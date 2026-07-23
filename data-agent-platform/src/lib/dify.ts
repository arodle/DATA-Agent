export interface DifyChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface DifyChatOptions {
  userId: string;
  apiKey?: string;
  conversationId?: string;
  baseUrl?: string;
  appType?: "chat" | "workflow";
}

export type DifyStreamChunk = {
  content?: string;
  done: boolean;
  conversationId?: string;
  error?: string;
};

function cleanText(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/\{[\s\S]*?\}/g, "")
    .replace(/\d+\.text/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function* streamDifyChat(
  query: string,
  _history: DifyChatMessage[],
  options: DifyChatOptions,
): AsyncGenerator<DifyStreamChunk> {
  const apiKey = options.apiKey || process.env.DIFY_API_KEY;
  const baseUrl = options.baseUrl || process.env.DIFY_BASE_URL || "https://api.dify.ai";
  const appType = options.appType || "chat";

  if (!apiKey || apiKey === "app-xxxxxxxx") {
    yield {
      content: `【演示模式】Dify API Key 未配置。\n\n请在 .env 文件中设置 DIFY_API_KEY。\n\n你的问题是：${query}`,
      done: true,
    };
    return;
  }

  const endpoint = appType === "workflow" ? "/v1/workflows/run" : "/v1/chat-messages";
  const body = appType === "workflow"
    ? { inputs: { user_question: query }, response_mode: "streaming", user: options.userId }
    : { inputs: {}, query, response_mode: "streaming", conversation_id: options.conversationId || "", user: options.userId };

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      yield { error: `Dify API 错误 (${response.status}): ${errText}`, done: true };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield { error: "无法读取响应流", done: true };
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let conversationId = options.conversationId || "";
    let finalAnswer = "";
    let receivedMessageEnd = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const dataStr = line.slice(6).trim();
        if (!dataStr) continue;

        try {
          const data = JSON.parse(dataStr) as Record<string, any>;
          if (typeof data.conversation_id === "string") conversationId = data.conversation_id;

          if (data.event === "message" || data.event === "agent_message") {
            const answer = typeof data.answer === "string" ? data.answer : "";
            if (answer) {
              finalAnswer += answer;
              yield { content: answer, done: false, conversationId };
            }
          } else if (data.event === "node_finished") {
            const outputs = data.data?.outputs || {};
            const answer = outputs.answer || outputs.text || outputs.content || outputs.message;
            if (typeof answer === "string") finalAnswer = answer;
          } else if (data.event === "workflow_finished") {
            const outputs = data.data?.outputs || {};
            const answer = outputs.text || outputs.answer || outputs.content || outputs.message || finalAnswer;
            const content = typeof answer === "string" ? cleanText(answer) : "";
            if (content) yield { content, done: false, conversationId };
            yield { done: true, conversationId };
            return;
          } else if (data.event === "message_end") {
            receivedMessageEnd = true;
          } else if (data.event === "error") {
            yield { error: String(data.message || "Dify 处理错误"), done: true };
            return;
          }
        } catch {
          // Ignore malformed SSE frames.
        }
      }
    }

    const content = cleanText(finalAnswer);
    if (content) {
      yield { content, done: false, conversationId };
    } else if (receivedMessageEnd) {
      yield { content: "检索结果未提供明确信息，请尝试提供更具体的查询条件。", done: false, conversationId };
    }
    yield { done: true, conversationId };
  } catch (error: unknown) {
    yield { error: error instanceof Error ? error.message : "网络请求失败", done: true };
  }
}
