import { prisma } from "@/lib/prisma";

export type CreateTaskPreviewInput = {
  projectId?: string;
  userId?: string;
  requirement?: string;
  taskName?: string;
  dataVolume?: number;
  stage?: string;
  executorType?: string;
  supplierId?: string | null;
};

async function getOrCreateDemoOrg() {
  const existing = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return existing;
  return prisma.organization.create({
    data: {
      name: "AutoLab Data Center",
      type: "CUSTOMER",
      description: "Demo organization for agent workflow",
    },
  });
}

async function getOrCreateDemoUser() {
  const existing = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      name: "Agent Operator",
      email: "agent-operator@example.com",
    },
  });
}

async function getOrCreateProject(userId?: string, projectId?: string) {
  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (project) return project;
  }

  const latest = await prisma.project.findFirst({ orderBy: { createdAt: "desc" } });
  if (latest) return latest;

  const org = await getOrCreateDemoOrg();
  const user = userId
    ? (await prisma.user.findUnique({ where: { id: userId } })) ?? (await getOrCreateDemoUser())
    : await getOrCreateDemoUser();

  return prisma.project.create({
    data: {
      code: `PRJ-${Date.now().toString().slice(-6)}`,
      name: "AI Agent 数据标采演示项目",
      mode: "ANNOTATION",
      ownerOrgId: org.id,
      creatorId: user.id,
      operatorId: user.id,
      executionStatus: "PENDING_REVIEW",
      currentStage: "REVIEW",
      priority: "HIGH",
      nextAction: "等待运营审核 Agent 生成的任务发布动作",
    },
  });
}

async function getDefaultSupplierId(inputSupplierId?: string | null) {
  if (inputSupplierId) return inputSupplierId;
  const supplier = await prisma.supplier.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { id: "asc" },
  });
  return supplier?.id ?? null;
}

function buildTaskPreview(input: CreateTaskPreviewInput, projectName: string, supplierId: string | null) {
  const volume = input.dataVolume ?? 5000;
  return {
    taskName: input.taskName || `${projectName} - Agent 生成标采任务`,
    executorType: input.executorType || "SUPPLIER",
    supplierId,
    stage: input.stage || "ANNOTATION",
    dataVolume: volume,
    estimatedEffort: Math.max(1, Math.round((volume / 1000) * 1.5)),
    plannedStart: new Date().toISOString(),
    plannedEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    risk: volume > 20000 ? "数据量较大，建议拆分批次并开启抽检" : "低风险，可先发布试运行批次",
    source: "AGENT_PREVIEW",
  };
}

export async function createProjectTaskActionPreview(input: CreateTaskPreviewInput) {
  const user = input.userId
    ? (await prisma.user.findUnique({ where: { id: input.userId } })) ?? (await getOrCreateDemoUser())
    : await getOrCreateDemoUser();
  const project = await getOrCreateProject(user.id, input.projectId);
  const supplierId = await getDefaultSupplierId(input.supplierId);
  const preview = buildTaskPreview(input, project.name, supplierId);

  return prisma.agentSession.create({
    data: {
      projectId: project.id,
      userId: user.id,
      context: "TASK_PUBLISHING",
      title: "Agent 任务发布动作预览",
      messages: {
        create: [
          {
            role: "USER",
            content: input.requirement || "请根据当前项目生成一条可发布给供应商的标采任务。",
          },
          {
            role: "ASSISTANT",
            content: `已生成任务发布预览：${preview.taskName}，数据量 ${preview.dataVolume}。等待运营授权。`,
            metadata: { preview },
          },
        ],
      },
      actions: {
        create: {
          projectId: project.id,
          actionType: "CREATE_PROJECT_TASK",
          targetEntity: "ProjectTask",
          status: "PREVIEW",
          previewJson: preview,
          diffJson: {
            creates: ["ProjectTask"],
            updates: ["Project.operatorId", "Project.executionStatus", "Project.currentStage", "Project.nextAction"],
          },
        },
      },
    },
    include: { actions: true, project: true, messages: true },
  });
}

export async function rejectAgentAction(actionId: string, userId?: string, reason?: string) {
  return prisma.agentAction.update({
    where: { id: actionId },
    data: {
      status: "REJECTED",
      resultJson: { reason: reason || "运营拒绝执行", rejectedBy: userId || "operator" },
    },
  });
}

export async function authorizeAndExecuteAgentAction(actionId: string, userId?: string) {
  const action = await prisma.agentAction.findUnique({
    where: { id: actionId },
    include: { session: true },
  });

  if (!action) throw new Error("Agent action not found");
  if (action.status !== "PREVIEW" && action.status !== "AUTHORIZED") {
    throw new Error(`Action status ${action.status} cannot be executed`);
  }

  await prisma.agentAction.update({
    where: { id: actionId },
    data: {
      status: "AUTHORIZED",
      authorizedBy: userId || "operator",
      authorizedAt: new Date(),
    },
  });

  if (action.actionType !== "CREATE_PROJECT_TASK") {
    return prisma.agentAction.update({
      where: { id: actionId },
      data: {
        status: "EXECUTED",
        executedAt: new Date(),
        resultJson: { message: "Action authorized. No executor is registered for this action type yet." },
      },
    });
  }

  const preview = action.previewJson as any;
  const projectId = action.projectId || action.session.projectId;
  if (!projectId) throw new Error("Project id is required to create task");

  const task = await prisma.projectTask.create({
    data: {
      projectId,
      name: preview.taskName || "Agent 生成任务",
      executorType: preview.executorType || "SUPPLIER",
      supplierId: preview.supplierId || null,
      stage: preview.stage || "ANNOTATION",
      status: "PUBLISHED",
      dataVolume: Number(preview.dataVolume ?? 0) || null,
      estimatedEffort: Number(preview.estimatedEffort ?? 0) || null,
      plannedStart: preview.plannedStart ? new Date(preview.plannedStart) : new Date(),
      plannedEnd: preview.plannedEnd ? new Date(preview.plannedEnd) : null,
      risk: preview.risk || null,
      resultSummary: "由 AgentAction 授权后自动创建",
    },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: {
      operatorId: userId || action.session.userId || null,
      executionStatus: "SUPPLIER_RUNNING",
      currentStage: "EXECUTE",
      nextAction: "供应商执行任务并提交交付批次",
    },
  });

  await prisma.operationLog.create({
    data: {
      projectId,
      userId: userId || null,
      actorRole: "OPERATOR",
      action: "AUTHORIZE_AGENT_ACTION",
      detail: `Authorized AgentAction ${actionId} and created ProjectTask ${task.id}`,
      entityType: "ProjectTask",
      entityId: task.id,
      metadata: { actionId, taskId: task.id, responsibleUserId: userId || action.session.userId || null },
    },
  });

  return prisma.agentAction.update({
    where: { id: actionId },
    data: {
      status: "EXECUTED",
      targetId: task.id,
      executedAt: new Date(),
      resultJson: {
        taskId: task.id,
        taskName: task.name,
        status: task.status,
      },
    },
  });
}