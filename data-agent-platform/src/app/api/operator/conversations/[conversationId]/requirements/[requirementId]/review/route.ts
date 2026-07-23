import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function meta(log: any, key: string) {
  return (log.metadata as Record<string, any> | null)?.[key];
}

export async function POST(req: Request, { params }: { params: Promise<{ conversationId: string; requirementId: string }> }) {
  try {
    const session = await auth().catch(() => null);
    const { conversationId, requirementId } = await params;
    const body = await req.json().catch(() => ({}));
    const decision = body.decision === "REJECT" ? "REJECT" : "APPROVE";
    const project = await prisma.project.findFirst({ where: { OR: [{ id: requirementId }, { requirement: { id: requirementId } }] }, include: { requirement: true } });
    const draftLog = project ? null : await prisma.operationLog.findFirst({ where: { action: "CREATE_REQUIREMENT_DRAFT", entityId: requirementId }, orderBy: { createdAt: "desc" } });
    if (!project && !draftLog) return NextResponse.json({ ok: false, error: "Requirement not found" }, { status: 404 });

    const missingFields = project ? [] : ["dataModality", "estimatedVolume", "deliveryTime", "steps", "qualityRequirement"];
    if (project) {
      if (!project.requirement?.title) missingFields.push("title");
      if (!project.requirement?.dataModality) missingFields.push("dataModality");
      if (!project.requirement?.estimatedVolume) missingFields.push("estimatedVolume");
      if (!project.expectedEndDate) missingFields.push("deliveryTime");
      if (!project.requirement?.acceptanceCriteria) missingFields.push("qualityRequirement");
    }

    if (decision === "APPROVE" && missingFields.length > 0) {
      return NextResponse.json({ ok: false, error: "Missing required fields", missingFields }, { status: 400 });
    }

    const log = await prisma.operationLog.create({
      data: {
        projectId: project?.id || null,
        userId: (session?.user as any)?.id,
        actorRole: "OPERATOR",
        action: decision === "APPROVE" ? "APPROVE_REQUIREMENT" : "REJECT_REQUIREMENT",
        detail: decision === "APPROVE" ? "Requirement review approved" : (body.reason || "Requirement returned for revision"),
        entityType: "REQUIREMENT",
        entityId: requirementId,
        metadata: { conversationId: project ? conversationId : meta(draftLog, "conversationId") || conversationId, decision, missingFields, draft: Boolean(draftLog) },
      },
    });

    return NextResponse.json({ ok: true, decision, log });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Review failed" }, { status: 500 });
  }
}