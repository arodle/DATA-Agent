import { prisma } from "@/lib/prisma";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function jsonString(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export async function generateProjectRetrospective(projectId: string, userId?: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      requirement: true,
      tasks: { include: { supplier: { include: { organization: true } }, qualityEvents: true } },
      datasets: true,
      qualityEvents: true,
      operationLogs: { orderBy: { createdAt: "asc" } },
      retrospectives: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!project) throw new Error("Project not found");

  const paidSettlements = project.operationLogs.filter((log) => log.action === "SETTLEMENT_PAID");
  const completedTasks = project.tasks.filter((task) => task.status === "COMPLETED");
  if (completedTasks.length === 0 && paidSettlements.length === 0) {
    throw new Error("Project has no completed delivery to summarize");
  }

  const existing = project.retrospectives[0];
  if (existing) {
    const [trainingExample, knowledge] = await Promise.all([
      ensureTrainingExample(existing.id, project, existing.successScore ?? 80),
      ensureKnowledgeAsset(existing.id, project, existing.summary, existing.successScore ?? 80, userId),
    ]);
    return { retrospective: existing, trainingExample, knowledge, reused: true };
  }

  const rejectedTasks = project.tasks.filter((task) => task.status === "REJECTED");
  const reworkEvents = project.qualityEvents.filter((event) => event.needRework);
  const openQualityEvents = project.qualityEvents.filter((event) => event.status === "OPEN");
  const score = clamp(88 + completedTasks.length * 2 - rejectedTasks.length * 10 - reworkEvents.length * 6 - openQualityEvents.length * 8, 55, 98);

  const taskPattern = project.tasks.map((task) => ({
    name: task.name,
    stage: task.stage,
    status: task.status,
    executorType: task.executorType,
    supplier: task.supplier?.organization.name || null,
    dataVolume: task.dataVolume,
    qualityEvents: task.qualityEvents.length,
  }));

  const reusablePattern = {
    projectCode: project.code,
    mode: project.mode,
    demandType: project.requirement?.demandType || null,
    modality: project.requirement?.dataModality || null,
    scenario: project.requirement?.scenario || null,
    taskPattern,
    datasetCount: project.datasets.length,
    deliveredItems: project.datasets.reduce((sum, item) => sum + (item.itemCount || 0), 0),
    paidSettlementCount: paidSettlements.length,
    riskSignals: project.qualityEvents.map((event) => ({ type: event.type, severity: event.severity, needRework: event.needRework })),
  };

  const summary = [
    `${project.code} ${project.name} 已完成交付复盘。`,
    `本项目沉淀 ${project.tasks.length} 个任务、${project.datasets.length} 个数据资产、${project.qualityEvents.length} 条质量事件，成功评分 ${score}。`,
    completedTasks.length > 0 ? `可复用路径：${completedTasks.map((task) => `${task.stage}/${task.executorType}`).join("、")}。` : "可复用路径：以结算和资产沉淀日志为主。",
    reworkEvents.length > 0 ? `注意事项：发现 ${reworkEvents.length} 个返工信号，后续相似项目应提前加入抽检和边界样本校验。` : "注意事项：当前未发现返工事件，适合作为标准流程样本。",
  ].join("\n");

  const retrospective = await prisma.projectRetrospective.create({
    data: {
      projectId: project.id,
      outcome: project.executionStatus === "COMPLETED" ? "COMPLETED" : "DELIVERED",
      successScore: score,
      summary,
      reusablePattern,
      isTrainingCandidate: score >= 75,
      desensitized: true,
    },
  });

  const [trainingExample, knowledge] = await Promise.all([
    ensureTrainingExample(retrospective.id, project, score),
    ensureKnowledgeAsset(retrospective.id, project, summary, score, userId),
  ]);

  await prisma.operationLog.create({
    data: {
      projectId: project.id,
      userId: userId || null,
      actorRole: "AGENT",
      action: "GENERATE_PROJECT_RETROSPECTIVE",
      detail: `Generated retrospective and training example for ${project.code}`,
      entityType: "ProjectRetrospective",
      entityId: retrospective.id,
      metadata: {
        retrospectiveId: retrospective.id,
        trainingExampleId: trainingExample.id,
        knowledgeId: knowledge.id,
        successScore: score,
      },
    },
  });

  await prisma.project.update({
    where: { id: project.id },
    data: { nextAction: "项目经验已沉淀为复盘、知识资产和训练样本" },
  });

  return { retrospective, trainingExample, knowledge, reused: false };
}

async function ensureTrainingExample(retrospectiveId: string, project: any, score: number) {
  const existing = await prisma.agentTrainingExample.findFirst({
    where: { sourceType: "PROJECT_RETROSPECTIVE", sourceId: retrospectiveId },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;

  const tasks = project.tasks.map((task: any) => ({
    name: task.name,
    stage: task.stage,
    executorType: task.executorType,
    dataVolume: task.dataVolume,
    targetSupplier: task.supplier?.organization.name || "待分配",
  }));

  return prisma.agentTrainingExample.create({
    data: {
      sourceType: "PROJECT_RETROSPECTIVE",
      sourceId: retrospectiveId,
      category: "PROJECT_PLANNING",
      input: `为相似需求生成项目拆解方案：${project.requirement?.title || project.name}。场景：${project.requirement?.scenario || "未填写"}；数据规模：${project.requirement?.estimatedVolume || "待评估"}。`,
      expectedOutput: jsonString({
        recommendedMode: project.mode,
        taskPlan: tasks,
        acceptanceCriteria: project.requirement?.acceptanceCriteria || "按项目验收标准执行",
        settlementPolicy: "验收通过后生成结算单，并将交付物沉淀为数据资产。",
      }),
      context: `${project.code} ${project.name}`,
      qualityScore: Number((score / 100).toFixed(2)),
      tags: ["project-retrospective", project.mode, project.requirement?.dataModality || "data"],
      approved: score >= 75,
    },
  });
}

async function ensureKnowledgeAsset(retrospectiveId: string, project: any, summary: string, score: number, userId?: string) {
  const existing = await prisma.knowledge.findFirst({
    where: { sourceType: "ProjectRetrospective", sourceId: retrospectiveId },
    include: { embedding: true },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    if (!existing.embedding) {
      await prisma.knowledgeEmbedding.create({
        data: { knowledgeId: existing.id, embeddingStatus: "PROCESSING", chunkCount: 1, modelName: "text-embedding" },
      }).catch(() => null);
    }
    return existing;
  }

  const knowledge = await prisma.knowledge.create({
    data: {
      title: `项目复盘：${project.code} ${project.name}`,
      content: summary,
      type: "项目经验",
      category: "Agent复盘",
      status: "PUBLISHED",
      confidence: score,
      tags: "agent,retrospective,project",
      sourceType: "ProjectRetrospective",
      sourceId: retrospectiveId,
      creatorId: userId || null,
      publisherId: userId || null,
      publishedAt: new Date(),
      relations: {
        create: [
          { relationType: "SOURCE_FROM", targetType: "ProjectRetrospective", targetId: retrospectiveId, createdBy: userId || null },
          { relationType: "APPLY_TO", targetType: "Project", targetId: project.id, createdBy: userId || null },
          ...project.datasets.slice(0, 5).map((dataset: any) => ({
            relationType: "RELATED_TO",
            targetType: "Dataset",
            targetId: dataset.id,
            createdBy: userId || null,
          })),
        ],
      },
      embedding: {
        create: { embeddingStatus: "PROCESSING", chunkCount: 1, modelName: "text-embedding" },
      },
    },
    include: { embedding: true },
  });

  return knowledge;
}
