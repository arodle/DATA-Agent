"use client";

import type { WorkflowNodeData } from "./workflowStore";

// ── 变量定义 ──
export type VariableType = "string" | "number" | "boolean" | "object" | "array" | "array<File>" | "File";

export interface VariableDef {
  name: string;
  type: VariableType;
  source?: string;
  sourceField?: string;
  description?: string;
  required?: boolean;
  defaultValue?: any;
}

// ── 配置字段定义 ──
export type ConfigFieldType =
  | "text"
  | "number"
  | "select"
  | "textarea"
  | "checkbox"
  | "json"
  | "comma-list"
  | "slider"
  | "tag-list"
  | "intent-list";

export interface ConfigFieldDef {
  key: string;
  label: string;
  type: ConfigFieldType;
  placeholder?: string;
  /** select 静态选项 */
  options?: { label: string; value: string }[];
  /** select 动态数据源键名（skills / tools / models / knowledgeList） */
  sourceKey?: string;
  rows?: number;
  step?: number;
  min?: number;
  max?: number;
  group?: string; // 分组标签
}

// ── 节点注册项 ──
export interface NodeRegistryItem {
  type: string;
  label: string;
  icon: string;
  desc: string;
  color: string;
  bg: string;
  inputs: VariableDef[];
  outputs: VariableDef[];
  defaults: Record<string, any>;
  runtimeDefaults: Record<string, any>;
  /** 配置面板字段定义 */
  configSchema: ConfigFieldDef[];
}

// ══════════════════════════════════════════
//  11 种节点类型完整定义
// ══════════════════════════════════════════

