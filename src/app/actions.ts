"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStorageAssetOption } from "@/lib/storageCatalog";

const currentUser = {
  id: "user-lin",
  name: "林同学",
  email: "lirenxuan@example.com",
  phone: "13800000001",
  organizationId: "org-autolab",
  organizationName: "AutoLab",
  organizationType: "CUSTOMER",
  departmentName: "感知算法组",
};

const defaultOperator = {
  id: "user-operator-a",
  name: "运营 A",
  email: "operator-a@example.com",
};

function textValue(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function makeProjectCode() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.floor(100 + Math.random() * 900);
  return `P-${date}-${suffix}`;
}

function inferAgentAction(message: string) {
  const text = message.toLowerCase();

  if (message.includes("质检") || message.includes("漏标") || message.includes("错标") || message.includes("脚本") || message.includes("缺陷")) {
    return {
      actionType: "GENERATE_QUALITY_SCRIPT",
      targetEntity: "QualityEvent",
      title: "生成质检脚本预览",
      summary: "Agent 将根据当前需求文档验收口径，生成一份质检脚本草案，用于检查漏标、错标、框偏移和格式问题。",
      proposedWrite: "写入 AgentAction 预览，不直接创建正式质检任务。",
    };
  }

  if (message.includes("预标注") || message.includes("自动拉框") || message.includes("模型") || text.includes("yolo") || message.includes("拉框")) {
    return {
      actionType: "RUN_OPEN_SOURCE_PRELABEL",
      targetEntity: "PrelabelRun",
      title: "开源模型预标注预览",
      summary: "Agent 将基于绑定数据资产和当前类别集，准备一次开源模型预标注预览。",
      proposedWrite: "写入预标注预览动作，用户授权后才进入工具执行或运营审核。",
    };
  }

  if (message.includes("工具") || message.includes("配置") || message.includes("类别") || message.includes("阈值") || message.includes("审核")) {
    return {
      actionType: "GENERATE_TOOL_CONFIG",
      targetEntity: "ProjectToolConfig",
      title: "生成工具配置预览",
      summary: "Agent 将根据需求文档、数据资产和验收口径生成工具配置草案，包括类别集、IoU 阈值和样例预览。",
      proposedWrite: "写入工具配置预览，不直接覆盖已审核配置。",
    };
  }

  return {
    actionType: "STRUCTURE_REQUIREMENT",
    targetEntity: "ProjectRequirement",
    title: "结构化需求预览",
    summary: "Agent 将把用户补充说明归并到当前需求文档草案，形成待确认的结构化字段和验收口径建议。",
    proposedWrite: "写入需求结构化预览，不直接修改当前 PDF 版本。",
  };
}
async function ensureCurrentUser() {
  const organization = await prisma.organization.upsert({
    where: { id: currentUser.organizationId },
    update: {
      name: currentUser.organizationName,
      type: currentUser.organizationType,
    },
    create: {
      id: currentUser.organizationId,
      name: currentUser.organizationName,
      type: currentUser.organizationType,
      description: "模拟登录用户所属组织，由系统自动绑定。",
    },
  });

  const user = await prisma.user.upsert({
    where: { id: currentUser.id },
    update: {
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
    },
    create: {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
    },
  });

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId_role: {
        organizationId: organization.id,
        userId: user.id,
        role: "CUSTOMER",
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      userId: user.id,
      role: "CUSTOMER",
    },
  });

  return { organization, user };
}

async function ensureToolTemplate() {
  return prisma.toolTemplate.upsert({
    where: { id: "tool-2d-bbox" },
    update: {
      name: "2D 框标注工具模板",
      toolType: "ANNOTATION_TOOL",
      modality: "图像",
      taskType: "目标检测",
      configSchema: { classes: "string[]", quality: "iouThreshold" },
      previewMode: "IMAGE_BBOX",
      description: "用于矩形框、类别集、IoU 质检阈值预览",
      isPublic: true,
    },
    create: {
      id: "tool-2d-bbox",
      name: "2D 框标注工具模板",
      toolType: "ANNOTATION_TOOL",
      modality: "图像",
      taskType: "目标检测",
      configSchema: { classes: "string[]", quality: "iouThreshold" },
      previewMode: "IMAGE_BBOX",
      description: "用于矩形框、类别集、IoU 质检阈值预览",
      isPublic: true,
    },
  });
}

