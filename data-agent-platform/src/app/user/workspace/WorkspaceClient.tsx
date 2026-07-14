"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

type ProjectItem = {
  id: string;
  code: string;
  name: string;
  executionStatus: string;
  createdAt: string;
  stage: string;
  dataCount: number;
};

type MessageItem = {
  id: string;
  role: "user" | "agent" | "system";
  content: string;
  plan?: PlanItem[];
  time: string;
};

type PlanItem = {
  id: string;
  title: string;
  desc: string;
  status: "pending" | "running" | "done";
  action?: string;
};

type SupplierChatItem = {
  id: string;
  senderRole: string;
  senderName: string;
  content: string;
  createdAt: string;
};

type Props = {
  projects: ProjectItem[];
  initialSupplierChats: SupplierChatItem[];
};

const statusLabel: Record<string, string> = {
  DRAFT: "草稿",
  PENDING_REVIEW: "待确认",
  SELF_RUNNING: "自执行中",
  TOOL_RUNNING: "工具执行中",
  AGENT_RUNNING: "Agent 执行中",
  SUPPLIER_RUNNING: "供应商执行中",
  ACCEPTANCE: "验收中",
  COMPLETED: "已完成",
  PAUSED: "已暂停",
  CANCELLED: "已取消",
};

const statusColor: Record<string, string> = {
  DRAFT: "#71717a",
  PENDING_REVIEW: "#d4a853",
  SELF_RUNNING: "#60a5fa",
  TOOL_RUNNING: "#60a5fa",
  AGENT_RUNNING: "#60a5fa",
  SUPPLIER_RUNNING: "#60a5fa",
  ACCEPTANCE: "#d4a853",
  COMPLETED: "#34d399",
  PAUSED: "#71717a",
  CANCELLED: "#f87171",
};

const initialMessages: MessageItem[] = [
  {
    id: "m1",
    role: "agent",
    content: "你好，林同学。我是你的项目 Agent。\n\n当前参与「城市道路车辆 2D 框标注」项目（执行中），说出目标，我会结合项目上下文帮你规划。",
    time: "10:21",
  },
];

const suggestionPrompts = [
  "提升模型准确率",
  "分析当前效果问题",
  "生成数据标注方案",
  "看看数据量够不够",
  "发起一次微调训练",
];

