"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const quickPrompts = [
  "团队今天的任务进度如何？",
  "帮我分析一下质量数据",
  "各团队产能情况怎么样？",
  "本周结算数据汇总",
];

const mockResponses: Record<string, string> = {
  "团队今天的任务进度如何？":
    "📋 **今日团队任务进度**（7月13日）\n\n**图像标注一组**\n- 任务量：8,000 → 已完成 4,880（61%）\n- 在线人数：18/25\n- 预计完成：明天 14:00\n\n**语音转写组**\n- 任务量：3,200 → 已完成 2,560（80%）\n- 在线人数：12/18\n- 预计完成：今天 18:00\n\n**质检组**\n- 待质检：1,240 条\n- 已完成质检：2,180 条\n\n需要查看某个团队的详细数据吗？",
  "帮我分析一下质量数据":
    "📊 **质量分析报告**\n\n**整体合格率**：97.8%\n- 图像标注合格率：98.2% ✅\n- 语音转写合格率：96.5% ⚠️\n- 文本标注合格率：99.1% ✅\n\n**返修趋势**\n- 本周返修率：2.2%（较上周 -0.3%）\n- 主要问题：\n  1. 远距离目标漏标（占比 45%）\n  2. 框偏移超出阈值（占比 32%）\n  3. 类别混淆（占比 23%）\n\n**建议**：加强远距离目标的标注培训。",
  "各团队产能情况怎么样？":
    "🏭 **团队产能周报**\n\n**图像标注一组**\n- 人效：920 张/人天\n- 本周产出：18,400 张\n- 是否达标：✅（目标 850 张/人天）\n\n**语音转写组**\n- 人效：45 分钟/条（音频）\n- 本周产出：540 条\n- 是否达标：✅（目标 50 分钟/条）\n\n**质检组**\n- 人效：280 张/人天\n- 本周产出：5,600 张\n- 是否达标：✅（目标 250 张/人天）",
  "本周结算数据汇总":
    "💰 **本周结算数据**（7月7日 - 7月13日）\n\n**已完成任务**\n- 图像标注一组：18,400 张 × 0.8元 = 14,720 元\n- 语音转写组：540 条 × 2.5元 = 1,350 元\n- 质检组：5,600 张 × 0.3元 = 1,680 元\n\n**合计**：17,750 元\n\n**待确认结算**：\n- 返修调整量：1,240 张\n- 预计调整金额：-992 元\n\n**本月累计**：68,320 元",
};

export default function SupplierAgent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "👋 你好！我是供应商管理 Agent，可以帮你处理以下事务：\n\n- 📋 团队任务进度查询\n- 📊 质量数据分析\n- 🏭 团队产能报告\n- 💰 结算数据汇总\n\n有什么我可以帮你的吗？",
      timestamp: "刚刚",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      const response = mockResponses[content] || "好的，我来帮你处理这个问题。正在查询相关数据...";
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <aside className="sAgentSidebar">
      <div className="sAgentSideHeader">
        <span className="opAgentAvatar">🤖</span>
        <div>
          <strong>管理 Agent</strong>
          <span className="opAgentStatus">
            <span className="statusDot" /> 在线
          </span>
        </div>
      </div>

      <div className="sAgentSideMessages">
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

      <div className="sAgentSidePrompts">
        {quickPrompts.map((prompt) => (
          <button key={prompt} className="quickPromptBtn" onClick={() => handleSend(prompt)}>
            {prompt}
          </button>
        ))}
      </div>

      <div className="sAgentSideInput">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入问题..."
          className="opAgentInput"
          rows={1}
        />
        <button className="opAgentSendBtn" onClick={() => handleSend()}>发送</button>
      </div>
    </aside>
  );
}
