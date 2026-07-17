const fs = require("fs");
const PptxGenJS = require("pptxgenjs");

const svgContent = fs.readFileSync(
  "c:\\Users\\lirenxuan\\Documents\\Data PM\\data-agent-platform\\public\\platform-flow.html",
  "utf8"
);

async function generatePptx() {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Data PM Platform";
  pptx.title = "数据标注平台 · 角色流程图";

  const slide = pptx.addSlide();

  slide.addText("🏗️ 数据标注平台 · 角色流程图", {
    x: 0.3, y: 0.1, w: 12.7, h: 0.5,
    fontSize: 18, bold: true, color: "1E293B", align: "center",
  });
  slide.addText("每个角色都配有专属 Agent，贯穿全部流程 · 用户 / 运营 / 供应商 三方协作", {
    x: 0.3, y: 0.55, w: 12.7, h: 0.3,
    fontSize: 10, color: "64748B", align: "center",
  });

  const C = {
    user: "3B82F6",
    userBg: "DBEAFE",
    operator: "A78BFA",
    operatorBg: "EDE9FE",
    pm: "D4A853",
    pmBg: "FEF3C7",
    worker: "F97316",
    workerBg: "FFEDD5",
    agent: "22C55E",
    border: "CBD5E1",
    bg: "F8FAFC",
    surface: "FFFFFF",
    text: "1E293B",
    muted: "64748B",
    dim: "94A3B8",
    red: "EF4444",
    green: "22C55E",
    white: "FFFFFF",
  };

  function addBox(opts) {
    const { x, y, w, h, text, color, fontSize = 8, bold = false, dashed = false, fill = C.surface, sub } = opts;
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y, w, h,
      fill: { color: fill },
      line: { color, width: dashed ? 0.75 : 1, dashType: dashed ? "dash" : "solid" },
      rectRadius: 0.06,
    });
    const textOpts = [{ text, options: { fontSize, bold, color, breakType: "none" } }];
    if (sub) {
      textOpts.push({ text: "\n" + sub, options: { fontSize: 7, color: C.dim, breakType: "none" } });
    }
    slide.addText(textOpts, { x, y, w, h, align: "center", valign: "middle", margin: [1, 2, 1, 2] });
  }

  // ========== Lane Headers ==========
  const cols = [
    { label: "需求方", agentLabel: "用户Agent", color: C.user, bgPattern: C.userBg, x: 0.3 },
    { label: "运营", agentLabel: "运营Agent", color: C.operator, bgPattern: C.operatorBg, x: 3.5 },
    { label: "供应商 · 负责人/PM", agentLabel: "PM Agent", color: C.pm, bgPattern: C.pmBg, x: 6.7 },
    { label: "供应商 · 标注员", agentLabel: "标注员Agent", color: C.worker, bgPattern: C.workerBg, x: 9.95 },
  ];
  const colW = 3.05;

  // Headers
  cols.forEach(c => {
    addBox({ x: c.x, y: 0.95, w: colW, h: 0.4, text: c.label, color: c.color, fontSize: 10, bold: true, fill: c.bgPattern });
    addBox({ x: c.x, y: 1.35, w: 1.5, h: 0.28, text: "👤 人类", color: c.color, fontSize: 8, fill: c.bgPattern });
    addBox({ x: c.x + 1.55, y: 1.35, w: 1.5, h: 0.28, text: "🤖 " + c.agentLabel, color: c.color, fontSize: 8, dashed: true, fill: C.bg });
  });

  // ========== Phase rows ==========
  const phaseYs = [1.72, 2.5, 3.1, 5.1, 6.18, 6.9];
  const phaseH = 0.65;
  const phaseLabels = [
    "① 项目启动", "② 方案确认 & 供应商选择", "③ 项目群聊 · 规则制定（核心）",
    "④ 规则转交 & 标注执行", "⑤ 验收 & 结算", "⑥ 数据回流 · Agent训练",
  ];

  phaseLabels.forEach((label, i) => {
    slide.addText(label, { x: 0.05, y: phaseYs[i] - 0.05, w: 1.8, h: 0.2, fontSize: 8, bold: true, color: i === 2 || i === 5 ? C.agent : C.muted });
  });

  // Phase 1: 项目启动
  addBox({ x: 0.3 + colW * 0, y: phaseYs[0], w: 1.5, h: phaseH, text: "📝 提出需求", sub: "/user/workspace", color: C.user, fontSize: 9, bold: true });
  addBox({ x: 0.3 + 1.55 + colW * 0, y: phaseYs[0], w: 1.5, h: phaseH, text: "🤖 需求拆解", sub: "Agent私聊辅助", color: C.user, fontSize: 9, dashed: true, fill: C.bg });
  addBox({ x: 0.3 + colW * 1, y: phaseYs[0], w: 1.5, h: phaseH, text: "📋 创建项目", sub: "运营工作台", color: C.operator, fontSize: 9, bold: true });
  addBox({ x: 0.3 + 1.55 + colW * 1, y: phaseYs[0], w: 1.5, h: phaseH, text: "🤖 自动审核", sub: "合规性检查", color: C.operator, fontSize: 9, dashed: true, fill: C.bg });

  // Phase 2
  addBox({ x: 0.3 + colW * 1, y: phaseYs[1], w: 1.5, h: phaseH, text: "🏭 指派供应商", sub: "供应商管理", color: C.operator, fontSize: 9, bold: true });
  addBox({ x: 0.3 + 1.55 + colW * 1, y: phaseYs[1], w: 1.5, h: phaseH, text: "🤖 供应商推荐", sub: "产能/评分匹配", color: C.operator, fontSize: 9, dashed: true, fill: C.bg });
  addBox({ x: 0.3 + colW * 2, y: phaseYs[1], w: 1.5, h: phaseH, text: "✅ 确认接单", sub: "任务总览", color: C.pm, fontSize: 9, bold: true });
  addBox({ x: 0.3 + 1.55 + colW * 2, y: phaseYs[1], w: 1.5, h: phaseH, text: "🤖 成本预估", sub: "试标可行性", color: C.pm, fontSize: 9, dashed: true, fill: C.bg });

  // Phase 3: Group Chat (large area)
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.3, y: phaseYs[2] - 0.05, w: 12.7, h: 1.9,
    fill: { color: "F0FDF4" },
    line: { color: C.agent, width: 1, dashType: "dash" },
    rectRadius: 0.1,
  });
  slide.addText("💬 项目群聊 · P-20260708-001（每个项目一个群，所有角色 + 各自Agent参与）", {
    x: 0.5, y: phaseYs[2], w: 12.3, h: 0.25,
    fontSize: 9, bold: true, color: C.agent,
  });

  // Participants in group
  const participants = [
    { name: "林同学", role: "需求方", color: C.user, x: 0.5 },
    { name: "用户Agent", role: "辅助表达", color: C.user, x: 2.0, dashed: true },
    { name: "王经理", role: "项目经理", color: C.pm, x: 3.5 },
    { name: "PM Agent", role: "提取规则", color: C.pm, x: 5.0, dashed: true },
    { name: "运营小张", role: "运营监督", color: C.operator, x: 6.5 },
    { name: "运营Agent", role: "记录归档", color: C.operator, x: 8.0, dashed: true },
  ];
  participants.forEach(p => {
    addBox({ x: p.x, y: phaseYs[2] + 0.3, w: 1.35, h: 0.4, text: p.dashed ? "🤖 " + p.name : p.name, sub: p.role, color: p.color, fontSize: 8, bold: true, dashed: p.dashed || false, fill: p.dashed ? C.bg : C.surface });
  });

  // Chat flow
  slide.addText("对话流：", { x: 0.5, y: phaseYs[2] + 0.8, w: 0.7, h: 0.2, fontSize: 8, bold: true, color: C.muted });
  const chatSteps = [
    { text: "林同学：遮挡50%→truncated", color: C.user, x: 1.2 },
    { text: "王经理：夜间也归truncated", color: C.pm, x: 3.5 },
    { text: "🤖 PM Agent：提取4条规则", color: C.pm, x: 5.8, dashed: true },
    { text: "🤖 运营Agent：记录归档", color: C.operator, x: 8.5, dashed: true },
  ];
  chatSteps.forEach(s => {
    addBox({ x: s.x, y: phaseYs[2] + 0.78, w: 2.2, h: 0.28, text: s.text, color: s.color, fontSize: 8, dashed: s.dashed || false, fill: s.dashed ? C.bg : C.surface });
  });

  // Document card
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.5, y: phaseYs[2] + 1.15, w: 12, h: 0.65,
    fill: { color: "FFFFFF" },
    line: { color: C.border, width: 0.75 },
    rectRadius: 0.08,
  });
  slide.addText("📄 P-20260708-001 标注规则文档 v1.0                    PM Agent 生成 · 4条 · 运营Agent归档", {
    x: 0.7, y: phaseYs[2] + 1.17, w: 11.6, h: 0.2,
    fontSize: 8, bold: true, color: C.text,
  });
  slide.addText("1.遮挡超50%→truncated  2.夜间车灯不清→truncated  3.小目标框放大10%容差  4.框重叠≤20%", {
    x: 0.7, y: phaseYs[2] + 1.37, w: 9, h: 0.2,
    fontSize: 7, color: "94A3B8",
  });
  addBox({ x: 9.9, y: phaseYs[2] + 1.53, w: 0.9, h: 0.22, text: "驳回修改", color: C.red, fontSize: 7, fill: C.white });
  addBox({ x: 11.0, y: phaseYs[2] + 1.53, w: 1.2, h: 0.22, text: "确认并转交", color: C.white, fontSize: 7, bold: true, fill: C.agent });

  // Phase 4: 规则转交 & 标注执行
  addBox({ x: 0.3 + colW * 0, y: phaseYs[3], w: 1.5, h: phaseH, text: "📈 进度查看", sub: "工作台", color: C.user, fontSize: 9, bold: true });
  addBox({ x: 0.3 + 1.55 + colW * 0, y: phaseYs[3], w: 1.5, h: phaseH, text: "🤖 效果分析", sub: "指标看板", color: C.user, fontSize: 9, dashed: true, fill: C.bg });
  addBox({ x: 0.3 + colW * 1, y: phaseYs[3], w: 1.5, h: phaseH, text: "📊 进度监控", sub: "流程管理", color: C.operator, fontSize: 9, bold: true });
  addBox({ x: 0.3 + 1.55 + colW * 1, y: phaseYs[3], w: 1.5, h: phaseH, text: "🤖 预警统计", sub: "异常检测", color: C.operator, fontSize: 9, dashed: true, fill: C.bg });
  addBox({ x: 0.3 + colW * 2, y: phaseYs[3], w: 1.5, h: phaseH, text: "🔍 质检审核", sub: "抽检/全检", color: C.pm, fontSize: 9, bold: true });
  addBox({ x: 0.3 + 1.55 + colW * 2, y: phaseYs[3], w: 1.5, h: phaseH, text: "🤖 质量分析", sub: "返修定位", color: C.pm, fontSize: 9, dashed: true, fill: C.bg });
  addBox({ x: 0.3 + colW * 3, y: phaseYs[3], w: 1.5, h: phaseH, text: "🏷️ 批量标注", sub: "执行中", color: C.worker, fontSize: 9, bold: true });
  addBox({ x: 0.3 + 1.55 + colW * 3, y: phaseYs[3], w: 1.5, h: phaseH, text: "🤖 规则校验", sub: "实时纠错", color: C.worker, fontSize: 9, dashed: true, fill: C.bg });

  // Phase 5: 验收 & 结算
  addBox({ x: 0.3 + colW * 0, y: phaseYs[4], w: 1.5, h: phaseH, text: "📦 验收", sub: "阶段/完整", color: C.user, fontSize: 9, bold: true });
  addBox({ x: 0.3 + 1.55 + colW * 0, y: phaseYs[4], w: 1.5, h: phaseH, text: "🤖 验收辅助", sub: "抽样/对比", color: C.user, fontSize: 9, dashed: true, fill: C.bg });
  addBox({ x: 0.3 + colW * 1, y: phaseYs[4], w: 1.5, h: phaseH, text: "💰 财务结算", sub: "/operator/finance", color: C.operator, fontSize: 9, bold: true });
  addBox({ x: 0.3 + 1.55 + colW * 1, y: phaseYs[4], w: 1.5, h: phaseH, text: "🤖 自动对账", sub: "费用核算", color: C.operator, fontSize: 9, dashed: true, fill: C.bg });
  addBox({ x: 0.3 + colW * 3, y: phaseYs[4], w: 1.5, h: phaseH, text: "📦 完整交付", sub: "全部批次", color: C.worker, fontSize: 9, bold: true });
  addBox({ x: 0.3 + 1.55 + colW * 3, y: phaseYs[4], w: 1.5, h: phaseH, text: "🤖 交付报告", sub: "完成率/质量", color: C.worker, fontSize: 9, dashed: true, fill: C.bg });

  // Phase 6: 数据回流
  addBox({ x: 0.3 + colW * 0, y: phaseYs[5], w: 1.5, h: phaseH, text: "🤖 对话数据", sub: "→ 训练", color: C.agent, fontSize: 9, dashed: true, fill: C.bg });
  addBox({ x: 0.3 + colW * 1, y: phaseYs[5], w: 1.5, h: phaseH, text: "🤖 对话数据", sub: "→ 训练", color: C.agent, fontSize: 9, dashed: true, fill: C.bg });
  addBox({ x: 0.3 + colW * 2, y: phaseYs[5], w: 1.5, h: phaseH, text: "🤖 对话数据", sub: "→ 训练", color: C.agent, fontSize: 9, dashed: true, fill: C.bg });
  addBox({ x: 0.3 + colW * 3, y: phaseYs[5], w: 1.5, h: phaseH, text: "🤖 对话数据", sub: "→ 训练", color: C.agent, fontSize: 9, dashed: true, fill: C.bg });

  // Bottom: training pipeline
  slide.addText("🔄 所有Agent对话 → 清洗标注 → 有价值对话 → Agent训练 → 模型优化", {
    x: 0.3, y: 7.5, w: 12.7, h: 0.3,
    fontSize: 9, bold: true, color: C.agent, align: "center",
  });

  // Legend
  const legendItems = [
    { color: C.user, label: "需求方" },
    { color: C.operator, label: "运营" },
    { color: C.pm, label: "负责人/PM" },
    { color: C.worker, label: "标注员" },
    { color: C.agent, label: "Agent" },
  ];
  const legendY = 7.2;
  const legendGap = 2.2;
  legendItems.forEach((item, i) => {
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 0.8 + i * legendGap, y: legendY, w: 0.15, h: 0.15,
      fill: { color: item.color },
    });
    slide.addText(item.label, { x: 1.0 + i * legendGap, y: legendY - 0.02, w: 1.5, h: 0.2, fontSize: 8, color: C.muted });
  });

  const outPath = "c:\\Users\\lirenxuan\\Documents\\Data PM\\data-agent-platform\\public\\platform-flow-single.pptx";
  await pptx.writeFile({ fileName: outPath });
  console.log("✅ PPTX saved to: " + outPath);
}

generatePptx().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
