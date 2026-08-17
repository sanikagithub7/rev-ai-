import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleCalendarConnection } from "@/lib/google/calendar";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.getUser();

    let orgId: string | null = null;
    let userId: string | null = user?.id || null;

    if (user) {
      const { data: member } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();
      if (member) orgId = member.organization_id;
    }

    // Fallback to primary organization if no active user session
    if (!orgId) {
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id")
        .limit(1);
      if (Array.isArray(orgs) && orgs.length > 0) {
        orgId = orgs[0].id;
      }
    }

    if (!orgId) {
      return NextResponse.json({ connected: false, error: "No workspace found." });
    }

    const conn = await getGoogleCalendarConnection(supabase, userId || "", orgId);

    return NextResponse.json({
      connected: conn.connected,
      lastUpdated: conn.lastUpdated || null,
      error: conn.error || null,
    });
  } catch (err: any) {
    return NextResponse.json({ connected: false, error: err.message });
  }
}
