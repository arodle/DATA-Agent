import { auth } from "@/auth";
import { submitSupplierTask } from "@/lib/supplier-task-service";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const session = await auth();
    const { taskId } = await params;
    const body = await req.json().catch(() => ({}));
    const task = await submitSupplierTask(taskId, (session?.user as any)?.id, body.summary);
    return NextResponse.json({ ok: true, task });
  } catch (error: any) {
    console.error("Failed to submit supplier task", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to submit task" }, { status: 500 });
  }
}