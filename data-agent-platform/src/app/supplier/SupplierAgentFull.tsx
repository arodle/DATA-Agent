"use client";

import { useState, useRef, useEffect } from "react";

interface RuleItem {
  category: string;
  content: string;
}

interface ChatMessage {
  id: string;
  senderRole: "user" | "pm" | "agent";
  senderName: string;
  content: string;
  createdAt: string;
  type: "text" | "document" | "notice";
  document?: {
    title: string;
    rules: RuleItem[];
    status: "pending" | "confirmed" | "rejected";
  };
}

const roleConfig: Record<string, { label: string; color: string; avatar: string; avatarBg: string }> = {
  user: { label: "需求方", color: "#60a5fa", avatar: "林", avatarBg: "#356df3" },
  pm: { label: "项目经理", color: "#d4a853", avatar: "王", avatarBg: "#d4a853" },
  agent: { label: "PM Agent", color: "#18c57a", avatar: "🤖", avatarBg: "linear-gradient(135deg, #18c57a, #2ee090)" },
};

const initialMessages: ChatMessage[] = [
  {
    id: "m1",
    senderRole: "agent",
    senderName: "PM Agent",
    content: "👋 群聊已建立 — P-20260708-001 · 城市道路车辆2D框标注\n\n群成员：林同学（需求方）、王经理（项目经理）、PM Agent\n\n请在群内沟通标注规范，沟通完成后我将自动生成规则文档供确认。",
    createdAt: "2026-07-14T09:30:00Z",
    type: "text",
  },
  {
    id: "m2",
    senderRole: "user",
    senderName: "林同学",
    content: "你好王经理，我们项目的标注标准需要更新：车辆被遮挡超过50%标记为truncated，不是occluded。",
    createdAt: "2026-07-14T09:32:00Z",
    type: "text",
  },
  {
    id: "m3",
    senderRole: "pm",
    senderName: "王经理",
    content: "收到林同学。这个变更影响已标注的2000张数据，需要返工吗？",
    createdAt: "2026-07-14T09:33:00Z",
    type: "text",
  },
  {
    id: "m4",
    senderRole: "user",
    senderName: "林同学",
    content: "已标注的不需要返工，新批次执行新标准。另外夜间场景车灯亮但车身看不清的也归truncated。",
    createdAt: "2026-07-14T09:34:00Z",
    type: "text",
  },
  {
    id: "m5",
    senderRole: "pm",
    senderName: "王经理",
    content: "好的，我更新规范文档。另外昨晚质检显示小目标框贴合度偏低，建议放大10%容差，你觉得呢？",
    createdAt: "2026-07-14T09:35:00Z",
    type: "text",
  },
  {
    id: "m6",
    senderRole: "user",
    senderName: "林同学",
    content: "10%可以接受，但要加校验：放大后不能和相邻框重叠超过20%。",
    createdAt: "2026-07-14T09:36:00Z",
    type: "text",
  },
  {
    id: "m7",
    senderRole: "pm",
    senderName: "王经理",
    content: "明白，我来让 Agent 整理规则文档。",
    createdAt: "2026-07-14T09:37:00Z",
    type: "text",
  },
];

// PM Agent 从对话中提取的规则
const extractedRules: RuleItem[] = [
  { category: "遮挡分类", content: "车辆被遮挡超过50% → 标记为 truncated（非 occluded）" },
  { category: "遮挡分类", content: "夜间车灯亮但车身看不清 → truncated" },
  { category: "框精度", content: "小目标框可放大10%容差" },
  { category: "框精度", content: "放大后框不能与相邻目标框重叠超过20%" },
];

const quickPrompts = [
  "补充：交通标志牌整体框标注",
  "补充：远距离小目标不标",
  "生成规则文档",
];

