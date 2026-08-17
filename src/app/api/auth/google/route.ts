import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("host") || url.host;
  const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return NextResponse.redirect(`${protocol}://${host}/api/google/auth`);
}
