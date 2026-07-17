const PptxGenJS = require("pptxgenjs");

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pptx.author = "Data PM Platform";
pptx.title = "数据标注平台 · 角色流程图";

// Color constants
const C = {
  bg: "0A0A0F",
  surface: "111114",
  border: "27272A",
  text: "E4E4E7",
  muted: "71717A",
  dim: "52525B",
  user: "60A5FA",
  userDark: "356DF3",
  operator: "A78BFA",
  operatorDark: "8B5CF6",
  pm: "D4A853",
  worker: "F97316",
  agent: "18C57A",
  red: "F87171",
  white: "FFFFFF",
  black: "0A0A0F",
};

// Helper: add shape with text
function addBox(slide, opts) {
  const { x, y, w, h, text, color, fontSize = 9, bold = false, dashed = false, fill = C.surface, sub } = opts;
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: fill },
    line: { color, width: 1.5, dashType: dashed ? "dash" : "solid" },
    rectRadius: 0.08,
  });
  if (sub) {
    slide.addText([
      { text, options: { fontSize, bold, color, breakType: "none" } },
      { text: "\n" + sub, options: { fontSize: 7, color: C.dim } },
    ], { x, y, w, h, align: "center", valign: "middle", margin: [2, 4, 2, 4] });
  } else {
    slide.addText(text, { x, y, w, h, align: "center", valign: "middle", fontSize, bold, color, margin: [2, 4, 2, 4] });
  }
}

// Helper: add arrow line
function addArrow(slide, opts) {
  const { x1, y1, x2, y2, color = C.muted, width = 1.5, dashed = false } = opts;
  slide.addShape(pptx.ShapeType.line, {
    x: Math.min(x1, x2), y: Math.min(y1, y2),
    w: Math.abs(x2 - x1) || 0.01, h: Math.abs(y2 - y1) || 0.01,
    line: { color, width, dashType: dashed ? "dash" : "solid", endArrowType: "triangle" },
    flipH: x2 < x1,
    flipV: y2 < y1,
  });
}

// ==================== Slide 1: Title ====================
let slide = pptx.addSlide();
slide.background = { color: C.bg };
slide.addText("🏗️ 数据标注平台 · 角色流程图", {
  x: 0.5, y: 1.8, w: 12.3, h: 1.2,
  fontSize: 32, bold: true, color: C.white, align: "center",
});
slide.addText("每个角色都配有专属 Agent，贯穿全部流程", {
  x: 0.5, y: 3.0, w: 12.3, h: 0.6,
  fontSize: 16, color: C.agent, align: "center",
});
slide.addText("用户 / 运营 / 供应商 三方协作", {
  x: 0.5, y: 3.6, w: 12.3, h: 0.6,
  fontSize: 14, color: C.muted, align: "center",
});

// Role legend
const roles = [
  { name: "需求方", agent: "用户Agent", color: C.user, x: 1.5 },
  { name: "运营", agent: "运营Agent", color: C.operator, x: 4.2 },
  { name: "负责人/PM", agent: "PM Agent", color: C.pm, x: 6.9 },
  { name: "标注员", agent: "标注员Agent", color: C.worker, x: 9.6 },
];
roles.forEach(r => {
  addBox(slide, { x: r.x, y: 5.0, w: 2.3, h: 0.5, text: `👤 ${r.name}  +  🤖 ${r.agent}`, color: r.color, fontSize: 10, bold: true });
});

// ==================== Slide 2: Overview ====================
slide = pptx.addSlide();
slide.background = { color: C.bg };

// Title
slide.addText("总览：6 大阶段 · 4 角色 × Agent", {
  x: 0.3, y: 0.15, w: 12.7, h: 0.45,
  fontSize: 14, bold: true, color: C.text,
});

// Phase labels (left column)
const phases = [
  { label: "① 项目启动", color: C.muted },
  { label: "② 方案确认 & 供应商选择", color: C.muted },
  { label: "③ 项目群聊 · 规则制定", color: C.agent },
  { label: "④ 规则转交 & 标注执行", color: C.muted },
  { label: "⑤ 验收 & 结算", color: C.muted },
  { label: "⑥ 数据回流 · Agent训练", color: C.agent },
];

const phaseY = 0.75;
const phaseH = 0.9;
const phaseGap = 0.08;

