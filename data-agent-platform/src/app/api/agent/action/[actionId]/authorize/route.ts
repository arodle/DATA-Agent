import { auth } from "@/auth";
import { authorizeAndExecuteAgentAction } from "@/lib/agent-action-service";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: Promise<{ actionId: string }> }) {
  try {
    const session = await auth();
    const { actionId } = await params;
    const action = await authorizeAndExecuteAgentAction(actionId, (session?.user as any)?.id);
    return NextResponse.json({ ok: true, action });
  } catch (error: any) {
    console.error("Failed to authorize agent action", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to authorize action" }, { status: 500 });
  }
}