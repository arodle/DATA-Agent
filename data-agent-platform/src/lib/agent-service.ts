/**
 * Agent对话服务
 * 流程：意图分类(Dify) → 数据查询(Prisma) → 结果生成(DeepSeek)
 */

import { prisma } from "./db";

// 意图类型定义
type IntentType =
  | "project_query"
  | "task_query"
  | "quality_query"
  | "supplier_query"
  | "rule_query"
  | "platform_query"
  | "requirement_generate"
  | "faq_query"
  | "tool_query"
  | "unknown";

// 查询参数接口
interface QueryParams {
  projectId?: string;
  taskId?: string;
  requirementId?: string;
  supplierId?: string;
  qualityEventId?: string;
  ruleId?: string;
  toolId?: string;
  orgId?: string;
  status?: string;
  keywords?: string[];
}

// 意图分类结果
interface IntentResult {
  intent: IntentType;
  params: QueryParams;
  missingFields: string[];
}

// 数据查询结果
interface QueryResult {
  success: boolean;
  data?: any;
  error?: string;
  source?: string;
}

/**
 * 调用Dify进行意图分类和参数抽取
 */
export async function classifyIntent(userQuery: string): Promise<IntentResult> {
  // 先使用降级方案进行意图分类（本地规则匹配）
  const fallbackResult = fallbackIntentClassification(userQuery);
  console.log("[Intent] Fallback classification:", fallbackResult.intent, fallbackResult.params);
  
  // 直接返回降级结果（暂时跳过Dify意图分类）
  return fallbackResult;
}

/**
 * 从文本中解析意图和参数
 */
function parseIntentFromText(text: string, userQuery: string): IntentResult {
  const intent: IntentType = extractIntent(text);
  const params: QueryParams = {};
  const missingFields: string[] = [];

  // 提取各种ID
  params.projectId = extractId(userQuery, "PRJ");
  params.taskId = extractId(userQuery, "BATCH") || extractId(userQuery, "TASK");
  params.requirementId = extractId(userQuery, "REQ");
  params.supplierId = extractId(userQuery, "SUP");
  params.qualityEventId = extractId(userQuery, "QINC");
  params.ruleId = extractId(userQuery, "RULE");
  params.toolId = extractId(userQuery, "TOOL");
  params.orgId = extractId(userQuery, "ORG");

  return { intent, params, missingFields };
}

/**
 * 从文本中提取意图
 */
function extractIntent(text: string): IntentType {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes("project_query") || lowerText.includes("项目进度") || lowerText.includes("项目状态")) {
    return "project_query";
  }
  if (lowerText.includes("task_query") || lowerText.includes("任务") || lowerText.includes("批次")) {
    return "task_query";
  }
  if (lowerText.includes("quality_query") || lowerText.includes("质量") || lowerText.includes("返修")) {
    return "quality_query";
  }
  if (lowerText.includes("supplier_query") || lowerText.includes("供应商")) {
    return "supplier_query";
  }
  if (lowerText.includes("rule_query") || lowerText.includes("规则")) {
    return "rule_query";
  }
  if (lowerText.includes("platform_query") || lowerText.includes("平台") || lowerText.includes("操作")) {
    return "platform_query";
  }
  if (lowerText.includes("requirement_generate") || lowerText.includes("需求")) {
    return "requirement_generate";
  }
  if (lowerText.includes("faq_query") || lowerText.includes("常见问题")) {
    return "faq_query";
  }
  if (lowerText.includes("tool_query") || lowerText.includes("工具")) {
    return "tool_query";
  }
  
  return "unknown";
}

/**
 * 从用户问题中提取ID
 */
function extractId(query: string, prefix: string): string | undefined {
  const regex = new RegExp(`${prefix}-\\d+`, "i");
  const match = query.match(regex);
  return match ? match[0].toUpperCase() : undefined;
}

/**
 * 降级方案：简单规则匹配
 */
