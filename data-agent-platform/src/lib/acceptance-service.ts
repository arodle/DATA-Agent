import { prisma } from "@/lib/prisma";

export async function approveTaskAcceptance(taskId: string, userId?: string, note?: string) {
  const task = await prisma.projectTask.findUnique({
    where: { id: taskId },
    include: { project: true },
  });
  if (!task) throw new Error("Task not found");
  if (task.status !== "SUBMITTED") {
    throw new Error(`Task status ${task.status} cannot be approved`);
  }

  const updated = await prisma.projectTask.update({
    where: { id: taskId },
    data: {
      status: "COMPLETED",
      actualEnd: task.actualEnd ?? new Date(),
      resultSummary: note || "运营验收通过，任务完成",
    },
    include: { project: true, supplier: { include: { organization: true } }, qualityEvents: true },
  });

  await prisma.qualityEvent.updateMany({
    where: { taskId, status: "OPEN" },
    data: {
      status: "CLOSED",
      action: "验收通过",
      closedAt: new Date(),
      needRework: false,
    },
  });

  const remainingOpenTasks = await prisma.projectTask.count({
    where: {
      projectId: task.projectId,
      id: { not: taskId },
      status: { in: ["DRAFT", "PUBLISHED", "RUNNING", "SUBMITTED", "REJECTED"] },
    },
  });

  await prisma.project.update({
    where: { id: task.projectId },
    data: {
      executionStatus: remainingOpenTasks === 0 ? "COMPLETED" : "SUPPLIER_RUNNING",
      currentStage: remainingOpenTasks === 0 ? "COMPLETED" : "EXECUTE",
      completedAt: remainingOpenTasks === 0 ? new Date() : task.project.completedAt,
      nextAction: remainingOpenTasks === 0 ? "项目已完成，可进入结算和资产沉淀" : "继续跟进剩余任务",
    },
  });

  await prisma.operationLog.create({
    data: {
      projectId: task.projectId,
      userId: userId || null,
      actorRole: "OPERATOR",
      action: "APPROVE_TASK_ACCEPTANCE",
      detail: `Approved delivery for task ${taskId}`,
      entityType: "ProjectTask",
      entityId: taskId,
      metadata: { taskId, previousStatus: task.status, nextStatus: "COMPLETED" },
    },
  });

  return updated;
}

export async function rejectTaskAcceptance(taskId: string, userId?: string, reason?: string) {
  const task = await prisma.projectTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");
  if (task.status !== "SUBMITTED") {
    throw new Error(`Task status ${task.status} cannot be rejected`);
  }

  const updated = await prisma.projectTask.update({
    where: { id: taskId },
    data: {
      status: "REJECTED",
      resultSummary: reason || "运营验收驳回，需供应商返修后重新提交",
    },
    include: { project: true, supplier: { include: { organization: true } }, qualityEvents: true },
  });

  await prisma.qualityEvent.create({
    data: {
      projectId: task.projectId,
      taskId,
      type: "ACCEPTANCE_REJECTED",
      severity: "HIGH",
      sampleScope: "REVIEW_SAMPLE",
      impact: reason || "验收未通过，需要返修",
      status: "OPEN",
      action: "供应商返修并重新提交",
      needRework: true,
    },
  });

  await prisma.project.update({
    where: { id: task.projectId },
    data: {
      executionStatus: "SUPPLIER_RUNNING",
      currentStage: "EXECUTE",
      currentRisk: "存在验收驳回任务，需要供应商返修",
      nextAction: "供应商返修并重新提交交付",
    },
  });

  await prisma.operationLog.create({
    data: {
      projectId: task.projectId,
      userId: userId || null,
      actorRole: "OPERATOR",
      action: "REJECT_TASK_ACCEPTANCE",
      detail: `Rejected delivery for task ${taskId}`,
      entityType: "ProjectTask",
      entityId: taskId,
      metadata: { taskId, previousStatus: task.status, nextStatus: "REJECTED", reason },
    },
  });

  return updated;
}