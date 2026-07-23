import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const session = await auth().catch(() => null);
    const { conversationId } = await params;
    const body = await req.json().catch(() => ({}));
    const title = String(body.title || "").trim();
    if (!title) return NextResponse.json({ ok: false, error: "Requirement title is required" }, { status: 400 });

    const requirementId = `draft-${Date.now().toString(36)}`;
    const log = await prisma.operationLog.create({
      data: {
        projectId: null,
        userId: (session?.user as any)?.id,
        actorRole: "OPERATOR",
        action: "CREATE_REQUIREMENT_DRAFT",
        detail: title,
        entityType: "REQUIREMENT",
        entityId: requirementId,
        metadata: {
          conversationId,
          requirementId,
          title,
          status: "DRAFT",
          source: "MANUAL_OPERATOR_CREATE",
        },
      },
    });

    return NextResponse.json({ ok: true, requirement: { id: requirementId, title, conversationId }, log });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Create requirement failed" }, { status: 500 });
  }
}