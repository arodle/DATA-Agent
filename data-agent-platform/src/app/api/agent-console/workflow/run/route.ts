import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type JsonMap = Record<string, unknown>;

export async function POST(req: NextRequest) {
  try {
    const { workflowId, question, userId } = await req.json() as { workflowId?: string; question?: string; userId?: string };
    if (!workflowId || !question) {
      return NextResponse.json({ success: false, error: "缺少 workflowId 或 question" }, { status: 400 });
    }

    const workflow = await prisma.agentWorkflow.findUnique({
      where: { id: workflowId },
      include: {
        nodes: { orderBy: { sortOrder: "asc" } },
        edges: true,
      },
    });

    if (!workflow) {
      return NextResponse.json({ success: false, error: "Workflow 不存在" }, { status: 404 });
    }
    if (workflow.nodes.length === 0) {
      return NextResponse.json({ success: false, error: "Workflow 没有任何节点，请先在 Studio 中编排" }, { status: 400 });
    }

    const trace = await prisma.agentSessionTrace.create({
      data: {
        workflowId,
        workflowName: workflow.name,
        version: workflow.currentVersion,
        userId: userId || null,
        question,
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    const sortedNodes = [...workflow.nodes].sort((a, b) => a.positionX - b.positionX || a.sortOrder - b.sortOrder);
    let currentInput: JsonMap = { question };
    let totalTokens = 0;
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < sortedNodes.length; i++) {
      const node = sortedNodes[i];
      const startedAt = new Date();
      const startedMs = Date.now();
      let output: JsonMap = {};
      let tokens = 0;
      let status = "SUCCESS";
      let errorMessage: string | null = null;

      try {
        const config = parseJson(node.configJson);
        const result = await runNode(node.nodeType, node.nodeName, question, currentInput, config);
        output = result.output;
        tokens = result.tokens;
        successCount += 1;
      } catch (error) {
        status = "FAILED";
        errorMessage = error instanceof Error ? error.message : String(error);
        output = { error: errorMessage };
        failedCount += 1;
      }

      const durationMs = Date.now() - startedMs;
      totalTokens += tokens;

      await prisma.agentNodeExecution.create({
        data: {
          traceId: trace.id,
          workflowId,
          nodeId: node.id,
          nodeType: node.nodeType,
          nodeName: node.nodeName,
          stepOrder: i + 1,
          inputJson: JSON.stringify({ from: i === 0 ? "user" : sortedNodes[i - 1]?.nodeName || "input", data: currentInput }),
          outputJson: JSON.stringify(output),
          tokens,
          durationMs,
          status,
          errorMessage,
          startedAt,
          completedAt: new Date(),
        },
      });

      currentInput = output;
    }

    const finalStatus = failedCount === 0 ? "SUCCESS" : successCount === 0 ? "FAILED" : "PARTIAL";
    await prisma.agentSessionTrace.update({
      where: { id: trace.id },
      data: {
        status: finalStatus,
        totalTokens,
        durationMs: Date.now() - trace.startedAt.getTime(),
        completedAt: new Date(),
      },
    });

    const fullTrace = await prisma.agentSessionTrace.findUnique({
      where: { id: trace.id },
      include: { nodeSteps: { orderBy: { stepOrder: "asc" } } },
    });

    return NextResponse.json({ success: true, trace: fullTrace });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

function parseJson(value: string | null): JsonMap {
  if (!value) return {};
  try {
    return JSON.parse(value) as JsonMap;
  } catch {
    return {};
  }
}

async function runNode(nodeType: string, nodeName: string, question: string, input: JsonMap, config: JsonMap) {
  switch (nodeType) {
    case "INPUT":
      return { output: { question }, tokens: 0 };
    case "AGENT":
      await sleep(80);
      return {
        output: {
          intent: classifyIntent(question),
          entities: extractEntities(question),
          skill: await skillName(config.skill),
          businessScope: config.businessScope || [],
          knowledgeScope: config.knowledgeScope || [],
        },
        tokens: 720,
      };
    case "DATA": {
      const rows = await queryBusinessData(String(config.businessObject || "Project"));
      return { output: { businessObject: config.businessObject || "Project", rows, count: rows.length }, tokens: 50 };
    }
    case "KNOWLEDGE": {
      const hits = await prisma.knowledge.findMany({ where: { status: "PUBLISHED" }, take: Number(config.topK || 5) });
      return {
        output: {
          query: question,
          hits: hits.length,
          results: hits.map((h) => ({ id: h.id, title: h.title, type: h.type, score: 0.82 })),
        },
        tokens: 240,
      };
    }
    case "TOOL":
      await sleep(80);
      return { output: { tool: nodeName, templateId: config.templateId, invoked: true, result: `${nodeName} 已执行` }, tokens: 80 };
    case "LLM":
      await sleep(180);
      return { output: { model: config.model || "deepseek-chat", completion: generateLLMResponse(question, input) }, tokens: 1200 };
    case "CONDITION":
      return { output: { expression: config.expression, result: "always", route: "default" }, tokens: 0 };
    case "OUTPUT":
      return { output: { saveTo: config.saveTo || "AgentMessage", saved: true }, tokens: 0 };
    default:
      return { output: { note: `未知节点类型: ${nodeType}` }, tokens: 0 };
  }
}

async function skillName(skillId: unknown) {
  if (typeof skillId !== "string" || !skillId) return "未指定";
  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  return skill?.name || "未指定";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function classifyIntent(q: string): string {
  if (q.includes("需求") || q.includes("标注") || q.includes("采集")) return "requirement";
  if (q.includes("质量") || q.includes("问题") || q.includes("不合格")) return "quality_diagnosis";
  if (q.includes("供应商")) return "supplier_inquiry";
  if (q.includes("项目") || q.includes("PRJ")) return "project_query";
  return "general";
}

function extractEntities(q: string): JsonMap {
  const entities: JsonMap = {};
  const numMatch = q.match(/(\d+)\s*万?/);
  if (numMatch) entities.dataVolume = Number(numMatch[1]) * (q.includes("万") ? 10000 : 1);
  if (q.includes("语音") || q.includes("ASR")) entities.modality = "AUDIO";
  if (q.includes("图") || q.includes("视频") || q.includes("帧")) entities.modality = "IMAGE";
  if (q.includes("框")) entities.type = "object_detection";
  if (q.includes("关键点")) entities.type = "keypoint";
  return entities;
}

async function queryBusinessData(businessObject: string): Promise<JsonMap[]> {
  if (businessObject === "Project") {
    return prisma.project.findMany({ take: 5, select: { id: true, code: true, name: true, executionStatus: true, currentStage: true } });
  }
  if (businessObject === "ProjectTask") {
    return prisma.projectTask.findMany({ take: 5, select: { id: true, name: true, status: true, stage: true, dataVolume: true } });
  }
  if (businessObject === "QualityEvent") {
    return prisma.qualityEvent.findMany({ take: 5, select: { id: true, type: true, severity: true, status: true, impact: true } });
  }
  if (businessObject === "Supplier") {
    const suppliers = await prisma.supplier.findMany({ take: 5, include: { organization: { select: { name: true } } } });
    return suppliers.map((s) => ({ id: s.id, name: s.organization.name, qualityLevel: s.qualityLevel, status: s.status }));
  }
  if (businessObject === "Dataset") {
    return prisma.dataset.findMany({ take: 5, select: { id: true, name: true, type: true, modality: true, itemCount: true } });
  }
  if (businessObject === "ModelRun") {
    return prisma.modelRun.findMany({ take: 5, select: { id: true, runName: true, status: true, tool: true } });
  }
  return [];
}

function generateLLMResponse(question: string, input: JsonMap): string {
  const rows = Array.isArray(input.rows) ? input.rows.length : 0;
  const hits = typeof input.hits === "number" ? input.hits : 0;
  return `基于 ${rows} 条业务数据和 ${hits} 条知识记录，已生成针对「${question}」的分析结果。`;
}