function fallbackIntentClassification(userQuery: string): IntentResult {
  const params: QueryParams = {
    projectId: extractId(userQuery, "PRJ"),
    taskId: extractId(userQuery, "BATCH") || extractId(userQuery, "TASK"),
    requirementId: extractId(userQuery, "REQ"),
    supplierId: extractId(userQuery, "SUP"),
    qualityEventId: extractId(userQuery, "QINC"),
  };

  let intent: IntentType = "unknown";
  
  if (params.projectId || userQuery.includes("项目")) {
    intent = "project_query";
  } else if (params.taskId || userQuery.includes("任务") || userQuery.includes("批次")) {
    intent = "task_query";
  } else if (params.qualityEventId || userQuery.includes("质量") || userQuery.includes("返修")) {
    intent = "quality_query";
  } else if (params.supplierId || userQuery.includes("供应商")) {
    intent = "supplier_query";
  } else if (userQuery.includes("规则")) {
    intent = "rule_query";
  } else if (userQuery.includes("平台") || userQuery.includes("操作")) {
    intent = "platform_query";
  } else if (userQuery.includes("需求")) {
    intent = "requirement_generate";
  }

  return { intent, params, missingFields: [] };
}

/**
 * 根据意图查询数据库
 */
export async function executeQuery(intent: IntentType, params: QueryParams): Promise<QueryResult> {
  try {
    switch (intent) {
      case "project_query":
        return await queryProject(params);
      case "task_query":
        return await queryTask(params);
      case "quality_query":
        return await queryQuality(params);
      case "supplier_query":
        return await querySupplier(params);
      case "faq_query":
        return await queryFAQ(params);
      default:
        return { success: false, error: "未识别的查询意图" };
    }
  } catch (error: any) {
    return { success: false, error: error.message || "数据库查询失败" };
  }
}

/**
 * 查询项目信息
 */
async function queryProject(params: QueryParams): Promise<QueryResult> {
  const { projectId } = params;
  
  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { code: projectId },
      include: {
        ownerOrg: true,
        requirement: true,
        stages: { orderBy: { sortOrder: "asc" } },
        tasks: true,
      },
    });
    
    if (!project) {
      return { success: false, error: `未找到项目 ${projectId}`, source: "Project表" };
    }
    
    return {
      success: true,
      data: formatProjectData(project),
      source: `Project表 (${projectId})`,
    };
  }
  
  // 查询项目列表
  const projects = await prisma.project.findMany({
    take: 10,
    orderBy: { updatedAt: "desc" },
    include: { ownerOrg: true },
  });
  
  return {
    success: true,
    data: projects.map(formatProjectSummary),
    source: "Project表",
  };
}

/**
 * 格式化项目数据
 */
function formatProjectData(project: any): any {
  return {
    code: project.code,
    name: project.name,
    status: project.executionStatus,
    currentStage: project.currentStage,
    priority: project.priority,
    startDate: project.startDate,
    expectedEndDate: project.expectedEndDate,
    completedAt: project.completedAt,
    currentRisk: project.currentRisk,
    nextAction: project.nextAction,
    ownerOrg: project.ownerOrg?.name,
    requirement: project.requirement ? {
      title: project.requirement.title,
      dataModality: project.requirement.dataModality,
      estimatedVolume: project.requirement.estimatedVolume,
    } : null,
    stages: project.stages.map((s: any) => ({
      type: s.type,
      status: s.status,
      summary: s.summary,
    })),
    tasks: project.tasks.map((t: any) => ({
      name: t.name,
      status: t.status,
      stage: t.stage,
    })),
  };
}

/**
 * 格式化项目摘要
 */
function formatProjectSummary(project: any): any {
  return {
    code: project.code,
    name: project.name,
    status: project.executionStatus,
    currentStage: project.currentStage,
    ownerOrg: project.ownerOrg?.name,
  };
}

/**
 * 查询任务信息
 */
