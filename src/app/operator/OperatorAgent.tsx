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

const mockResponses: Record<string, string> = {
  "今天有哪些待审核的项目？":
    "今天共有 3 个待审核项目：\n\n1. **PRJ-007 图像分类标注** - 提交时间 09:32，待审核验收报告\n2. **PRJ-009 语音转写** - 提交时间 10:15，待审核工具配置\n3. **PRJ-012 NLP实体识别** - 提交时间 14:20，待审核需求文档\n\n需要我帮你打开审核中心吗？",
  "帮我分析一下当前数据质量":
    "当前数据质量整体情况：\n\n✅ **整体合格率**：97.8%（较上周 +0.5%）\n🏷️ **标签一致性**：98.2%\n📊 **数据完整性**：96.5%（需要关注）\n🔄 **标注一致性**：99.1%\n\n**需要关注的问题**：\n- PRJ-001 图像数据有 45 条标注错误（高优先级）\n- PRJ-002 语音数据有 120 条数据缺失（中优先级）",
  "供应商绩效排名怎么样？":
    "本月供应商绩效排名（综合得分）：\n\n1. 🥇 **数据标注科技A** - 95.2 分\n   准确率 98.5% · 及时率 96.8%\n2. 🥈 **智能标注B** - 92.7 分\n   准确率 97.1% · 及时率 95.2%\n3. 🥉 **采集服务C** - 90.3 分\n   准确率 95.6% · 及时率 93.1%\n\n需要查看详细数据吗？",
  "生成本周运营报告":
    "📊 **本周运营报告**（7月7日 - 7月13日）\n\n**项目进展**\n- 进行中项目：12 个（+2）\n- 本周完成：3 个\n- 待审核：3 个\n\n**数据产出**\n- 新增标注数据：45,200 条\n- 数据质量合格率：97.8%\n\n**供应商情况**\n- 活跃供应商：3 家\n- 在线人数：186 人\n- 平均工时：6.8 小时/人\n\n需要我导出详细报告吗？",
};

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
            <button className="opAgentSendBtn" onClick={() => handleSend()}>
              发送
            </button>
          </div>
        </div>
      )}
    </>
  );
}