export async function createDraftProject(formData: FormData) {
  const projectName = textValue(formData, "projectName", "未命名数据项目");
  const mode = textValue(formData, "mode", "PROFESSIONAL");
  const demandType = textValue(formData, "demandType", "标注");
  const storageAsset = getStorageAssetOption(textValue(formData, "storageAssetId", "storage-vehicle-6996"));
  const modelName = textValue(formData, "modelName", "暂未绑定模型");
  const scenario = textValue(
    formData,
    "scenario",
    "用户创建了项目草稿，等待 Agent 进一步澄清数据场景、任务边界和交付口径。",
  );
  const acceptanceCriteria = textValue(formData, "acceptanceCriteria", "待 Agent 生成验收建议，用户预览确认后再进入审核。");

  const { organization, user: creator } = await ensureCurrentUser();

  if (mode === "EDUCATION") {
    await prisma.organization.update({ where: { id: organization.id }, data: { type: "SCHOOL" } });
  }

  const operator = await prisma.user.upsert({
    where: { id: defaultOperator.id },
    update: {
      name: defaultOperator.name,
      email: defaultOperator.email,
    },
    create: defaultOperator,
  });

  const toolTemplate = await ensureToolTemplate();
  const code = makeProjectCode();
  const project = await prisma.project.create({
    data: {
      code,
      name: projectName,
      mode,
      ownerOrgId: organization.id,
      creatorId: creator.id,
      operatorId: operator.id,
      executionStatus: "DRAFT",
      operationStatus: "PENDING_REVIEW",
      currentStage: "创建",
      priority: "P2",
      startDate: new Date(),
      expectedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      companyName: currentUser.organizationName,
      departmentName: currentUser.departmentName,
      contactName: currentUser.name,
      contactInfo: currentUser.email,
      currentRisk: "待评估",
      nextAction: "Agent 生成结构化需求预览，用户确认后进入运营审核",
      requirement: {
        create: {
          title: `${projectName} 需求草稿`,
          demandType,
          dataModality: storageAsset.modality,
          scenario: `${scenario}\n已选数据资产：${storageAsset.name}（${storageAsset.itemCount} 条，${storageAsset.format}）`,
          estimatedVolume: storageAsset.itemCount,
          acceptanceCriteria,
          sampleStatus: "已选择数据资产",
          agentStructuredJson: {
            createdBy: "form",
            boundUser: currentUser.id,
            storageAssetId: storageAsset.id,
            storagePath: storageAsset.storagePath,
            needsAuthorization: true,
            modelName,
          },
        },
      },
      datasets: {
        create: {
          name: storageAsset.name,
          type: "RAW",
          modality: storageAsset.modality,
          itemCount: storageAsset.itemCount,
          format: storageAsset.format,
          storagePath: storageAsset.storagePath,
          source: storageAsset.source,
        },
      },
      toolConfigs: {
        create: {
          templateId: toolTemplate.id,
          name: `${projectName} 工具配置草稿`,
          configJson: {
            toolType: "2D_BBOX",
            classes: ["car", "person", "rider"],
            requiredAllItems: true,
            iouThreshold: 0.75,
            minBoxSize: "12px",
            attributeFields: ["occlusion", "truncation"],
          },
          previewJson: {
            sampleName: storageAsset.name,
            sampleImage: "demo-road-001.jpg",
            boxCount: 5,
            estimatedPassRate: "92%",
            previewNotes: ["类别集已生成", "IoU 阈值 0.75", "需要运营确认是否保留遮挡属性"],
          },
          status: "WAITING_REVIEW",
        },
      },
      prelabelRuns: {
        create: {
          modelName: modelName || "YOLOv8n open-source prelabel",
          imageName: "demo-road-001.jpg",
          inputPath: storageAsset.storagePath,
          boxCount: 5,
          status: "PREVIEW",
          resultJson: { boxes: [{ label: "car", x1: 120, y1: 80, x2: 360, y2: 220 }] },
        },
      },
      stages: {
        create: [
          { type: "创建", status: "CURRENT", summary: "项目草稿已创建，等待用户授权 Agent 写入结构化需求", sortOrder: 1 },
          { type: "审核", status: "PENDING", summary: "审核工具配置、样例预标注效果和质检阈值", sortOrder: 2 },
          { type: "执行", status: "PENDING", summary: "用户自执行、Agent 工具执行或运营分配供应商", sortOrder: 3 },
          { type: "验收", status: "PENDING", summary: "质检、返修、训练效果复盘", sortOrder: 4 },
        ],
      },
      operationLogs: {
        create: [
          {
            userId: creator.id,
            actorRole: "USER",
            action: "创建项目草稿",
            detail: `系统已自动绑定当前用户，并引用数据资产：${storageAsset.name}。`,
            entityType: "Project",
          },
          {
            userId: creator.id,
            actorRole: "AGENT",
            action: "生成工具配置预览",
            detail: "Agent 已生成工具配置草稿和样例预标注效果，等待用户授权后进入运营审核。",
            entityType: "ProjectToolConfig",
          },
        ],
      },
    },
  });

  const session = await prisma.agentSession.create({
    data: {
      projectId: project.id,
      userId: creator.id,
      context: "CUSTOMER_PROJECT",
      title: `${projectName} 需求澄清`,
    },
  });

  await prisma.agentAction.create({
    data: {
      sessionId: session.id,
      projectId: project.id,
      actionType: "STRUCTURE_REQUIREMENT",
      targetEntity: "ProjectRequirement",
      targetId: project.id,
      status: "PREVIEW",
      previewJson: {
        projectName,
        demandType,
        dataModality: storageAsset.modality,
        estimatedVolume: storageAsset.itemCount,
        storageAsset,
        scenario,
        acceptanceCriteria,
        modelName,
      },
    },
  });

  redirect(`/?project=${project.code}#detail`);
}

