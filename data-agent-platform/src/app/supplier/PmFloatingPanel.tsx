"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatMessage {
  id: string;
  senderRole: string;
  senderName: string;
  content: string;
  createdAt: string;
}

const pmPrompts = [
  "团队今天的任务进度如何？",
  "帮我分析一下质量数据",
  "根据对话提取标注规则",
  "生成质检脚本",
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
};

const roleLabel: Record<string, string> = {
  USER: "需求方",
  PM: "项目经理",
  SUPPLIER_LEADER: "供应商负责人",
};

const demoChats: ChatMessage[] = [
  { id: "c1", senderRole: "USER", senderName: "林同学", content: "你好王经理，我们项目的标注标准需要更新：车辆被遮挡超过50%标记为truncated，不是occluded。", createdAt: "2026-07-14T09:32:00Z" },
  { id: "c2", senderRole: "PM", senderName: "王经理", content: "收到林同学。这个变更影响已标注的2000张数据，需要返工吗？", createdAt: "2026-07-14T09:33:00Z" },
  { id: "c3", senderRole: "USER", senderName: "林同学", content: "已标注的不需要返工，新批次执行新标准。另外夜间场景车灯亮但车身看不清的也归truncated。", createdAt: "2026-07-14T09:34:00Z" },
  { id: "c4", senderRole: "PM", senderName: "王经理", content: "好的，我更新规范文档。另外昨晚质检显示小目标框贴合度偏低，建议放大10%容差，你觉得呢？", createdAt: "2026-07-14T09:35:00Z" },
  { id: "c5", senderRole: "USER", senderName: "林同学", content: "10%可以接受，但要加校验：放大后不能和相邻框重叠超过20%。", createdAt: "2026-07-14T09:36:00Z" },
  { id: "c6", senderRole: "PM", senderName: "王经理", content: "明白，我把这些规则整理进标注规范，导入给标注团队。", createdAt: "2026-07-14T09:37:00Z" },
];

export default function PmFloatingPanel({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"agent" | "chat">("agent");
  const [agentMessages, setAgentMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "👋 张总你好！PM 助手已就绪。\n\n• 📋 查看团队任务进度\n• 📊 分析质量数据\n• 📐 从对话提取标注规则\n• ⚙️ 生成质检脚本\n\n有什么我可以帮你的？",
      timestamp: "刚刚",
    },
  ]);
  const [agentInput, setAgentInput] = useState("");
  const [chats] = useState<ChatMessage[]>(demoChats);
  const [chatInput, setChatInput] = useState("");
  const agentEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    agentEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  const handleAgentSend = (text?: string) => {
    const content = text || agentInput.trim();
    if (!content) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    };
    setAgentMessages((prev) => [...prev, userMsg]);
    setAgentInput("");
    setTimeout(() => {
      const response = mockResponses[content] || "好的，我来帮你处理。";
      setAgentMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      }]);
    }, 600);
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    setChatInput("");
  };

  return (
    <div className="pmFloatingOverlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pmFloatingWindow">
        <div className="pmFloatingWinHeader">
          <div className="pmFloatingWinTabs">
            <button
              className={`pmFloatingWinTab ${activeTab === "agent" ? "active" : ""}`}
              onClick={() => setActiveTab("agent")}
            >
              <span className="pmFloatingWinTabIcon">🤖</span>
              PM Agent
            </button>
            <button
              className={`pmFloatingWinTab ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveTab("chat")}
            >
              <span className="pmFloatingWinTabIcon">💬</span>
              需求方对话
            </button>
          </div>
          <div className="pmFloatingWinHeaderRight">
            <span className="pmFloatingWinBadge">项目经理</span>
            <button className="pmFloatingWinClose" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="pmFloatingWinBody">
          {activeTab === "agent" && (
            <div className="pmFloatingAgentChat">
              <div className="pmFloatingWinMessages">
                {agentMessages.map((msg) => (
                  <div key={msg.id} className={`pmFloatMsg ${msg.role}`}>
                    <div className="pmFloatMsgBubble">
                      <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{msg.content}</p>
                    </div>
                    <span className="pmFloatMsgTime">{msg.timestamp}</span>
                  </div>
                ))}
                <div ref={agentEndRef} />
              </div>
              <div className="pmFloatingWinPrompts">
                {pmPrompts.map((prompt) => (
                  <button key={prompt} className="pmFloatPromptBtn" onClick={() => handleAgentSend(prompt)}>
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="pmFloatingWinInputBar">
                <textarea
                  className="pmFloatInput"
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  placeholder="输入问题..."
                  rows={1}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAgentSend(); } }}
                />
                <button className="pmFloatSendBtn" onClick={() => handleAgentSend()}>发送</button>
              </div>
            </div>
          )}

          {activeTab === "chat" && (
            <div className="pmFloatingUserChat">
              <div className="pmFloatingWinMessages">
                {demoChats.map((chat) => (
                  <div key={chat.id} className={`pmFloatChatBubble ${chat.senderRole === "PM" ? "mine" : "other"}`}>
                    <div className="pmFloatChatMeta">
                      <span className="pmFloatChatRole" style={{ color: chat.senderRole === "USER" ? "#60a5fa" : "#d4a853" }}>
                        {roleLabel[chat.senderRole] || chat.senderRole}
                      </span>
                      <span className="pmFloatChatName">{chat.senderName}</span>
                      <span className="pmFloatChatTime">
                        {new Date(chat.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="pmFloatChatContent">{chat.content}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="pmFloatingWinInputBar">
                <textarea
                  className="pmFloatInput"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                  placeholder="与需求方沟通标注规范、质量标准..."
                  rows={2}
                />
                <button className="pmFloatSendBtn" onClick={handleChatSend} disabled={!chatInput.trim()}>发送</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
