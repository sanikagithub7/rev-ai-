import { NextResponse } from "next/server";
import { getGoogleOAuthConsentUrl } from "@/lib/google/calendar";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("host") || url.host;
  const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
  const redirectUri = `${appUrl}/api/google/callback`;

  const oauthUrl = getGoogleOAuthConsentUrl(redirectUri);
  return NextResponse.redirect(oauthUrl);
}