export async function submitAgentMessage(formData: FormData) {
  const projectCode = textValue(formData, "projectCode");
  const message = textValue(formData, "message");

  if (!projectCode || !message) {
    redirect(projectCode ? `/?project=${projectCode}#detail` : "/#detail");
  }

  const { user } = await ensureCurrentUser();
  const project = await prisma.project.findUnique({
    where: { code: projectCode },
    include: {
      agentSessions: { orderBy: { createdAt: "desc" }, take: 1 },
      requirement: true,
      datasets: { orderBy: { createdAt: "asc" }, take: 1 },
    },
  });

  if (!project) {
    redirect("/#detail");
  }

  const intent = inferAgentAction(message);
  const session = project.agentSessions[0] ?? await prisma.agentSession.create({
    data: {
      projectId: project.id,
      userId: user.id,
      context: "PROJECT_AGENT_CHAT",
      title: `${project.name} Agent 对话`,
    },
  });

  await prisma.agentMessage.create({
    data: {
      sessionId: session.id,
      role: "USER",
      content: message,
      metadata: { projectCode },
    },
  });

  await prisma.agentMessage.create({
    data: {
      sessionId: session.id,
      role: "ASSISTANT",
      content: `${intent.title}：${intent.summary}`,
      metadata: { actionType: intent.actionType, needsAuthorization: true },
    },
  });

  await prisma.agentAction.create({
    data: {
      sessionId: session.id,
      projectId: project.id,
      actionType: intent.actionType,
      targetEntity: intent.targetEntity,
      targetId: project.id,
      status: "PREVIEW",
      previewJson: {
        source: "agent_chat",
        userInput: message,
        proposedAction: intent.title,
        summary: intent.summary,
        proposedWrite: intent.proposedWrite,
        requirementVersion: project.requirement?.rawDocumentUrl ?? "未绑定 PDF",
        dataset: project.datasets[0]
          ? {
              name: project.datasets[0].name,
              itemCount: project.datasets[0].itemCount,
              storagePath: project.datasets[0].storagePath,
              type: project.datasets[0].type,
            }
          : null,
      },
      diffJson: {
        writePolicy: "用户授权前不写入正式业务表；供应商执行必须经过运营分配。",
      },
    },
  });

  await prisma.operationLog.create({
    data: {
      projectId: project.id,
      userId: user.id,
      actorRole: "USER",
      action: "发送 Agent 对话",
      detail: `用户输入：${message}；Agent 已生成 ${intent.title}。`,
      entityType: "AgentSession",
      entityId: session.id,
      metadata: { actionType: intent.actionType },
    },
  });

  redirect(`/?project=${projectCode}#detail`);
}
export async function authorizeAgentPreview(formData: FormData) {
  const projectCode = textValue(formData, "projectCode");
  const actionId = textValue(formData, "actionId");

  if (!projectCode || !actionId) {
    redirect("/#detail");
  }

  const { user } = await ensureCurrentUser();
  const project = await prisma.project.findUnique({ where: { code: projectCode } });

  if (!project) {
    redirect("/#detail");
  }

  await prisma.agentAction.update({
    where: { id: actionId },
    data: {
      status: "AUTHORIZED",
      authorizedBy: user.id,
      authorizedAt: new Date(),
      executedAt: new Date(),
      resultJson: {
        authorizedBy: user.name,
        nextStage: "审核",
        note: "用户确认 Agent 预览内容，提交运营审核。",
      },
    },
  });

  await prisma.project.update({
    where: { id: project.id },
    data: {
      executionStatus: "PENDING_REVIEW",
      operationStatus: "PENDING_REVIEW",
      currentStage: "审核",
      nextAction: "运营审核工具配置、样例预标注效果和质检阈值",
      stages: {
        updateMany: [
          { where: { type: "创建" }, data: { status: "DONE", completedAt: new Date() } },
          { where: { type: "审核" }, data: { status: "CURRENT", startedAt: new Date(), summary: "审核工具配置、样例预标注效果和质检阈值" } },
        ],
      },
      operationLogs: {
        create: {
          userId: user.id,
          actorRole: "USER",
          action: "授权 Agent 预览",
          detail: "用户确认结构化需求、数据资产和工具配置预览，项目进入运营审核。",
          entityType: "AgentAction",
          entityId: actionId,
          metadata: { actionId },
        },
      },
    },
  });

  redirect(`/?project=${projectCode}#detail`);
}

