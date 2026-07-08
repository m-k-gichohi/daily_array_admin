import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function getValidPinterestToken() {
  const { data: token, error } = await supabase
    .from("pinterest_tokens")
    .select("*")
    .single();

  if (error) {
    throw new Error(`Unable to load Pinterest token: ${error.message}`);
  }

  if (!token) {
    throw new Error("Pinterest token not found.");
  }

  console.log("Pinterest token loaded.");

  const expiresAt = new Date(token.expires_at);
  const now = new Date();

  console.log("Current UTC:", now.toISOString());
  console.log("Token expires at:", expiresAt.toISOString());

  // Refresh if the token expires within the next hour
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  if (expiresAt > oneHourFromNow) {
    console.log("Pinterest access token is still valid.");
    return token;
  }

  console.log("Pinterest token is expiring soon. Refreshing...");

  const credentials = btoa(
    `${Deno.env.get("PINTEREST_CLIENT_ID")}:${Deno.env.get(
      "PINTEREST_CLIENT_SECRET",
    )}`,
  );

  const response = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refresh_token,
    }),
  });

  const responseText = await response.text();

  console.log("Pinterest Refresh Response:");
  console.log(responseText);

  let refreshed: any;

  try {
    refreshed = JSON.parse(responseText);
  } catch {
    throw new Error("Pinterest returned an invalid refresh response.");
  }

  if (!response.ok) {
    throw new Error(`Failed to refresh Pinterest token: ${responseText}`);
  }

  // Calculate the new expiry time
  const newExpiresAt = new Date(
    Date.now() + refreshed.expires_in * 1000,
  ).toISOString();

  const { error: updateError } = await supabase
    .from("pinterest_tokens")
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token ?? token.refresh_token,
      expires_at: newExpiresAt,
      expires_in: refreshed.expires_in,
      scope: refreshed.scope,
    })
    .eq("id", token.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  console.log("Pinterest token refreshed successfully.");

  return {
    ...token,
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token ?? token.refresh_token,
    expires_at: newExpiresAt,
    expires_in: refreshed.expires_in,
    scope: refreshed.scope,
  };
}

serve(async (req) => {
  console.log("==========================================");
  console.log("Pinterest Scheduler Started");
  console.log("Current UTC:", new Date().toISOString());

  const authHeader = req.headers.get("Authorization");

  console.log("Authorization Header:", authHeader ? "Present" : "Missing");

  if (authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
    console.log("Unauthorized request");

    return new Response(
      JSON.stringify({
        success: false,
        error: "Unauthorized",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    // Fetch scheduled pins
    const { data: pins, error: pinError } = await supabase
      .from("pinterest_pins")
      .select("*")
      .eq("status", "scheduled")
      .lte("publish_at", new Date().toISOString())
      .order("publish_at", { ascending: true })
      .limit(10);

    if (pinError) throw pinError;

    console.log(`Found ${pins?.length ?? 0} pin(s) ready to publish.`);

    if (!pins || pins.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No scheduled pins ready to publish.",
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Fetch Pinterest token
    const token = await getValidPinterestToken();

    console.log("Pinterest access token loaded.");

    console.log("Pinterest access token loaded.", token);

    const results = [];

    for (const pin of pins) {
      console.log("------------------------------------------");
      console.log("Publishing Pin");
      console.log("ID:", pin.id);
      console.log("Title:", pin.pin_title);
      console.log("Board:", pin.board_id);
      console.log("Publish At:", pin.publish_at);

      try {
        const requestBody = {
          board_id: pin.board_id,
          title: pin.pin_title,
          description: pin.pin_description,
          link: pin.destination_url,
          media_source: {
            source_type: "image_url",
            url: pin.image_url,
          },
        };

        console.log("Pinterest Request:");
        console.log(JSON.stringify(requestBody, null, 2));

        const response = await fetch("https://api-sandbox.pinterest.com/v5/pins", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        console.log("Pinterest HTTP Status:", response.status);

        const responseText = await response.text();

        console.log("Pinterest Raw Response:");
        console.log(responseText);

        let pinterestResult;

        try {
          pinterestResult = JSON.parse(responseText);
        } catch {
          pinterestResult = responseText;
        }

        if (!response.ok) {
          console.error("Pinterest Publish Failed");
          console.error(JSON.stringify(pinterestResult, null, 2));

          await supabase
            .from("pinterest_pins")
            .update({
              status: "failed",
              error_message:
                typeof pinterestResult === "string"
                  ? pinterestResult
                  : JSON.stringify(pinterestResult),
            })
            .eq("id", pin.id);

          results.push({
            pin_id: pin.id,
            success: false,
            error: pinterestResult,
          });

          continue;
        }

        console.log("Pinterest Publish Successful");
        console.log("Pinterest Pin ID:", pinterestResult.id);

        await supabase
          .from("pinterest_pins")
          .update({
            status: "posted",
            pinterest_pin_id: pinterestResult.id,
            error_message: null,
          })
          .eq("id", pin.id);

        results.push({
          pin_id: pin.id,
          success: true,
          pinterest_pin_id: pinterestResult.id,
        });
      } catch (err) {
        console.error("Unexpected Error While Publishing");

        if (err instanceof Error) {
          console.error(err.stack);
        } else {
          console.error(err);
        }

        await supabase
          .from("pinterest_pins")
          .update({
            status: "failed",
            error_message: err instanceof Error ? err.message : String(err),
          })
          .eq("id", pin.id);

        results.push({
          pin_id: pin.id,
          success: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    console.log("------------------------------------------");
    console.log("Finished Processing");
    console.log(JSON.stringify(results, null, 2));
    console.log("==========================================");

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Fatal Error");

    if (error instanceof Error) {
      console.error(error.stack);
    } else {
      console.error(error);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
});
