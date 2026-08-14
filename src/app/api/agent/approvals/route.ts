import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, action } = body; // action: "APPROVE" | "REJECT"

    if (!requestId || !action) {
      return NextResponse.json({ error: "requestId and action are required." }, { status: 400 });
    }

    if (action === "APPROVE") {
      return NextResponse.json({
        success: true,
        status: "APPROVED",
        message: "[DEMO / SIMULATED] Action approved and executed successfully.",
        executedAction: {
          type: "SEND_EMAIL",
          simulated: true,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      return NextResponse.json({
        success: true,
        status: "REJECTED",
        message: "Action rejected. Workflow paused.",
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Approval processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