async function queryTask(params: QueryParams): Promise<QueryResult> {
  const { projectId, taskId } = params;
  
  if (taskId) {
    const task = await prisma.projectTask.findFirst({
      where: { id: taskId },
      include: { project: true, supplier: true },
    });
    
    if (!task) {
      return { success: false, error: `未找到任务 ${taskId}`, source: "ProjectTask表" };
    }
    
    return {
      success: true,
      data: {
        id: task.id,
        name: task.name,
        stage: task.stage,
        status: task.status,
        dataVolume: task.dataVolume,
        estimatedEffort: task.estimatedEffort,
        actualEffort: task.actualEffort,
        plannedStart: task.plannedStart,
        plannedEnd: task.plannedEnd,
        actualEnd: task.actualEnd,
        risk: task.risk,
        project: task.project?.name,
        supplier: task.supplier?.organizationId,
      },
      source: `ProjectTask表 (${taskId})`,
    };
  }
  
  if (projectId) {
    const tasks = await prisma.projectTask.findMany({
      where: { project: { code: projectId } },
      include: { supplier: true },
    });
    
    return {
      success: true,
      data: tasks.map((t: any) => ({
        name: t.name,
        stage: t.stage,
        status: t.status,
        dataVolume: t.dataVolume,
        supplier: t.supplier?.organizationId,
      })),
      source: `ProjectTask表 (${projectId}的项目任务)`,
    };
  }
  
  return { success: false, error: "请提供任务ID或项目ID" };
}

/**
 * 查询质量问题
 */
async function queryQuality(params: QueryParams): Promise<QueryResult> {
  const { projectId, qualityEventId } = params;
  
  if (qualityEventId) {
    const event = await prisma.qualityEvent.findFirst({
      where: { id: qualityEventId },
      include: { project: true, task: true },
    });
    
    if (!event) {
      return { success: false, error: `未找到质量事件 ${qualityEventId}`, source: "QualityEvent表" };
    }
    
    return {
      success: true,
      data: {
        id: event.id,
        type: event.type,
        severity: event.severity,
        status: event.status,
        impact: event.impact,
        action: event.action,
        rootCause: event.rootCause,
        needRework: event.needRework,
        createdAt: event.createdAt,
        project: event.project?.name,
        task: event.task?.name,
      },
      source: `QualityEvent表 (${qualityEventId})`,
    };
  }
  
  if (projectId) {
    const events = await prisma.qualityEvent.findMany({
      where: { project: { code: projectId } },
      take: 10,
    });
    
    return {
      success: true,
      data: events.map((e: any) => ({
        type: e.type,
        severity: e.severity,
        status: e.status,
        createdAt: e.createdAt,
      })),
      source: `QualityEvent表 (${projectId}的质量事件)`,
    };
  }
  
  return { success: false, error: "请提供质量事件ID或项目ID" };
}

/**
 * 查询供应商信息
 */
async function querySupplier(params: QueryParams): Promise<QueryResult> {
  const { supplierId } = params;
  
  if (supplierId) {
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId },
      include: { organization: true },
    });
    
    if (!supplier) {
      return { success: false, error: `未找到供应商 ${supplierId}`, source: "Supplier表" };
    }
    
    return {
      success: true,
      data: {
        id: supplier.id,
        organization: supplier.organization?.name,
        qualityLevel: supplier.qualityLevel,
        efficiencyRange: supplier.efficiencyRange,
        capabilityTags: supplier.capabilityTags,
        supportedModes: supplier.supportedModes,
        status: supplier.status,
      },
      source: `Supplier表 (${supplierId})`,
    };
  }
  
  const suppliers = await prisma.supplier.findMany({
    where: { status: "ACTIVE" },
    include: { organization: true },
    take: 10,
  });
  
  return {
    success: true,
    data: suppliers.map((s: any) => ({
      id: s.id,
      organization: s.organization?.name,
      qualityLevel: s.qualityLevel,
      status: s.status,
    })),
    source: "Supplier表",
  };
}