phases.forEach((p, i) => {
  const y = phaseY + i * (phaseH + phaseGap);
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.15, y, w: 1.8, h: phaseH,
    fill: { color: C.surface },
    line: { color: p.color, width: 1 },
    rectRadius: 0.06,
  });
  slide.addText(p.label, {
    x: 0.15, y, w: 1.8, h: phaseH,
    fontSize: 9, bold: true, color: p.color, align: "center", valign: "middle",
  });
});

// Column headers
const cols = [
  { label: "需求方\n+ 用户Agent", color: C.user, x: 2.1 },
  { label: "运营\n+ 运营Agent", color: C.operator, x: 5.0 },
  { label: "负责人/PM\n+ PM Agent", color: C.pm, x: 7.9 },
  { label: "标注员\n+ 标注员Agent", color: C.worker, x: 10.8 },
];

cols.forEach(c => {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: c.x, y: 0.15, w: 2.7, h: 0.45,
    fill: { color: c.color, transparency: 88 },
    line: { color: c.color, width: 1.5 },
    rectRadius: 0.06,
  });
  slide.addText(c.label, {
    x: c.x, y: 0.15, w: 2.7, h: 0.45,
    fontSize: 9, bold: true, color: c.color, align: "center", valign: "middle",
  });
});

// Content grid - human | agent pairs per phase per role
const grid = [
  // Phase 1
  [
    { h: "📝 提出需求", a: "🤖 需求拆解", sub: "/user/workspace" },
    { h: "📋 创建项目", a: "🤖 自动审核", sub: "运营工作台" },
    { h: "", a: "" },
    { h: "", a: "" },
  ],
  // Phase 2
  [
    { h: "", a: "" },
    { h: "🏭 指派供应商", a: "🤖 供应商推荐" },
    { h: "✅ 确认接单", a: "🤖 成本预估" },
    { h: "", a: "" },
  ],
  // Phase 3
  [
    { h: "💬 沟通标准", a: "🤖 辅助表达" },
    { h: "📊 监督进度", a: "🤖 记录归档" },
    { h: "💬 沟通标准", a: "🤖 提取规则\n生成文档" },
    { h: "", a: "" },
  ],
  // Phase 4
  [
    { h: "📈 进度查看", a: "🤖 效果分析" },
    { h: "📊 进度监控", a: "🤖 预警统计" },
    { h: "🔍 质检审核", a: "🤖 质量分析" },
    { h: "🏷️ 批量标注", a: "🤖 规则校验\n实时纠错" },
  ],
  // Phase 5
  [
    { h: "📦 验收", a: "🤖 验收辅助" },
    { h: "💰 财务结算", a: "🤖 自动对账" },
    { h: "", a: "" },
    { h: "📦 完整交付", a: "🤖 交付报告" },
  ],
  // Phase 6
  [
    { h: "🤖 对话回流", a: "训练" },
    { h: "🤖 对话回流", a: "训练" },
    { h: "🤖 对话回流", a: "训练" },
    { h: "🤖 对话回流", a: "训练" },
  ],
];

grid.forEach((row, pi) => {
  const y = phaseY + pi * (phaseH + phaseGap);
  row.forEach((cell, ci) => {
    const cx = cols[ci].x;
    const cellW = 2.7;
    const halfW = cellW / 2 - 0.03;
    if (cell.h) {
      addBox(slide, { x: cx, y, w: halfW, h: phaseH, text: cell.h, color: cols[ci].color, fontSize: 8, bold: true, sub: pi === 5 ? "" : "" });
    }
    if (cell.a) {
      addBox(slide, { x: cx + halfW + 0.06, y, w: halfW, h: phaseH, text: cell.a, color: cols[ci].color, fontSize: 8, dashed: true, fill: C.bg });
    }
  });
});

// Flow arrows between phases (vertical)
for (let i = 0; i < 5; i++) {
  const y1 = phaseY + (i + 1) * (phaseH + phaseGap) - phaseGap;
  const y2 = phaseY + (i + 1) * (phaseH + phaseGap);
  addArrow(slide, { x1: 6.5, y1, x2: 6.5, y2, color: C.dim, width: 1, dashed: true });
}

// ==================== Slide 3: Project Group Chat ====================
slide = pptx.addSlide();
slide.background = { color: C.bg };

slide.addText("③ 项目群聊 · 规则制定（核心环节）", {
  x: 0.3, y: 0.15, w: 12.7, h: 0.5,
  fontSize: 16, bold: true, color: C.agent,
});

