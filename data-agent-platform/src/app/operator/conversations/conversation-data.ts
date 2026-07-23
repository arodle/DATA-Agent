import { prisma } from "@/lib/prisma";

export type Tone = "green" | "yellow" | "red" | "blue" | "gray" | "purple";

export type StatusView = {
  label: string;
  tone: Tone;
};

export type ConversationMessageView = {
  id: string;
  senderName: string;
  senderType: "CUSTOMER" | "OPERATOR" | "AI" | "SYSTEM";
  content: string;
  attachments: Array<{ name: string; url?: string }>;
  requirementIds: string[];
  aiProcessed: boolean;
  hasChange: boolean;
  createdAt: Date;
};

export type RequirementStepView = {
  id: string;
  stepName: string;
  taskType: string;
  modality?: string;
  toolName?: string;
  inputSource?: string;
  outputFormat?: string;
  sortOrder: number;
};

export type RequirementView = {
  id: string;
  requirementNo: string;
  title: string;
  status: StatusView;
  projectType: string;
  projectCount: number;
  hasPendingAiChange: boolean;
  updatedAt: Date;
  modality?: string;
  dataSource?: string;
  dataCount?: number;
  deliveryTime?: Date | null;
  qualityRequirement?: string;
  budget?: number | null;
  confidentialityRequirement?: string;
  needCollection: boolean;
  needAnnotation: boolean;
  needSupplier: boolean;
  owner: string;
  steps: RequirementStepView[];
  missingFields: string[];
  projects: any[];
  draftLogId?: string;
};

export type AiSuggestionView = {
  id: string;
  type: string;
  title: string;
  content: string;
  reason: string;
  source: string;
  confidence: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "MODIFIED";
  requirementId?: string;
};

export type RequirementTimelineItem = {
  id: string;
  actionType: string;
  operatorName: string;
  description: string;
  createdAt: Date;
  sourceMessageIds?: string[];
  projectCode?: string;
};

export type ConversationSummary = {
  id: string;
  name: string;
  communicationStatus: StatusView;
  unreadCount: number;
  memberCount: number;
  latestMessage?: ConversationMessageView;
  aiStatus: StatusView;
  operationStatus: StatusView;
  requirementCount: number;
  requirements: RequirementView[];
  owner: string;
  assistantOwner?: string;
  updatedAt: Date;
  href: string;
  projects: any[];
  draftLogId?: string;
};

const labels = {
  unknownCustomer: "\u672a\u547d\u540d\u5ba2\u6237",
  noMessage: "\u6682\u65e0\u6d88\u606f",
  customer: "\u5ba2\u6237",
  operator: "\u8fd0\u8425",
  ai: "AI",
  system: "\u7cfb\u7edf",
  unanalysed: "\u672a\u5206\u6790",
  analysing: "\u5206\u6790\u4e2d",
  analysed: "\u5df2\u5b8c\u6210",
  newRequirement: "\u53d1\u73b0\u65b0\u9700\u6c42",
  requirementChange: "\u53d1\u73b0\u9700\u6c42\u53d8\u66f4",
  waitingInfo: "\u7b49\u5f85\u4fe1\u606f",
  analysisFailed: "\u5206\u6790\u5931\u8d25",
  noTodo: "\u65e0\u5f85\u529e",
  waitReply: "\u5f85\u56de\u590d\u5ba2\u6237",
  waitReview: "\u5f85\u5ba1\u6838\u9700\u6c42",
  waitChange: "\u5f85\u786e\u8ba4\u53d8\u66f4",
  waitProject: "\u5f85\u521b\u5efa\u9879\u76ee",
  projectRunning: "\u9879\u76ee\u6267\u884c\u4e2d",
  exception: "\u5f85\u5904\u7406\u5f02\u5e38",
  draft: "\u8349\u7a3f",
  communication: "\u6c9f\u901a\u4e2d",
  missingInfo: "\u4fe1\u606f\u5f85\u8865\u5168",
  approved: "\u5df2\u5ba1\u6838",
  running: "\u6267\u884c\u4e2d",
  done: "\u5df2\u5b8c\u6210",
  cancelled: "\u5df2\u53d6\u6d88",
};

function customerName(project: any) {
  return project.ownerOrg?.name || project.companyName || project.contactName || labels.unknownCustomer;
}

