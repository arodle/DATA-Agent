const STORAGE_KEY = "dataops-agent-platform-v3";
const stages = ["创建", "审核", "执行", "验收"];
const detailTabs = [
  ["data", "数据中心"],
  ["workflow", "工作流"],
  ["prelabel", "智能预标注"],
  ["acceptance", "验收"],
  ["logs", "操作日志"]
];

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
  detailTab: "data",
  highlightedStage: "执行",
  pendingAction: null,
  messages: [],
  detector: null,
  detectionStatus: "未加载模型",
  detectionImageUrl: "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/cats.jpg",
  detectionImageName: "sample-cats.jpg",
  detections: [],
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
    if (!Array.isArray(parsed.prelabels)) parsed.prelabels = [];
    return parsed;
  } catch {
    return cloneSeed();
  }
}

function cloneSeed() {
  const seed = structuredClone(window.DATAOPS_SEED);
  if (!Array.isArray(seed.prelabels)) seed.prelabels = [];
  return seed;
}

function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data)); }
function esc(value) { return String(value ?? "").replace(/[&<>'"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[ch])); }
function nowText() { const d = new Date(); const p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; }
function nextId(prefix, list) { const max = list.reduce((n, item) => Math.max(n, Number(String(item.id || "").replace(/\D/g, "")) || 0), 0); return `${prefix}-${max + 1}`; }
function currentProject() { return state.data.projects.find((item) => item.id === state.selectedProjectId) || state.data.projects[0]; }
function roleActor() { return ({ customer: "当前用户", operator: "当前运营", vendor: "Vendor-02", quality: "当前质检", manager: "当前管理者" }[state.role] || "当前用户"); }
function badge(text) { const v = String(text || ""); let tone = "blue"; if (/完成|已关闭|活跃|正常|通过|可/.test(v)) tone = "green"; if (/创建|审核|执行|验收|待|处理中|进行|未/.test(v)) tone = "amber"; if (/风险|P0|P1|延期|拒绝|失败|缺失|不可/.test(v)) tone = "red"; return `<span class="badge ${tone}">${esc(v)}</span>`; }
function panel(title, body, extra = "") { return `<section class="panel"><header class="panel-header"><h2>${esc(title)}</h2>${extra}</header><div class="panel-body">${body}</div></section>`; }
function metric(label, value, hint) { return `<div class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong><p>${esc(hint)}</p></div>`; }
function table(items, columns, actions = null) { if (!items.length) return `<div class="empty">暂无记录</div>`; return `<div class="table-wrap"><table><thead><tr>${columns.map((c) => `<th>${esc(c.label)}</th>`).join("")}${actions ? "<th>操作</th>" : ""}</tr></thead><tbody>${items.map((item) => `<tr>${columns.map((c) => `<td>${typeof c.render === "function" ? c.render(item) : esc(item[c.key])}</td>`).join("")}${actions ? `<td><div class="row-actions">${actions(item)}</div></td>` : ""}</tr>`).join("")}</tbody></table></div>`; }

function render() { renderNav(); renderHeader(); renderContent(); renderAgent(); }
function renderNav() { const meta = roleMeta[state.role]; el.nav.innerHTML = meta.nav.map(([view, label, hint]) => `<button class="nav-btn ${state.view === view ? "active" : ""}" data-view="${view}">${esc(label)}<span>${esc(hint)}</span></button>`).join(""); document.querySelectorAll(".role-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.role === state.role)); }
function renderHeader() { const meta = roleMeta[state.role]; const active = meta.nav.find(([view]) => view === state.view) || meta.nav[0]; el.roleLabel.textContent = meta.label; el.pageTitle.textContent = active[1]; el.dataScope.textContent = meta.scope; }
function renderContent() { if (state.view === "projectDetail") el.content.innerHTML = renderProjectDetail(); else if (state.view === "suppliers") el.content.innerHTML = renderSuppliers(); else if (state.view === "quality") el.content.innerHTML = renderQuality(); else if (state.view === "knowledge") el.content.innerHTML = renderKnowledge(); else el.content.innerHTML = renderProjectList(); }

function roleProjects() { if (state.role === "customer") return state.data.projects.filter((i) => i.org === "示例组织 A"); if (state.role === "vendor") return state.data.projects.filter((i) => i.supplier === "Vendor-02" || i.taskStatus !== "创建中"); return state.data.projects; }
function renderProjectList() {
  const projects = roleProjects();
  return `<div class="platform-filter"><input placeholder="项目名称"><input placeholder="项目编号"><button class="dark-btn">搜索</button><button class="ghost-btn">重置</button><button class="dark-btn">新建项目</button></div>
    <div class="project-card-grid">${projects.map((p) => `<article class="project-card"><div class="card-menu">...</div><h2>${esc(p.taskName)}</h2><p>项目ID：</p><strong>${esc(p.id)}</strong><p>项目描述：</p><span>${esc(p.acceptance || "N/A")}</span><footer><button data-open-project="${esc(p.id)}">打开</button><button data-open-project="${esc(p.id)}" data-open-tab="workflow">访问控制</button></footer></article>`).join("")}</div>`;
}

function renderProjectDetail() {
  const project = currentProject();
  if (!project) return `<div class="empty">未找到项目</div>`;
  return `<div class="project-crumb">项目列表 / 项目详情 [${esc(project.id)}]</div><div class="detail-title"><h1>当前项目：${esc(project.taskName)} [${esc(project.id)}]</h1>${badge(project.taskStatus)}</div>${renderDetailTabs()}${renderDetailTabContent(project)}`;
}
function renderDetailTabs() { return `<div class="detail-tabs">${detailTabs.map(([id, label]) => `<button class="tab-btn ${state.detailTab === id ? "active" : ""}" data-detail-tab="${id}">${esc(label)}</button>`).join("")}</div>`; }
function renderDetailTabContent(project) {
  if (state.detailTab === "workflow") return renderWorkflowTab(project);
  if (state.detailTab === "prelabel") return renderPrelabelTab(project);
  if (state.detailTab === "acceptance") return renderAcceptanceTab(project);
  if (state.detailTab === "logs") return renderLogsTab(project);
  return renderDataCenterTab(project);
}
function renderDataCenterTab(project) {
  const batches = state.data.batches.filter((b) => b.projectId === project.id);
  const done = batches.filter((b) => b.status === "已完成").reduce((sum, b) => sum + Number(b.volume || 0), 0);
  const assigned = batches.reduce((sum, b) => sum + Number(b.volume || 0), 0);
  const rows = batches.length ? batches : [{ id: "DATA-4542", type: "点云", supplier: project.supplier, volume: project.volume, status: "未分配", plannedEnd: project.endDate, risk: project.currentRisk }];
  return `<section class="stat-strip"><div>总数据量：<b>${esc(project.volume)}</b></div><div>已分配到工作流<br><b>${assigned}</b></div><div>未分配到工作流<br><b>${Math.max(Number(project.volume || 0) - assigned, 0)}</b></div><div>已完成数据量<br><b>${done}</b></div><button class="dark-btn">原始数据管理</button></section>${panel("数据列表", `<div class="table-filter"><input placeholder="数据编号"><select><option>批次</option></select><select><option>所在节点</option></select><select><option>数据状态</option></select><button class="dark-btn">搜索</button><button class="ghost-btn">重置</button></div>${table(rows, [{ key: "id", label: "数据编号" }, { key: "type", label: "数据类型" }, { key: "supplier", label: "当前工作人员" }, { key: "status", label: "数据状态", render: (i) => badge(i.status) }, { key: "plannedEnd", label: "计划结束" }, { key: "risk", label: "风险" }])}`)}`;
}
function renderWorkflowTab(project) {
  const logs = state.data.operationLogs.filter((i) => i.projectId === project.id);
  const batches = state.data.batches.filter((i) => i.projectId === project.id);
  return `<div class="project-detail-layout"><section class="panel project-basic ${state.pendingAction?.target === "basic" ? "agent-focus" : ""}"><header class="panel-header"><h2>项目基础信息</h2><span>${esc(project.projectId)}</span></header><div class="panel-body basic-grid">${info("任务ID", project.id)}${info("任务名称", project.taskName)}${info("创建人", project.creator)}${info("运营人员", project.operator)}${info("供应商", project.supplier)}${info("任务类型", project.type)}${info("开始时间", project.startDate)}${info("结束时间", project.endDate)}${info("验收标准", project.acceptance, "wide")}${info("当前风险", project.currentRisk, "wide")}${info("下一步", project.nextAction, "wide")}</div></section><aside class="panel progress-panel ${state.pendingAction?.target === "stage" ? "agent-focus" : ""}"><header class="panel-header"><h2>进度看板</h2><span class="cursor-pill">Agent 光标：${esc(state.highlightedStage || project.stage)}</span></header><div class="panel-body">${renderStageBoard(project)}${renderRoleActions(project)}</div></aside></div><div class="grid two detail-lower">${panel("批次执行", table(batches, [{ key: "id", label: "批次ID" }, { key: "type", label: "类型" }, { key: "supplier", label: "供应商" }, { key: "volume", label: "数据量" }, { key: "status", label: "状态", render: (i) => badge(i.status) }, { key: "plannedEnd", label: "计划结束" }, { key: "risk", label: "风险" }]))}${panel("最近日志", logs.slice(0, 4).map(renderLog).join("") || `<div class="empty">暂无日志</div>`)}</div>`;
}
function info(label, value, wide = "") { return `<div class="info-item ${wide}"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`; }
function renderStageBoard(project) { const idx = stages.indexOf(project.stage); const focus = state.highlightedStage || project.stage; return `<div class="stage-board">${stages.map((s, i) => `<article class="stage-card ${i < idx ? "done" : ""} ${s === project.stage ? "current" : ""} ${s === focus ? "agent-cursor" : ""}"><div class="stage-index">${i+1}</div><div><strong>${esc(s)}</strong><p>${esc(state.data.stageDetails[s]?.[state.role] || state.data.stageDetails[s]?.operator || "等待下一步操作。")}</p></div>${i < idx ? badge("已完成") : s === project.stage ? badge("当前") : badge("未开始")}</article>`).join("")}</div>`; }
function renderRoleActions(project) { const actions = availableActions(project); return `<div class="action-pad"><h3>可发起操作</h3><p>所有操作只生成预览，不会直接写入；必须在右侧 Agent 面板确认授权。</p><div class="action-grid">${actions.map((a) => `<button class="small-btn" data-propose-action="${a.type}">${esc(a.label)}</button>`).join("")}</div></div>`; }
function availableActions(project) { const a = []; if (state.role === "customer") { if (project.stage === "创建") a.push({ type: "submitReview", label: "提交审核" }); if (project.stage === "验收") a.push({ type: "acceptDelivery", label: "确认验收" }); a.push({ type: "requestProgress", label: "询问进度" }); } if (state.role === "operator") { if (project.stage === "创建" || project.stage === "审核") a.push({ type: "approveProject", label: "审核通过" }); if (project.stage === "审核") a.push({ type: "assignSupplier", label: "指派供应商" }); if (project.stage === "执行") a.push({ type: "moveAcceptance", label: "进入验收" }); a.push({ type: "addRiskLog", label: "记录风险" }); } if (state.role === "vendor") { if (project.stage === "执行") a.push({ type: "submitProgress", label: "提交进度" }, { type: "submitDelivery", label: "提交交付" }); a.push({ type: "askRule", label: "询问规则" }); } if (state.role === "quality") a.push({ type: "createQuality", label: "登记质量事件" }, { type: "closeQuality", label: "关闭质量事件" }); return a; }

function renderPrelabelTab(project) {
  const prelabels = state.data.prelabels.filter((i) => i.projectId === project.id);
  return `<div class="prelabel-layout"><section class="panel"><header class="panel-header"><h2>智能预标注</h2>${badge("Xenova/detr-resnet-50")}</header><div class="panel-body"><p>上传一张图片或使用样例图，浏览器会加载开源 DETR 目标检测模型并生成拉框结果。结果不会直接写入项目，需在右侧 Agent 确认。</p><div class="model-controls"><input id="imageUpload" type="file" accept="image/*"><button class="ghost-btn" data-load-sample>使用样例图</button><button class="dark-btn" data-run-detection>运行预标注</button></div><div class="model-status">状态：${esc(state.detectionStatus)}</div><div class="annotator-stage"><img id="detectImage" src="${esc(state.detectionImageUrl)}" alt="待预标注图片"><div id="boxLayer" class="box-layer">${renderBoxes()}</div></div></div></section><aside class="panel"><header class="panel-header"><h2>预标注结果</h2>${badge(`${state.detections.length} 个框`)}</header><div class="panel-body">${state.detections.length ? table(state.detections, [{ key: "label", label: "标签" }, { key: "score", label: "置信度", render: (i) => `${Math.round(i.score * 100)}%` }, { key: "box", label: "坐标", render: (i) => `${Math.round(i.box.xmin)}, ${Math.round(i.box.ymin)}, ${Math.round(i.box.xmax)}, ${Math.round(i.box.ymax)}` }], () => "") : `<div class="empty">还没有检测结果</div>`}<div class="action-grid"><button class="small-btn" data-propose-prelabel ${state.detections.length ? "" : "disabled"}>生成写入预览</button></div></div></aside></div>${panel("已授权预标注记录", table(prelabels, [{ key: "id", label: "记录ID" }, { key: "imageName", label: "图片" }, { key: "model", label: "模型" }, { key: "boxCount", label: "框数量" }, { key: "createdAt", label: "写入时间" }]))}`;
}
function renderBoxes() { return state.detections.map((d, i) => { const b = d.box; return `<div class="detect-box" style="left:${b.xmin}px;top:${b.ymin}px;width:${Math.max(b.xmax-b.xmin, 1)}px;height:${Math.max(b.ymax-b.ymin, 1)}px"><span>${esc(d.label)} ${Math.round(d.score*100)}%</span></div>`; }).join(""); }
async function loadDetector() { if (state.detector) return state.detector; state.detectionStatus = "正在加载 Transformers.js 和模型，首次会比较慢"; render(); const mod = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm"); const { pipeline, env } = mod; env.allowLocalModels = false; state.detector = await pipeline("object-detection", "Xenova/detr-resnet-50", { dtype: "q8" }); state.detectionStatus = "模型已加载"; render(); return state.detector; }
async function runDetection() { try { const img = document.getElementById("detectImage"); if (!img?.src) return; state.detailTab = "prelabel"; const detector = await loadDetector(); state.detectionStatus = "正在推理"; render(); const output = await detector(img.src, { threshold: 0.7 }); state.detections = output.map((item) => ({ label: item.label, score: item.score, box: normalizeBox(item.box, img) })).slice(0, 12); state.detectionStatus = `完成：识别 ${state.detections.length} 个候选框`; state.messages.push(["agent", `模型已完成预标注，检测到 ${state.detections.length} 个框。请点击“生成写入预览”，再确认是否写入项目。`]); render(); } catch (err) { state.detectionStatus = `模型运行失败：${err.message}`; state.messages.push(["agent", "模型加载或推理失败。公网/浏览器策略可能影响 Hugging Face 模型下载，可以稍后重试或改成后端推理。"]); render(); } }
function normalizeBox(box, img) { const w = img.naturalWidth || img.clientWidth || 1; const h = img.naturalHeight || img.clientHeight || 1; const rw = img.clientWidth / w; const rh = img.clientHeight / h; return { xmin: box.xmin * rw, ymin: box.ymin * rh, xmax: box.xmax * rw, ymax: box.ymax * rh }; }
function proposePrelabelWrite() { const project = currentProject(); state.pendingAction = { projectId: project.id, target: "log", stage: "执行", action: "写入智能预标注", summary: `使用 Xenova/detr-resnet-50 为 ${state.detectionImageName} 生成 ${state.detections.length} 个候选框。`, patch: {}, extra: "prelabel", preview: { projectId: project.id, model: "Xenova/detr-resnet-50", imageName: state.detectionImageName, boxes: state.detections.map((d) => ({ label: d.label, score: Number(d.score.toFixed(4)), box: Object.fromEntries(Object.entries(d.box).map(([k, v]) => [k, Math.round(v)])) })) } }; state.highlightedStage = "执行"; state.messages.push(["agent", "已生成智能预标注写入预览。确认后会写入项目预标注记录，并追加操作日志。"]); render(); }

function renderAcceptanceTab(project) { const open = state.data.qualityEvents.filter((i) => i.projectId === project.id && i.status !== "已关闭"); const result = open.length ? "暂不可验收" : "可进入验收"; return panel("验收检查", `<div class="list-summary"><div>${metric("开放质量事件", open.length, "未关闭不允许通过")}</div><div>${metric("预标注记录", state.data.prelabels.filter((i) => i.projectId === project.id).length, "已授权写入")}</div><div>${metric("当前阶段", project.stage, "项目生命周期")}</div><div>${metric("验收判断", result, "基于当前记录")}</div></div>${table(open, [{ key: "id", label: "事件ID" }, { key: "type", label: "类型" }, { key: "severity", label: "级别", render: (i) => badge(i.severity) }, { key: "status", label: "状态", render: (i) => badge(i.status) }])}`); }
function renderLogsTab(project) { const logs = state.data.operationLogs.filter((i) => i.projectId === project.id); return panel("操作日志", `<div class="log-list">${logs.length ? logs.map(renderLog).join("") : `<div class="empty">暂无日志</div>`}</div>`); }
function renderLog(log) { return `<article class="log-item"><div><strong>${esc(log.action)}</strong><p>${esc(log.note)}</p></div><span>${esc(log.time)}</span><em>${esc(log.actor)} · ${esc(log.role)}</em></article>`; }

function renderAgent() { if (!state.messages.length) state.messages = [["agent", "我现在像操作光标一样工作：你让我做事时，我会先定位项目阶段、生成预览和授权说明；只有你点击确认写入，数据和日志才会更新。"]]; const pending = state.pendingAction ? renderPendingAction() : ""; el.agentFeed.innerHTML = `${state.messages.map(([role, text]) => `<article class="message"><div class="avatar ${role === "agent" ? "agent" : ""}">${role === "agent" ? "AI" : "你"}</div><div class="bubble"><p>${esc(text)}</p></div></article>`).join("")}${pending}`; el.agentFeed.scrollTop = el.agentFeed.scrollHeight; }
function renderPendingAction() { const a = state.pendingAction; return `<article class="auth-card"><div class="auth-head"><strong>待授权写入</strong>${badge(a.stage)}</div><p>${esc(a.summary)}</p><div class="preview-box"><span>写入预览</span><pre>${esc(JSON.stringify(a.preview, null, 2))}</pre></div><div class="auth-actions"><button class="ghost-btn" data-cancel-action>取消</button><button class="dark-btn" data-confirm-action>确认写入</button></div></article>`; }
function pending(project, stage, action, summary, patch, extra = "") { return { projectId: project.id, target: extra === "" ? "stage" : "log", stage, action, summary, patch, extra, preview: { projectId: project.id, before: pickProject(project), after: { ...pickProject(project), ...patch }, log: { action, actor: roleActor(), role: roleMeta[state.role].label, note: summary } } }; }
function pickProject(project) { return { taskStatus: project.taskStatus, stage: project.stage, supplier: project.supplier, currentRisk: project.currentRisk, nextAction: project.nextAction }; }
function buildActionTemplates(project) { return { submitReview: pending(project, "审核", "提交审核", "用户确认需求信息完整，提交运营审核。", { taskStatus: "审核中", stage: "审核", nextAction: "等待运营审核需求、预算、规则和供应商资源" }), approveProject: pending(project, "执行", "审核通过", "运营审核通过，项目进入供应商执行准备。", { taskStatus: "执行中", stage: "执行", supplier: project.supplier === "待选配" ? "Vendor-02" : project.supplier, nextAction: "供应商按批次执行，运营跟进质量和进度" }), assignSupplier: pending(project, "审核", "指派供应商", "运营选择 Vendor-02 作为主执行供应商。", { supplier: "Vendor-02", nextAction: "等待供应商确认排期并启动首批任务" }), moveAcceptance: pending(project, "验收", "进入验收", "运营确认执行阶段完成，项目进入验收。", { taskStatus: "验收中", stage: "验收", nextAction: "用户检查交付结果，质检关闭剩余质量事件" }), acceptDelivery: pending(project, "验收", "确认验收", "用户确认交付结果通过验收。", { taskStatus: "已完成", stage: "验收", nextAction: "进入结算复核" }), submitProgress: pending(project, "执行", "提交进度", "供应商提交当前执行进度。", { nextAction: "运营查看进度并决定是否抽检" }), submitDelivery: pending(project, "验收", "提交交付", "供应商提交本批次交付物，等待运营和用户验收。", { taskStatus: "验收中", stage: "验收", nextAction: "运营发起验收检查" }), createQuality: pending(project, "执行", "登记质量事件", "质检登记一条 P2 质量事件并要求返修。", { currentRisk: "新增 P2 质量事件，等待供应商返修" }, "quality"), closeQuality: pending(project, "验收", "关闭质量事件", "质检确认返修通过，关闭当前质量事件。", { currentRisk: "质量事件已关闭，等待验收确认" }, "qualityClose"), addRiskLog: pending(project, project.stage, "记录风险", "补充当前风险和下一步动作。", { currentRisk: "已记录新的运营关注点，需后续跟踪" }), requestProgress: pending(project, project.stage, "询问进度", "用户发起进度询问，运营需回复当前状态。", { nextAction: "运营回复项目当前进度" }), askRule: pending(project, "执行", "询问规则", "供应商询问当前规则口径，运营需确认后回复。", { nextAction: "运营确认规则口径并同步供应商" }) }; }
function proposeAction(type) { const project = currentProject(); const action = buildActionTemplates(project)[type]; if (!action) return; state.pendingAction = action; state.highlightedStage = action.stage; state.detailTab = "workflow"; state.view = "projectDetail"; state.messages.push(["agent", `我已定位到「${action.stage}」阶段，并生成了「${action.summary}」的写入预览。请确认后再写入。`]); render(); }
function confirmPendingAction() { const a = state.pendingAction; if (!a) return; const p = state.data.projects.find((i) => i.id === a.projectId); if (!p) return; Object.assign(p, a.patch); if (a.extra === "quality") state.data.qualityEvents.unshift({ id: nextId("QINC", state.data.qualityEvents), projectId: p.id, batchId: "待关联", ruleId: "待确认", type: "待确认缺陷", severity: "P2", impact: "待确认", status: "处理中", action: "返修确认" }); if (a.extra === "qualityClose") state.data.qualityEvents.filter((i) => i.projectId === p.id && i.status !== "已关闭").forEach((i) => i.status = "已关闭"); if (a.extra === "prelabel") state.data.prelabels.unshift({ id: nextId("PRE", state.data.prelabels), projectId: p.id, imageName: state.detectionImageName, model: "Xenova/detr-resnet-50", boxCount: state.detections.length, boxes: a.preview.boxes, createdAt: nowText() }); state.data.operationLogs.unshift({ id: nextId("LOG", state.data.operationLogs), projectId: p.id, time: nowText(), actor: roleActor(), role: roleMeta[state.role].label, action: a.action, note: a.summary }); saveData(); state.messages.push(["agent", `已授权写入：${a.action}。我同时追加了一条操作日志。`]); state.pendingAction = null; state.highlightedStage = p.stage; render(); }
function cancelPendingAction() { state.messages.push(["agent", "已取消本次待写入动作，数据没有变化。"]); state.pendingAction = null; render(); }

function renderSuppliers() { return panel("供应商", table(state.data.suppliers, [{ key: "id", label: "供应商ID" }, { key: "tags", label: "能力标签" }, { key: "capacity", label: "可用产能" }, { key: "qualityLevel", label: "质量等级" }, { key: "efficiencyRange", label: "效率区间" }, { key: "status", label: "状态", render: (i) => badge(i.status) }, { key: "risk", label: "风险备注" }])); }
function renderQuality() { return panel("质量事件", table(state.data.qualityEvents, [{ key: "id", label: "事件ID" }, { key: "projectId", label: "项目ID" }, { key: "type", label: "类型" }, { key: "severity", label: "级别", render: (i) => badge(i.severity) }, { key: "impact", label: "影响范围" }, { key: "status", label: "状态", render: (i) => badge(i.status) }, { key: "action", label: "处理动作" }])); }
function renderKnowledge() { return panel("规则知识", table(state.data.rules, [{ key: "id", label: "规则ID" }, { key: "version", label: "版本" }, { key: "name", label: "名称" }, { key: "type", label: "类型" }, { key: "modality", label: "模态" }, { key: "scope", label: "适用范围" }, { key: "metric", label: "质量度量" }, { key: "status", label: "状态", render: (i) => badge(i.status) }])); }
function agentReply(text) { const p = currentProject(); if (/预标|模型|拉框|检测/.test(text)) { state.view = "projectDetail"; state.detailTab = "prelabel"; state.messages.push(["agent", "我已切到智能预标注页签。上传图片或使用样例图后，点击运行预标注。"]); render(); } else if (/审核|提交/.test(text)) proposeAction(p.stage === "创建" ? "submitReview" : "approveProject"); else if (/供应商|指派/.test(text)) proposeAction("assignSupplier"); else if (/验收/.test(text)) proposeAction(p.stage === "验收" ? "acceptDelivery" : "moveAcceptance"); else if (/质量|返修|缺陷/.test(text)) proposeAction("createQuality"); else if (/进度/.test(text)) proposeAction(state.role === "vendor" ? "submitProgress" : "requestProgress"); else if (/规则/.test(text)) proposeAction("askRule"); else { state.messages.push(["agent", "可以说：智能预标注、提交审核、指派供应商、提交进度、登记质量事件、进入验收。每一步都会先预览，再等你确认写入。"]); render(); } }

el.agentSend.addEventListener("click", () => { const text = el.agentInput.value.trim(); if (!text) return; state.messages.push(["user", text]); el.agentInput.value = ""; agentReply(text); });
el.agentInput.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) el.agentSend.click(); });
document.querySelectorAll(".role-btn").forEach((btn) => btn.addEventListener("click", () => { state.role = btn.dataset.role; state.view = "projectList"; state.pendingAction = null; render(); }));
el.nav.addEventListener("click", (e) => { const btn = e.target.closest(".nav-btn"); if (!btn) return; state.view = btn.dataset.view; render(); });
el.content.addEventListener("click", (e) => { const t = e.target.closest("button"); if (!t) return; if (t.dataset.openProject) { state.selectedProjectId = t.dataset.openProject; state.detailTab = t.dataset.openTab || "data"; state.highlightedStage = currentProject()?.stage || "创建"; state.view = "projectDetail"; } if (t.dataset.detailTab) state.detailTab = t.dataset.detailTab; if (t.dataset.proposeAction) proposeAction(t.dataset.proposeAction); if (t.dataset.loadSample !== undefined) { state.detectionImageUrl = "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/cats.jpg"; state.detectionImageName = "sample-cats.jpg"; state.detections = []; render(); } if (t.dataset.runDetection !== undefined) runDetection(); if (t.dataset.proposePrelabel !== undefined) proposePrelabelWrite(); render(); });
el.content.addEventListener("change", (e) => { if (e.target.id !== "imageUpload") return; const file = e.target.files?.[0]; if (!file) return; state.detectionImageUrl = URL.createObjectURL(file); state.detectionImageName = file.name; state.detections = []; state.detectionStatus = "图片已载入，等待运行预标注"; render(); });
el.agentFeed.addEventListener("click", (e) => { const t = e.target.closest("button"); if (!t) return; if (t.dataset.confirmAction !== undefined) confirmPendingAction(); if (t.dataset.cancelAction !== undefined) cancelPendingAction(); });
el.saveBtn.addEventListener("click", () => { saveData(); state.messages.push(["agent", "当前数据已保存到浏览器本地。"]); render(); });
el.exportBtn.addEventListener("click", () => { const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: "application/json" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `dataops-agent-export-${nowText().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href); });
el.resetBtn.addEventListener("click", () => { if (!confirm("确认重置为初始样例数据？当前浏览器本地数据会被覆盖。")) return; localStorage.removeItem(STORAGE_KEY); state.data = cloneSeed(); state.pendingAction = null; state.messages = []; state.view = "projectList"; render(); });
render();
