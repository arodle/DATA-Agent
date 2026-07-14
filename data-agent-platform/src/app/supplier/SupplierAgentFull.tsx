"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const pmPrompts = [
  "团队今天的任务进度如何？",
  "帮我分析一下质量数据",
  "根据对话提取标注规则",
  "生成质检脚本",
];

const managerPrompts = [
  "团队今天的任务进度如何？",
  "各团队产能情况怎么样？",
  "本周结算数据汇总",
];

const mockResponses: Record<string, string> = {
  "团队今天的任务进度如何？":
    "📋 **今日团队任务进度**\n\n**图像标注一组**\n任务量：8,000 → 已完成 4,880（61%）\n在线人数：18/25\n\n**语音转写组**\n任务量：3,200 → 已完成 2,560（80%）\n在线人数：12/18\n\n**质检组**\n待质检：1,240 条\n已完成质检：2,180 条",
  "帮我分析一下质量数据":
    "📊 **质量分析**\n\n整体合格率：97.8%\n图像标注合格率：98.2% ✅\n语音转写合格率：96.5% ⚠️\n\n返修趋势\n本周返修率：2.2%（↓0.3%）\n主要问题：远距离目标漏标(45%)、框偏移(32%)、类别混淆(23%)",
  "根据对话提取标注规则":
    "📐 **从供应商对话中提取的标注规则草案**\n\n1. 遮挡超过50%的车辆 → truncated\n2. 夜间车灯亮但车身不清 → truncated\n3. 交通标志牌 → 整体框，不标文字\n4. 小目标框可放大10%容差\n5. 放大后框不能与相邻框重叠超20%\n\n→ 请在对话页「规则面板」确认并导出给标注员。",
  "生成质检脚本":
    "⚙️ **质检脚本已生成**\n\n脚本名：vehicle_2d_quality_check\n检查项：\n• 遮挡分类一致性\n• 框重叠率 ≤ 20%\n• 小目标框容差 ≤ 10%\n\n→ 已保存，可在质量分析页执行。",
  "各团队产能情况怎么样？":
    "🏭 **团队产能周报**\n\n图像标注一组：920张/人天 ✅\n语音转写组：45分钟/条 ✅\n质检组：280张/人天 ✅",
  "本周结算数据汇总":
    "💰 **本周结算**\n\n图像标注：14,720元\n语音转写：1,350元\n质检：1,680元\n合计：17,750元",
};

export default function SupplierAgentFull({ role }: { role: "manager" | "pm" }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: role === "pm"
        ? "👋 王经理你好！我是项目经理 Agent。\n\n• 📋 查看团队任务进度\n• 📊 分析质量数据\n• 📐 从对话提取标注规则\n• ⚙️ 生成质检脚本\n\n有什么我可以帮你的？"
        : "👋 张总你好！我是管理 Agent。\n\n• 📋 团队任务进度\n• 🏭 团队产能报告\n• 💰 结算数据汇总",
      timestamp: "刚刚",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const prompts = role === "pm" ? pmPrompts : managerPrompts;

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
      const response = mockResponses[content] || "好的，我来帮你处理。";
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      }]);
    }, 600);
  };

  return (
    <aside className="sAgentSidebar">
      <div className="sAgentSideHeader">
        <span className="opAgentAvatar">{role === "pm" ? "📐" : "🤖"}</span>
        <div>
          <strong>{role === "pm" ? "项目经理 Agent" : "管理 Agent"}</strong>
          <span className="opAgentStatus"><span className="statusDot" /> 在线</span>
        </div>
      </div>
      <div className="sAgentSideMessages">
        {messages.map((msg) => (
          <div key={msg.id} className={`opAgentMsg ${msg.role}`}>
            <div className="opAgentMsgBubble"><p style={{ whiteSpace: "pre-wrap" }}>{msg.content}</p></div>
            <span className="opAgentMsgTime">{msg.timestamp}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="sAgentSidePrompts">
        {prompts.map((prompt) => (
          <button key={prompt} className="quickPromptBtn" onClick={() => handleSend(prompt)}>{prompt}</button>
        ))}
      </div>
      <div className="sAgentSideInput">
        <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="输入问题..." className="opAgentInput" rows={1}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
        <button className="opAgentSendBtn" onClick={() => handleSend()}>发送</button>
      </div>
    </aside>
  );
}
