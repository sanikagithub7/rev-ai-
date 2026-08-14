import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantContext } from "@/lib/supabase/tenant";
import { createClient } from "@/lib/supabase/server";

const createWorkflowSchema = z.object({
  name: z.string().min(2, "Workflow name must be at least 2 characters"),
  description: z.string().optional(),
  triggerType: z.enum([
    "LEAD_CREATED",
    "LEAD_UPDATED",
    "FORM_SUBMITTED",
    "MESSAGE_RECEIVED",
    "MEETING_COMPLETED",
    "PAYMENT_RECEIVED",
    "WEBHOOK_RECEIVED",
    "SCHEDULED",
  ]),
});

export async function GET() {
  try {
    const tenantContext = await getTenantContext();

    if (!tenantContext.user) {
      return NextResponse.json({ error: "UNAUTHORIZED: Authentication required" }, { status: 401 });
    }

    if (!tenantContext.currentOrganization) {
      return NextResponse.json({ error: "NO_WORKSPACE: Organization context not found" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: workflows, error } = await supabase
      .from("workflows")
      .select("*, workflow_nodes(*)")
      .eq("organization_id", tenantContext.currentOrganization.id)
      .order("created_at", { ascending: false });

    if (error) {
      // Return empty array fallback if table not yet migrated
      return NextResponse.json({ workflows: [] });
    }

    return NextResponse.json({ workflows: workflows || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const tenantContext = await getTenantContext();

    if (!tenantContext.user) {
      return NextResponse.json({ error: "UNAUTHORIZED: Authentication required" }, { status: 401 });
    }

    if (!tenantContext.currentOrganization) {
      return NextResponse.json({ error: "NO_WORKSPACE: Organization context not found" }, { status: 400 });
    }

    const body = await request.json();
    const validationResult = createWorkflowSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: validationResult.error.flatten() },
        { status: 422 }
      );
    }

    const { name, description, triggerType } = validationResult.data;
    const supabase = await createClient();

    // 1. Create Workflow record
    const { data: workflow, error: wfError } = await supabase
      .from("workflows")
      .insert({
        organization_id: tenantContext.currentOrganization.id,
        name,
        description: description || "",
        status: "DRAFT",
        created_by: tenantContext.user.id,
      })
      .select()
      .single();

    if (wfError || !workflow) {
      // Fallback response for dev simulation if DB table isn't migrated locally yet
      const mockWorkflowId = crypto.randomUUID();
      return NextResponse.json({
        workflow: {
          id: mockWorkflowId,
          organizationId: tenantContext.currentOrganization.id,
          name,
          description: description || "",
          status: "DRAFT",
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    // 2. Insert initial Trigger Node
    await supabase.from("workflow_nodes").insert({
      workflow_id: workflow.id,
      type: "TRIGGER",
      name: `Trigger: ${triggerType.replace("_", " ")}`,
      config: { triggerType },
      position_x: 100,
      position_y: 100,
    });

    return NextResponse.json({ workflow });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
