import { NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

type ChatMessage = {
  role: "user" | "assistant" | "agent";
  content: string;
};

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
});

const SYSTEM_PROMPT = `你是一个专业的数据项目管理助手，帮助用户规划数据标注、数据采集、数据清洗、质量验收和供应商协作项目。

你的职责：
1. 需求分析：理解任务类型、数据规模、目标类别、场景和验收标准。
2. 方案设计：给出可执行的数据来源、标注规范、质检策略、排期和风险建议。
3. 成本估算：基于规模、复杂度和供应商执行方式估算费用。
4. 授权预览：当需要创建任务、通知供应商或发起验收时，明确提示需要用户确认。

回复要求：使用中文，结构清晰，简洁专业。`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { messages?: ChatMessage[]; projectName?: string };
    const { messages, projectName } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return json({ error: "消息不能为空" }, 400);
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey || apiKey === "sk-your-deepseek-api-key-here") {
      const latest = messages[messages.length - 1]?.content || "";
      return json({ mock: true, content: buildMockReply(latest, projectName) });
    }

    const openaiMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT + (projectName ? `\n\n当前项目：${projectName}` : "") },
      ...messages.map((message) => ({
        role: message.role === "user" ? "user" as const : "assistant" as const,
        content: message.content,
      })),
    ];

    const stream = await deepseek.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      messages: openaiMessages,
      temperature: 0.7,
      stream: true,
    });

    const encoder = new TextEncoder();
    let fullContent = "";
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || "";
            if (!delta) continue;
            fullContent += delta;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, fullContent })}\n\n`));
          controller.close();
        } catch (error: unknown) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : "流式输出错误" })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    return json({ error: error instanceof Error ? error.message : "服务器错误" }, 500);
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function buildMockReply(input: string, projectName?: string) {
  const context = projectName ? `「${projectName}」` : "当前项目";
  if (/费用|价格|报价|预算|成本|结算|金额/.test(input)) {
    return `已基于${context}生成费用估算框架：\n\n1. 数据准备：按数据量和清洗复杂度计费。\n2. 标注执行：按目标框数量、类别数量和遮挡比例调整单价。\n3. 质检验收：建议抽检 10%-20%，高风险类别加严复核。\n\n如果你确认数据规模和验收标准，我可以继续生成一版可授权的报价预览。`;
  }
  if (/供应商|外包|匹配|招标/.test(input)) {
    return `我建议先按三类指标匹配供应商：\n\n1. 能力：是否覆盖当前模态和任务类型。\n2. 质量：历史验收通过率、返工率和质检响应速度。\n3. 产能：预计日交付量是否满足排期。\n\n下一步可以生成供应商候选清单，等待运营确认后再分配任务。`;
  }
  if (/验收|质检|抽检|返修|交付/.test(input)) {
    return `已整理${context}的验收建议：\n\n1. 自动质检先检查缺标、类别异常、框越界和重复标注。\n2. 人工抽检覆盖高频类别、边界场景和低置信样本。\n3. 对不合格批次生成返修任务，并记录为训练样例。\n\n我可以继续生成验收规则和抽检比例预览。`;
  }
  return `我已收到你的需求：${input}\n\n建议按这个顺序推进：\n1. 补全任务类型、数据规模、目标类别和验收标准。\n2. 生成数据规划方案，明确采集、复用或公开数据来源。\n3. 拆分标采任务，形成待授权的执行预览。\n\n你可以继续告诉我数据量、目标类别或期望交付时间。`;
}
