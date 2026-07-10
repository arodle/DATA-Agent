"use client";

import { useState } from "react";
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

type Props = {
  projects: ProjectItem[];
};

const statusLabel: Record<string, string> = {
  DRAFT: "草稿",
  PENDING_REVIEW: "待确认",
  SELF_RUNNING: "自执行中",
  TOOL_RUNNING: "工具执行中",
  AGENT_RUNNING: "Agent执行中",
  SUPPLIER_RUNNING: "供应商执行中",
  ACCEPTANCE: "验收中",
  COMPLETED: "已完成",
  PAUSED: "已暂停",
  CANCELLED: "已取消",
};

const statusColor: Record<string, string> = {
  DRAFT: "#9aa7b5",
  PENDING_REVIEW: "#9b6400",
  SELF_RUNNING: "#2d65c7",
  TOOL_RUNNING: "#2d65c7",
  AGENT_RUNNING: "#2d65c7",
  SUPPLIER_RUNNING: "#2d65c7",
  ACCEPTANCE: "#9b6400",
  COMPLETED: "#0aa866",
  PAUSED: "#9aa7b5",
  CANCELLED: "#c41e3a",
};

const initialMessages: MessageItem[] = [
  {
    id: "m1",
    role: "agent",
    content: "你好，林同学。我是你的项目 Agent。\n\n当前你正参与「城市道路车辆 2D 框标注」项目（执行中）。你可以说出想完成的目标，我会结合项目上下文帮你规划。",
    time: "10:21",
  },
];

const suggestionPrompts = [
  { icon: "📈", text: "提升模型准确率" },
  { icon: "🔍", text: "分析当前效果问题" },
  { icon: "📝", text: "生成数据标注方案" },
  { icon: "📊", text: "看看数据量够不够" },
  { icon: "⚙️", text: "发起一次微调训练" },
];

