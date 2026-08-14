import { NextResponse } from "next/server";
import { getGoogleOAuthConsentUrl } from "@/lib/google/calendar";

export async function GET() {
  const oauthUrl = getGoogleOAuthConsentUrl();
  return NextResponse.redirect(oauthUrl);
}
