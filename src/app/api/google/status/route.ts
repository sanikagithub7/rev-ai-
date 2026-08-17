import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.getUser();

    if (!user) {
      return NextResponse.json({ connected: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!member) {
      return NextResponse.json({ connected: false, error: "No organization member record" }, { status: 403 });
    }

    const { data: tokenRecord } = await supabase
      .from("user_google_tokens")
      .select("id, expires_at, updated_at")
      .eq("user_id", user.id)
      .eq("organization_id", member.organization_id)
      .limit(1)
      .single();

    if (!tokenRecord) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      lastUpdated: tokenRecord.updated_at,
    });
  } catch (err: any) {
    return NextResponse.json({ connected: false, error: err.message });
  }
}
