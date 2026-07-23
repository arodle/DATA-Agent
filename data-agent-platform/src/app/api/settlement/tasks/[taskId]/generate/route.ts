import { auth } from "@/auth";
import { generateSettlementForTask } from "@/lib/settlement-service";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const session = await auth();
    const { taskId } = await params;
    const settlement = await generateSettlementForTask(taskId, (session?.user as any)?.id);
    return NextResponse.json({ ok: true, settlement });
  } catch (error: any) {
    console.error("Failed to generate settlement", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to generate settlement" }, { status: 500 });
  }
}