export default function WorkspaceClient({ projects }: Props) {
  const [activeProjectCode, setActiveProjectCode] = useState(projects[0]?.code ?? "");
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [input, setInput] = useState("");
  const [activePlan, setActivePlan] = useState<PlanItem[] | null>(null);

  const activeProject = projects.find((p) => p.code === activeProjectCode) ?? projects[0];

  const handleSend = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const userMsg: MessageItem = { id: `u${Date.now()}`, role: "user", content, time };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const agentMsg: MessageItem = {
        id: `a${Date.now()}`,
        role: "agent",
        content: `我已结合「${activeProject?.name ?? "当前项目"}」的上下文进行解析。已生成结构化任务规划，请确认后我将继续执行。`,
        time,
        plan: [
          { id: "p1", title: "分析当前项目数据质量", desc: "检查 2.4K 帧图片的标注完整率与漏标率", status: "done" },
          { id: "p2", title: "评估当前模型效果", desc: "拉取 v2.3 模型在测试集上的 mAP、Recall 指标", status: "running" },
          { id: "p3", title: "生成优化建议", desc: "基于错误样本分析，输出数据补充 / 训练参数调整建议", status: "pending", action: "GENERATE_QUALITY_SCRIPT" },
          { id: "p4", title: "等待用户授权", desc: "需要调用算力 2x A100 进行微调训练", status: "pending", action: "REQUEST_GPU" },
        ],
      };
      setActivePlan(agentMsg.plan ?? null);
      setMessages((prev) => [...prev, agentMsg]);
    }, 600);
  };

  const handleAuth = (action: string) => {
    setActivePlan((prev) =>
      prev?.map((p) => (p.action === action ? { ...p, status: "running" as const } : p)) ?? null
    );
  };

  return (
    <div className="aiWorkspace">
      <aside className="wsLeft">
        <div className="wsLeftTop">
          <div className="wsLeftTitle">我的项目空间</div>
          <div className="wsLeftSearch">
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
                <span
                  className="wsProjectStatus"
                  style={{ color: statusColor[p.executionStatus] ?? "#9aa7b5" }}
                >
                  {statusLabel[p.executionStatus] ?? p.executionStatus}
                </span>
              </div>
              <div className="wsProjectName">{p.name}</div>
              <div className="wsProjectMeta">
                <span>📊 {p.dataCount.toLocaleString()}</span>
                <span>{p.stage}</span>
              </div>
            </button>
          ))}
          {projects.length === 0 && (
            <div className="wsEmpty">暂无项目</div>
          )}
        </div>
        <div className="wsLeftResources">
          <div className="wsLeftResTitle">项目资源</div>
          <Link href="/user/data" className="wsLeftResItem">
            <span>📁</span>数据资产
          </Link>
          <Link href="/user/models" className="wsLeftResItem">
            <span>🧠</span>模型中心
          </Link>
          <Link href="/user/compute" className="wsLeftResItem">
            <span>⚡</span>算力资源
          </Link>
          <Link href="/user/agent" className="wsLeftResItem">
            <span>🤖</span>Agent 控制台
          </Link>
        </div>
      </aside>

      <main className="wsCenter">
        <div className="wsCenterTop">
          <div>
            <div className="wsCenterCrumb">用户工作台 / {activeProject?.code ?? "未选择"}</div>
            <div className="wsCenterTitle">
              {activeProject?.name ?? "请选择项目"}
              {activeProject && (
                <span
                  className="wsProjectStatus"
                  style={{ color: statusColor[activeProject.executionStatus] ?? "#9aa7b5" }}
                >
                  {statusLabel[activeProject.executionStatus] ?? activeProject.executionStatus}
                </span>
              )}
            </div>
          </div>
          <div className="wsCenterActions">
            <Link href={`/user/projects/${activeProject?.code ?? ""}`} className="outlineBtn">
              打开项目详情
            </Link>
          </div>
        </div>

        <div className="wsChat">
          {messages.map((m) => (
            <div key={m.id} className={`wsMsg wsMsg_${m.role}`}>
              <div className="wsMsgAvatar">
                {m.role === "user" ? "林" : m.role === "agent" ? "🤖" : "·"}
              </div>
              <div className="wsMsgBody">
                <div className="wsMsgContent">{m.content}</div>
                {m.plan && (
                  <div className="wsPlan">
                    {m.plan.map((p) => (
                      <div key={p.id} className={`wsPlanItem wsPlan_${p.status}`}>
                        <div className="wsPlanDot">
                          {p.status === "done" ? "✓" : p.status === "running" ? "⟳" : "·"}
                        </div>
                        <div className="wsPlanText">
                          <strong>{p.title}</strong>
                          <span>{p.desc}</span>
                        </div>
                        {p.action && p.status === "pending" && (
                          <button className="wsPlanAuth" onClick={() => handleAuth(p.action!)}>
                            授权执行
                          </button>
                        )}
                        {p.action && p.status === "running" && (
                          <span className="wsPlanRunning">执行中...</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="wsMsgTime">{m.time}</div>
              </div>
            </div>
          ))}
        </div>

        {messages.length <= 1 && (
          <div className="wsSuggestions">
            {suggestionPrompts.map((s, i) => (
              <button key={i} className="wsSuggestionChip" onClick={() => handleSend(s.text)}>
                <span>{s.icon}</span>
                {s.text}
              </button>
            ))}
          </div>
        )}

        <div className="wsInputBar">
          <div className="wsInputInner">
            <span className="wsInputAt">@</span>
            <input
              placeholder="告诉 Agent 你想做什么，比如：帮我看看现在模型效果为什么不理想"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button className="wsInputSend" onClick={() => handleSend()}>
              发送 ↵
            </button>
          </div>
          <div className="wsInputHint">
            按 Enter 发送 · Shift+Enter 换行 · Agent 将自动结合项目上下文生成结构化任务
          </div>
        </div>
      </main>

      <aside className="wsRight">
        <div className="wsRightPanel">
          <div className="wsRightPanelHead">
            <strong>项目实时状态</strong>
            <span>{activeProject?.code ?? "-"}</span>
          </div>
          <div className="wsRightPanelBody">
            <div className="wsStatusRow">
              <span>当前阶段</span>
              <strong>{activeProject?.stage ?? "-"}</strong>
            </div>
            <div className="wsStatusRow">
              <span>数据量</span>
              <strong>{activeProject ? activeProject.dataCount.toLocaleString() : 0} 条</strong>
            </div>
            <div className="wsStatusRow">
              <span>项目状态</span>
              <strong style={{ color: statusColor[activeProject?.executionStatus ?? ""] ?? "#0d2137" }}>
                {statusLabel[activeProject?.executionStatus ?? ""] ?? "-"}
              </strong>
            </div>
          </div>
        </div>

        <div className="wsRightPanel">
          <div className="wsRightPanelHead">
            <strong>模型效果</strong>
          </div>
          <div className="wsRightPanelBody">
            <div className="wsMetricItem">
              <span>mAP@0.5</span>
              <strong>0.924</strong>
            </div>
            <div className="wsMetricItem">
              <span>Recall</span>
              <strong>0.891</strong>
            </div>
            <div className="wsMetricItem">
              <span>FPS</span>
              <strong>45.2</strong>
            </div>
          </div>
        </div>

        <div className="wsRightPanel">
          <div className="wsRightPanelHead">
            <strong>Agent 任务</strong>
            <span className="wsRightBadge">3</span>
          </div>
          <div className="wsRightPanelBody">
            <div className="wsTaskItem">
              <span className="wsTaskDot running" />
              <div>
                <strong>数据质量分析</strong>
                <span>执行中 · 已用 2 分钟</span>
              </div>
            </div>
            <div className="wsTaskItem">
              <span className="wsTaskDot pending" />
              <div>
                <strong>生成标注方案</strong>
                <span>等待授权</span>
              </div>
            </div>
            <div className="wsTaskItem">
              <span className="wsTaskDot pending" />
              <div>
                <strong>微调训练</strong>
                <span>等待授权</span>
              </div>
            </div>
          </div>
        </div>

        <div className="wsRightPanel">
          <div className="wsRightPanelHead">
            <strong>待我确认</strong>
            <span className="wsRightBadge warn">2</span>
          </div>
          <div className="wsRightPanelBody">
            <div className="wsConfirmItem">
              <strong>新一批 500 张采集图片</strong>
              <span>已上传至 OSS · 待确认验收</span>
            </div>
            <div className="wsConfirmItem">
              <strong>训练结果 v2.4</strong>
              <span>mAP 提升 2.3% · 待确认</span>
            </div>
          </div>
        </div>

        <div className="wsRightPanel">
          <div className="wsRightPanelHead">
            <strong>服务调用</strong>
          </div>
          <div className="wsRightPanelBody">
            <div className="wsServiceItem">
              <span>🔌 AutoDL 算力</span>
              <strong style={{ color: "#0aa866" }}>已连接</strong>
            </div>
            <div className="wsServiceItem">
              <span>📦 阿里云 OSS</span>
              <strong style={{ color: "#0aa866" }}>已连接</strong>
            </div>
            <div className="wsServiceItem">
              <span>🤖 Agent 推理</span>
              <strong style={{ color: "#0aa866" }}>在线</strong>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
