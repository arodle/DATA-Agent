import { auth } from "@/auth";
import { rejectAgentAction } from "@/lib/agent-action-service";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ actionId: string }> }) {
  try {
    const session = await auth();
    const { actionId } = await params;
    const body = await req.json().catch(() => ({}));
    const action = await rejectAgentAction(actionId, (session?.user as any)?.id, body.reason);
    return NextResponse.json({ ok: true, action });
  } catch (error: any) {
    console.error("Failed to reject agent action", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to reject action" }, { status: 500 });
  }
}