// Group chat container
slide.addShape(pptx.ShapeType.roundRect, {
  x: 0.3, y: 0.8, w: 12.7, h: 6.2,
  fill: { color: "0F1117" },
  line: { color: C.agent, width: 1.5, dashType: "dash" },
  rectRadius: 0.12,
});
slide.addText("💬 项目群聊 · P-20260708-001（每个项目一个群，所有角色 + 各自Agent参与）", {
  x: 0.5, y: 0.85, w: 12.3, h: 0.35,
  fontSize: 11, bold: true, color: C.agent,
});

// Participants row
const participants = [
  { icon: "林", name: "林同学", role: "需求方", color: C.user, x: 0.6 },
  { icon: "🤖", name: "用户Agent", role: "辅助需求表达", color: C.user, x: 2.6, dashed: true },
  { icon: "王", name: "王经理", role: "项目经理", color: C.pm, x: 4.6 },
  { icon: "🤖", name: "PM Agent", role: "提取规则/生成文档", color: C.pm, x: 6.6, dashed: true },
  { icon: "张", name: "运营小张", role: "运营监督", color: C.operator, x: 8.6 },
  { icon: "🤖", name: "运营Agent", role: "记录/归档", color: C.operator, x: 10.6, dashed: true },
];

participants.forEach(p => {
  addBox(slide, {
    x: p.x, y: 1.35, w: 1.8, h: 0.7,
    text: `${p.icon === "🤖" ? "🤖 " : ""}${p.name}`,
    color: p.color, fontSize: 10, bold: true,
    dashed: p.dashed || false,
    fill: p.dashed ? C.bg : C.surface,
    sub: p.role,
  });
});

// Chat flow
slide.addText("对话流：", { x: 0.5, y: 2.2, w: 1, h: 0.3, fontSize: 10, bold: true, color: C.dim });

const chatSteps = [
  { text: "林同学：遮挡50%→truncated", color: C.user, x: 0.5, y: 2.55, w: 3.0 },
  { text: "王经理：夜间也归truncated", color: C.pm, x: 3.7, y: 2.55, w: 3.0 },
  { text: "🤖 PM Agent：提取4条规则", color: C.pm, x: 6.9, y: 2.55, w: 3.0, dashed: true },
  { text: "🤖 运营Agent：记录归档", color: C.operator, x: 10.1, y: 2.55, w: 2.5, dashed: true },
];

chatSteps.forEach((step, i) => {
  addBox(slide, {
    x: step.x, y: step.y, w: step.w, h: 0.35,
    text: step.text, color: step.color, fontSize: 9,
    dashed: step.dashed || false,
    fill: step.dashed ? C.bg : C.surface,
  });
  if (i < chatSteps.length - 1) {
    addArrow(slide, {
      x1: step.x + step.w, y1: step.y + 0.175,
      x2: chatSteps[i + 1].x, y2: step.y + 0.175,
      color: C.dim, width: 1, dashed: true,
    });
  }
});

// Document card
slide.addShape(pptx.ShapeType.roundRect, {
  x: 0.5, y: 3.1, w: 12.3, h: 1.1,
  fill: { color: "131620" },
  line: { color: C.border, width: 1 },
  rectRadius: 0.1,
});
slide.addText("📄 P-20260708-001 标注规则文档 v1.0                    PM Agent 生成 · 4 条规则 · 运营Agent归档", {
  x: 0.7, y: 3.15, w: 11.9, h: 0.3,
  fontSize: 10, bold: true, color: C.text,
});
slide.addText("1. 遮挡超50%→truncated   2. 夜间车灯不清→truncated   3. 小目标框放大10%容差   4. 框重叠≤20%", {
  x: 0.7, y: 3.5, w: 9, h: 0.3,
  fontSize: 9, color: "A1A1AA",
});
addBox(slide, { x: 10.0, y: 3.85, w: 1.2, h: 0.3, text: "驳回修改", color: C.red, fontSize: 9, fill: C.bg });
addBox(slide, { x: 11.4, y: 3.85, w: 1.3, h: 0.3, text: "确认并转交", color: C.black, fontSize: 9, bold: true, fill: C.agent });

