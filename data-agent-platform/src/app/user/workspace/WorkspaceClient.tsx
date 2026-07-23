"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import UnifiedInputBar from "@/components/UnifiedInputBar";

type ProjectItem = {
  id: string;
  code: string;
  name: string;
  executionStatus: string;
  createdAt: string;
  stage: string;
  dataCount: number;
  unreadCount: number;
};

type PlanItem = {
  id: string;
  title: string;
  desc: string;
  status: "pending" | "running" | "done";
  action?: string;
};

type CostEstimateItem = {
  name: string;
  unitPrice: string;
  quantity: string;
  amount: string;
};

const PHASE_DEFS = [
  { name: "需求分析", icon: "🔍", color: "#60a5fa" },
  { name: "数据规划", icon: "📊", color: "#34d399" },
  { name: "方案设计", icon: "📐", color: "#d4a853" },
  { name: "任务发布", icon: "🚀", color: "#f59e0b" },
  { name: "供应商匹配", icon: "🏭", color: "#a78bfa" },
  { name: "供应商执行", icon: "⚙️", color: "#f97316" },
  { name: "量产验收", icon: "✅", color: "#22c55e" },
  { name: "交付结算", icon: "💰", color: "#ec4899" },
] as const;

type PhaseEntry = {
  id: string;
  index: number;
  name: string;
  color: string;
  icon: string;
  stepCount: number;
  msgIds: string[];
};