const supplierRoleLabel: Record<string, string> = {
  USER: "你",
  SUPPLIER_LEADER: "供应商负责人",
  SUPPLIER_MEMBER: "执行员",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function Avatar({ role, senderRole }: { role?: string; senderRole?: string }) {
  const actualRole = senderRole || role;

  if (actualRole === "user" || actualRole === "USER") {
    return (
      <div className="wsAvatar wsAvatarUser">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="10" fill="#1e293b" />
          <rect width="32" height="32" rx="10" stroke="#334155" strokeWidth="1" />
          <text x="16" y="21" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="600" fontFamily="inherit">林</text>
        </svg>
      </div>
    );
  }

  if (actualRole === "agent") {
    return (
      <div className="wsAvatar wsAvatarAgent">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="10" fill="rgba(96,165,250,0.08)" />
          <rect width="32" height="32" rx="10" stroke="rgba(96,165,250,0.2)" strokeWidth="1" />
          <circle cx="12" cy="15" r="2.5" fill="#60a5fa" />
          <circle cx="20" cy="15" r="2.5" fill="#60a5fa" />
          <path d="M10 22 Q16 26 22 22" stroke="#60a5fa" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (actualRole === "system") {
    return (
      <div className="wsAvatar wsAvatarSystem">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="10" fill="#18181b" />
          <rect width="32" height="32" rx="10" stroke="#27272a" strokeWidth="1" />
          <circle cx="16" cy="16" r="2" fill="#52525b" />
        </svg>
      </div>
    );
  }

  return (
    <div className="wsAvatar wsAvatarSupplier">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="10" fill="rgba(212,168,83,0.08)" />
        <rect width="32" height="32" rx="10" stroke="rgba(212,168,83,0.2)" strokeWidth="1" />
        <rect x="10" y="6" width="12" height="18" rx="3" stroke="#d4a853" strokeWidth="1.5" fill="none" />
        <line x1="13" y1="10" x2="19" y2="10" stroke="#d4a853" strokeWidth="1" />
        <line x1="13" y1="14" x2="19" y2="14" stroke="#d4a853" strokeWidth="1" />
        <line x1="13" y1="18" x2="17" y2="18" stroke="#d4a853" strokeWidth="1" />
      </svg>
    </div>
  );
}

export default function WorkspaceClient({ projects, initialSupplierChats }: Props) {
  const [activeProjectCode, setActiveProjectCode] = useState(projects[0]?.code ?? "");
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [input, setInput] = useState("");
  const [activePlan, setActivePlan] = useState<PlanItem[] | null>(null);
  const [chatMode, setChatMode] = useState<"agent" | "supplier">("agent");
  const [supplierChats, setSupplierChats] = useState<SupplierChatItem[]>(initialSupplierChats);
  const [supplierInput, setSupplierInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const activeProject = projects.find((p) => p.code === activeProjectCode) ?? projects[0];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, supplierChats, chatMode]);

  const handleSend = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const userMsg: MessageItem = { id: `u${Date.now()}`, role: "user", content, time };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const agentMsg: MessageItem = {
        id: `a${Date.now()}`,
        role: "agent",
        content: `已结合「${activeProject?.name ?? "当前项目"}」上下文进行解析，生成以下结构化规划：`,
        time,
        plan: [
          { id: "p1", title: "分析数据质量", desc: "检查标注完整率与漏标率", status: "done" },
          { id: "p2", title: "评估模型效果", desc: "拉取 v2.3 mAP、Recall 指标", status: "running" },
          { id: "p3", title: "生成优化建议", desc: "基于错误样本，输出数据补充方案", status: "pending", action: "GENERATE_QUALITY_SCRIPT" },
          { id: "p4", title: "等待授权", desc: "微调训练需 2×A100", status: "pending", action: "REQUEST_GPU" },
        ],
      };
      setActivePlan(agentMsg.plan ?? null);
      setMessages((prev) => [...prev, agentMsg]);
    }, 800);
  };

  const handleAuth = (action: string) => {
    setActivePlan((prev) =>
      prev?.map((p) => (p.action === action ? { ...p, status: "running" as const } : p)) ?? null
    );
  };

  const handleSupplierSend = async () => {
    if (!supplierInput.trim() || sending || !activeProject) return;
    setSending(true);
    const currentInput = supplierInput.trim();
    const tempId = `temp-${Date.now()}`;
    const optimistic: SupplierChatItem = {
      id: tempId,
      senderRole: "USER",
      senderName: "林同学",
      content: currentInput,
      createdAt: new Date().toISOString(),
    };
    setSupplierChats((prev) => [...prev, optimistic]);
    setSupplierInput("");

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: activeProject.id, content: currentInput, senderRole: "USER" }),
      });
      const data = await res.json();
      if (data.success) {
        setSupplierChats((prev) =>
          prev.map((c) => (c.id === tempId ? { ...data.chat, createdAt: new Date(data.chat.createdAt).toISOString() } : c)),
        );
      }
    } catch (e) {
      console.error("Supplier chat send failed:", e);
    }
    setSending(false);
  };

  return (
    <div className="aiWorkspace dark">
      <aside className="wsLeft">
        <div className="wsLeftTop">
          <div className="wsLeftTitle">项目空间</div>
          <div className="wsLeftSearch">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="wsSearchIcon">
              <circle cx="6" cy="6" r="4.5" stroke="#52525b" strokeWidth="1.5" />
              <path d="M9.5 9.5L13 13" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input placeholder="搜索项目..." />
          </div>
        </div>
        <div className="wsProjectList">
          {projects.map((p) => (
            <button
              key={p.id}
              className={p.code === activeProjectCode ? "wsProjectItem active" : "wsProjectItem"}
              onClick={() => setActiveProjectCode(p.code)}
            >
              <div className="wsProjectItemHead">
                <span className="wsProjectCode">{p.code}</span>
                <span className="wsProjectStatus" style={{ color: statusColor[p.executionStatus] ?? "#71717a" }}>
                  <span className="wsStatusDot" style={{ background: statusColor[p.executionStatus] ?? "#71717a" }} />
                  {statusLabel[p.executionStatus] ?? p.executionStatus}
                </span>
              </div>
              <div className="wsProjectName">{p.name}</div>
              <div className="wsProjectMeta">
                <span>{p.dataCount.toLocaleString()} 条</span>
                <span>{p.stage}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="wsLeftResources">
          <Link href="/user/data" className="wsLeftResItem">数据资产</Link>
          <Link href="/user/models" className="wsLeftResItem">模型中心</Link>
          <Link href="/user/compute" className="wsLeftResItem">算力资源</Link>
          <Link href="/user/agent" className="wsLeftResItem">Agent 控制台</Link>
        </div>
      </aside>

      <main className="wsCenter">
        <div className="wsCenterTop">
          <div>
            <div className="wsCenterCrumb">{activeProject?.code ?? ""}</div>
            <div className="wsCenterTitle">
              {activeProject?.name ?? "选择项目"}
              <span className="wsModeTag">
                <span className="wsModeTagDot" style={{ background: statusColor[activeProject?.executionStatus ?? ""] ?? "#71717a" }} />
                {statusLabel[activeProject?.executionStatus ?? ""] ?? "-"}
              </span>
            </div>
          </div>
          <div className="wsCenterActions">
            <div className="wsChatModeToggle">
              <button
                className={`wsModeBtn ${chatMode === "agent" ? "active" : ""}`}
                onClick={() => setChatMode("agent")}
              >
                Agent
              </button>
              <button
                className={`wsModeBtn ${chatMode === "supplier" ? "active" : ""}`}
                onClick={() => setChatMode("supplier")}
              >
                供应商
                {supplierChats.length > 0 && (
                  <span className="wsModeCount">{supplierChats.length}</span>
                )}
              </button>
            </div>
            <Link href={`/user/projects/${activeProject?.code ?? ""}`} className="wsDetailLink">
              详情 →
            </Link>
          </div>
        </div>

        {chatMode === "agent" ? (
          <>
            <div className="wsChat">
              {messages.map((m) => (
                <div key={m.id} className={`wsMsg wsMsg_${m.role}`}>
                  <Avatar role={m.role} />
                  <div className="wsMsgBody">
                    <div className="wsMsgContent">{m.content}</div>
                    {m.plan && (
                      <div className="wsPlan">
                        {m.plan.map((p) => (
                          <div key={p.id} className={`wsPlanItem wsPlan_${p.status}`}>
                            <div className="wsPlanLeft">
                              <div className="wsPlanDot" data-status={p.status} />
                              <div className="wsPlanText">
                                <strong>{p.title}</strong>
                                <span>{p.desc}</span>
                              </div>
                            </div>
                            {p.action && p.status === "pending" && (
                              <button className="wsPlanAuth" onClick={() => handleAuth(p.action!)}>授权</button>
                            )}
                            {p.action && p.status === "running" && (
                              <span className="wsPlanRunning">运行中</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="wsMsgTime">{m.time}</div>
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {messages.length <= 1 && (
              <div className="wsSuggestions">
                {suggestionPrompts.map((s, i) => (
                  <button key={i} className="wsSuggestionChip" onClick={() => handleSend(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="wsInputBar">
              <div className="wsInputInner">
                <input
                  placeholder="告诉 Agent 你想做什么…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button className="wsInputSend" onClick={() => handleSend()}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8L14 2L8 14L6 10L2 8Z" fill="currentColor" />
                    <path d="M6 10L8 14L14 2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="wsChat">
              {supplierChats.length === 0 && (
                <div className="wsSupplierEmpty">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <rect width="48" height="48" rx="14" fill="rgba(212,168,83,0.06)" />
                    <rect width="48" height="48" rx="14" stroke="rgba(212,168,83,0.12)" strokeWidth="1" />
                    <path d="M16 20h16M16 26h12" stroke="#d4a853" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                  </svg>
                  <strong>开始与供应商对话</strong>
                  <p>讨论需求细节、质量标准、进度同步、异常处理等</p>
                  <p className="wsSupplierEmptyHint">对话将回流至 Agent 用于训练优化</p>
                </div>
              )}

              {supplierChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`wsMsg ${chat.senderRole === "USER" ? "wsMsg_user" : "wsMsg_supplier"}`}
                >
                  <Avatar senderRole={chat.senderRole} />
                  <div className="wsMsgBody">
                    {chat.senderRole !== "USER" && (
                      <div className="wsMsgMeta">
                        <span className="wsMsgRole">{supplierRoleLabel[chat.senderRole] || chat.senderRole}</span>
                        <span className="wsMsgName">{chat.senderName}</span>
                      </div>
                    )}
                    <div className="wsMsgContent">{chat.content}</div>
                    <div className="wsMsgTime">{formatTime(chat.createdAt)}</div>
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            <div className="wsInputBar">
              <div className="wsInputInner">
                <textarea
                  className="wsSupplierTextarea"
                  value={supplierInput}
                  onChange={(e) => setSupplierInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSupplierSend(); } }}
                  placeholder="输入消息，与供应商沟通…"
                  rows={2}
                  disabled={sending}
                />
                <button className="wsInputSend" onClick={handleSupplierSend} disabled={sending || !supplierInput.trim()}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8L14 2L8 14L6 10L2 8Z" fill="currentColor" />
                    <path d="M6 10L8 14L14 2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      <aside className="wsRight">
        <div className="wsRightPanel">
          <div className="wsRightPanelHead">
            <span className="wsRightPanelLabel">项目状态</span>
            <span className="wsRightPanelCode">{activeProject?.code ?? "-"}</span>
          </div>
          <div className="wsRightPanelBody">
            <div className="wsMetricRow">
              <span>当前阶段</span>
              <strong>{activeProject?.stage ?? "-"}</strong>
            </div>
            <div className="wsMetricRow">
              <span>数据量</span>
              <strong>{activeProject ? activeProject.dataCount.toLocaleString() : "0"}</strong>
            </div>
            <div className="wsMetricRow">
              <span>状态</span>
              <strong style={{ color: statusColor[activeProject?.executionStatus ?? ""] ?? "#a1a1aa" }}>
                {statusLabel[activeProject?.executionStatus ?? ""] ?? "-"}
              </strong>
            </div>
          </div>
        </div>

        <div className="wsRightPanel">
          <div className="wsRightPanelHead">
            <span className="wsRightPanelLabel">模型效果</span>
          </div>
          <div className="wsRightPanelBody">
            <div className="wsMetricRow">
              <span>mAP@0.5</span>
              <strong>0.924</strong>
            </div>
            <div className="wsMetricRow">
              <span>Recall</span>
              <strong>0.891</strong>
            </div>
            <div className="wsMetricRow">
              <span>FPS</span>
              <strong>45.2</strong>
            </div>
          </div>
        </div>

        <div className="wsRightPanel">
          <div className="wsRightPanelHead">
            <span className="wsRightPanelLabel">Agent 任务</span>
            <span className="wsPill wsPillBlue">3</span>
          </div>
          <div className="wsRightPanelBody">
            <div className="wsMetricRow">
              <span>数据质量分析</span>
              <span className="wsRunningLabel">执行中</span>
            </div>
            <div className="wsMetricRow">
              <span>生成标注方案</span>
              <span className="wsPendingLabel">等待授权</span>
            </div>
            <div className="wsMetricRow">
              <span>微调训练</span>
              <span className="wsPendingLabel">等待授权</span>
            </div>
          </div>
        </div>

        <div className="wsRightPanel">
          <div className="wsRightPanelHead">
            <span className="wsRightPanelLabel">待确认</span>
            <span className="wsPill wsPillWarn">2</span>
          </div>
          <div className="wsRightPanelBody">
            <div className="wsMetricRow">
              <span>采集图片验收</span>
              <span className="wsPendingLabel">500 张</span>
            </div>
            <div className="wsMetricRow">
              <span>训练结果 v2.4</span>
              <span style={{ color: "#34d399", fontSize: "11px" }}>+2.3%</span>
            </div>
          </div>
        </div>

        <div className="wsRightPanel">
          <div className="wsRightPanelHead">
            <span className="wsRightPanelLabel">服务</span>
          </div>
          <div className="wsRightPanelBody">
            <div className="wsMetricRow">
              <span>算力</span>
              <span style={{ color: "#34d399", fontSize: "11px" }}>已连接</span>
            </div>
            <div className="wsMetricRow">
              <span>存储</span>
              <span style={{ color: "#34d399", fontSize: "11px" }}>已连接</span>
            </div>
            <div className="wsMetricRow">
              <span>推理</span>
              <span style={{ color: "#34d399", fontSize: "11px" }}>在线</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