// Entry points
slide.addText("进入群聊入口：", { x: 0.5, y: 4.4, w: 1.5, h: 0.3, fontSize: 9, bold: true, color: C.dim });
const entries = [
  { text: "用户 /user/workspace", color: C.user, x: 2.0 },
  { text: "「Agent」标签=私聊", color: C.user, x: 4.3 },
  { text: "PM /supplier AI助手", color: C.pm, x: 6.6 },
  { text: "运营 /operator 监督", color: C.operator, x: 8.9 },
];
entries.forEach(e => {
  addBox(slide, { x: e.x, y: 4.4, w: 2.1, h: 0.3, text: e.text, color: e.color, fontSize: 9 });
});

// Flow description
slide.addText("工作流程", { x: 0.5, y: 4.9, w: 2, h: 0.3, fontSize: 11, bold: true, color: C.text });

const flowSteps = [
  { num: "1", text: "需求方与项目经理在群聊中沟通标注标准、质量要求", color: C.user },
  { num: "2", text: "PM Agent 从对话中自动提取规则，生成标注规则文档", color: C.pm },
  { num: "3", text: "需求方在群聊内点击「确认并转交」或「驳回修改」", color: C.agent },
  { num: "4", text: "确认后规则自动推送给标注团队，标注员 Agent 加载最新规则", color: C.agent },
  { num: "5", text: "所有 Agent 对话数据回流至训练，经清洗标注后投入模型优化", color: C.agent },
];

flowSteps.forEach((s, i) => {
  const y = 5.3 + i * 0.35;
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 0.6, y: y + 0.03, w: 0.25, h: 0.25,
    fill: { color: s.color },
  });
  slide.addText(s.num, { x: 0.6, y: y + 0.03, w: 0.25, h: 0.25, fontSize: 8, bold: true, color: C.white, align: "center", valign: "middle" });
  slide.addText(s.text, { x: 1.0, y, w: 11, h: 0.3, fontSize: 10, color: C.text, valign: "middle" });
});

// ==================== Slide 4: Agent Capabilities ====================
slide = pptx.addSlide();
slide.background = { color: C.bg };

slide.addText("📌 Agent 贯穿全程 · 各角色 Agent 能力矩阵", {
  x: 0.3, y: 0.15, w: 12.7, h: 0.5,
  fontSize: 16, bold: true, color: C.agent,
});

// Table header
const headers = ["阶段", "🤖 用户Agent", "🤖 运营Agent", "🤖 PM Agent", "🤖 标注员Agent"];
const headerColors = [C.muted, C.user, C.operator, C.pm, C.worker];
const colWidths = [2.0, 2.6, 2.6, 2.6, 2.6];
const colX = [0.3];
for (let i = 1; i < colWidths.length; i++) colX.push(colX[i - 1] + colWidths[i - 1] + 0.08);

// Header row
headers.forEach((h, i) => {
  addBox(slide, { x: colX[i], y: 0.8, w: colWidths[i], h: 0.4, text: h, color: headerColors[i], fontSize: 10, bold: true, fill: C.surface });
});

// Data rows
const tableData = [
  {
    phase: "① 项目启动",
    user: "需求拆解\n辅助表达",
    operator: "自动审核\n合规性检查",
    pm: "—",
    worker: "—",
  },
  {
    phase: "② 方案确认",
    user: "—",
    operator: "供应商推荐\n产能/评分匹配",
    pm: "成本预估\n试标可行性",
    worker: "—",
  },
  {
    phase: "③ 群聊规则",
    user: "辅助需求表达\n标准澄清",
    operator: "记录归档\n流程跟踪",
    pm: "规则提取\n生成规则文档",
    worker: "—",
  },
  {
    phase: "④ 标注执行",
    user: "效果分析\n指标看板",
    operator: "预警统计\n异常检测",
    pm: "质量分析\n返修定位",
    worker: "加载规则\n实时纠错\n自检报告",
  },
  {
    phase: "⑤ 验收结算",
    user: "验收辅助\n抽样/对比",
    operator: "自动对账\n费用核算",
    pm: "—",
    worker: "交付报告\n完成率/质量",
  },
  {
    phase: "⑥ 数据回流",
    user: "对话数据\n→ 训练",
    operator: "对话数据\n→ 训练",
    pm: "对话数据\n→ 训练",
    worker: "对话数据\n→ 训练",
  },
];

tableData.forEach((row, ri) => {
  const y = 1.3 + ri * 0.85;
  const cells = [row.phase, row.user, row.operator, row.pm, row.worker];
  const colors = [C.muted, C.user, C.operator, C.pm, C.worker];
  cells.forEach((cell, ci) => {
    const isDashed = ci > 0 && cell !== "—";
    addBox(slide, {
      x: colX[ci], y, w: colWidths[ci], h: 0.8,
      text: cell, color: colors[ci], fontSize: 8,
      dashed: isDashed, fill: isDashed ? C.bg : C.surface,
    });
  });
});