function senderType(role: string): ConversationMessageView["senderType"] {
  if (role === "assistant") return "AI";
  if (role === "system") return "SYSTEM";
  return "CUSTOMER";
}

export function senderTypeLabel(type: ConversationMessageView["senderType"]) {
  if (type === "AI") return labels.ai;
  if (type === "SYSTEM") return labels.system;
  if (type === "OPERATOR") return labels.operator;
  return labels.customer;
}

function requirementStatus(project: any): StatusView {
  if (project.executionStatus === "COMPLETED") return { label: labels.done, tone: "green" };
  if (project.executionStatus === "PENDING_REVIEW") return { label: labels.waitReview, tone: "yellow" };
  if (project.executionStatus === "ACCEPTANCE") return { label: labels.approved, tone: "blue" };
  if (project.executionStatus === "CANCELLED") return { label: labels.cancelled, tone: "gray" };
  if (["SUPPLIER_RUNNING", "AGENT_RUNNING", "TOOL_RUNNING", "IN_PROGRESS"].includes(project.executionStatus)) return { label: labels.running, tone: "purple" };
  if (!project.requirement?.estimatedVolume || !project.expectedEndDate) return { label: labels.missingInfo, tone: "red" };
  return { label: labels.communication, tone: "blue" };
}

export function requirementTitle(project: any) {
  return project.requirement?.title || project.name;
}

function projectType(project: any) {
  const stages = new Set((project.tasks || []).map((task: any) => task.stage));
  if (stages.has("ANNOTATION") && stages.has("COLLECTION")) return "\u91c7\u96c6 + \u6807\u6ce8";
  if (stages.has("ANNOTATION") || project.mode === "ANNOTATION") return "\u6807\u6ce8";
  if (stages.has("COLLECTION") || project.mode === "COLLECTION") return "\u91c7\u96c6";
  return project.mode;
}

function requirementNo(project: any, index: number) {
  const date = new Date(project.createdAt);
  const ym = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  return `REQ-${ym}-${String(index + 1).padStart(3, "0")}`;
}

function itemCount(project: any) {
  const datasetItems = (project.datasets || []).reduce((sum: number, dataset: any) => sum + (dataset.itemCount || 0), 0);
  const taskItems = (project.tasks || []).reduce((sum: number, task: any) => sum + (task.dataVolume || 0), 0);
  return Math.max(datasetItems, taskItems);
}


function metadataValue(log: any, key: string) {
  const metadata = log.metadata as Record<string, any> | null;
  return metadata?.[key];
}

function buildDraftRequirement(log: any, index: number): RequirementView {
  const title = metadataValue(log, "title") || log.detail || "Requirement Draft";
  return {
    id: metadataValue(log, "requirementId") || log.entityId || log.id,
    requirementNo: `REQ-DRAFT-${String(index + 1).padStart(3, "0")}`,
    title,
    status: { label: labels.draft, tone: "gray" },
    projectType: "\u672a\u5b9a",
    projectCount: 0,
    hasPendingAiChange: false,
    updatedAt: log.createdAt,
    modality: undefined,
    dataSource: undefined,
    dataCount: undefined,
    deliveryTime: undefined,
    qualityRequirement: undefined,
    budget: undefined,
    confidentialityRequirement: undefined,
    needCollection: false,
    needAnnotation: false,
    needSupplier: false,
    owner: log.user?.name || labels.operator,
    steps: [],
    missingFields: ["\u6570\u636e\u6a21\u6001", "\u6570\u636e\u6570\u91cf", "\u4ea4\u4ed8\u65f6\u95f4", "\u6267\u884c\u6b65\u9aa4", "\u8d28\u91cf\u6807\u51c6"],
    projects: [],
    draftLogId: log.id,
  };
}
function buildRequirement(project: any, index: number): RequirementView {
  const pendingChange = project.agentSessions?.some((session: any) => session.actions?.some((action: any) => action.status === "PREVIEW"));
  const count = itemCount(project);
  const needs = [];
  if (!project.expectedEndDate) needs.push("\u4ea4\u4ed8\u65f6\u95f4");
  if (!count) needs.push("\u6570\u636e\u6570\u91cf");
  if (!project.requirement?.acceptanceCriteria) needs.push("\u8d28\u91cf\u6807\u51c6");
  if (!project.tasks?.length) needs.push("\u6267\u884c\u6b65\u9aa4");

  return {
    id: project.requirement?.id || project.id,
    requirementNo: requirementNo(project, index),
    title: requirementTitle(project),
    status: requirementStatus(project),
    projectType: projectType(project),
    projectCount: 1,
    hasPendingAiChange: Boolean(pendingChange),
    updatedAt: project.updatedAt,
    modality: project.requirement?.dataModality || project.datasets?.[0]?.modality || project.mode,
    dataSource: project.datasets?.[0]?.source || project.datasets?.[0]?.storagePath || "-",
    dataCount: count || undefined,
    deliveryTime: project.expectedEndDate,
    qualityRequirement: project.requirement?.acceptanceCriteria,
    budget: project.budgetAmount,
    confidentialityRequirement: project.requirement?.safetyRequirement,
    needCollection: project.mode === "COLLECTION" || project.tasks?.some((task: any) => task.stage === "COLLECTION"),
    needAnnotation: project.mode === "ANNOTATION" || project.tasks?.some((task: any) => task.stage === "ANNOTATION"),
    needSupplier: project.tasks?.some((task: any) => task.supplierId),
    owner: project.operator?.name || project.operator?.email || "\u5f85\u5206\u914d",
    steps: (project.tasks || []).map((task: any, taskIndex: number) => ({
      id: task.id,
      stepName: task.name || `Step ${taskIndex + 1}`,
      taskType: task.stage,
      modality: project.requirement?.dataModality || project.mode,
      toolName: task.stage === "ANNOTATION" ? "PointTool" : "DataCollector",
      inputSource: project.datasets?.[0]?.name || project.datasets?.[0]?.source,
      outputFormat: task.stage === "ANNOTATION" ? "JSON / COCO" : "Dataset",
      sortOrder: taskIndex + 1,
    })),
    missingFields: needs,
    projects: [project],
  };
}