export async function approveToolReview(formData: FormData) {
  const projectCode = textValue(formData, "projectCode");

  if (!projectCode) {
    redirect("/#detail");
  }

  const operator = await prisma.user.upsert({
    where: { id: defaultOperator.id },
    update: defaultOperator,
    create: defaultOperator,
  });
  const project = await prisma.project.findUnique({
    where: { code: projectCode },
    include: { toolConfigs: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!project) {
    redirect("/#detail");
  }

  const latestToolConfig = project.toolConfigs[0];

  await prisma.project.update({
    where: { id: project.id },
    data: {
      executionStatus: "TOOL_RUNNING",
      operationStatus: "APPROVED",
      currentStage: "执行",
      nextAction: "工具配置已通过审核，可进入执行任务配置",
      toolConfigs: latestToolConfig
        ? {
            update: {
              where: { id: latestToolConfig.id },
              data: { status: "APPROVED" },
            },
          }
        : undefined,
      stages: {
        updateMany: [
          { where: { type: "审核" }, data: { status: "DONE", completedAt: new Date() } },
          { where: { type: "执行" }, data: { status: "CURRENT", startedAt: new Date() } },
        ],
      },
      operationLogs: {
        create: {
          userId: operator.id,
          actorRole: "OPERATOR",
          action: "通过工具配置审核",
          detail: "运营确认工具配置和样例效果可进入执行阶段。",
          entityType: "ProjectToolConfig",
          entityId: latestToolConfig?.id,
        },
      },
    },
  });

  redirect(`/?project=${projectCode}#detail`);
}