/**
 * 查询FAQ
 */
async function queryFAQ(params: QueryParams): Promise<QueryResult> {
  // 这里可以从数据库或知识库查询FAQ
  return {
    success: true,
    data: {
      message: "FAQ查询功能待实现，请提供具体的FAQ关键词",
    },
    source: "FAQ知识库",
  };
}

/**
 * 调用DeepSeek生成最终回答
 */
export async function generateAnswer(
  userQuery: string,
  queryResult: QueryResult,
  intent: IntentType
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  if (!apiKey || apiKey === "sk-your-deepseek-api-key-here") {
    // 演示模式
    return generateDemoAnswer(userQuery, queryResult, intent);
  }

  const systemPrompt = `你是数据交付业务助手。根据查询结果回答用户问题。

规则：
1. 只能使用查询结果中的数据，不要编造
2. 如果查询失败，说明原因并建议用户补充信息
3. 回答格式清晰，包含：当前状态、关键数据、下一步建议、数据来源`;

  const userPrompt = `用户问题：${userQuery}

查询意图：${intent}

查询结果：
${JSON.stringify(queryResult.data, null, 2)}

数据来源：${queryResult.source}

请根据以上信息回答用户问题。`;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API错误: ${response.status}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || "生成回答失败";
  } catch (error) {
    console.error("Generate answer error:", error);
    return generateDemoAnswer(userQuery, queryResult, intent);
  }
}

/**
 * 演示模式：生成回答
 */
function generateDemoAnswer(userQuery: string, queryResult: QueryResult, intent: IntentType): string {
  if (!queryResult.success) {
    return `查询失败：${queryResult.error}\n\n请检查查询条件或提供更多信息。`;
  }

  const data = queryResult.data;
  
  if (intent === "project_query") {
    if (data.code) {
      return `项目 ${data.code} 信息：
- 名称：${data.name}
- 状态：${data.status}
- 当前阶段：${data.currentStage}
- 优先级：${data.priority || "未设置"}
- 所属组织：${data.ownerOrg || "未知"}

阶段进展：
${data.stages?.map((s: any) => `- ${s.type}: ${s.status}`).join("\n") || "暂无阶段信息"}

风险点：${data.currentRisk || "暂无记录"}
下一步：${data.nextAction || "暂无建议"}

数据来源：${queryResult.source}`;
    } else {
      return `找到 ${Array.isArray(data) ? data.length : 0} 个项目：\n${Array.isArray(data) ? data.map((p: any) => `- ${p.code}: ${p.name} (${p.status})`).join("\n") : "暂无数据"}\n\n数据来源：${queryResult.source}`;
    }
  }
  
  if (intent === "task_query") {
    return `任务信息：\n${JSON.stringify(data, null, 2)}\n\n数据来源：${queryResult.source}`;
  }
  
  if (intent === "quality_query") {
    return `质量信息：\n${JSON.stringify(data, null, 2)}\n\n数据来源：${queryResult.source}`;
  }
  
  if (intent === "supplier_query") {
    return `供应商信息：\n${JSON.stringify(data, null, 2)}\n\n数据来源：${queryResult.source}`;
  }

  return `查询结果：\n${JSON.stringify(data, null, 2)}\n\n数据来源：${queryResult.source}`;
}

/**
 * 完整的Agent对话处理流程
 */
export async function processAgentQuery(userQuery: string): Promise<string> {
  // 1. 意图分类
  const intentResult = await classifyIntent(userQuery);
  console.log("Intent:", intentResult.intent, "Params:", intentResult.params);
  
  // 2. 数据查询
  const queryResult = await executeQuery(intentResult.intent, intentResult.params);
  console.log("Query result:", queryResult.success, queryResult.source);
  
  // 3. 结果生成
  const answer = await generateAnswer(userQuery, queryResult, intentResult.intent);
  
  return answer;
}