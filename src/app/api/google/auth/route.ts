import { NextResponse } from "next/server";
import { getGoogleOAuthConsentUrl } from "@/lib/google/calendar";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("host") || url.host;
  const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
  const redirectUri = `${appUrl}/api/google/callback`;

  const consentRes = getGoogleOAuthConsentUrl(redirectUri);

  if (!consentRes.url || consentRes.error) {
    const errorMsg = consentRes.error || "Google Calendar connection is not configured. Please contact the administrator.";
    return NextResponse.redirect(`${appUrl}/dashboard/meetings?error=${encodeURIComponent(errorMsg)}`);
  }

  return NextResponse.redirect(consentRes.url);
}
