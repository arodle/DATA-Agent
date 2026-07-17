"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface AnnotRule {
  id: string;
  content: string;
  category: string;
}

const defaultRules: AnnotRule[] = [
  { id: "r1", content: "遮挡超过50%的车辆 → 标记为 truncated", category: "遮挡分类" },
  { id: "r2", content: "夜间车灯亮但车身不清 → truncated", category: "遮挡分类" },
  { id: "r3", content: "交通标志牌 → 整体框，不标文字", category: "标注范围" },
  { id: "r4", content: "小目标框可放大10%容差", category: "框精度" },
  { id: "r5", content: "放大后框不能与相邻目标框重叠超过20%", category: "框精度" },
];

export default function SupplierAgentWorker() {
  const [rules] = useState<AnnotRule[]>(defaultRules);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "👋 你好！我是标注辅助 Agent。\n\n⚠️ 我的能力基于项目经理导入的标注规则，可以帮你查询规则、判断标注是否符合规范。\n\n当前已加载 5 条规则。",
      timestamp: "刚刚",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = (text?: string) => {
    const content = text || inputValue.trim();
    if (!content) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");

    setTimeout(() => {
      const lower = content.toLowerCase();
      let response: string;

      if (lower.includes("规则") || lower.includes("规范") || lower.includes("标准")) {
        response = "📐 **当前标注规则**\n\n" + rules.map((r) => `**${r.category}**：${r.content}`).join("\n\n");
      } else if (lower.includes("截断") || lower.includes("遮挡") || lower.includes("truncat")) {
        const related = rules.filter((r) => r.category === "遮挡分类");
        response = "🔍 **遮挡相关规则**\n\n" + related.map((r) => `• ${r.content}`).join("\n");
      } else if (lower.includes("框") || lower.includes("重叠")) {
        const related = rules.filter((r) => r.category === "框精度");
        response = "📏 **框精度规则**\n\n" + related.map((r) => `• ${r.content}`).join("\n");
      } else {
        response = "根据当前规则库，我没有找到直接相关的规则。\n\n你可以问我：\n• 查看全部规则\n• 截断/遮挡怎么标\n• 框的精度要求";
      }

      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      }]);
    }, 500);
  };

  return (
    <>
      <button
        className="sAgentFloatBtn worker"
        onClick={() => setIsOpen(true)}
        title="标注辅助 Agent"
      >
        <span className="sAgentFloatIcon">📋</span>
        <span className="sAgentFloatLabel">标注助手</span>
      </button>

      {isOpen && (
        <div className="sAgentFullPanel sAgentWorkerPanel">
          <div className="sAgentFullHeader">
            <div className="sAgentFullHeaderLeft">
              <span className="sAgentFullAvatar">📋</span>
              <div>
                <strong>标注辅助</strong>
                <span className="sAgentFullStatus"><span className="statusDot" /> 规则模式</span>
              </div>
            </div>
            <button className="sAgentFullClose" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="sAgentFullBanner">
            <span>📐</span> 基于项目经理导入的 {rules.length} 条规则
          </div>

          <div className="sAgentFullMessages">
            {messages.map((msg) => (
              <div key={msg.id} className={`sAgentFullMsg ${msg.role}`}>
                <div className="sAgentFullMsgBubble">
                  <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{msg.content}</p>
                </div>
                <span className="sAgentFullMsgTime">{msg.timestamp}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="sAgentFullPrompts">
            <button className="sAgentFullPromptBtn" onClick={() => handleSend("查看全部规则")}>查看全部规则</button>
            <button className="sAgentFullPromptBtn" onClick={() => handleSend("遮挡和截断怎么标")}>遮挡/截断规则</button>
            <button className="sAgentFullPromptBtn" onClick={() => handleSend("框有什么精度要求")}>框精度要求</button>
          </div>

          <div className="sAgentFullInput">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="查询标注规则..."
              className="sAgentFullInputArea"
              rows={1}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <button className="sAgentFullSendBtn" onClick={() => handleSend()}>查询</button>
          </div>
        </div>
      )}
    </>
  );
}
