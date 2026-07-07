const STORAGE_KEY = "dataops-agent-platform-v2";
const stages = ["创建", "审核", "执行", "验收"];

const roleMeta = {
  customer: { label: "用户端", scope: "组织视角：示例组织 A", nav: [["projectList", "项目列表", "入口"], ["knowledge", "规则说明", "参考"]] },
  operator: { label: "运营端", scope: "运营视角：授权项目", nav: [["projectList", "项目列表", "入口"], ["suppliers", "供应商", "选配"], ["quality", "质量事件", "闭环"], ["knowledge", "规则知识", "规范"]] },
  vendor: { label: "供应商端", scope: "供应商视角：Vendor-02", nav: [["projectList", "项目列表", "入口"], ["quality", "返修反馈", "处理"], ["knowledge", "规则规范", "查询"]] },
  quality: { label: "质检端", scope: "质检视角：授权项目", nav: [["projectList", "项目列表", "入口"], ["quality", "质量事件", "登记"], ["knowledge", "规则管理", "版本"]] },
  manager: { label: "管理端", scope: "管理视角：汇总项目", nav: [["projectList", "项目列表", "入口"], ["quality", "质量风险", "复盘"], ["suppliers", "供应商表现", "对比"]] }
};

const state = {
  role: "customer",
  view: "projectList",
  selectedProjectId: "TASK-1001",
  highlightedStage: "执行",
  pendingAction: null,
  messages: [],
  data: loadData()
};

const el = {
  nav: document.getElementById("nav"),
  roleLabel: document.getElementById("roleLabel"),
  pageTitle: document.getElementById("pageTitle"),
  dataScope: document.getElementById("dataScope"),
  content: document.getElementById("content"),
  agentFeed: document.getElementById("agentFeed"),
  agentInput: document.getElementById("agentInput"),
  agentSend: document.getElementById("agentSend"),
  saveBtn: document.getElementById("saveBtn"),
  exportBtn: document.getElementById("exportBtn"),
  resetBtn: document.getElementById("resetBtn")
};

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return cloneSeed();
  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed.projects) || !parsed.projects[0]?.taskName) return cloneSeed();
    return parsed;
  } catch {
    return cloneSeed();
  }
}

function cloneSeed() {
  return structuredClone(window.DATAOPS_SEED);
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function esc(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[ch]));
}

