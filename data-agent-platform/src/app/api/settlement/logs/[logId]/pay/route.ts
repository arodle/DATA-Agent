import { auth } from "@/auth";
import { markSettlementPaid } from "@/lib/settlement-service";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: Promise<{ logId: string }> }) {
  try {
    const session = await auth();
    const { logId } = await params;
    const settlement = await markSettlementPaid(logId, (session?.user as any)?.id);
    return NextResponse.json({ ok: true, settlement });
  } catch (error: any) {
    console.error("Failed to mark settlement paid", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to mark paid" }, { status: 500 });
  }
}