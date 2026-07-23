import { NextRequest } from "next/server";
import { processAgentQuery } from "@/lib/agent-service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "query 不能为空" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 调用新的Agent服务处理查询
    // 流程：意图分类 → 数据查询 → 结果生成
    const answer = await processAgentQuery(query);

    // 返回流式响应
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      start(controller) {
        // 发送回答内容
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: answer })}\n\n`));
        // 发送结束标记
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, fullContent: answer })}\n\n`));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e: any) {
    console.error("Operator agent chat error:", e);
    return new Response(JSON.stringify({ error: e?.message || "服务器错误" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}