type UnifiedMessage = {
  id: string;
  role: "user" | "agent" | "supplier" | "system";
  content: string;
  plan?: PlanItem[];
  costEstimate?: {
    items: CostEstimateItem[];
    total: string;
    note?: string;
  };
  time: string;
  senderName?: string;
  phaseId?: string;
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
  currentUser?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
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

const suggestionPrompts = [
  "预估一下项目费用",
  "生成数据标注方案",
  "看看数据量够不够",
  "和供应商沟通标注规范",
  "分析当前效果问题",
  "发起一次微调训练",
  "提升模型准确率",
];

function Avatar({ role }: { role?: string }) {
  if (role === "user") {
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
  if (role === "agent") {
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
  if (role === "system") {
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

function detectPhase(userInput: string): (typeof PHASE_DEFS)[number] {
  if (/费用|价格|多少钱|报价|预算|成本|结算|计价|金额|预估.*费/.test(userInput)) {
    return PHASE_DEFS[2];
  }
  if (/供应商|匹配|试标|招标|外包/.test(userInput)) {
    return PHASE_DEFS[4];
  }
  if (/执行|标注.*进度|采集.*进度|量产/.test(userInput)) {
    return PHASE_DEFS[5];
  }
  if (/验收|质检|抽检|合格率|返修|交付/.test(userInput)) {
    return PHASE_DEFS[6];
  }
  if (/结算|付款|发票|账单|尾款/.test(userInput)) {
    return PHASE_DEFS[7];
  }
  if (/规划|方案|仿真|采购|数据源|清洗/.test(userInput)) {
    return PHASE_DEFS[1];
  }
  if (/发布|创建|任务.*生成|上线/.test(userInput)) {
    return PHASE_DEFS[3];
  }
  return PHASE_DEFS[0];
}

function generateAgentResponse(userInput: string, projectName: string) {
  const costRelated = /费用|价格|多少钱|报价|预算|成本|预估.*费|结算|计价|单价|金额/.test(userInput);
  if (costRelated) {
    return {
      content: `已根据「${projectName}」的需求生成费用预估明细，请查看右侧 **费用预估** 面板。`,
      costEstimate: {
        items: [
          { name: "数据采集（路采）", unitPrice: "50元/公里", quantity: "200公里", amount: "10,000" },
          { name: "数据清洗", unitPrice: "0.02元/张", quantity: "50,000张", amount: "1,000" },
          { name: "2D框标注", unitPrice: "0.8元/框", quantity: "~125K框", amount: "100,000" },
          { name: "仿真数据生成", unitPrice: "0.5元/张", quantity: "15,000张", amount: "7,500" },
          { name: "预标注调用", unitPrice: "0.05元/张", quantity: "50,000张", amount: "2,500" },
          { name: "验收抽检", unitPrice: "0.15元/框", quantity: "~10K框", amount: "1,500" },
        ],
        total: "122,500",
        note: "以上为预估费用，实际费用以供应商最终报价为准。",
      },
    };
  }
  if (/供应商|沟通|规范|标注.*规则|质检/.test(userInput)) {
    return {
      content: "已关联供应商协作通道。\n\n关于标注规范的沟通：\n1. 先在对话中明确标注精度要求\n2. 我帮你生成标注规范文档草稿\n3. 确认后直接同步给供应商团队\n\n需要我现在生成标注规范草案吗？",
      plan: [
        { id: "p1", title: "明确标注要求", desc: "确认目标类别、精度、特殊场景处理", status: "done" },
        { id: "p2", title: "生成规范文档", desc: "基于历史模板生成标注规范 v2.1", status: "pending", action: "GENERATE_ANNOTATION_SPEC" },
        { id: "p3", title: "同步供应商", desc: "将规范推送到供应商团队工作台", status: "pending" },
      ],
    };
  }
  if (/模型|训练|微调|算法|mAP|准确率/.test(userInput)) {
    return {
      content: `已结合「${projectName}」上下文进行解析，生成以下结构化规划：`,
      plan: [
        { id: "p1", title: "分析数据质量", desc: "检查标注完整率与漏标率", status: "done" },
        { id: "p2", title: "评估模型效果", desc: "拉取 v2.3 mAP、Recall 指标", status: "running" },
        { id: "p3", title: "生成优化建议", desc: "基于错误样本，输出数据补充方案", status: "pending", action: "GENERATE_QUALITY_SCRIPT" },
        { id: "p4", title: "等待授权", desc: "微调训练需 2×A100", status: "pending", action: "REQUEST_GPU" },
      ],
    };
  }
  return {
    content: `已结合「${projectName}」上下文进行解析，生成以下结构化规划：`,
    plan: [
      { id: "p1", title: "分析数据质量", desc: "检查标注完整率与漏标率", status: "done" },
      { id: "p2", title: "评估项目进度", desc: "当前已完成 45%，预计 2 周内交付", status: "running" },
      { id: "p3", title: "生成优化建议", desc: "基于错误样本，输出数据补充方案", status: "pending", action: "GENERATE_QUALITY_SCRIPT" },
    ],
  };
}

export default function WorkspaceClient({ projects, initialSupplierChats, currentUser }: Props) {
  const [activeProjectCode, setActiveProjectCode] = useState(projects[0]?.code ?? "");
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [phaseEntries, setPhaseEntries] = useState<PhaseEntry[]>([]);
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [activePlan, setActivePlan] = useState<PlanItem[] | null>(null);
  const [costEstimate, setCostEstimate] = useState<UnifiedMessage["costEstimate"] | null>(null);
  const [sending, setSending] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectMessages, setNewProjectMessages] = useState<{ id: string; role: "user" | "agent"; content: string; time: string }[]>([]);
  const [newProjectInput, setNewProjectInput] = useState("");
  const [newProjectSending, setNewProjectSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const msgRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const activeProject = projects.find((p) => p.code === activeProjectCode) ?? projects[0];

  const isModelProject = activeProject
    ? /模型|训练|推理|微调|算法/.test(activeProject.name)
    : false;
  const isAnnotationProject = activeProject
    ? /标注|采集|检测|OCR|分割|分类/.test(activeProject.name)
    : false;

  useEffect(() => {
    // 构建10轮模拟对话，覆盖多个阶段
    const phases: PhaseEntry[] = [];
    const msgs: UnifiedMessage[] = [];
    let phaseIdx = 0;

    const addPhase = (name: string) => {
      const def = PHASE_DEFS.find((d) => d.name === name) ?? PHASE_DEFS[0];
      const id = `phase-${phaseIdx}`;
      phases.push({ id, index: phaseIdx + 1, name: def.name, color: def.color, icon: def.icon, stepCount: 0, msgIds: [] });
      phaseIdx++;
      return id;
    };

    const addMsg = (role: UnifiedMessage["role"], content: string, time: string, phaseId: string, senderName?: string) => {
      const id = `m${msgs.length + 1}`;
      msgs.push({ id, role, content, time, phaseId, senderName });
      const phase = phases.find((p) => p.id === phaseId);
      if (phase) { phase.msgIds.push(id); phase.stepCount++; }
    };

    const projectName = activeProject?.name ?? "城市道路车辆2D框标注";

    // 阶段1：需求分析（3轮）
    const p1 = addPhase("需求分析");
    addMsg("agent", `你好，${currentUser?.name ?? "用户"}。我是你的项目 Agent。\n\n当前参与「${projectName}」，说出目标，我会结合项目上下文帮你规划。`, "10:21", p1);
    addMsg("user", "我需要标注5万张城市道路场景的车辆图片，目标类别包括轿车、SUV、卡车、公交车、摩托车", "10:22", p1);
    addMsg("agent", "收到需求。我来整理一下关键信息：\n\n**任务类型**：2D矩形框标注\n**数据规模**：50,000 张\n**目标类别**：轿车、SUV、卡车、公交车、摩托车（5类）\n**场景**：城市道路\n\n已匹配到历史项目 PRJ-A23K（相似度 87%），可复用其标注规范和 Schema。需要我直接复用吗？", "10:23", p1);

    // 阶段2：数据规划（2轮）
    const p2 = addPhase("数据规划");
    addMsg("user", "复用标注规范，数据来源我们公司云上有3万张原始图，另外2万张怎么做", "10:25", p2);
    addMsg("agent", "已确认复用 PRJ-A23K 的标注规范 v2.1。\n\n关于数据来源规划：\n1. **公司云**：30,000 张原始图（直接拉取）\n2. **仿真生成**：15,000 张（基于 CARLA 仿真器，覆盖夜间/雨天场景）\n3. **成品采购**：5,000 张（从公开数据集采购补充分辨率多样性）\n\n仿真+采购可覆盖公司云缺少的长尾场景。是否同意此方案？", "10:26", p2);

    // 阶段3：方案设计（2轮）
    const p3 = addPhase("方案设计");
    addMsg("user", "同意，预估一下费用", "10:28", p3);
    addMsg("agent", "已根据「" + projectName + "」的需求生成费用预估明细，请查看右侧 **费用预估** 面板。", "10:28", p3);

    // 阶段4：任务发布（1轮）
    const p4 = addPhase("任务发布");
    addMsg("user", "费用可以，发布任务吧", "10:30", p4);
    addMsg("agent", "已生成采标任务方案：\n\n**批次1**：公司云 30,000 张 → 标注团队A\n**批次2**：仿真 15,000 张 → 标注团队B\n**批次3**：采购 5,000 张 → 标注团队A（复用）\n\n预标注模型：YOLOv8-voc（mAP 0.82）\n验收规则：AC-v2（三轮交叉验证，抽检率 10%）\n\n任务已提交运营审核，等待授权发布。", "10:31", p4);

    // 阶段5：供应商匹配（2轮）
    const p5 = addPhase("供应商匹配");
    addMsg("agent", "运营已审核通过。基于任务需求匹配到 3 家供应商：\n\n1. **智标科技** — 2D框标注 0.75元/框，质量 98.2%，交付周期 5天/万张\n2. **数聚标注** — 2D框标注 0.82元/框，质量 99.1%，交付周期 7天/万张\n3. **云标数据** — 2D框标注 0.68元/框，质量 96.5%，交付周期 4天/万张\n\n推荐 **数聚标注** 作为主力（质量最高），**云标数据** 作为备选。", "10:35", p5);
    addMsg("user", "选数聚标注做主力，云标数据做备选，通知他们", "10:36", p5);

    // 阶段6：供应商执行（2轮）
    const p6 = addPhase("供应商执行");
    addMsg("supplier", "收到任务通知。我们安排了12名标注员，先做 500 张试标，预计明天 14:00 前提交试标结果。", "10:40", p6, "数聚标注-王经理");
    addMsg("agent", "供应商已接收任务。试标批次已创建（500张），预计明日 14:00 出结果。\n\n我会持续跟踪进度，试标完成后自动触发质检。", "10:41", p6);

    // 阶段7：量产验收（2轮）
    const p7 = addPhase("量产验收");
    addMsg("agent", "试标通过验收（合格率 98.7% > 95% 阈值），已进入量产阶段。\n\n**当前进度**：\n- 批次1：18,000/30,000（60%）\n- 批次2：8,000/15,000（53%）\n- 批次3：未开始\n\n质检发现 3 类问题：\n1. 遮挡>50% 漏标率偏高 → 已更新规范补发\n2. 极小目标(<20px) 不一致 → 已统一忽略规则\n3. 框偏移>3px 占比 2.1% → 可接受", "11:30", p7);
    addMsg("user", "遮挡问题改了规范后重新标注那批数据", "11:31", p7);

    // 阶段8：交付结算（2轮）
    const p8 = addPhase("交付结算");
    addMsg("agent", "全部批次已验收通过！\n\n**交付摘要**：\n- 总标注量：50,000 张 / 124,873 框\n- 验收合格率：99.3%\n- 返修率：0.7%（347张返修后全部通过）\n\n数据资产已沉淀：\n- 数据集 DS-V3 创建（版本 v1.0）\n- 标注规范 v2.2 已归档\n- Schema 资产已更新\n\n结算单已生成，请确认。", "14:20", p8);
    addMsg("user", "确认结算", "14:21", p8);

    setMessages(msgs);
    setPhaseEntries(phases);
    setActivePhaseId(p8);
    setActivePlan(null);
    setCostEstimate({
      items: [
        { name: "数据采集（路采）", unitPrice: "50元/公里", quantity: "200公里", amount: "10,000" },
        { name: "数据清洗", unitPrice: "0.02元/张", quantity: "50,000张", amount: "1,000" },
        { name: "2D框标注", unitPrice: "0.82元/框", quantity: "~125K框", amount: "102,500" },
        { name: "仿真数据生成", unitPrice: "0.5元/张", quantity: "15,000张", amount: "7,500" },
        { name: "预标注调用", unitPrice: "0.05元/张", quantity: "50,000张", amount: "2,500" },
        { name: "验收抽检", unitPrice: "0.15元/框", quantity: "~10K框", amount: "1,500" },
      ],
      total: "125,000",
      note: "主力供应商：数聚标注（0.82元/框）。以上为预估费用，实际以验收量为准。",
    });
  }, [activeProjectCode, projects, initialSupplierChats]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const setMsgRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) msgRefs.current.set(id, el);
    else msgRefs.current.delete(id);
  }, []);

  const handlePhaseClick = useCallback((phaseId: string) => {
    setActivePhaseId(phaseId);
    const phase = phaseEntries.find((p) => p.id === phaseId);
    if (!phase || phase.msgIds.length === 0) return;
    const firstMsgId = phase.msgIds[0];
    const el = msgRefs.current.get(firstMsgId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [phaseEntries]);

  const ensurePhase = useCallback((phaseName: string): PhaseEntry => {
    let nextIndex = 1;

    setPhaseEntries((prev) => {
      const maxIdx = prev.reduce((max, p) => Math.max(max, p.index), 0);
      nextIndex = maxIdx + 1;
      return prev;
    });

    const def = PHASE_DEFS.find((d) => d.name === phaseName) ?? PHASE_DEFS[0];
    const newPhase: PhaseEntry = {
      id: `phase-${nextIndex}`,
      index: nextIndex,
      name: def.name,
      color: def.color,
      icon: def.icon,
      stepCount: 0,
      msgIds: [],
    };

    setPhaseEntries((prev) => [...prev, newPhase]);
    return newPhase;
  }, []);

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;

    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const detectedPhase = detectPhase(content);
    const phase = ensurePhase(detectedPhase.name);

    const userMsgId = `u${Date.now()}`;
    const userMsg: UnifiedMessage = {
      id: userMsgId,
      role: "user",
      content,
      time,
      phaseId: phase.id,
    };
    setPhaseEntries((prev) =>
      prev.map((p) =>
        p.id === phase.id
          ? { ...p, msgIds: [...p.msgIds, userMsgId], stepCount: p.stepCount + 1 }
          : p,
      ),
    );
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    setActivePhaseId(phase.id);

    const agentMsgId = `a${Date.now()}`;
    const agentMsg: UnifiedMessage = {
      id: agentMsgId,
      role: "agent",
      content: "",
      time,
      phaseId: phase.id,
    };
    setPhaseEntries((prev) =>
      prev.map((p) =>
        p.id === phase.id
          ? { ...p, msgIds: [...p.msgIds, agentMsgId], stepCount: p.stepCount + 1 }
          : p,
      ),
    );
    setMessages((prev) => [...prev, agentMsg]);

    try {
      const historyMessages = messages
        .filter((m) => m.role === "user" || m.role === "agent")
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...historyMessages, { role: "user", content }],
          projectName: activeProject?.name,
        }),
      });

      if (!response.ok) {
        throw new Error("请求失败");
      }

      const contentType = response.headers.get("content-type");
      if (contentType?.includes("text/event-stream")) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.content) {
                    fullContent += data.content;
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === agentMsgId ? { ...m, content: fullContent } : m,
                      ),
                    );
                  }
                  if (data.done) {
                    fullContent = data.fullContent || fullContent;
                  }
                } catch {
                  // ignore parse error
                }
              }
            }
          }
        }
      } else {
        const data = await response.json();
        if (data.error && data.mock) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === agentMsgId ? { ...m, content: data.content || data.error } : m,
            ),
          );
        } else if (data.error) {
          throw new Error(data.error);
        }
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === agentMsgId
            ? { ...m, content: `抱歉，发生了错误：${err?.message || "未知错误"}` }
            : m,
        ),
      );
    }

    setSending(false);
  };

  const handleAuth = (action: string) => {
    setActivePlan((prev) =>
      prev?.map((p) => (p.action === action ? { ...p, status: "running" as const } : p)) ?? null,
    );
  };

  const handleNewProjectOpen = () => {
    setShowNewProject(true);
    setNewProjectMessages([
      {
        id: "init",
        role: "agent",
        content: "你好！我是数据项目创建 Agent。请告诉我你的数据需求，我会帮你创建项目并配置工作流。\n\n例如：\n- 需要标注10万张车辆检测图片\n- 训练一个垃圾分类识别模型\n- 采集城市道路场景数据\n- 做OCR文字识别标注项目",
        time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setNewProjectInput("");
  };

  const handleNewProjectSend = async () => {
    const content = newProjectInput.trim();
    if (!content || newProjectSending) return;

    setNewProjectSending(true);
    const time = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    const userMsg = {
      id: `u${Date.now()}`,
      role: "user" as const,
      content,
      time,
    };
    setNewProjectMessages((prev) => [...prev, userMsg]);
    setNewProjectInput("");

    try {
      const response = await fetch("/api/projects/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "创建项目失败");
      }

      const project = data.project as { code: string; name: string };
      setNewProjectMessages((prev) => [...prev, {
        id: `a${Date.now()}`,
        role: "agent" as const,
        content: `已创建真实项目草稿：\n\n**项目编号**：${project.code}\n**项目名称**：${project.name}\n\n我已同步写入需求草稿、默认阶段和 Agent 会话记录。即将打开项目详情。`,
        time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      }]);

      window.setTimeout(() => {
        window.location.href = `/user/projects/${project.code}`;
      }, 900);
    } catch (error) {
      setNewProjectMessages((prev) => [...prev, {
        id: `a${Date.now()}`,
        role: "agent" as const,
        content: `创建项目失败：${error instanceof Error ? error.message : "未知错误"}`,
        time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      }]);
    } finally {
      setNewProjectSending(false);
    }
  };
  return (
    <div className="aiWorkspace dark">
      <aside className="wsLeft">
        <div className="wsLeftTop">
          <div className="wsLeftHeader">
            <span className="wsLeftTitle">项目空间</span>
            <button className="wsNewProjectBtn" onClick={handleNewProjectOpen}>
              <span className="wsNewProjectIcon">+</span>
              <span className="wsNewProjectText">新建项目</span>
            </button>
          </div>
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
                {p.unreadCount > 0 && <span className="wsProjectUnread">{p.unreadCount > 99 ? "99+" : p.unreadCount}</span>}
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
          <span className="wsLeftResLabel">功能入口</span>
          <div className="wsLeftResGrid">
            <Link href="/user/data" className="wsLeftResItem"><span className="wsLeftResIcon">📊</span><span className="wsLeftResText">数据资产</span></Link>
            <Link href="/user/models" className="wsLeftResItem"><span className="wsLeftResIcon">🧠</span><span className="wsLeftResText">模型中心</span></Link>
            <Link href="/user/compute" className="wsLeftResItem"><span className="wsLeftResIcon">⚡</span><span className="wsLeftResText">算力资源</span></Link>
            <Link href="/user/agent" className="wsLeftResItem"><span className="wsLeftResIcon">🤖</span><span className="wsLeftResText">Agent 控制台</span></Link>
            <Link href="/user/annotation" className="wsLeftResItem"><span className="wsLeftResIcon">🏷️</span><span className="wsLeftResText">标注任务</span></Link>
            <Link href="/user/collection" className="wsLeftResItem"><span className="wsLeftResIcon">📷</span><span className="wsLeftResText">采集任务</span></Link>
            <Link href="/user/help" className="wsLeftResItem"><span className="wsLeftResIcon">❓</span><span className="wsLeftResText">帮助中心</span></Link>
            <Link href="/user/settings" className="wsLeftResItem"><span className="wsLeftResIcon">⚙️</span><span className="wsLeftResText">设置</span></Link>
          </div>
        </div>
      </aside>

      {showNewProject ? (
        <main className="wsCenter wsNewProjectView">
          <div className="wsCenterTop">
            <div>
              <div className="wsCenterCrumb">NEW</div>
              <div className="wsCenterTitle">新建数据项目<span className="wsModeTag"><span className="wsModeTagDot" style={{ background: "#34d399" }} />创建中</span></div>
            </div>
            <div className="wsCenterActions">
              <button className="wsModeBtn active" onClick={() => setShowNewProject(false)}>← 返回</button>
            </div>
          </div>
          <div className="wsChat">
            <div className="wsChatMessages" style={{ flex: 1 }}>
              {newProjectMessages.map((msg) => (
                <div key={msg.id} className={`wsMsg wsMsg_${msg.role}`}>
                  <Avatar role={msg.role} />
                  <div className="wsMsgBody">
                    <div className="wsMsgContent">{msg.content}</div>
                    <div className="wsMsgTime">{msg.time}</div>
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>
          </div>
          <UnifiedInputBar value={newProjectInput} onChange={setNewProjectInput} onSend={handleNewProjectSend} placeholder="描述你的数据需求，如：需要标注10万张车辆检测图片" sending={newProjectSending} />
        </main>
      ) : (
        <>
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
                <Link href="/user/workflow-demo" className="wsDetailLink">流程模拟 →</Link>
              </div>
            </div>

            <div className="wsChat">
              {/* 阶段导航（每个阶段一个圆点） */}
              <div className="wsPhaseNav">
                {phaseEntries.map((phase, i) => (
                  <div
                    key={phase.id}
                    className={`wsPhaseNavItem ${phase.id === activePhaseId ? "active" : ""}`}
                    onClick={() => handlePhaseClick(phase.id)}
                    title={phase.name}
                  >
                    <div className="wsPhaseNavDot" style={{ background: phase.color }} />
                    {i < phaseEntries.length - 1 && (
                      <div className="wsPhaseNavLine" />
                    )}
                  </div>
                ))}
              </div>

              <div className="wsChatMessages">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    ref={(el) => setMsgRef(m.id, el)}
                    className={`wsMsg wsMsg_${m.role}`}
                    data-phase-id={m.phaseId}
                  >
                    <div className="wsMsgMain">
                      <Avatar role={m.role} />
                      <div className="wsMsgBody">
                        {m.role === "supplier" && m.senderName && (
                          <div className="wsMsgMeta"><span className="wsMsgName">{m.senderName}</span></div>
                        )}
                        <div className="wsMsgContent">
                          {m.content}
                          {m.costEstimate && (
                            <span className="wsCostInlineRef">
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ verticalAlign: "middle", marginRight: 4 }}>
                                <rect x="1" y="3" width="12" height="9" rx="1.5" stroke="#d4a853" strokeWidth="1" fill="none" />
                                <line x1="7" y1="6" x2="7" y2="10" stroke="#d4a853" strokeWidth="1" strokeLinecap="round" />
                                <circle cx="7" cy="4.5" r="0.8" fill="#d4a853" />
                              </svg>
                              费用预估已生成，详见右侧面板 →
                            </span>
                          )}
                        </div>
                        {m.plan && (
                          <div className="wsPlan">
                            {m.plan.map((p) => (
                              <div key={p.id} className={`wsPlanItem wsPlan_${p.status}`}>
                                <div className="wsPlanLeft">
                                  <div className="wsPlanDot" data-status={p.status} />
                                  <div className="wsPlanText"><strong>{p.title}</strong><span>{p.desc}</span></div>
                                </div>
                                {p.action && p.status === "pending" && <button className="wsPlanAuth" onClick={() => handleAuth(p.action!)}>授权</button>}
                                {p.action && p.status === "running" && <span className="wsPlanRunning">运行中</span>}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="wsMsgTime">{m.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>
            </div>

            {messages.length <= 1 && (
              <div className="wsSuggestions">
                {suggestionPrompts.map((s, i) => (
                  <button key={i} className="wsSuggestionChip" onClick={() => handleSend(s)}>{s}</button>
                ))}
              </div>
            )}

            <UnifiedInputBar
              value={input}
              onChange={setInput}
              onSend={() => handleSend()}
              placeholder="告诉 Agent 你想做什么…（左侧时间线追踪流程阶段）"
              sending={sending}
            />
          </main>

          <aside className="wsRight">
            {costEstimate && (
              <div className="wsRightPanel wsCostPanel">
                <div className="wsRightPanelHead">
                  <span className="wsRightPanelLabel">费用预估</span>
                  <span className="wsPill wsPillWarn">预估</span>
                </div>
                <div className="wsRightPanelBody">
                  <table className="wsCostTable">
                    <thead><tr><th>项目</th><th>单价</th><th>数量</th><th>金额(元)</th></tr></thead>
                    <tbody>
                      {costEstimate.items.map((item, i) => (
                        <tr key={i}><td>{item.name}</td><td>{item.unitPrice}</td><td>{item.quantity}</td><td className="wsCostAmount">{item.amount}</td></tr>
                      ))}
                    </tbody>
                    <tfoot><tr><td colSpan={3} className="wsCostTotalLabel">合计</td><td className="wsCostTotal">{costEstimate.total} 元</td></tr></tfoot>
                  </table>
                  {costEstimate.note && <p className="wsCostNote">{costEstimate.note}</p>}
                  <div className="wsCostActions">
                    <button className="wsCostBtn wsCostBtnPrimary">确认方案</button>
                    <button className="wsCostBtn">对比报价</button>
                  </div>
                </div>
              </div>
            )}

            <div className="wsRightPanel">
              <div className="wsRightPanelHead"><span className="wsRightPanelLabel">项目状态</span><span className="wsRightPanelCode">{activeProject?.code ?? "-"}</span></div>
              <div className="wsRightPanelBody">
                <div className="wsMetricRow"><span>当前阶段</span><strong>{activeProject?.stage ?? "-"}</strong></div>
                <div className="wsMetricRow"><span>数据量</span><strong>{activeProject ? activeProject.dataCount.toLocaleString() : "0"}</strong></div>
                <div className="wsMetricRow"><span>状态</span><strong style={{ color: statusColor[activeProject?.executionStatus ?? ""] ?? "#a1a1aa" }}>{statusLabel[activeProject?.executionStatus ?? ""] ?? "-"}</strong></div>
              </div>
            </div>

            {isModelProject && (
              <div className="wsRightPanel">
                <div className="wsRightPanelHead"><span className="wsRightPanelLabel">模型效果</span></div>
                <div className="wsRightPanelBody">
                  <div className="wsMetricRow"><span>mAP@0.5</span><strong>0.924</strong></div>
                  <div className="wsMetricRow"><span>Recall</span><strong>0.891</strong></div>
                  <div className="wsMetricRow"><span>FPS</span><strong>45.2</strong></div>
                </div>
              </div>
            )}

            {isModelProject && (
              <div className="wsRightPanel">
                <div className="wsRightPanelHead"><span className="wsRightPanelLabel">Agent 任务</span><span className="wsPill wsPillBlue">3</span></div>
                <div className="wsRightPanelBody">
                  <div className="wsMetricRow"><span>数据质量分析</span><span className="wsRunningLabel">执行中</span></div>
                  <div className="wsMetricRow"><span>生成标注方案</span><span className="wsPendingLabel">等待授权</span></div>
                  <div className="wsMetricRow"><span>微调训练</span><span className="wsPendingLabel">等待授权</span></div>
                </div>
              </div>
            )}

            {isAnnotationProject && (
              <div className="wsRightPanel">
                <div className="wsRightPanelHead"><span className="wsRightPanelLabel">需求文档</span><button className="wsRightPanelMore">详情 →</button></div>
                <div className="wsRightPanelBody">
                  <div className="wsDocSummary">
                    <span className="wsDocSummaryTitle">城市道路车辆 2D 框标注</span>
                    <ul className="wsDocSummaryList"><li>标注类型：2D 矩形框</li><li>目标类别：轿车、SUV、卡车、公交车、摩托车</li><li>数据规模：50,000 张</li><li>标注精度：框偏移 ≤ 3px</li></ul>
                  </div>
                </div>
              </div>
            )}

            {isAnnotationProject && (
              <div className="wsRightPanel">
                <div className="wsRightPanelHead"><span className="wsRightPanelLabel">标注文档</span><button className="wsRightPanelMore">详情 →</button></div>
                <div className="wsRightPanelBody">
                  <div className="wsDocSummary">
                    <span className="wsDocSummaryTitle">标注规范 v2.1</span>
                    <ul className="wsDocSummaryList"><li>遮挡处理：遮挡 &gt; 50% 不标</li><li>截断目标：保留出框 30% 以上</li><li>极小目标：&lt; 20×20px 忽略</li><li>质量标准：三轮交叉验证</li></ul>
                  </div>
                </div>
              </div>
            )}

            {isAnnotationProject && (
              <div className="wsRightPanel">
                <div className="wsRightPanelHead"><span className="wsRightPanelLabel">API 调用</span><span className="wsPill wsPillBlue">在线</span></div>
                <div className="wsRightPanelBody">
                  <div className="wsMetricRow"><span>Endpoint</span><code className="wsApiEndpoint">/api/v1/annotation</code></div>
                  <div className="wsMetricRow"><span>Token</span><code className="wsApiToken">sk-xxx...a1b2</code></div>
                  <div className="wsMetricRow"><span>今日调用</span><strong>1,283</strong></div>
                  <div className="wsMetricRow"><span>限流</span><span style={{ color: "#34d399", fontSize: "11px" }}>正常</span></div>
                </div>
              </div>
            )}

            <div className="wsRightPanel">
              <div className="wsRightPanelHead"><span className="wsRightPanelLabel">待确认</span><span className="wsPill wsPillWarn">2</span></div>
              <div className="wsRightPanelBody">
                <div className="wsMetricRow"><span>采集图片验收</span><span className="wsPendingLabel">500 张</span></div>
                <div className="wsMetricRow"><span>训练结果 v2.4</span><span style={{ color: "#34d399", fontSize: "11px" }}>+2.3%</span></div>
              </div>
            </div>

            <div className="wsRightPanel">
              <div className="wsRightPanelHead"><span className="wsRightPanelLabel">服务</span></div>
              <div className="wsRightPanelBody">
                <div className="wsMetricRow"><span>算力</span><span style={{ color: "#34d399", fontSize: "11px" }}>已连接</span></div>
                <div className="wsMetricRow"><span>存储</span><span style={{ color: "#34d399", fontSize: "11px" }}>已连接</span></div>
                <div className="wsMetricRow"><span>推理</span><span style={{ color: "#34d399", fontSize: "11px" }}>在线</span></div>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
