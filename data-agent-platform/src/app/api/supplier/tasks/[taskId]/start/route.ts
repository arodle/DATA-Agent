import { auth } from "@/auth";
import { startSupplierTask } from "@/lib/supplier-task-service";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const session = await auth();
    const { taskId } = await params;
    const task = await startSupplierTask(taskId, (session?.user as any)?.id);
    return NextResponse.json({ ok: true, task });
  } catch (error: any) {
    console.error("Failed to start supplier task", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to start task" }, { status: 500 });
  }
}