export default function SupplierAgentFull({ role }: { role: "manager" | "pm" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const now = () => new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });

  const handleSend = (text?: string) => {
    const content = text || input.trim();
    if (!content) return;

    // 特殊指令：生成规则文档
    if (content === "生成规则文档") {
      handleGenerateDoc();
      return;
    }

    // 普通发言（以项目经理身份）
    const userMsg: ChatMessage = {
      id: `pm${Date.now()}`,
      senderRole: "pm",
      senderName: "王经理",
      content,
      createdAt: new Date().toISOString(),
      type: "text",
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // 如果是补充规则，Agent 确认收到
    if (content.startsWith("补充：")) {
      setTimeout(() => {
        const agentMsg: ChatMessage = {
          id: `ag${Date.now()}`,
          senderRole: "agent",
          senderName: "PM Agent",
          content: `✅ 已记录补充规则：${content.replace("补充：", "")}\n\n当前待生成文档包含 ${extractedRules.length + 1} 条规则。点击「生成规则文档」可随时整理。`,
          createdAt: new Date().toISOString(),
          type: "text",
        };
        setMessages((prev) => [...prev, agentMsg]);
      }, 600);
    }
  };

  // PM Agent 生成规则文档
  const handleGenerateDoc = () => {
    setIsGenerating(true);
    setInput("");

    // Agent 先发一条提示
    const tipMsg: ChatMessage = {
      id: `ag-tip${Date.now()}`,
      senderRole: "agent",
      senderName: "PM Agent",
      content: "📝 正在从群聊对话中提取标注规则，生成规则文档...",
      createdAt: new Date().toISOString(),
      type: "text",
    };
    setMessages((prev) => [...prev, tipMsg]);

    setTimeout(() => {
      const docMsg: ChatMessage = {
        id: `doc${Date.now()}`,
        senderRole: "agent",
        senderName: "PM Agent",
        content: "",
        createdAt: new Date().toISOString(),
        type: "document",
        document: {
          title: "P-20260708-001 标注规则文档 v1.0",
          rules: extractedRules,
          status: "pending",
        },
      };
      setMessages((prev) => [...prev, docMsg]);
      setIsGenerating(false);
    }, 1500);
  };

  // 用户确认文档
  const handleConfirmDoc = (docId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === docId && msg.document
          ? { ...msg, document: { ...msg.document, status: "confirmed" } }
          : msg
      )
    );

    // 系统通知：已转交标注员
    setTimeout(() => {
      const noticeMsg: ChatMessage = {
        id: `notice${Date.now()}`,
        senderRole: "agent",
        senderName: "PM Agent",
        content: "✅ 需求方已确认规则文档，已自动转交给标注团队。\n\n标注员的 Agent 已加载最新规则，可立即开始执行。",
        createdAt: new Date().toISOString(),
        type: "notice",
      };
      setMessages((prev) => [...prev, noticeMsg]);
    }, 800);
  };

  // 用户驳回文档
  const handleRejectDoc = (docId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === docId && msg.document
          ? { ...msg, document: { ...msg.document, status: "rejected" } }
          : msg
      )
    );
  };

  return (
    <>
      <button
        className="sAgentFloatBtn manager"
        onClick={() => setIsOpen(true)}
        title="AI 助手"
      >
        <span className="sAgentFloatIcon">🤖</span>
        <span className="sAgentFloatLabel">AI 助手</span>
      </button>

      {isOpen && (
        <div className="sAgentFullPanel">
          <div className="sAgentFullHeader">
            <div className="sAgentFullHeaderLeft">
              <span className="sAgentFullAvatar">🤖</span>
              <div>
                <strong>P-20260708-001 · 项目群聊</strong>
                <span className="sAgentFullStatus">
                  <span className="statusDot" /> 林同学 · 王经理 · PM Agent
                </span>
              </div>
            </div>
            <button className="sAgentFullClose" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="sAgentFullMessages">
            {messages.map((msg) => {
              const cfg = roleConfig[msg.senderRole];
              const isMine = msg.senderRole === "pm";

              // 系统通知
              if (msg.type === "notice") {
                return (
                  <div key={msg.id} className="sAgentNoticeMsg">
                    <div className="sAgentNoticeIcon">📋</div>
                    <div className="sAgentNoticeContent">{msg.content}</div>
                  </div>
                );
              }

              // 文档消息
              if (msg.type === "document" && msg.document) {
                const doc = msg.document;
                return (
                  <div key={msg.id} className="sAgentDocMsg">
                    <div className="sAgentDocHeader">
                      <span className="sAgentDocIcon">📄</span>
                      <div>
                        <strong>{doc.title}</strong>
                        <span className="sAgentDocMeta">PM Agent 生成 · {doc.rules.length} 条规则</span>
                      </div>
                      {doc.status === "confirmed" && <span className="sAgentDocBadge confirmed">✅ 已确认</span>}
                      {doc.status === "rejected" && <span className="sAgentDocBadge rejected">❌ 已驳回</span>}
                    </div>

                    <div className="sAgentDocRules">
                      {doc.rules.map((rule, i) => (
                        <div key={i} className="sAgentDocRule">
                          <span className="sAgentDocRuleCat">{rule.category}</span>
                          <span className="sAgentDocRuleContent">{rule.content}</span>
                        </div>
                      ))}
                    </div>

                    {doc.status === "pending" && (
                      <div className="sAgentDocActions">
                        <span className="sAgentDocHint">请需求方确认后转交标注员</span>
                        <div className="sAgentDocBtns">
                          <button className="sAgentDocBtn reject" onClick={() => handleRejectDoc(msg.id)}>
                            驳回修改
                          </button>
                          <button className="sAgentDocBtn confirm" onClick={() => handleConfirmDoc(msg.id)}>
                            确认并转交
                          </button>
                        </div>
                      </div>
                    )}

                    {doc.status === "confirmed" && (
                      <div className="sAgentDocFooter">
                        ✅ 需求方已确认，规则已转交标注团队
                      </div>
                    )}
                    {doc.status === "rejected" && (
                      <div className="sAgentDocFooter rejected">
                        ❌ 需方驳回，请在群聊中继续沟通修改
                      </div>
                    )}
                  </div>
                );
              }

              // 普通文本消息
              return (
                <div key={msg.id} className={`sAgentGroupMsg ${isMine ? "mine" : "other"}`}>
                  <div className="sAgentGroupAvatar" style={{ background: cfg.avatarBg }}>
                    {cfg.avatar}
                  </div>
                  <div className="sAgentGroupBody">
                    <div className="sAgentGroupMeta">
                      <span className="sAgentGroupName" style={{ color: cfg.color }}>
                        {msg.senderName}
                      </span>
                      <span className="sAgentGroupRole">{cfg.label}</span>
                      <span className="sAgentGroupTime">
                        {new Date(msg.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="sAgentGroupBubble">{msg.content}</div>
                  </div>
                </div>
              );
            })}
            {isGenerating && (
              <div className="sAgentGroupMsg other">
                <div className="sAgentGroupAvatar" style={{ background: "linear-gradient(135deg, #18c57a, #2ee090)" }}>🤖</div>
                <div className="sAgentGroupBody">
                  <div className="sAgentTyping">
                    <span className="sAgentTypingDot" />
                    <span className="sAgentTypingDot" />
                    <span className="sAgentTypingDot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="sAgentFullPrompts">
            <button
              className="sAgentFullPromptBtn generateBtn"
              onClick={handleGenerateDoc}
              disabled={isGenerating}
            >
              {isGenerating ? "⏳ 生成中..." : "📝 生成规则文档"}
            </button>
            {quickPrompts.map((prompt) => (
              <button key={prompt} className="sAgentFullPromptBtn" onClick={() => handleSend(prompt)}>
                {prompt}
              </button>
            ))}
          </div>

          <div className="sAgentFullInput">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="以项目经理身份发言..."
              className="sAgentFullInputArea"
              rows={1}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <button className="sAgentFullSendBtn" onClick={() => handleSend()} disabled={!input.trim()}>发送</button>
          </div>
        </div>
      )}
    </>
  );
}