function latestMessage(projects: any[]): ConversationMessageView | undefined {
  const messages = projects.flatMap((project) =>
    project.agentSessions.flatMap((session: any) =>
      session.messages.map((message: any) => buildMessage(message, project))
    )
  ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  if (messages[0]) return messages[0];
  const latestProject = [...projects].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
  if (!latestProject) return undefined;
  return {
    id: `${latestProject.id}-fallback-message`,
    senderName: latestProject.contactName || labels.customer,
    senderType: "CUSTOMER",
    content: latestProject.name || labels.noMessage,
    attachments: [],
    requirementIds: [latestProject.requirement?.id || latestProject.id],
    aiProcessed: true,
    hasChange: latestProject.agentSessions?.some((session: any) => session.actions?.some((action: any) => action.status === "PREVIEW")) || false,
    createdAt: latestProject.updatedAt,
  };
}

function buildMessage(message: any, project: any): ConversationMessageView {
  const type = senderType(message.role);
  const hasChange = project.agentSessions?.some((session: any) => session.actions?.some((action: any) => action.status === "PREVIEW"));
  return {
    id: message.id,
    senderName: type === "AI" ? labels.ai : (project.contactName || customerName(project)),
    senderType: type,
    content: message.content,
    attachments: [],
    requirementIds: [project.requirement?.id || project.id],
    aiProcessed: type === "AI" || Boolean(project.agentSessions?.length),
    hasChange: Boolean(hasChange),
    createdAt: message.createdAt,
  };
}

function aiStatus(projects: any[]): StatusView {
  const hasPreview = projects.some((project) => project.agentSessions?.some((session: any) => session.actions?.some((action: any) => action.status === "PREVIEW")));
  const hasSessions = projects.some((project) => project.agentSessions?.length);
  const hasMissing = projects.some((project) => !project.expectedEndDate || !project.requirement?.estimatedVolume);
  if (hasPreview) return { label: labels.requirementChange, tone: "yellow" };
  if (hasMissing) return { label: labels.waitingInfo, tone: "red" };
  if (hasSessions) return { label: labels.analysed, tone: "green" };
  return { label: labels.unanalysed, tone: "gray" };
}

function operationStatus(projects: any[]): StatusView {
  const hasRisk = projects.some((project) => project.qualityEvents?.some((event: any) => event.status === "OPEN"));
  const hasPreview = projects.some((project) => project.agentSessions?.some((session: any) => session.actions?.some((action: any) => action.status === "PREVIEW")));
  const hasReview = projects.some((project) => project.executionStatus === "PENDING_REVIEW");
  const hasDraft = projects.some((project) => project.executionStatus === "DRAFT");
  const hasRunning = projects.some((project) => ["SUPPLIER_RUNNING", "AGENT_RUNNING", "TOOL_RUNNING", "IN_PROGRESS"].includes(project.executionStatus));
  if (hasRisk) return { label: labels.exception, tone: "red" };
  if (hasPreview) return { label: labels.waitChange, tone: "yellow" };
  if (hasReview) return { label: labels.waitReview, tone: "yellow" };
  if (hasDraft) return { label: labels.waitProject, tone: "blue" };
  if (hasRunning) return { label: labels.projectRunning, tone: "purple" };
  return { label: labels.noTodo, tone: "green" };
}

function communicationStatus(summaryStatus: StatusView, unreadCount: number): StatusView {
  if (unreadCount > 0) return { label: labels.waitReply, tone: "yellow" };
  return summaryStatus.tone === "green" ? { label: "\u6b63\u5e38", tone: "green" } : { label: "\u9700\u5173\u6ce8", tone: summaryStatus.tone };
}

function memberCount(projects: any[]) {
  const names = new Set<string>();
  projects.forEach((project) => {
    if (project.contactName) names.add(project.contactName);
    if (project.creator?.name) names.add(project.creator.name);
    if (project.operator?.name) names.add(project.operator.name);
  });
  return Math.max(names.size, 1);
}

function unreadCount(projects: any[]) {
  return projects.filter((project) => project.agentSessions?.some((session: any) => session.actions?.some((action: any) => action.status === "PREVIEW")) || project.qualityEvents?.some((event: any) => event.status === "OPEN")).length;
}

export function allMessagesFor(projects: any[]): ConversationMessageView[] {
  const messages = projects.flatMap((project) => {
    const realMessages = project.agentSessions.flatMap((session: any) => session.messages.map((message: any) => buildMessage(message, project)));
    if (realMessages.length) return realMessages;
    const reqId = project.requirement?.id || project.id;
    return [
      {
        id: `${project.id}-customer`,
        senderName: project.contactName || labels.customer,
        senderType: "CUSTOMER" as const,
        content: project.name,
        attachments: project.requirement?.rawDocumentUrl ? [{ name: project.requirement.rawDocumentUrl, url: project.requirement.rawDocumentUrl }] : [],
        requirementIds: [reqId],
        aiProcessed: true,
        hasChange: false,
        createdAt: project?.createdAt || project?.updatedAt || new Date(),
      },
      {
        id: `${project.id}-system`,
        senderName: labels.system,
        senderType: "SYSTEM" as const,
        content: "\u7cfb\u7edf\u5df2\u5efa\u7acb Requirement \u8349\u7a3f\uff0c\u7b49\u5f85\u8fd0\u8425\u8865\u5168\u548c\u5ba1\u6838\u3002",
        attachments: [],
        requirementIds: [reqId],
        aiProcessed: true,
        hasChange: project.agentSessions?.some((session: any) => session.actions?.some((action: any) => action.status === "PREVIEW")) || false,
        createdAt: project.updatedAt,
      },
    ];
  });
  return messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export function suggestionsFor(project: any | null | undefined, requirement: RequirementView): AiSuggestionView[] {
  const actionSuggestions = (project?.agentSessions || []).flatMap((session: any) => session.actions.map((action: any) => ({
    id: action.id,
    type: action.actionType || "REQUIREMENT_UPDATE",
    title: labels.requirementChange,
    content: action.actionType,
    reason: "\u6765\u81ea Conversation \u4e2d\u7684 AI \u52a8\u4f5c\u9884\u89c8",
    source: "AgentAction",
    confidence: 82,
    status: action.status === "PREVIEW" ? "PENDING" as const : "ACCEPTED" as const,
    requirementId: requirement.id,
  })));

  const missingSuggestions = requirement.missingFields.map((field, index) => ({
    id: `${requirement.id}-missing-${index}`,
    type: "MISSING_INFORMATION",
    title: `${labels.waitingInfo}: ${field}`,
    content: `${field}\u9700\u8981\u8fd0\u8425\u5411\u5ba2\u6237\u786e\u8ba4`,
    reason: "\u521b\u5efa\u9879\u76ee\u524d\u7684\u5fc5\u586b\u4fe1\u606f\u68c0\u67e5",
    source: "Requirement validator",
    confidence: 88,
    status: "PENDING" as const,
    requirementId: requirement.id,
  }));

  const defaultSuggestions = [
    {
      id: `${requirement.id}-tool`,
      type: "TOOL_RECOMMENDATION",
      title: "\u63a8\u8350\u5de5\u5177",
      content: requirement.needAnnotation ? "PointTool / RectTool" : "DataCollector",
      reason: "\u6839\u636e\u6570\u636e\u6a21\u6001\u548c\u6267\u884c\u6b65\u9aa4\u63a8\u8350",
      source: "AI rules",
      confidence: 76,
      status: "PENDING" as const,
      requirementId: requirement.id,
    },
  ];

  return [...actionSuggestions, ...missingSuggestions, ...defaultSuggestions];
}

export function timelineFor(project: any | null | undefined, requirement: RequirementView): RequirementTimelineItem[] {
  const logs = (project?.operationLogs || []).map((log: any) => ({
    id: log.id,
    actionType: log.action,
    operatorName: log.user?.name || log.actorRole || labels.operator,
    description: log.detail || log.action,
    createdAt: log.createdAt,
    projectCode: project?.code,
  }));

  return [
    {
      id: `${requirement.id}-created`,
      actionType: "CUSTOMER_MESSAGE",
      operatorName: project?.contactName || labels.customer,
      description: "\u5ba2\u6237\u63d0\u51fa\u9700\u6c42",
      createdAt: project?.createdAt || project?.updatedAt || new Date(),
      projectCode: project?.code,
    },
    ...logs,
    {
      id: `${requirement.id}-updated`,
      actionType: "REQUIREMENT_UPDATED",
      operatorName: requirement.owner,
      description: "Requirement \u5b57\u6bb5\u6216\u5173\u8054\u9879\u76ee\u5df2\u66f4\u65b0",
      createdAt: requirement.updatedAt,
      projectCode: project?.code,
    },
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getConversationSummaries() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      ownerOrg: true,
      creator: true,
      operator: true,
      requirement: true,
      datasets: true,
      tasks: { orderBy: { updatedAt: "asc" } },
      qualityEvents: true,
      operationLogs: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 8 },
      agentSessions: {
        orderBy: { updatedAt: "desc" },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
          actions: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  const draftLogs = await prisma.operationLog.findMany({ where: { action: "CREATE_REQUIREMENT_DRAFT" }, include: { user: true }, orderBy: { createdAt: "desc" } });

  const groups = new Map<string, any[]>();
  projects.forEach((project: any) => {
    const key = project.ownerOrgId || project.companyName || project.contactName || project.id;
    groups.set(key, [...(groups.get(key) || []), project]);
  });

  return Array.from(groups.entries()).map(([id, groupProjects]) => {
    const sorted = [...groupProjects].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    const draftRequirements = draftLogs
      .filter((log: any) => metadataValue(log, "conversationId") === id)
      .map((log: any, index: number) => buildDraftRequirement(log, sorted.length + index));
    const requirements = [...sorted.map((project, index) => buildRequirement(project, index)), ...draftRequirements];
    const ai = aiStatus(sorted);
    const operation = operationStatus(sorted);
    const unread = unreadCount(sorted);
    return {
      id,
      name: customerName(sorted[0]),
      communicationStatus: communicationStatus(operation, unread),
      unreadCount: unread,
      memberCount: memberCount(sorted),
      latestMessage: latestMessage(sorted),
      aiStatus: ai,
      operationStatus: operation,
      requirementCount: requirements.length,
      requirements,
      owner: sorted[0].operator?.name || sorted[0].operator?.email || "\u5f85\u5206\u914d",
      assistantOwner: sorted[1]?.operator?.name || undefined,
      updatedAt: requirements.reduce((latest, req) => req.updatedAt > latest ? req.updatedAt : latest, sorted[0].updatedAt),
      href: `/operator/conversations/${encodeURIComponent(id)}`,
      projects: sorted,
    } satisfies ConversationSummary;
  }).sort((a, b) => {
    const aTodo = a.operationStatus.label === labels.noTodo ? 0 : 1;
    const bTodo = b.operationStatus.label === labels.noTodo ? 0 : 1;
    if (aTodo !== bTodo) return bTodo - aTodo;
    if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}

export async function getConversation(id: string) {
  const conversations = await getConversationSummaries();
  return conversations.find((conversation) => conversation.id === id || encodeURIComponent(conversation.id) === id) || conversations[0] || null;
}
