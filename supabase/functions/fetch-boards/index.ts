import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getValidPinterestToken } from "../_shared/fetch-token.ts";

serve(async (req) => {
  const authHeader = req.headers.get("Authorization");

  console.log("Authorization Header:", authHeader ? "Present" : "Missing");

  if (!authHeader) {
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

  // Verify the authenticated user
  const authClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    },
  );

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
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

  console.log("Authenticated user:", user.id);

  try {
    const token = await getValidPinterestToken();

    const response = await fetch(
      "https://api.pinterest.com/v5/boards?page_size=100",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          Accept: "application/json",
        },
      },
    );

    const responseText = await response.text();

    let pinterestResult;

    try {
      pinterestResult = JSON.parse(responseText);
    } catch {
      pinterestResult = responseText;
    }

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: pinterestResult,
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        boards: pinterestResult.items ?? pinterestResult,
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