export const NODE_REGISTRY: Record<string, NodeRegistryItem> = {
  INPUT: {
    type: "INPUT",
    label: "用户输入",
    icon: "▸",
    desc: "接收用户输入和上下文，作为 Workflow 执行入口",
    color: "#5b8def",
    bg: "#ecfeff",
    inputs: [],
    outputs: [
      // 用户输入变量
      { name: "query", type: "string", description: "用户原始输入，例如：查询昨天供应商通过率", required: true },
      { name: "files", type: "array<File>", description: "用户上传文件列表，例如：质量报告.xlsx", required: false },
      { name: "conversation_id", type: "string", description: "会话 ID，用于串联客服/IM/飞书/企业微信等外部系统", required: false },
      // Runtime 上下文变量（整体输出，子字段运行时动态展开）
      { name: "runtime", type: "object", description: "运行时上下文：user/project/permission/时间/请求信息" },
    ],
    defaults: {
      // 用户可配置的输入字段
      userInputs: [
        { name: "query", type: "string", required: true, description: "用户原始输入，例如：查询昨天供应商通过率" },
        { name: "files", type: "array<File>", required: false, description: "用户上传文件列表，例如：质量报告.xlsx" },
        { name: "conversation_id", type: "string", required: false, description: "会话 ID，用于串联客服/IM/飞书/企业微信等外部系统" },
      ],
      // 运行时自动注入的上下文
      runtimeContext: [
        { name: "user", label: "用户信息", keys: ["userId", "organizationId", "role"] },
        { name: "project", label: "项目上下文", keys: ["projectId", "datasetId", "taskId"] },
        { name: "permission", label: "权限信息", keys: ["permissions"] },
        { name: "time", label: "时间信息", keys: ["today", "now", "timestamp"] },
      ],
      description: "接收用户输入和上下文，作为 Workflow 执行入口",
    },
    runtimeDefaults: { timeout: 30000, retry: 0 },
    configSchema: [
      { key: "timeout", label: "超时(ms)", type: "number", min: 1000, step: 1000, group: "runtime" },
      { key: "retry", label: "重试次数", type: "number", min: 0, max: 5, group: "runtime" },
    ],
  },

  INTENT_CLASSIFIER: {
    type: "INTENT_CLASSIFIER",
    label: "意图识别",
    icon: "◆",
    desc: "识别用户意图：项目查询/质量诊断/需求生成/规则查询/供应商等",
    color: "#8b5cf6",
    bg: "#ede9fe",
    inputs: [
      { name: "query", type: "string", description: "用户问题文本" },
    ],
    outputs: [
      { name: "intent", type: "object", description: "识别出的意图对象：{id, name, confidence, reason}" },
      { name: "confidence", type: "number", description: "置信度分数" },
      { name: "candidates", type: "array", description: "候选意图列表" },
      { name: "reason", type: "string", description: "识别理由" },
    ],
    defaults: {
      model: "deepseek-v4-flash",
      prompt: `SYSTEM
task query.
但如果同时包含质量事件或QINC，优先输出quality_query。

如果用户问题询问项目进度、项目状态、项目风险、项目下一步，输出project_query。
但如果同时包含平台操作词，优先输出platform_query；如果同时包含质量词，优先输出quality_query。

示例：
PRJ-003是否可以发起结算？ -> platform_query
PRJ-003发起结算需要准备什么？ -> platform_query
创建标注任务需要上传什么附件？ -> platform_query
正式试标前需要准备什么？ -> faq_query
REQ-002对应项目是否有质量问题？ -> quality_query
QINC-003为什么要返修，依据哪个规则？ -> quality_query
PRJ-001现在进展怎么样，有什么风险？ -> project_query
PRJ-001现在进展怎么样，有什么风险？ -> project_query
BATCH-003有没有延期风险？ -> task_query
语音转写应该遵守什么规则？ -> rule_query
BBoxTool的输出JSON长什么样？ -> tool_query`,
      strategy: "single",
      threshold: 0.8,
      fallback: "unknown",
      intents: [
        { id: "platform_query", name: "平台操作", description: "查询平台操作流程、功能使用", examples: ["如何发起结算", "创建任务需要什么"], routeNodeId: "" },
        { id: "quality_query", name: "质量诊断", description: "查询质量事件、缺陷原因、返修规则", examples: ["QINC-003为什么返修", "质量报告"], routeNodeId: "" },
        { id: "project_query", name: "项目查询", description: "查询项目进度、状态、风险、资源", examples: ["PRJ-001进展", "项目风险"], routeNodeId: "" },
        { id: "task_query", name: "任务查询", description: "查询标注任务状态、批次进度", examples: ["BATCH-003进度", "任务状态"], routeNodeId: "" },
        { id: "rule_query", name: "规则查询", description: "查询标注规则、流程规范", examples: ["标注规则", "语音转写规则"], routeNodeId: "" },
        { id: "faq_query", name: "常见问题", description: "常见问题解答", examples: ["试标准备", "结算流程"], routeNodeId: "" },
        { id: "supplier_query", name: "供应商查询", description: "查询供应商质量、绩效、统计", examples: ["供应商通过率", "供应商排行"], routeNodeId: "" },
        { id: "tool_query", name: "工具查询", description: "查询工具使用方法、输出格式", examples: ["BBoxTool输出", "工具参数"], routeNodeId: "" },
      ],
    },
    runtimeDefaults: { timeout: 15000, retry: 1 },
    configSchema: [
      { key: "model", label: "模型", type: "select", options: [
        { label: "DeepSeek - deepseek-v4-flash", value: "deepseek-v4-flash" },
        { label: "DeepSeek - deepseek-v4-pro", value: "deepseek-v4-pro" },
        { label: "DeepSeek - deepseek-chat", value: "deepseek-chat" },
        { label: "DeepSeek - deepseek-reasoner", value: "deepseek-reasoner" },
        { label: "OpenAI - gpt-4o", value: "gpt-4o" },
        { label: "OpenAI - gpt-4o-mini", value: "gpt-4o-mini" },
        { label: "Qwen - qwen-2-72b-instruct", value: "qwen-2-72b-instruct" },
        { label: "Qwen - qwen-2-5b-instruct", value: "qwen-2-5b-instruct" },
        { label: "Claude - claude-3-5-sonnet", value: "claude-3-5-sonnet" },
        { label: "Claude - claude-3-opus", value: "claude-3-opus" },
        { label: "Gemini - gemini-1.5-pro", value: "gemini-1.5-pro" },
        { label: "Gemini - gemini-1.5-flash", value: "gemini-1.5-flash" },
      ], group: "模型" },
      { key: "prompt", label: "Prompt", type: "textarea", rows: 12, placeholder: "意图分类系统提示词", group: "模型" },
      { key: "intents", label: "可识别意图", type: "intent-list", group: "意图" },
      { key: "strategy", label: "识别策略", type: "select", options: [
        { label: "单意图", value: "single" },
        { label: "多意图", value: "multiple" },
      ], group: "策略" },
      { key: "threshold", label: "最低置信度", type: "slider", min: 0, max: 1, step: 0.05, group: "策略" },
      { key: "fallback", label: "无法识别时", type: "select", options: [
        { label: "Unknown", value: "unknown" },
        { label: "跳转默认节点", value: "default" },
      ], group: "策略" },
      { key: "timeout", label: "超时(ms)", type: "number", min: 1000, step: 1000, group: "运行配置" },
      { key: "retry", label: "重试次数", type: "number", min: 0, max: 5, group: "运行配置" },
      { key: "cacheEnabled", label: "启用缓存", type: "checkbox", group: "运行配置" },
    ],
  },

  ENTITY_EXTRACTOR: {
    type: "ENTITY_EXTRACTOR",
    label: "参数抽取",
    icon: "⊞",
    desc: "从用户问题中提取业务实体参数：项目ID/批次/规则/质量事件/供应商等",
    color: "#06b6d4",
    bg: "#ecfeff",
    inputs: [
      { name: "query", type: "string", description: "用户问题文本" },
      { name: "intent", type: "string", description: "已识别的意图" },
    ],
    outputs: [
      { name: "entities", type: "object", description: "提取的业务实体JSON" },
      { name: "missing_fields", type: "array", description: "缺失的必要字段" },
    ],
    defaults: {
      model: "deepseek-chat",
      entitySchema: {
        requirement_id: "string", project_id: "string", batch_id: "string",
        rule_id: "string", quality_event_id: "string", supplier_id: "string",
        tool_id: "string", org_id: "string", status: "string",
        date_range: "object", keywords: "array",
      },
    },
    runtimeDefaults: { timeout: 15000, retry: 1 },
    configSchema: [
      { key: "model", label: "模型", type: "select", sourceKey: "models", group: "模型" },
      { key: "entitySchema", label: "实体 Schema", type: "json", rows: 6, group: "抽取" },
      { key: "timeout", label: "超时(ms)", type: "number", min: 1000, step: 1000, group: "runtime" },
      { key: "retry", label: "重试次数", type: "number", min: 0, max: 5, group: "runtime" },
    ],
  },

  BUSINESS_ROUTER: {
    type: "BUSINESS_ROUTER",
    label: "业务路由",
    icon: "⊿",
    desc: "根据意图+实体选择下游 Agent 流程",
    color: "#f59e0b",
    bg: "#fef3c7",
    inputs: [
      { name: "intent", type: "string", description: "意图" },
      { name: "entities", type: "object", description: "实体参数" },
    ],
    outputs: [
      { name: "route", type: "string", description: "路由目标节点ID" },
    ],
    defaults: {
      routes: [
        { intent: "quality_query", target: "quality_agent" },
        { intent: "project_query", target: "project_agent" },
        { intent: "supplier_query", target: "supplier_agent" },
        { intent: "rule_query", target: "rule_agent" },
        { intent: "task_query", target: "task_agent" },
      ],
    },
    runtimeDefaults: { timeout: 5000 },
    configSchema: [
      { key: "routes", label: "路由规则", type: "json", rows: 8, placeholder: '[{"intent":"xxx","target":"nodeId"}]', group: "路由" },
      { key: "timeout", label: "超时(ms)", type: "number", min: 1000, step: 1000, group: "runtime" },
    ],
  },

  CONDITION: {
    type: "CONDITION",
    label: "条件判断",
    icon: "◇",
    desc: "IF/ELSE 条件分支路由",
    color: "#94a3b8",
    bg: "#f1f5f9",
    inputs: [],
    outputs: [
      { name: "result", type: "boolean", description: "条件判断结果" },
    ],
    defaults: { expression: "${intent} == 'quality_query'", rules: [] },
    runtimeDefaults: { timeout: 1000 },
    configSchema: [
      { key: "expression", label: "条件表达式", type: "text", placeholder: "${intent} == 'quality_query'", group: "条件" },
      { key: "rules", label: "路由规则", type: "json", rows: 4, placeholder: '[{"when":"xxx","goTo":"nodeId"}]', group: "条件" },
      { key: "timeout", label: "超时(ms)", type: "number", min: 500, step: 500, group: "runtime" },
    ],
  },

  BUSINESS_DATA_QUERY: {
    type: "BUSINESS_DATA_QUERY",
    label: "业务数据查询",
    icon: "▤",
    desc: "查询业务数据库：Project/Task/Dataset/QualityEvent/Supplier/ModelRun",
    color: "#00b894",
    bg: "#dbeafe",
    inputs: [
      { name: "entities", type: "object", description: "查询条件" },
    ],
    outputs: [
      { name: "data", type: "array", description: "查询结果" },
      { name: "count", type: "number", description: "结果数量" },
    ],
    defaults: {
      businessObject: "Project",
      fields: "id, code, name, status",
      filter: "id = ${entities.project_id}",
      permissions: { organizationId: "${context.orgId}" },
    },
    runtimeDefaults: { timeout: 10000 },
    configSchema: [
      { key: "businessObject", label: "业务对象", type: "select", options: [
        { label: "Project", value: "Project" },
        { label: "ProjectTask", value: "ProjectTask" },
        { label: "Dataset", value: "Dataset" },
        { label: "QualityEvent", value: "QualityEvent" },
        { label: "Supplier", value: "Supplier" },
        { label: "ModelRun", value: "ModelRun" },
      ], group: "查询" },
      { key: "fields", label: "查询字段", type: "text", placeholder: "id, code, name, status", group: "查询" },
      { key: "filter", label: "过滤条件", type: "text", placeholder: "id = ${entities.project_id}", group: "查询" },
      { key: "permissions", label: "权限控制", type: "json", rows: 3, group: "查询" },
      { key: "timeout", label: "超时(ms)", type: "number", min: 1000, step: 1000, group: "runtime" },
    ],
  },

  KNOWLEDGE_RETRIEVAL: {
    type: "KNOWLEDGE_RETRIEVAL",
    label: "知识检索",
    icon: "▦",
    desc: "RAG 检索知识库：标注规则/质量案例/项目经验/SOP流程",
    color: "#f59e0b",
    bg: "#fef3c7",
    inputs: [
      { name: "query", type: "string", description: "检索查询" },
      { name: "entities", type: "object", description: "过滤条件" },
    ],
    outputs: [
      { name: "documents", type: "array", description: "检索到的知识文档" },
      { name: "scores", type: "array", description: "相关性分数" },
    ],
    defaults: { knowledgeTypes: ["标注规则", "质量案例"], topK: 5, minScore: 0.6, rerank: true },
    runtimeDefaults: { timeout: 15000 },
    configSchema: [
      { key: "knowledgeTypes", label: "知识类型", type: "tag-list", placeholder: "输入类型后回车", group: "检索" },
      { key: "topK", label: "Top K", type: "number", min: 1, max: 20, group: "检索" },
      { key: "minScore", label: "最小相关度", type: "slider", min: 0, max: 1, step: 0.05, group: "检索" },
      { key: "rerank", label: "Rerank", type: "checkbox", group: "检索" },
      { key: "timeout", label: "超时(ms)", type: "number", min: 1000, step: 1000, group: "runtime" },
    ],
  },

  TOOL: {
    type: "TOOL",
    label: "工具调用",
    icon: "⚙",
    desc: "调用工具模板：数据分析/报告生成/模型分析",
    color: "#ef6b6b",
    bg: "#fce7f3",
    inputs: [
      { name: "params", type: "object", description: "工具参数" },
    ],
    outputs: [
      { name: "result", type: "object", description: "工具执行结果" },
    ],
    defaults: { templateId: "", config: {} },
    runtimeDefaults: { timeout: 60000 },
    configSchema: [
      { key: "templateId", label: "工具模板", type: "select", sourceKey: "tools", group: "工具" },
      { key: "config", label: "Config JSON", type: "json", rows: 4, group: "工具" },
      { key: "timeout", label: "超时(ms)", type: "number", min: 1000, step: 5000, group: "runtime" },
    ],
  },

  LLM: {
    type: "LLM",
    label: "LLM",
    icon: "✧",
    desc: "DeepSeek 大模型推理",
    color: "#ec4899",
    bg: "#d1fae5",
    inputs: [
      { name: "context", type: "object", description: "上下文（数据/知识/历史）" },
    ],
    outputs: [
      { name: "text", type: "string", description: "模型生成文本" },
      { name: "tokens", type: "number", description: "消耗Token数" },
    ],
    defaults: {
      model: "deepseek-chat",
      temperature: 0.3,
      maxTokens: 2000,
      systemPrompt: "你是专业的数据标采业务Agent",
      userPrompt: "{{query}}",
    },
    runtimeDefaults: { timeout: 30000, retry: 1 },
    configSchema: [
      { key: "model", label: "模型", type: "select", sourceKey: "models", group: "模型" },
      { key: "temperature", label: "Temperature", type: "slider", min: 0, max: 1, step: 0.1, group: "模型" },
      { key: "maxTokens", label: "Max Tokens", type: "number", min: 100, step: 100, group: "模型" },
      { key: "systemPrompt", label: "System Prompt", type: "textarea", rows: 4, group: "Prompt" },
      { key: "userPrompt", label: "User Prompt", type: "textarea", rows: 3, placeholder: "{{query}}", group: "Prompt" },
      { key: "timeout", label: "超时(ms)", type: "number", min: 1000, step: 5000, group: "runtime" },
      { key: "retry", label: "重试次数", type: "number", min: 0, max: 5, group: "runtime" },
    ],
  },

  AGENT: {
    type: "AGENT",
    label: "Agent",
    icon: "◈",
    desc: "绑定 Skill + Tools + Knowledge + Context 的完整 Agent",
    color: "#a06bff",
    bg: "#ede9fe",
    inputs: [
      { name: "query", type: "string", description: "用户问题" },
      { name: "intent", type: "string", description: "意图" },
      { name: "entities", type: "object", description: "实体参数" },
      { name: "data", type: "object", description: "业务数据" },
      { name: "documents", type: "array", description: "知识文档" },
    ],
    outputs: [
      { name: "response", type: "string", description: "Agent 回答" },
      { name: "actions", type: "array", description: "执行的动作列表" },
    ],
    defaults: {
      skill: "",
      prompt: "你是专业的业务Agent",
      businessScope: [],
      knowledgeScope: [],
      dataScope: [],
      toolPermission: [],
    },
    runtimeDefaults: { timeout: 60000, retry: 0 },
    configSchema: [
      { key: "skill", label: "绑定 Skill", type: "select", sourceKey: "skills", group: "Agent" },
      { key: "prompt", label: "Prompt 模板", type: "textarea", rows: 5, placeholder: "你是专业的业务Agent", group: "Agent" },
      { key: "businessScope", label: "业务范围", type: "tag-list", placeholder: "输入后回车", group: "范围" },
      { key: "knowledgeScope", label: "知识范围", type: "tag-list", placeholder: "输入后回车", group: "范围" },
      { key: "dataScope", label: "数据范围", type: "tag-list", placeholder: "输入后回车", group: "范围" },
      { key: "toolPermission", label: "工具权限", type: "tag-list", placeholder: "输入后回车", group: "范围" },
      { key: "timeout", label: "超时(ms)", type: "number", min: 1000, step: 5000, group: "runtime" },
      { key: "retry", label: "重试次数", type: "number", min: 0, max: 5, group: "runtime" },
    ],
  },

  OUTPUT: {
    type: "OUTPUT",
    label: "输出",
    icon: "◀",
    desc: "输出最终结果，保存到业务表",
    color: "#10b981",
    bg: "#fee2e2",
    inputs: [
      { name: "response", type: "string", description: "Agent 回答内容" },
      { name: "data", type: "object", description: "输出数据" },
    ],
    outputs: [],
    defaults: { saveTo: "AgentMessage", notifyUser: false },
    runtimeDefaults: { timeout: 5000 },
    configSchema: [
      { key: "saveTo", label: "保存到业务表", type: "select", options: [
        { label: "AgentMessage", value: "AgentMessage" },
        { label: "Knowledge", value: "Knowledge" },
        { label: "QualityEvent", value: "QualityEvent" },
        { label: "SupplierChat", value: "SupplierChat" },
        { label: "ProjectRetrospective", value: "ProjectRetrospective" },
      ], group: "输出" },
      { key: "notifyUser", label: "通知用户", type: "checkbox", group: "输出" },
      { key: "timeout", label: "超时(ms)", type: "number", min: 1000, step: 1000, group: "runtime" },
    ],
  },
};

export const NODE_PALETTE: NodeRegistryItem[] = Object.values(NODE_REGISTRY);

export function getNodeStyle(type: string): NodeRegistryItem {
  return NODE_REGISTRY[type] || NODE_REGISTRY.INPUT;
}

export function getNodeVariables(type: string): { inputs: VariableDef[]; outputs: VariableDef[] } {
  const def = NODE_REGISTRY[type];
  return {
    inputs: def?.inputs || [],
    outputs: def?.outputs || [],
  };
}