function nowText() {
  const date = new Date();
  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function nextId(prefix, list) {
  const max = list.reduce((num, item) => Math.max(num, Number(String(item.id || "").replace(/\D/g, "")) || 0), 0);
  return `${prefix}-${max + 1}`;
}

function currentProject() {
  return state.data.projects.find((item) => item.id === state.selectedProjectId) || state.data.projects[0];
}

function roleActor() {
  const map = { customer: "当前用户", operator: "当前运营", vendor: "Vendor-02", quality: "当前质检", manager: "当前管理者" };
  return map[state.role] || "当前用户";
}

function badge(text) {
  const value = String(text || "");
  let tone = "blue";
  if (/完成|已关闭|活跃|正常|通过/.test(value)) tone = "green";
  if (/创建|审核|执行|验收|待|处理中|进行/.test(value)) tone = "amber";
  if (/风险|P0|P1|延期|拒绝|失败|缺失/.test(value)) tone = "red";
  return `<span class="badge ${tone}">${esc(value)}</span>`;
}

function panel(title, body, extra = "") {
  return `<section class="panel"><header class="panel-header"><h2>${esc(title)}</h2>${extra}</header><div class="panel-body">${body}</div></section>`;
}

function table(items, columns, actions = null) {
  if (!items.length) return `<div class="empty">暂无记录</div>`;
  return `<div class="table-wrap"><table><thead><tr>${columns.map((col) => `<th>${esc(col.label)}</th>`).join("")}${actions ? "<th>操作</th>" : ""}</tr></thead><tbody>${items.map((item) => `<tr>${columns.map((col) => `<td>${typeof col.render === "function" ? col.render(item) : esc(item[col.key])}</td>`).join("")}${actions ? `<td><div class="row-actions">${actions(item)}</div></td>` : ""}</tr>`).join("")}</tbody></table></div>`;
}

function render() {
  renderNav();
  renderHeader();
  renderContent();
  renderAgent();
}

function renderNav() {
  const meta = roleMeta[state.role];
  el.nav.innerHTML = meta.nav.map(([view, label, hint]) => `<button class="nav-btn ${state.view === view ? "active" : ""}" data-view="${view}">${esc(label)}<span>${esc(hint)}</span></button>`).join("");
  document.querySelectorAll(".role-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.role === state.role));
}

function renderHeader() {
  const meta = roleMeta[state.role];
  const active = meta.nav.find(([view]) => view === state.view) || meta.nav[0];
  el.roleLabel.textContent = meta.label;
  el.pageTitle.textContent = active[1];
  el.dataScope.textContent = meta.scope;
}

function renderContent() {
  if (state.view === "projectDetail") el.content.innerHTML = renderProjectDetail();
  else if (state.view === "suppliers") el.content.innerHTML = renderSuppliers();
  else if (state.view === "quality") el.content.innerHTML = renderQuality();
  else if (state.view === "knowledge") el.content.innerHTML = renderKnowledge();
  else el.content.innerHTML = renderProjectList();
}

function roleProjects() {
  if (state.role === "customer") return state.data.projects.filter((item) => item.org === "示例组织 A");
  if (state.role === "vendor") return state.data.projects.filter((item) => item.supplier === "Vendor-02" || item.taskStatus !== "创建中");
  return state.data.projects;
}

function renderProjectList() {
  const projects = roleProjects();
  const grouped = ["创建中", "审核中", "执行中", "验收中", "已完成"].map((status) => [status, projects.filter((item) => item.taskStatus === status)]);
  return `
    <div class="list-summary">
      <div>${metric("项目总数", projects.length, "当前角色可见")}</div>
      <div>${metric("执行中", projects.filter((p) => p.taskStatus === "执行中").length, "供应商/运营正在处理")}</div>
      <div>${metric("待审核", projects.filter((p) => p.taskStatus === "审核中").length, "需要运营确认")}</div>
      <div>${metric("待验收", projects.filter((p) => p.taskStatus === "验收中").length, "需要关闭质量和确认交付")}</div>
    </div>
    <div class="status-groups">
      ${grouped.map(([status, rows]) => `
        <section class="status-section">
          <div class="status-title"><h2>${esc(status)}</h2>${badge(`${rows.length} 个项目`)}</div>
          ${table(rows, projectListColumns(), (item) => `<button data-open-project="${esc(item.id)}">进入详情</button>`)}
        </section>
      `).join("")}
    </div>`;
}

function metric(label, value, hint) {
  return `<div class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong><p>${esc(hint)}</p></div>`;
}

function projectListColumns() {
  return [
    { key: "id", label: "任务ID", render: (item) => `<button class="link-btn" data-open-project="${esc(item.id)}">${esc(item.id)}</button>` },
    { key: "taskName", label: "任务名称", render: (item) => `<button class="link-btn strong" data-open-project="${esc(item.id)}">${esc(item.taskName)}</button>` },
    { key: "creator", label: "创建人" },
    { key: "operator", label: "运营人员" },
    { key: "startDate", label: "开始时间" },
    { key: "endDate", label: "结束时间" }
  ];
}

function renderProjectDetail() {
  const project = currentProject();
  if (!project) return `<div class="empty">未找到项目</div>`;
  const logs = state.data.operationLogs.filter((item) => item.projectId === project.id);
  const batches = state.data.batches.filter((item) => item.projectId === project.id);
  const quality = state.data.qualityEvents.filter((item) => item.projectId === project.id);
  return `
    <div class="detail-toolbar">
      <button class="ghost-btn" data-back-list>返回项目列表</button>
      <div>${badge(project.taskStatus)} ${badge(project.priority)}</div>
    </div>
    <div class="project-detail-layout">
      <section class="panel project-basic ${state.pendingAction?.target === "basic" ? "agent-focus" : ""}" data-step="basic">
        <header class="panel-header"><h2>项目基础信息</h2><span>${esc(project.projectId)}</span></header>
        <div class="panel-body basic-grid">
          ${info("任务ID", project.id)}
          ${info("任务名称", project.taskName)}
          ${info("创建人", project.creator)}
          ${info("运营人员", project.operator)}
          ${info("供应商", project.supplier)}
          ${info("任务类型", project.type)}
          ${info("数据模态", project.modality)}
          ${info("数据量", project.volume)}
          ${info("开始时间", project.startDate)}
          ${info("结束时间", project.endDate)}
          ${info("验收标准", project.acceptance, "wide")}
          ${info("当前风险", project.currentRisk, "wide")}
          ${info("下一步", project.nextAction, "wide")}
        </div>
      </section>
      <aside class="panel progress-panel ${state.pendingAction?.target === "stage" ? "agent-focus" : ""}" data-step="stage">
        <header class="panel-header"><h2>进度看板</h2><span class="cursor-pill">Agent 光标：${esc(state.highlightedStage || project.stage)}</span></header>
        <div class="panel-body">
          ${renderStageBoard(project)}
          ${renderRoleActions(project)}
        </div>
      </aside>
    </div>
    <div class="grid two detail-lower">
      ${panel("批次执行", table(batches, [
        { key: "id", label: "批次ID" }, { key: "type", label: "类型" }, { key: "supplier", label: "供应商" }, { key: "volume", label: "数据量" }, { key: "status", label: "状态", render: (item) => badge(item.status) }, { key: "plannedEnd", label: "计划结束" }, { key: "risk", label: "风险" }
      ]))}
      ${panel("质量事件", table(quality, [
        { key: "id", label: "事件ID" }, { key: "type", label: "类型" }, { key: "severity", label: "级别", render: (item) => badge(item.severity) }, { key: "impact", label: "影响范围" }, { key: "status", label: "状态", render: (item) => badge(item.status) }, { key: "action", label: "处理动作" }
      ]))}
    </div>
    <section class="panel log-panel ${state.pendingAction?.target === "log" ? "agent-focus" : ""}" data-step="log">
      <header class="panel-header"><h2>操作日志</h2>${badge(`${logs.length} 条`)}</header>
      <div class="panel-body log-list">
        ${logs.length ? logs.map(renderLog).join("") : `<div class="empty">暂无操作日志</div>`}
      </div>
    </section>`;
}

function info(label, value, wide = "") {
  return `<div class="info-item ${wide}"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
}

function renderStageBoard(project) {
  const currentIndex = stages.indexOf(project.stage);
  const focus = state.highlightedStage || project.stage;
  return `<div class="stage-board">${stages.map((stage, index) => {
    const isDone = index < currentIndex;
    const isCurrent = stage === project.stage;
    const isFocus = stage === focus;
    const copy = state.data.stageDetails[stage]?.[state.role] || state.data.stageDetails[stage]?.operator || "等待下一步操作。";
    return `<article class="stage-card ${isDone ? "done" : ""} ${isCurrent ? "current" : ""} ${isFocus ? "agent-cursor" : ""}" data-stage="${esc(stage)}">
      <div class="stage-index">${index + 1}</div>
      <div><strong>${esc(stage)}</strong><p>${esc(copy)}</p></div>
      ${isDone ? badge("已完成") : isCurrent ? badge("当前") : badge("未开始")}
    </article>`;
  }).join("")}</div>`;
}

function renderRoleActions(project) {
  const actions = availableActions(project);
  return `<div class="action-pad"><h3>可发起操作</h3><p>所有操作只生成预览，不会直接写入；必须在右侧 Agent 面板确认授权。</p><div class="action-grid">${actions.map((action) => `<button class="small-btn" data-propose-action="${action.type}">${esc(action.label)}</button>`).join("")}</div></div>`;
}

function availableActions(project) {
  const actions = [];
  if (state.role === "customer") {
    if (project.stage === "创建") actions.push({ type: "submitReview", label: "提交审核" });
    if (project.stage === "验收") actions.push({ type: "acceptDelivery", label: "确认验收" });
    actions.push({ type: "requestProgress", label: "询问进度" });
  }
  if (state.role === "operator") {
    if (project.stage === "创建" || project.stage === "审核") actions.push({ type: "approveProject", label: "审核通过" });
    if (project.stage === "审核") actions.push({ type: "assignSupplier", label: "指派供应商" });
    if (project.stage === "执行") actions.push({ type: "moveAcceptance", label: "进入验收" });
    actions.push({ type: "addRiskLog", label: "记录风险" });
  }
  if (state.role === "vendor") {
    if (project.stage === "执行") actions.push({ type: "submitProgress", label: "提交进度" }, { type: "submitDelivery", label: "提交交付" });
    actions.push({ type: "askRule", label: "询问规则" });
  }
  if (state.role === "quality") actions.push({ type: "createQuality", label: "登记质量事件" }, { type: "closeQuality", label: "关闭质量事件" });
  if (state.role === "manager") actions.push({ type: "addRiskLog", label: "记录管理关注" });
  return actions;
}

function renderLog(log) {
  return `<article class="log-item"><div><strong>${esc(log.action)}</strong><p>${esc(log.note)}</p></div><span>${esc(log.time)}</span><em>${esc(log.actor)} · ${esc(log.role)}</em></article>`;
}

function renderAgent() {
  if (!state.messages.length) {
    state.messages = [["agent", "我现在像操作光标一样工作：你让我做事时，我会先定位项目阶段、生成预览和授权说明；只有你点击确认写入，数据和日志才会更新。"]];
  }
  const pending = state.pendingAction ? renderPendingAction() : "";
  el.agentFeed.innerHTML = `${state.messages.map(([role, text]) => `<article class="message"><div class="avatar ${role === "agent" ? "agent" : ""}">${role === "agent" ? "AI" : "你"}</div><div class="bubble"><p>${esc(text)}</p></div></article>`).join("")}${pending}`;
  el.agentFeed.scrollTop = el.agentFeed.scrollHeight;
}

function renderPendingAction() {
  const action = state.pendingAction;
  return `<article class="auth-card"><div class="auth-head"><strong>待授权写入</strong>${badge(action.stage)}</div><p>${esc(action.summary)}</p><div class="preview-box"><span>写入预览</span><pre>${esc(JSON.stringify(action.preview, null, 2))}</pre></div><div class="auth-actions"><button class="ghost-btn" data-cancel-action>取消</button><button class="dark-btn" data-confirm-action>确认写入</button></div></article>`;
}

function proposeAction(type) {
  const project = currentProject();
  const templates = buildActionTemplates(project);
  const action = templates[type];
  if (!action) return;
  state.pendingAction = action;
  state.highlightedStage = action.stage;
  state.view = "projectDetail";
  state.messages.push(["agent", `我已定位到「${action.stage}」阶段，并生成了「${action.summary}」的写入预览。请确认后再写入。`]);
  render();
}

function buildActionTemplates(project) {
  return {
    submitReview: pending(project, "审核", "提交审核", "用户确认需求信息完整，提交运营审核。", { taskStatus: "审核中", stage: "审核", nextAction: "等待运营审核需求、预算、规则和供应商资源" }),
    approveProject: pending(project, "执行", "审核通过", "运营审核通过，项目进入供应商执行准备。", { taskStatus: "执行中", stage: "执行", supplier: project.supplier === "待选配" ? "Vendor-02" : project.supplier, nextAction: "供应商按批次执行，运营跟进质量和进度" }),
    assignSupplier: pending(project, "审核", "指派供应商", "运营选择 Vendor-02 作为主执行供应商。", { supplier: "Vendor-02", nextAction: "等待供应商确认排期并启动首批任务" }),
    moveAcceptance: pending(project, "验收", "进入验收", "运营确认执行阶段完成，项目进入验收。", { taskStatus: "验收中", stage: "验收", nextAction: "用户检查交付结果，质检关闭剩余质量事件" }),
    acceptDelivery: pending(project, "验收", "确认验收", "用户确认交付结果通过验收。", { taskStatus: "已完成", stage: "验收", nextAction: "进入结算复核" }),
    submitProgress: pending(project, "执行", "提交进度", "供应商提交当前执行进度。", { nextAction: "运营查看进度并决定是否抽检" }),
    submitDelivery: pending(project, "验收", "提交交付", "供应商提交本批次交付物，等待运营和用户验收。", { taskStatus: "验收中", stage: "验收", nextAction: "运营发起验收检查" }),
    createQuality: pending(project, "执行", "登记质量事件", "质检登记一条 P2 质量事件并要求返修。", { currentRisk: "新增 P2 质量事件，等待供应商返修" }, "quality"),
    closeQuality: pending(project, "验收", "关闭质量事件", "质检确认返修通过，关闭当前质量事件。", { currentRisk: "质量事件已关闭，等待验收确认" }, "qualityClose"),
    addRiskLog: pending(project, project.stage, "记录风险", "补充当前风险和下一步动作。", { currentRisk: "已记录新的运营关注点，需后续跟踪" }),
    requestProgress: pending(project, project.stage, "询问进度", "用户发起进度询问，运营需回复当前状态。", { nextAction: "运营回复项目当前进度" }),
    askRule: pending(project, "执行", "询问规则", "供应商询问当前规则口径，运营需确认后回复。", { nextAction: "运营确认规则口径并同步供应商" })
  };
}

function pending(project, stage, action, summary, patch, extra = "") {
  return { projectId: project.id, target: extra === "" ? "stage" : "log", stage, action, summary, patch, extra, preview: { projectId: project.id, before: pickProject(project), after: { ...pickProject(project), ...patch }, log: { action, actor: roleActor(), role: roleMeta[state.role].label, note: summary } } };
}

function pickProject(project) {
  return { taskStatus: project.taskStatus, stage: project.stage, supplier: project.supplier, currentRisk: project.currentRisk, nextAction: project.nextAction };
}

function confirmPendingAction() {
  const action = state.pendingAction;
  if (!action) return;
  const project = state.data.projects.find((item) => item.id === action.projectId);
  if (!project) return;
  Object.assign(project, action.patch);
  if (action.extra === "quality") {
    state.data.qualityEvents.unshift({ id: nextId("QINC", state.data.qualityEvents), projectId: project.id, batchId: "待关联", ruleId: "待确认", type: "待确认缺陷", severity: "P2", impact: "待确认", status: "处理中", action: "返修确认" });
  }
  if (action.extra === "qualityClose") {
    state.data.qualityEvents.filter((item) => item.projectId === project.id && item.status !== "已关闭").forEach((item) => item.status = "已关闭");
  }
  state.data.operationLogs.unshift({ id: nextId("LOG", state.data.operationLogs), projectId: project.id, time: nowText(), actor: roleActor(), role: roleMeta[state.role].label, action: action.action, note: action.summary });
  saveData();
  state.messages.push(["agent", `已授权写入：${action.action}。我同时追加了一条操作日志。`]);
  state.pendingAction = null;
  state.highlightedStage = project.stage;
  render();
}

function cancelPendingAction() {
  state.messages.push(["agent", "已取消本次待写入动作，数据没有变化。"]);
  state.pendingAction = null;
  render();
}

function renderSuppliers() {
  return panel("供应商", table(state.data.suppliers, [
    { key: "id", label: "供应商ID" }, { key: "tags", label: "能力标签" }, { key: "capacity", label: "可用产能" }, { key: "qualityLevel", label: "质量等级" }, { key: "efficiencyRange", label: "效率区间" }, { key: "status", label: "状态", render: (item) => badge(item.status) }, { key: "risk", label: "风险备注" }
  ]), badge("项目详情内完成授权写入"));
}

function renderQuality() {
  return panel("质量事件", table(state.data.qualityEvents, [
    { key: "id", label: "事件ID" }, { key: "projectId", label: "项目ID" }, { key: "type", label: "类型" }, { key: "severity", label: "级别", render: (item) => badge(item.severity) }, { key: "impact", label: "影响范围" }, { key: "status", label: "状态", render: (item) => badge(item.status) }, { key: "action", label: "处理动作" }
  ]));
}

function renderKnowledge() {
  return panel("规则知识", table(state.data.rules, [
    { key: "id", label: "规则ID" }, { key: "version", label: "版本" }, { key: "name", label: "名称" }, { key: "type", label: "类型" }, { key: "modality", label: "模态" }, { key: "scope", label: "适用范围" }, { key: "metric", label: "质量度量" }, { key: "status", label: "状态", render: (item) => badge(item.status) }
  ]));
}

function agentReply(text) {
  const project = currentProject();
  if (/审核|提交/.test(text)) proposeAction(project.stage === "创建" ? "submitReview" : "approveProject");
  else if (/供应商|指派/.test(text)) proposeAction("assignSupplier");
  else if (/验收/.test(text)) proposeAction(project.stage === "验收" ? "acceptDelivery" : "moveAcceptance");
  else if (/质量|返修|缺陷/.test(text)) proposeAction("createQuality");
  else if (/进度/.test(text)) proposeAction(state.role === "vendor" ? "submitProgress" : "requestProgress");
  else if (/规则/.test(text)) proposeAction("askRule");
  else {
    state.messages.push(["agent", "我已收到。你可以说：提交审核、指派供应商、提交进度、登记质量事件、进入验收。每一步都会先预览，再等你确认写入。"]);
    render();
  }
}

el.agentSend.addEventListener("click", () => {
  const text = el.agentInput.value.trim();
  if (!text) return;
  state.messages.push(["user", text]);
  el.agentInput.value = "";
  agentReply(text);
});

el.agentInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) el.agentSend.click();
});

document.querySelectorAll(".role-btn").forEach((btn) => btn.addEventListener("click", () => {
  state.role = btn.dataset.role;
  state.view = "projectList";
  state.pendingAction = null;
  render();
}));

el.nav.addEventListener("click", (event) => {
  const btn = event.target.closest(".nav-btn");
  if (!btn) return;
  state.view = btn.dataset.view;
  render();
});

el.content.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.openProject) {
    state.selectedProjectId = target.dataset.openProject;
    state.highlightedStage = currentProject()?.stage || "创建";
    state.view = "projectDetail";
  }
  if (target.dataset.backList !== undefined) state.view = "projectList";
  if (target.dataset.proposeAction) proposeAction(target.dataset.proposeAction);
  render();
});

el.agentFeed.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.confirmAction !== undefined) confirmPendingAction();
  if (target.dataset.cancelAction !== undefined) cancelPendingAction();
});

el.saveBtn.addEventListener("click", () => {
  saveData();
  state.messages.push(["agent", "当前数据已保存到浏览器本地。"]);
  render();
});

el.exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `dataops-agent-export-${nowText().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
});

el.resetBtn.addEventListener("click", () => {
  if (!confirm("确认重置为初始样例数据？当前浏览器本地数据会被覆盖。")) return;
  localStorage.removeItem(STORAGE_KEY);
  state.data = cloneSeed();
  state.pendingAction = null;
  state.messages = [];
  state.view = "projectList";
  render();
});

render();
