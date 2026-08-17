import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeGoogleOAuthCode } from "@/lib/google/calendar";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const errorParam = url.searchParams.get("error");
  const state = url.searchParams.get("state");

  const host = request.headers.get("host") || url.host;
  const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
  const redirectUri = `${appUrl}/api/google/callback`;

  if (errorParam) {
    const errorMsg = errorParam === "access_denied"
      ? "Google OAuth authorization was cancelled or denied."
      : `Google OAuth error: ${errorParam}`;
    return NextResponse.redirect(`${appUrl}/dashboard/meetings?error=${encodeURIComponent(errorMsg)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/dashboard/meetings?error=${encodeURIComponent("Authorization code missing from Google callback.")}`);
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.getUser();

    if (!user) {
      return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent("Please sign in to connect Google Calendar.")}`);
    }

    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!member) {
      return NextResponse.redirect(`${appUrl}/dashboard/meetings?error=${encodeURIComponent("No active workspace found for user.")}`);
    }

    // Exchange authorization code for tokens
    const exchangeRes = await exchangeGoogleOAuthCode(code, redirectUri);
    if (!exchangeRes.success || !exchangeRes.tokens) {
      return NextResponse.redirect(
        `${appUrl}/dashboard/meetings?error=${encodeURIComponent(exchangeRes.error || "Failed to authenticate with Google. Please try connecting again.")}`
      );
    }

    const { access_token, refresh_token, expires_in, scope } = exchangeRes.tokens;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Store tokens securely in user_google_tokens table
    const { error: upsertErr } = await supabase
      .from("user_google_tokens")
      .upsert(
        {
          user_id: user.id,
          organization_id: member.organization_id,
          access_token,
          refresh_token: refresh_token || null,
          expires_at: expiresAt,
          scope,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,organization_id" }
      );

    if (upsertErr) {
      return NextResponse.redirect(
        `${appUrl}/dashboard/meetings?error=${encodeURIComponent("Failed to save Google Calendar connection. Please try again.")}`
      );
    }

    return NextResponse.redirect(`${appUrl}/dashboard/meetings?status=google_connected`);
  } catch (err: any) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/meetings?error=${encodeURIComponent(err.message || "An unexpected error occurred during Google authentication.")}`
    );
  }
}
