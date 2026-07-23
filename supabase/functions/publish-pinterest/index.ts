import { serve } from "https://deno.land/std/http/server.ts";

import { getValidPinterestToken } from "../_shared/fetch-token.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { deleteCloudinaryImage } from "../_shared/cloudinary.ts";
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

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

    console.log("Pinterest access token loaded. 1");

    console.log("Pinterest access token loaded. 2", token);
    console.log("Pinterest access token loaded.", token.access_token);

    const results = [];

    for (const pin of pins) {
      console.log("------------------------------------------");
      console.log("Publishing Pin");
      console.log("ID:", pin.id);
      console.log("Title:", pin.pin_title);
      console.log("Board:", pin.board_id);
      console.log("Publish At:", pin.publish_at);
      console.log("Pin Token :", token.access_token);

      try {
        const requestBody = {
          board_id: pin.board_id,
          title: pin.pin_title,
          description: pin.pin_description,
          link: pin.destination_url,
          alt_text: pin.alt_text,
          media_source: {
            source_type: "image_url",
            url: pin.image_url,
          },
          ...(pin.is_ai_generated && {
            ai_disclosures: {
              values: ["AI_MODIFIED"],
            },
          }),
        };

        console.log("Pinterest Request:");
        console.log(JSON.stringify(requestBody, null, 2));

        const response = await fetch("https://api.pinterest.com/v5/pins", {
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

        const pinterestImage =
          pinterestResult.media?.images?.["1200x"]?.url ??
          pinterestResult.media?.images?.["600x"]?.url ??
          pin.image_url;

        let deleted = false;

        if (pin.cloudinary_public_id) {
          deleted = await deleteCloudinaryImage(pin.cloudinary_public_id);
        }

        await supabase
          .from("pinterest_pins")
          .update({
            status: "posted",
            pinterest_pin_id: pinterestResult.id,
            image_url: pinterestImage,
            pinterest_published_at: pinterestResult.created_at,

            cloudinary_public_id: deleted ? null : pin.cloudinary_public_id,
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
