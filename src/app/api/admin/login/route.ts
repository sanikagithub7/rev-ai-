import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCredentials, createAdminSession } from "@/lib/admin/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, password, securityCode } = body;

    if (!name || !password || !securityCode) {
      return NextResponse.json(
        { error: "Name, password, and security code are required." },
        { status: 400 }
      );
    }

    // Verify credentials server-side against process.env
    const isValid = verifyAdminCredentials(name, password, securityCode);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid administrator credentials." },
        { status: 401 }
      );
    }

    // Create HTTP-only session cookie
    await createAdminSession(name);

    return NextResponse.json({
      success: true,
      message: "Admin authenticated successfully.",
    });
  } catch (error) {
    console.error("Admin login API error:", error);
    return NextResponse.json(
      { error: "Server authentication error." },
      { status: 500 }
    );
  }
}
