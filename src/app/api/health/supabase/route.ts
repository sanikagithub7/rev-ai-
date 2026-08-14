import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Query lightweight table metadata or auth state
    const { data: authData, error: authError } = await supabase.auth.getSession();

    if (authError) {
      return NextResponse.json({
        status: "DEGRADED",
        supabaseConfigured: true,
        authStatus: "AUTH_CHECK_FAILED",
        error: authError.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      status: "HEALTHY",
      supabaseConfigured: true,
      authenticated: Boolean(authData.session),
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      status: "UNHEALTHY",
      supabaseConfigured: false,
      error: errorMsg,
    }, { status: 500 });
  }
}
