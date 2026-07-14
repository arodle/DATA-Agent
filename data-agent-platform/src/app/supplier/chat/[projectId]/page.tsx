"use client";

import { useState, useEffect, useRef } from "react";

interface ChatMessage {
  id: string;
  senderRole: string;
  senderName: string;
  content: string;
  createdAt: string;
}

interface AnnotRule {
  id: string;
  content: string;
  category: string;
  source: string;
}

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

const extractedRules: AnnotRule[] = [
  { id: "er1", content: "车辆被遮挡超过50% → 标记为 truncated（非 occluded）", category: "遮挡分类", source: "c1" },
  { id: "er2", content: "夜间车灯亮但车身看不清 → truncated", category: "遮挡分类", source: "c3" },
  { id: "er3", content: "小目标框可放大10%容差", category: "框精度", source: "c5" },
  { id: "er4", content: "放大后的框不能与相邻目标框重叠超过20%", category: "框精度", source: "c5" },
];

const categories = ["遮挡分类", "框精度", "标注范围", "质量要求", "其他"];

export default function SupplierChatPage() {
  const [chats] = useState<ChatMessage[]>(demoChats);
  const [rules, setRules] = useState<AnnotRule[]>(extractedRules);
  const [input, setInput] = useState("");
  const [ruleInput, setRuleInput] = useState("");
  const [ruleCategory, setRuleCategory] = useState("其他");
  const [showRulePanel, setShowRulePanel] = useState(false);
  const [exported, setExported] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setInput("");
  };

  const addRule = () => {
    if (!ruleInput.trim()) return;
    setRules((prev) => [...prev, {
      id: `ar${Date.now()}`,
      content: ruleInput.trim(),
      category: ruleCategory,
      source: "manual",
    }]);
    setRuleInput("");
  };

  const removeRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const exportRules = () => {
    const text = rules.map((r) => `[${r.category}] ${r.content}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `标注规则_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <div className="pmChatShell">
      <div className="pmChatMain">
        <div className="pmChatHeader">
          <div>
            <strong>P-20260708-001 · 城市道路车辆2D框标注</strong>
            <span className="pmChatHeaderRole">项目经理对话</span>
          </div>
          <div className="pmChatHeaderActions">
            <button
              className={`pmToggleRuleBtn ${showRulePanel ? "active" : ""}`}
              onClick={() => setShowRulePanel(!showRulePanel)}
            >
              📐 规则面板 {rules.length > 0 && `(${rules.length})`}
            </button>
          </div>
        </div>

        <div className="chatBody">
          {chats.map((chat) => (
            <div key={chat.id} className={`chatBubble ${chat.senderRole === "PM" ? "chatBubbleMine" : "chatBubbleOther"}`}>
              <div className="chatBubbleMeta">
                <span className="chatBubbleRole" style={{ color: chat.senderRole === "USER" ? "#60a5fa" : "#d4a853" }}>
                  {roleLabel[chat.senderRole] || chat.senderRole}
                </span>
                <span className="chatBubbleName">{chat.senderName}</span>
                <span className="chatBubbleTime">
                  {new Date(chat.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                </span>
                {chat.senderRole === "USER" && rules.some((r) => r.source === chat.id) && (
                  <span className="pmRuleTag">📐 已提取规则</span>
                )}
              </div>
              <div className="chatBubbleContent">{chat.content}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="chatInputBar">
          <textarea className="chatInput" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="与需求方沟通标注规范、质量标准..." rows={2} />
          <button className="chatSendBtn" onClick={handleSend} disabled={!input.trim()}>发送</button>
        </div>
      </div>

      {showRulePanel && (
        <aside className="pmRulePanel">
          <div className="pmRulePanelHead">
            <strong>标注规则管理</strong>
            <span className="pmRuleCount">{rules.length} 条规则</span>
          </div>

          <div className="pmRuleInfo">
            从对话中提取规则，人工增强后导出给标注员。标注员的Agent将基于这些规则工作。
          </div>

          <div className="pmRuleList">
            {rules.map((rule) => (
              <div key={rule.id} className="pmRuleItem">
                <div className="pmRuleItemHead">
                  <span className="pmRuleCat">{rule.category}</span>
                  {rule.source !== "manual" && <span className="pmRuleSource">来自对话</span>}
                  <button className="pmRuleDel" onClick={() => removeRule(rule.id)}>✕</button>
                </div>
                <div className="pmRuleContent">{rule.content}</div>
              </div>
            ))}
            {rules.length === 0 && (
              <div className="emptyState" style={{ padding: "20px", fontSize: "12px" }}>暂无规则，从对话提取或手动添加</div>
            )}
          </div>

          <div className="pmRuleAdd">
            <div className="pmRuleAddTitle">手动增加规则</div>
            <select className="pmRuleCatSelect" value={ruleCategory} onChange={(e) => setRuleCategory(e.target.value)}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <textarea className="pmRuleInput" value={ruleInput} onChange={(e) => setRuleInput(e.target.value)}
              placeholder="输入规则内容..." rows={2}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addRule(); } }} />
            <button className="pmRuleAddBtn" onClick={addRule} disabled={!ruleInput.trim()}>添加规则</button>
          </div>

          <button className="pmRuleExportBtn" onClick={exportRules}>
            {exported ? "✅ 已导出" : "📥 导出规则给标注员"}
          </button>
        </aside>
      )}
    </div>
  );
}
