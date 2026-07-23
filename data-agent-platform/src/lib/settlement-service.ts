import { prisma } from "@/lib/prisma";

const DEFAULT_UNIT_PRICE: Record<string, number> = {
  ANNOTATION: 0.8,
  COLLECTION: 0.5,
  QUALITY: 0.2,
  DELIVERY: 0.1,
};

function buildSettlementId() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `SET-${y}${m}${d}-${now.getTime().toString().slice(-6)}`;
}

export async function generateSettlementForTask(taskId: string, userId?: string) {
  const task = await prisma.projectTask.findUnique({
    where: { id: taskId },
    include: {
      project: true,
      supplier: { include: { organization: true } },
      datasets: true,
      qualityEvents: true,
    },
  });
  if (!task) throw new Error("Task not found");
  if (task.status !== "COMPLETED") {
    throw new Error(`Task status ${task.status} cannot be settled`);
  }

  const existing = await prisma.operationLog.findFirst({
    where: {
      action: "GENERATE_SETTLEMENT",
      entityType: "ProjectTask",
      entityId: taskId,
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;

  const volume = task.dataVolume ?? 0;
  const unitPrice = DEFAULT_UNIT_PRICE[task.stage] ?? 0.8;
  const grossAmount = Number((volume * unitPrice).toFixed(2));
  const deduction = task.qualityEvents.filter((e) => e.needRework).length > 0 ? Number((grossAmount * 0.05).toFixed(2)) : 0;
  const finalAmount = Number((grossAmount - deduction).toFixed(2));
  const settlementId = buildSettlementId();

  const dataset = task.datasets[0] ?? await prisma.dataset.create({
    data: {
      projectId: task.projectId,
      taskId: task.id,
      name: `${task.project.code}-${task.name}-交付数据`,
      type: "DELIVERY",
      modality: task.stage === "ANNOTATION" ? "image" : null,
      itemCount: volume,
      format: "JSONL",
      storagePath: `settlements/${settlementId}/delivery`,
      version: "v1",
      source: "SUPPLIER_DELIVERY",
    },
  });

  await prisma.datasetVersion.create({
    data: {
      datasetId: dataset.id,
      version: `settlement-${settlementId}`,
      changeNote: `任务 ${task.name} 验收通过后自动沉淀`,
      itemCount: volume,
      storagePath: `settlements/${settlementId}/delivery`,
      createdById: userId || null,
    },
  }).catch(async () => dataset);

  await prisma.project.update({
    where: { id: task.projectId },
    data: {
      nextAction: "结算单已生成，等待付款确认和资产复盘",
    },
  });

  return prisma.operationLog.create({
    data: {
      projectId: task.projectId,
      userId: userId || null,
      actorRole: "OPERATOR",
      action: "GENERATE_SETTLEMENT",
      detail: `Generated settlement ${settlementId} for task ${taskId}`,
      entityType: "ProjectTask",
      entityId: taskId,
      metadata: {
        settlementId,
        taskId,
        taskName: task.name,
        projectCode: task.project.code,
        projectName: task.project.name,
        supplierId: task.supplierId,
        supplierName: task.supplier?.organization.name || "待分配",
        stage: task.stage,
        volume,
        unitPrice,
        grossAmount,
        deduction,
        finalAmount,
        currency: "CNY",
        status: "CONFIRMED",
        datasetId: dataset.id,
      },
    },
  });
}

export async function markSettlementPaid(logId: string, userId?: string) {
  const log = await prisma.operationLog.findUnique({ where: { id: logId } });
  if (!log || log.action !== "GENERATE_SETTLEMENT") throw new Error("Settlement log not found");
  const metadata = (log.metadata || {}) as any;
  return prisma.operationLog.update({
    where: { id: logId },
    data: {
      userId: userId || log.userId,
      action: "SETTLEMENT_PAID",
      detail: `Settlement ${metadata.settlementId || logId} marked as paid`,
      metadata: {
        ...metadata,
        status: "PAID",
        paidAt: new Date().toISOString(),
      },
    },
  });
}