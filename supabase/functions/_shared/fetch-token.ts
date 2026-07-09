
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

export async function getValidPinterestToken() {
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