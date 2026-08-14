import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantContext } from "@/lib/supabase/tenant";
import { createClient } from "@/lib/supabase/server";

const updateWorkflowSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]).optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantContext = await getTenantContext();

    if (!tenantContext.user || !tenantContext.currentOrganization) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: workflow, error: wfError } = await supabase
      .from("workflows")
      .select("*, workflow_nodes(*), workflow_edges(*)")
      .eq("id", id)
      .eq("organization_id", tenantContext.currentOrganization.id)
      .single();

    if (wfError || !workflow) {
      return NextResponse.json({ error: "WORKFLOW_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ workflow });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantContext = await getTenantContext();

    if (!tenantContext.user || !tenantContext.currentOrganization) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = updateWorkflowSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: validationResult.error.flatten() },
        { status: 422 }
      );
    }

    const { name, description, status, nodes, edges } = validationResult.data;
    const supabase = await createClient();

    // 1. Verify workflow belongs to user's organization
    const { data: existingWf } = await supabase
      .from("workflows")
      .select("id")
      .eq("id", id)
      .eq("organization_id", tenantContext.currentOrganization.id)
      .single();

    if (!existingWf) {
      return NextResponse.json({ error: "WORKFLOW_NOT_FOUND_OR_FORBIDDEN" }, { status: 404 });
    }

    // 2. Update workflow metadata
    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name) updatePayload.name = name;
    if (description !== undefined) updatePayload.description = description;
    if (status) updatePayload.status = status;

    const { data: updatedWf } = await supabase
      .from("workflows")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    // 3. Persist nodes if provided
    if (nodes && Array.isArray(nodes)) {
      // Delete existing nodes and re-insert updated nodes
      await supabase.from("workflow_nodes").delete().eq("workflow_id", id);
      for (const node of nodes) {
        await supabase.from("workflow_nodes").insert({
          id: node.id || undefined,
          workflow_id: id,
          type: node.type,
          name: node.name,
          config: node.config || {},
          position_x: node.positionX || 0,
          position_y: node.positionY || 0,
        });
      }
    }

    // 4. Persist edges if provided
    if (edges && Array.isArray(edges)) {
      await supabase.from("workflow_edges").delete().eq("workflow_id", id);
      for (const edge of edges) {
        await supabase.from("workflow_edges").insert({
          id: edge.id || undefined,
          workflow_id: id,
          source_node_id: edge.sourceNodeId,
          target_node_id: edge.targetNodeId,
          condition: edge.condition || null,
        });
      }
    }

    return NextResponse.json({ workflow: updatedWf || { id, ...updatePayload } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantContext = await getTenantContext();

    if (!tenantContext.user || !tenantContext.currentOrganization) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("workflows")
      .delete()
      .eq("id", id)
      .eq("organization_id", tenantContext.currentOrganization.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
