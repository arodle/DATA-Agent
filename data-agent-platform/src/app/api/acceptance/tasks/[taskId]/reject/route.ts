import { auth } from "@/auth";
import { rejectTaskAcceptance } from "@/lib/acceptance-service";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const session = await auth();
    const { taskId } = await params;
    const body = await req.json().catch(() => ({}));
    const task = await rejectTaskAcceptance(taskId, (session?.user as any)?.id, body.reason);
    return NextResponse.json({ ok: true, task });
  } catch (error: any) {
    console.error("Failed to reject task acceptance", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to reject acceptance" }, { status: 500 });
  }
}