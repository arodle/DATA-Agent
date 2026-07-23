import { prisma } from "@/lib/prisma";

export async function startSupplierTask(taskId: string, userId?: string) {
  const task = await prisma.projectTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");
  if (!["PUBLISHED", "DRAFT"].includes(task.status)) {
    throw new Error(`Task status ${task.status} cannot be started`);
  }

  const updated = await prisma.projectTask.update({
    where: { id: taskId },
    data: {
      status: "RUNNING",
      plannedStart: task.plannedStart ?? new Date(),
      resultSummary: "供应商已启动执行",
    },
    include: { project: true, supplier: { include: { organization: true } } },
  });

  await prisma.project.update({
    where: { id: task.projectId },
    data: {
      executionStatus: "SUPPLIER_RUNNING",
      currentStage: "EXECUTE",
      nextAction: "等待供应商提交交付批次",
    },
  });

  await prisma.operationLog.create({
    data: {
      projectId: task.projectId,
      userId: userId || null,
      actorRole: "SUPPLIER",
      action: "START_SUPPLIER_TASK",
      detail: `Supplier started task ${taskId}`,
      entityType: "ProjectTask",
      entityId: taskId,
      metadata: { taskId, previousStatus: task.status, nextStatus: "RUNNING" },
    },
  });

  return updated;
}

export async function submitSupplierTask(taskId: string, userId?: string, summary?: string) {
  const task = await prisma.projectTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");
  if (!["RUNNING", "PUBLISHED"].includes(task.status)) {
    throw new Error(`Task status ${task.status} cannot be submitted`);
  }

  const updated = await prisma.projectTask.update({
    where: { id: taskId },
    data: {
      status: "SUBMITTED",
      actualEnd: new Date(),
      actualEffort: task.estimatedEffort ?? null,
      resultSummary: summary || "供应商已提交交付，等待运营/质检验收",
    },
    include: { project: true, supplier: { include: { organization: true } } },
  });

  await prisma.project.update({
    where: { id: task.projectId },
    data: {
      executionStatus: "ACCEPTANCE",
      currentStage: "ACCEPTANCE",
      nextAction: "运营触发质检并完成验收",
    },
  });

  await prisma.qualityEvent.create({
    data: {
      projectId: task.projectId,
      taskId,
      type: "DELIVERY_REVIEW",
      severity: "INFO",
      sampleScope: "FULL_BATCH",
      impact: "供应商提交交付后自动创建验收检查事件",
      status: "OPEN",
      action: "等待运营验收",
    },
  });

  await prisma.operationLog.create({
    data: {
      projectId: task.projectId,
      userId: userId || null,
      actorRole: "SUPPLIER",
      action: "SUBMIT_SUPPLIER_TASK",
      detail: `Supplier submitted task ${taskId}`,
      entityType: "ProjectTask",
      entityId: taskId,
      metadata: { taskId, previousStatus: task.status, nextStatus: "SUBMITTED" },
    },
  });

  return updated;
}