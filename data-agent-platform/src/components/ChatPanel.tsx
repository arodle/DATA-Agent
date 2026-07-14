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

interface Props {
  projectId: string;
  projectCode: string;
  projectName: string;
  role: "user" | "supplier";
  initialChats?: ChatMessage[];
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

export default function ChatPanel({ projectId, projectCode, projectName, role, initialChats = [] }: Props) {
  const [chats, setChats] = useState<ChatMessage[]>(initialChats);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSending(true);

    const senderRole = role === "user" ? "USER" : "SUPPLIER_LEADER";
    const tempId = `temp-${Date.now()}`;

    const optimistic: ChatMessage = {
      id: tempId,
      senderRole,
      senderName: senderRole === "USER" ? "林同学" : "供应商联系人",
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
        body: JSON.stringify({ projectId, content: currentInput, senderRole }),
      });
      const data = await res.json();
      if (data.success) {
        setChats((prev) =>
          prev.map((c) => (c.id === tempId ? { ...data.chat, createdAt: new Date(data.chat.createdAt).toISOString() } : c)),
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
    <div className="chatShell">
      <div className="chatHeader">
        <div className="chatHeaderLeft">
          <strong>{projectCode} · {projectName}</strong>
          <span className="chatHeaderRole">
            {role === "user" ? "需求方" : "供应商"}对话
          </span>
        </div>
        <span className="chatHeaderHint">
          对话记录将回流至Agent进行学习优化
        </span>
      </div>

      <div className="chatBody">
        {chats.length === 0 && (
          <div className="chatEmpty">
            <div className="chatEmptyIcon">💬</div>
            <strong>开始与{role === "user" ? "供应商" : "需求方"}对话</strong>
            <p>讨论需求细节、质量标准、进度同步、异常处理等</p>
          </div>
        )}

        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`chatBubble ${
              chat.senderRole === (role === "user" ? "USER" : "SUPPLIER_LEADER")
                ? "chatBubbleMine"
                : "chatBubbleOther"
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
          placeholder={
            role === "user"
              ? "输入消息，与供应商沟通..."
              : "输入消息，与需求方沟通..."
          }
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
  );
}