// Bottom note
slide.addText("实线框 = 人类操作  |  虚线框 = Agent 自动辅助  |  所有 Agent 对话数据最终回流至训练管线", {
  x: 0.3, y: 6.7, w: 12.7, h: 0.3,
  fontSize: 9, color: C.dim, align: "center",
});

// ==================== Slide 5: Data Flow Back ====================
slide = pptx.addSlide();
slide.background = { color: C.bg };

slide.addText("⑥ 数据回流 · Agent 训练闭环", {
  x: 0.3, y: 0.15, w: 12.7, h: 0.5,
  fontSize: 16, bold: true, color: C.agent,
});

// 4 Agent sources
const agentSources = [
  { name: "用户Agent\n对话数据", color: C.user, x: 1.0 },
  { name: "运营Agent\n对话数据", color: C.operator, x: 4.0 },
  { name: "PM Agent\n对话数据", color: C.pm, x: 7.0 },
  { name: "标注员Agent\n对话数据", color: C.worker, x: 10.0 },
];

agentSources.forEach(a => {
  addBox(slide, { x: a.x, y: 1.2, w: 2.5, h: 0.8, text: a.name, color: a.color, fontSize: 11, bold: true, dashed: true, fill: C.bg });
});

// Arrows down
agentSources.forEach(a => {
  addArrow(slide, { x1: a.x + 1.25, y1: 2.05, x2: a.x + 1.25, y2: 2.6, color: a.color, width: 1.5, dashed: true });
});

// Pipeline
const pipelineSteps = [
  { text: "📥 收集对话", color: C.muted, x: 0.5 },
  { text: "🔍 清洗标注", color: C.agent, x: 3.3 },
  { text: "✅ 有价值对话筛选", color: C.agent, x: 6.1 },
  { text: "🧠 Agent训练", color: C.agent, x: 8.9 },
  { text: "🚀 模型优化", color: C.agent, x: 11.0 },
];

pipelineSteps.forEach((p, i) => {
  addBox(slide, { x: p.x, y: 2.7, w: 2.3, h: 0.6, text: p.text, color: p.color, fontSize: 11, bold: true });
  if (i < pipelineSteps.length - 1) {
    addArrow(slide, {
      x1: p.x + 2.35, y1: 3.0,
      x2: pipelineSteps[i + 1].x - 0.05, y2: 3.0,
      color: C.agent, width: 2,
    });
  }
});

// Feedback loop
slide.addShape(pptx.ShapeType.roundRect, {
  x: 1.5, y: 3.8, w: 10.3, h: 0.6,
  fill: { color: C.surface },
  line: { color: C.agent, width: 1, dashType: "dash" },
  rectRadius: 0.08,
});
slide.addText("🔄 优化后的模型 → 提升 Agent 能力 → 更好的辅助 → 更高质量的对话 → 更好的训练数据", {
  x: 1.5, y: 3.8, w: 10.3, h: 0.6,
  fontSize: 10, color: C.agent, align: "center", valign: "middle",
});

// Key points
slide.addText("关键原则", { x: 0.5, y: 4.8, w: 3, h: 0.35, fontSize: 12, bold: true, color: C.text });

const keyPoints = [
  "每个角色的 Agent 在所有阶段持续辅助，不是独立环节",
  "Agent 对话数据是有价值的数据资产，需要清洗标注后投入训练",
  "无价值的闲聊/无效对话被过滤，不进入训练管线",
  "训练后的模型反过来提升 Agent 能力，形成正反馈闭环",
  "标注员 Agent 能力受限，仅基于 PM 导入的规则回答",
];

keyPoints.forEach((p, i) => {
  slide.addText(`• ${p}`, { x: 0.7, y: 5.25 + i * 0.35, w: 12, h: 0.3, fontSize: 10, color: C.muted });
});

// ==================== Save ====================
const outPath = "c:\\Users\\lirenxuan\\Documents\\Data PM\\data-agent-platform\\public\\platform-flow.pptx";
pptx.writeFile({ fileName: outPath }).then(() => {
  console.log("✅ PPTX saved to: " + outPath);
}).catch(err => {
  console.error("❌ Error:", err);
});
