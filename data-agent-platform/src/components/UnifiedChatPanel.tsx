"use client";

import { useState, useEffect, useRef } from "react";

interface ChatMessage {
  id: string;
  senderRole: string;
  senderName: string;
  content: string;
  contentType: string;
  createdAt: string;
}

interface AgentMessage {
  id: string;
  role: string;
  content: string;
}

interface Props {
  projectId: string;
  projectCode: string;
  agentMessages: AgentMessage[];
  supplierChats: ChatMessage[];
}

const roleLabel: Record<string, string> = {
  USER: "需求方",
  SUPPLIER_LEADER: "供应商负责人",
  SUPPLIER_MEMBER: "供应商执行员",
  AGENT: "AI助手",
};

const roleColor: Record<string, string> = {
  USER: "#4a90d9",
  SUPPLIER_LEADER: "#f5a623",
  SUPPLIER_MEMBER: "#7ed321",
  AGENT: "#9b59b6",
};

export default function UnifiedChatPanel({
  projectId,
  projectCode,
  agentMessages,
  supplierChats,
}: Props) {
  const [chatTab, setChatTab] = useState<"agent" | "supplier">("agent");
  const [chats, setChats] = useState<ChatMessage[]>(supplierChats);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, agentMessages, chatTab]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      senderRole: "USER",
      senderName: "林同学",
      content: input.trim(),
      contentType: "TEXT",
      createdAt: new Date().toISOString(),
    };

    setChats((prev) => [...prev, optimistic]);
    const currentInput = input.trim();
    setInput("");

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, content: currentInput, senderRole: "USER" }),
      });
      const data = await res.json();
      if (data.success) {
        setChats((prev) =>
          prev.map((c) =>
            c.id === tempId
              ? { ...data.chat, createdAt: new Date(data.chat.createdAt).toISOString() }
              : c,
          ),
        );
      }
    } catch (e) {
      console.error("Send failed:", e);
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="card" style={{ marginTop: "14px" }}>
      <div className="cardHeader">
        <div className="unifiedChatTabs">
          <button
            className={`unifiedChatTab ${chatTab === "agent" ? "active" : ""}`}
            onClick={() => setChatTab("agent")}
          >
            🤖 Agent 助手
          </button>
          <button
            className={`unifiedChatTab ${chatTab === "supplier" ? "active" : ""}`}
            onClick={() => setChatTab("supplier")}
          >
            💬 供应商沟通
            {chats.length > 0 && (
              <span className="unifiedChatCount">{chats.length}</span>
            )}
          </button>
        </div>
      </div>

      <div className="cardBody noPadding">
        {chatTab === "agent" ? (
          <>
            <div className="terminalBox" style={{ maxHeight: "360px" }}>
              <p className="termSystem">[系统] 已绑定当前项目 {projectCode}。</p>
              {agentMessages.length > 0 ? (
                agentMessages.map((message) => (
                  <p
                    key={message.id}
                    className={message.role === "USER" ? "termUser" : "termAgent"}
                  >
                    [{message.role === "USER" ? "用户" : "Agent"}] {message.content}
                  </p>
                ))
              ) : (
                <>
                  <p className="termUser">[用户] 我想做车辆拉框，先看看可行方案。</p>
                  <p className="termAgent">[Agent] 已生成需求文档摘要、验收口径和工具配置预览。</p>
                  <p className="termMuted">用户确认前不会进入正式执行。</p>
                </>
              )}
              <div ref={bottomRef} />
            </div>
            <div className="commandLine">
              <input placeholder="告诉 Agent 你的目标，例如：帮我生成一版需求文档..." />
              <button>预览</button>
            </div>
          </>
        ) : (
          <div className="unifiedSupplierChat">
            <div className="chatBody" style={{ maxHeight: "320px", minHeight: "200px" }}>
              {chats.length === 0 && (
                <div className="chatEmpty">
                  <div className="chatEmptyIcon">💬</div>
                  <strong>开始与供应商对话</strong>
                  <p>讨论需求细节、质量标准、进度同步、异常处理等</p>
                  <p style={{ fontSize: "12px", color: "#9aa7b5", marginTop: "4px" }}>
                    对话记录将回流至Agent进行学习优化
                  </p>
                </div>
              )}

              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`chatBubble ${
                    chat.senderRole === "USER" ? "chatBubbleMine" : "chatBubbleOther"
                  }`}
                >
                  <div className="chatBubbleMeta">
                    <span
                      className="chatBubbleRole"
                      style={{ color: roleColor[chat.senderRole] || "#666" }}
                    >
                      {roleLabel[chat.senderRole] || chat.senderRole}
                    </span>
                    <span className="chatBubbleName">{chat.senderName}</span>
                    <span className="chatBubbleTime">
                      {new Date(chat.createdAt).toLocaleTimeString("zh-CN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="chatBubbleContent">{chat.content}</div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="chatInputBar">
              <textarea
                className="chatInput"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息，与供应商沟通..."
                rows={2}
                disabled={sending}
              />
              <button
                className="chatSendBtn"
                onClick={sendMessage}
                disabled={sending || !input.trim()}
              >
                {sending ? "..." : "发送"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
