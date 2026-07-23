import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function meta(log: any, key: string) {
  return (log.metadata as Record<string, any> | null)?.[key];
}

const draftBlockers = ["dataModality", "estimatedVolume", "deliveryTime", "steps", "qualityRequirement"];

export async function POST(req: Request, { params }: { params: Promise<{ conversationId: string; requirementId: string }> }) {
  try {
    const { conversationId, requirementId } = await params;
    const body = await req.json().catch(() => ({}));
    const project = await prisma.project.findFirst({
      where: { OR: [{ id: requirementId }, { requirement: { id: requirementId } }] },
      include: { requirement: true, tasks: true, datasets: true, operator: true },
    });

    if (!project) {
      const draftLog = await prisma.operationLog.findFirst({
        where: { action: "CREATE_REQUIREMENT_DRAFT", entityId: requirementId },
        orderBy: { createdAt: "desc" },
      });
      if (!draftLog) return NextResponse.json({ ok: false, error: "Requirement not found" }, { status: 404 });

      return NextResponse.json({
        ok: true,
        mock: true,
        preview: {
          conversationId: meta(draftLog, "conversationId") || conversationId,
          requirementId,
          projectCount: 0,
          projects: [],
          blockers: draftBlockers,
          message: "\u5f53\u524d Requirement \u5c1a\u672a\u8865\u5168\uff0c\u4e0d\u80fd\u751f\u6210\u9879\u76ee\u9884\u89c8\u3002",
        },
      });
    }

    const steps = project.tasks.map((task: any, index: number) => ({
      sortOrder: index + 1,
      stepName: task.name,
      taskType: task.stage,
      toolName: task.stage === "ANNOTATION" ? "PointTool" : "DataCollector",
      outputFormat: task.stage === "ANNOTATION" ? "JSON / COCO" : "Dataset",
    }));

    const preview = {
      conversationId,
      requirementId,
      projectCount: body.mode === "MULTI" ? Math.max(1, steps.length) : 1,
      projects: [{
        projectType: project.mode,
        projectName: `${project.code} - ${project.name}`,
        dataSource: project.datasets[0]?.name || project.datasets[0]?.source || "-",
        steps,
        toolConfig: steps.map((step: any) => ({ stepName: step.stepName, toolName: step.toolName })),
        supplierRequired: project.tasks.some((task: any) => task.supplierId),
        quotationMode: project.budgetAmount ? "BUDGET" : "PENDING_QUOTE",
        owner: project.operator?.name || project.operator?.email || "\u5f85\u5206\u914d",
      }],
    };

    return NextResponse.json({ ok: true, preview, mock: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Preview failed" }, { status: 500 });
  }
}