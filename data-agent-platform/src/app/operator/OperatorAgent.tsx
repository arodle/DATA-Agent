"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const quickPrompts = [
  "今天有哪些待审核的项目？",
  "帮我分析一下当前数据质量",
  "供应商绩效排名怎么样？",
  "生成本周运营报告",
];

export default function OperatorAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "👋 你好！我是运营 Agent，可以帮你处理以下事务：\n\n- 📋 项目审核与管理\n- 📊 数据分析与报告\n- 🏭 供应商绩效查询\n- 📈 运营数据监控\n\n有什么我可以帮你的吗？",
      timestamp: "刚刚",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const content = text || inputValue.trim();
    if (!content || sending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setSending(true);

    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const response = await fetch("/api/operator/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: content,
          conversationId,
          userId: "operator-current",
        }),
      });

      if (!response.ok) {
        throw new Error("请求失败");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  fullContent += data.content;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, content: fullContent } : m,
                    ),
                  );
                }
                if (data.conversationId) {
                  setConversationId(data.conversationId);
                }
                if (data.error) {
                  fullContent = fullContent || `错误：${data.error}`;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, content: fullContent } : m,
                    ),
                  );
                }
              } catch {
                // ignore
              }
            }
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `抱歉，发生了错误：${err?.message || "未知错误"}` }
            : m,
        ),
      );
    }

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {!isOpen && (
        <button className="opAgentFab" onClick={() => setIsOpen(true)}>
          <span className="opAgentFabIcon">🤖</span>
          <span className="opAgentFabText">运营 Agent</span>
          <span className="opAgentFabBadge">3</span>
        </button>
      )}

      {isOpen && (
        <div className="opAgentPanel">
          <div className="opAgentHeader">
            <div className="opAgentHeaderLeft">
              <span className="opAgentAvatar">🤖</span>
              <div>
                <strong>运营 Agent</strong>
                <span className="opAgentStatus">
                  <span className="statusDot" /> 在线
                </span>
              </div>
            </div>
            <button className="opAgentClose" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          <div className="opAgentMessages">
            {messages.map((msg) => (
              <div key={msg.id} className={`opAgentMsg ${msg.role}`}>
                <div className="opAgentMsgBubble">
                  <p style={{ whiteSpace: "pre-wrap" }}>{msg.content}</p>
                </div>
                <span className="opAgentMsgTime">{msg.timestamp}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="opAgentQuickPrompts">
            {quickPrompts.map((prompt) => (
              <button key={prompt} className="quickPromptBtn" onClick={() => handleSend(prompt)}>
                {prompt}
              </button>
            ))}
          </div>

          <div className="opAgentInputBar">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入问题，或选择上方快捷指令..."
              className="opAgentInput"
              rows={1}
            />
            <button className="opAgentSendBtn" onClick={() => handleSend()} disabled={sending}>
              {sending ? "..." : "发送"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}