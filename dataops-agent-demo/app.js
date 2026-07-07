const STORAGE_KEY = "dataops-agent-platform-v1";

const roleMeta = {
  customer: {
    label: "用户端",
    scope: "组织视角：示例组织 A",
    nav: [
      ["workspace", "工作台", "总览"],
      ["newRequirement", "提交需求", "创建"],
      ["myProjects", "我的项目", "进度"],
      ["operations", "平台操作", "待办"],
      ["acceptance", "验收交付", "确认"]
    ]
  },
  operator: {
    label: "运营端",
    scope: "运营视角：授权项目",
    nav: [
      ["workspace", "运营工作台", "总览"],
      ["requirements", "需求评估", "立项"],
      ["projects", "项目管理", "推进"],
      ["batches", "任务批次", "执行"],
      ["suppliers", "供应商", "选配"],
      ["quality", "质量返修", "闭环"],
      ["settlement", "结算复核", "检查"],
      ["knowledge", "规则知识", "规范"]
    ]
  },
  vendor: {
    label: "供应商端",
    scope: "供应商视角：Vendor-02",
    nav: [
      ["workspace", "任务工作台", "总览"],
      ["batches", "我的批次", "执行"],
      ["quality", "返修反馈", "处理"],
      ["knowledge", "规则规范", "查询"]
    ]
  },
  quality: {
    label: "质检端",
    scope: "质检视角：授权项目",
    nav: [
      ["workspace", "质检工作台", "总览"],
      ["quality", "质量事件", "登记"],
      ["knowledge", "规则管理", "版本"],
      ["projects", "项目抽检", "跟踪"]
    ]
  },
  manager: {
    label: "管理端",
    scope: "管理视角：汇总数据",
    nav: [
      ["workspace", "经营看板", "总览"],
      ["projects", "项目概览", "风险"],
      ["suppliers", "供应商表现", "对比"],
      ["quality", "质量风险", "复盘"],
      ["settlement", "结算风险", "检查"]
    ]
  }
};

const state = {
  role: "customer",
  view: "workspace",
  data: loadData(),
  messages: []
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
  if (!saved) return structuredClone(window.DATAOPS_SEED);
  try {
    return JSON.parse(saved);
  } catch {
    return structuredClone(window.DATAOPS_SEED);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function esc(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[ch]));
}

function nextId(prefix, list) {
  const max = list.reduce((num, item) => {
    const current = Number(String(item.id || "").replace(/\D/g, ""));
    return Number.isFinite(current) ? Math.max(num, current) : num;
  }, 0);
  return `${prefix}-${max + 1}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function badge(text) {
  const value = String(text || "");
  let tone = "blue";
  if (/完成|已立项|已交付|启用|活跃|正常/.test(value)) tone = "green";
  if (/待|评估|进行|处理中|未开始/.test(value)) tone = "amber";
  if (/延期|风险|P0|P1|失败|暂不/.test(value)) tone = "red";
  return `<span class="badge ${tone}">${esc(value)}</span>`;
}

function metric(label, value, hint = "") {
  return `<div class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong><p>${esc(hint)}</p></div>`;
}

function table(items, columns, actions = null) {
  if (!items.length) return `<div class="empty">暂无记录</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${columns.map((col) => `<th>${esc(col.label)}</th>`).join("")}${actions ? "<th>操作</th>" : ""}</tr></thead>
        <tbody>
          ${items.map((item) => `
            <tr>
              ${columns.map((col) => {
                const value = typeof col.render === "function" ? col.render(item) : esc(item[col.key]);
                return `<td>${value}</td>`;
              }).join("")}
              ${actions ? `<td><div class="row-actions">${actions(item)}</div></td>` : ""}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>`;
}

function panel(title, body, extra = "") {
  return `<section class="panel"><header class="panel-header"><h2>${esc(title)}</h2>${extra}</header><div class="panel-body">${body}</div></section>`;
}

function render() {
  renderNav();
  renderHeader();
  renderContent();
  renderAgent();
  bindDynamicEvents();
}

function renderNav() {
  const meta = roleMeta[state.role];
  el.nav.innerHTML = meta.nav.map(([view, label, hint]) => `
    <button class="nav-btn ${state.view === view ? "active" : ""}" data-view="${view}">${esc(label)}<span>${esc(hint)}</span></button>
  `).join("");
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
  const handlers = {
    workspace: renderWorkspace,
    newRequirement: renderNewRequirement,
    myProjects: renderMyProjects,
    operations: renderOperations,
    acceptance: renderAcceptance,
    requirements: renderRequirements,
    projects: renderProjects,
    batches: renderBatches,
    suppliers: renderSuppliers,
    quality: renderQuality,
    settlement: renderSettlement,
    knowledge: renderKnowledge
  };
  el.content.innerHTML = (handlers[state.view] || renderWorkspace)();
}

function renderWorkspace() {
  const { requirements, projects, batches, qualityEvents, operations } = state.data;
  const running = projects.filter((item) => item.status === "执行中").length;
  const pendingOps = operations.filter((item) => item.status !== "已完成").length;
  const openQuality = qualityEvents.filter((item) => item.status !== "已关闭").length;
  const atRisk = projects.filter((item) => /风险|待|未|延期/.test(item.risk + item.qualityStatus + item.settlementStatus)).length;

  const timeline = [
    ["1", "需求进入", "用户提交需求，Agent 帮助补齐字段和验收标准。", requirements.length],
    ["2", "运营评估", "运营确认规则、预算、数据路径和工具配置。", projects.length],
    ["3", "供应商执行", "按批次分配任务，记录效率、风险和实际完成。", batches.length],
    ["4", "质量闭环", "质量事件绑定项目、批次、规则和返修动作。", qualityEvents.length],
    ["5", "验收结算", "检查交付量、未关闭质量事件和结算口径。", state.data.settlements.length]
  ].map(([num, title, desc, count]) => `
    <div class="timeline-item"><div class="timeline-dot">${num}</div><div><strong>${title}</strong><p>${desc}</p></div>${badge(`${count} 条`)}</div>
  `).join("");

  return `
    <div class="grid four">
      ${metric("需求总数", requirements.length, "含待评估、评估中、已立项")}
      ${metric("执行中项目", running, "当前正在推进")}
      ${metric("待处理操作", pendingOps, "需用户或运营补充")}
      ${metric("开放质量事件", openQuality, "未关闭缺陷和返修")}
    </div>
    <div class="grid two" style="margin-top:12px;">
      ${panel("交付流程", `<div class="timeline">${timeline}</div>`)}
      ${panel("当前风险", table(projects.slice(0, 5), [
        { key: "id", label: "项目" },
        { key: "stage", label: "阶段" },
        { key: "risk", label: "风险" },
        { key: "nextAction", label: "下一步" }
      ]), badge(`${atRisk} 个风险点`))}
    </div>
  `;
}

function renderNewRequirement() {
  return panel("提交数据标采需求", `
    <form id="requirementForm">
      <div class="form-grid">
        <div class="field"><label>需求标题</label><input name="title" required placeholder="例如：车道线语义分割标注"></div>
        <div class="field"><label>需求方/组织</label><input name="org" required value="示例组织 A"></div>
        <div class="field"><label>需求联系人</label><input name="owner" required placeholder="填写联系人"></div>
        <div class="field"><label>需求类型</label><select name="type"><option>标注</option><option>采集</option><option>清洗</option><option>质检</option><option>数据集构建</option></select></div>
        <div class="field"><label>数据模态</label><select name="modality"><option>图像</option><option>视频</option><option>音频</option><option>文本</option><option>点云</option><option>多模态</option></select></div>
        <div class="field"><label>预估数据量</label><input name="volume" type="number" min="1" required placeholder="例如：6996"></div>
        <div class="field"><label>优先级</label><select name="priority"><option>P1</option><option>P0</option><option>P2</option><option>P3</option></select></div>
        <div class="field"><label>期望完成日期</label><input name="dueDate" type="date" required></div>
        <div class="field full"><label>场景描述</label><textarea name="description" placeholder="描述数据来源、对象、标注目标、特殊场景"></textarea></div>
        <div class="field full"><label>验收标准</label><textarea name="acceptance" required placeholder="例如：框贴合可见边界，IoU 大于 0.85，类别准确率不低于 95%"></textarea></div>
      </div>
      <div class="form-actions"><button class="dark-btn" type="submit">提交需求</button></div>
    </form>
  `, badge("用户可用"));
}

function renderMyProjects() {
  return panel("我的项目进度", table(state.data.projects, projectColumns()), badge("仅显示本组织项目"));
}

function renderOperations() {
  return panel("平台操作事项", table(state.data.operations, [
    { key: "id", label: "事项ID" },
    { key: "title", label: "事项" },
    { key: "role", label: "角色" },
    { key: "objectId", label: "关联对象" },
    { key: "status", label: "状态", render: (item) => badge(item.status) },
    { key: "dueDate", label: "截止" },
    { key: "guide", label: "操作说明" }
  ], (item) => item.status !== "已完成" ? `<button data-complete-op="${esc(item.id)}">标记完成</button>` : ""));
}

function renderAcceptance() {
  const rows = state.data.projects.map((project) => ({
    ...project,
    readiness: /未开始|待|处理/.test(project.qualityStatus + project.settlementStatus + project.risk) ? "暂不可验收" : "可验收"
  }));
  return panel("验收交付", table(rows, [
    { key: "id", label: "项目ID" },
    { key: "name", label: "项目" },
    { key: "stage", label: "阶段" },
    { key: "qualityStatus", label: "质量状态" },
    { key: "readiness", label: "验收判断", render: (item) => badge(item.readiness) },
    { key: "nextAction", label: "下一步" }
  ]));
}

function renderRequirements() {
  return panel("需求评估", table(state.data.requirements, requirementColumns(), (item) => `
    ${item.status === "已立项" ? "" : `<button data-create-project="${esc(item.id)}">立项</button>`}
    <button data-mark-evaluate="${esc(item.id)}">评估中</button>
  `), badge("运营可处理"));
}

function renderProjects() {
  return panel("项目管理", table(state.data.projects, projectColumns(), (item) => `
    <button data-stage-project="${esc(item.id)}">推进阶段</button>
    <button data-create-batch="${esc(item.id)}">生成批次</button>
  `));
}

function renderBatches() {
  return panel("任务批次", table(state.data.batches, [
    { key: "id", label: "批次ID" },
    { key: "projectId", label: "项目" },
    { key: "type", label: "类型" },
    { key: "supplier", label: "供应商" },
    { key: "volume", label: "数据量" },
    { key: "estimateEfficiency", label: "预估效率" },
    { key: "actualEfficiency", label: "实际效率", render: (item) => esc(item.actualEfficiency || "未完成") },
    { key: "status", label: "状态", render: (item) => badge(item.status) },
    { key: "plannedEnd", label: "计划结束" },
    { key: "risk", label: "风险" }
  ], (item) => item.status === "已完成" ? "" : `<button data-complete-batch="${esc(item.id)}">完成批次</button>`));
}

function renderSuppliers() {
  return panel("供应商管理", table(state.data.suppliers, [
    { key: "id", label: "供应商ID" },
    { key: "tags", label: "能力标签" },
    { key: "capacity", label: "可用产能" },
    { key: "qualityLevel", label: "质量等级" },
    { key: "efficiencyRange", label: "效率区间" },
    { key: "status", label: "状态", render: (item) => badge(item.status) },
    { key: "risk", label: "风险备注" }
  ]), badge("敏感价格不展示"));
}

function renderQuality() {
  return `
    <div class="grid two">
      ${panel("登记质量事件", `
        <form id="qualityForm">
          <div class="field"><label>关联项目</label><select name="projectId">${state.data.projects.map((p) => `<option>${esc(p.id)}</option>`).join("")}</select></div>
          <div class="field"><label>关联批次</label><select name="batchId">${state.data.batches.map((b) => `<option>${esc(b.id)}</option>`).join("")}</select></div>
          <div class="field"><label>关联规则</label><select name="ruleId">${state.data.rules.map((r) => `<option>${esc(r.id)}</option>`).join("")}</select></div>
          <div class="field"><label>事件类型</label><input name="type" required placeholder="漏标、错标、点位偏移、格式错误"></div>
          <div class="field"><label>严重级别</label><select name="severity"><option>P2</option><option>P1</option><option>P0</option></select></div>
          <div class="field"><label>样本范围</label><input name="sample" required placeholder="例如：IMG_0001~IMG_0100"></div>
          <div class="field"><label>缺陷定位</label><input name="location" required placeholder="坐标、对象ID或缺失说明"></div>
          <div class="field"><label>影响范围</label><input name="impact" required placeholder="例如：100 张抽检样本"></div>
          <div class="field"><label>处理动作</label><input name="action" required placeholder="返修、重采、规则复训"></div>
          <div class="form-actions"><button class="dark-btn" type="submit">登记事件</button></div>
        </form>
      `)}
      ${panel("质量事件列表", table(state.data.qualityEvents, [
        { key: "id", label: "事件ID" },
        { key: "projectId", label: "项目" },
        { key: "type", label: "类型" },
        { key: "severity", label: "级别", render: (item) => badge(item.severity) },
        { key: "impact", label: "影响范围" },
        { key: "status", label: "状态", render: (item) => badge(item.status) },
        { key: "action", label: "处理动作" }
      ], (item) => item.status === "已关闭" ? "" : `<button data-close-quality="${esc(item.id)}">关闭</button>`))}
    </div>
  `;
}

function renderSettlement() {
  return panel("结算复核", table(state.data.settlements, [
    { key: "id", label: "结算ID" },
    { key: "projectId", label: "项目" },
    { key: "supplier", label: "供应商" },
    { key: "period", label: "周期" },
    { key: "volume", label: "结算量" },
    { key: "status", label: "状态", render: (item) => badge(item.status) },
    { key: "checkResult", label: "复核结果" }
  ], (item) => `<button data-check-settlement="${esc(item.id)}">重新复核</button>`), badge("结算前检查"));
}

function renderKnowledge() {
  return panel("规则知识库", table(state.data.rules, [
    { key: "id", label: "规则ID" },
    { key: "version", label: "版本" },
    { key: "name", label: "名称" },
    { key: "type", label: "类型" },
    { key: "modality", label: "模态" },
    { key: "scope", label: "适用范围" },
    { key: "metric", label: "质量度量" },
    { key: "status", label: "状态", render: (item) => badge(item.status) }
  ]));
}

function requirementColumns() {
  return [
    { key: "id", label: "需求ID" },
    { key: "title", label: "标题" },
    { key: "org", label: "组织" },
    { key: "type", label: "类型" },
    { key: "modality", label: "模态" },
    { key: "volume", label: "数据量" },
    { key: "priority", label: "优先级", render: (item) => badge(item.priority) },
    { key: "status", label: "状态", render: (item) => badge(item.status) }
  ];
}

function projectColumns() {
  return [
    { key: "id", label: "项目ID" },
    { key: "name", label: "项目" },
    { key: "org", label: "组织" },
    { key: "stage", label: "阶段" },
    { key: "status", label: "状态", render: (item) => badge(item.status) },
    { key: "supplier", label: "供应商" },
    { key: "risk", label: "当前风险" },
    { key: "nextAction", label: "下一步" }
  ];
}

function renderAgent() {
  if (!state.messages.length) {
    state.messages = [
      ["agent", "我可以按角色处理数据需求、项目推进、批次执行、质量返修、规则查询和结算复核。现在这是本地可用版，数据会保存在你的浏览器里。"],
      ["agent", "建议先从用户端提交一个真实但脱敏的需求，再切到运营端立项并生成批次。"]
    ];
  }
  el.agentFeed.innerHTML = state.messages.map(([role, text]) => `
    <article class="message"><div class="avatar ${role === "agent" ? "agent" : ""}">${role === "agent" ? "AI" : "你"}</div><div class="bubble"><p>${esc(text)}</p></div></article>
  `).join("");
  el.agentFeed.scrollTop = el.agentFeed.scrollHeight;
}

function agentReply(text) {
  const input = text.toLowerCase();
  if (/需求|创建|提交/.test(text)) {
    state.role = "customer";
    state.view = "newRequirement";
    return "我已切到用户端的提交需求页。你先填写标题、模态、数据量和验收标准，提交后运营端就能评估立项。";
  }
  if (/立项|项目|进度/.test(text)) {
    state.role = "operator";
    state.view = "requirements";
    return "我已切到运营端需求评估。待评估或评估中的需求可以一键立项，系统会生成项目记录。";
  }
  if (/批次|供应商|任务/.test(text)) {
    state.role = "operator";
    state.view = "batches";
    return "我已打开任务批次。这里可以查看供应商分配、计划结束、效率和当前风险。";
  }
  if (/质量|返修|缺陷|漏标|错标/.test(text)) {
    state.role = "quality";
    state.view = "quality";
    return "我已切到质检端。可以登记质量事件，并把事件绑定到项目、批次和规则。";
  }
  if (/结算|验收/.test(text)) {
    state.role = "operator";
    state.view = "settlement";
    return "我已打开结算复核。系统会检查是否存在未关闭质量事件，再给出是否可结算。";
  }
  if (/风险|看板|管理/.test(text)) {
    state.role = "manager";
    state.view = "workspace";
    return "我已切到管理端经营看板。这里看项目、质量、待办和交付风险汇总。";
  }
  if (input.includes("save")) {
    saveData();
    return "已保存当前数据。";
  }
  return "我理解了。当前版本先支持需求创建、运营立项、批次管理、质量事件、规则查询和结算复核。你也可以直接说：创建需求、查看质量、生成批次、结算复核。";
}

function bindDynamicEvents() {
  document.querySelectorAll(".nav-btn").forEach((btn) => btn.addEventListener("click", () => {
    state.view = btn.dataset.view;
    render();
  }));

  const requirementForm = document.getElementById("requirementForm");
  if (requirementForm) requirementForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(requirementForm);
    const item = {
      id: nextId("REQ", state.data.requirements),
      title: form.get("title"),
      org: form.get("org"),
      owner: form.get("owner"),
      type: form.get("type"),
      modality: form.get("modality"),
      volume: Number(form.get("volume")),
      description: form.get("description"),
      acceptance: form.get("acceptance"),
      priority: form.get("priority"),
      status: "待评估",
      dueDate: form.get("dueDate"),
      createdAt: today()
    };
    state.data.requirements.unshift(item);
    state.data.operations.unshift({ id: nextId("OP", state.data.operations), title: "运营评估新需求", role: "运营", objectId: item.id, status: "待处理", dueDate: item.dueDate, guide: "确认数据、规则、预算、安全信息和供应商资源。" });
    saveData();
    state.messages.push(["agent", `已提交需求 ${item.id}。下一步切到运营端进行评估和立项。`]);
    state.role = "operator";
    state.view = "requirements";
    render();
  });

  const qualityForm = document.getElementById("qualityForm");
  if (qualityForm) qualityForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(qualityForm);
    state.data.qualityEvents.unshift({
      id: nextId("QINC", state.data.qualityEvents),
      projectId: form.get("projectId"),
      batchId: form.get("batchId"),
      ruleId: form.get("ruleId"),
      type: form.get("type"),
      severity: form.get("severity"),
      sample: form.get("sample"),
      location: form.get("location"),
      impact: form.get("impact"),
      status: "处理中",
      action: form.get("action"),
      createdAt: today()
    });
    saveData();
    state.messages.push(["agent", "质量事件已登记，已进入处理中状态。运营端可据此生成返修说明和结算拦截。"]);
    render();
  });
}

function createProject(requirementId) {
  const req = state.data.requirements.find((item) => item.id === requirementId);
  if (!req) return;
  req.status = "已立项";
  const project = {
    id: nextId("PRJ", state.data.projects),
    requirementId: req.id,
    name: `${req.title}交付项目`,
    org: req.org,
    manager: "待分配",
    stage: "需求评估",
    status: "待启动",
    supplier: "待选配",
    toolStatus: "待配置",
    qualityStatus: "未开始",
    settlementStatus: "未开始",
    risk: "供应商、工具和预算待确认",
    nextAction: "配置工具、选配供应商、拆分任务批次"
  };
  state.data.projects.unshift(project);
  state.data.operations.unshift({ id: nextId("OP", state.data.operations), title: "配置项目工具", role: "运营", objectId: project.id, status: "待处理", dueDate: req.dueDate, guide: "根据需求配置标签、导出格式、质检规则和权限。" });
  saveData();
  state.messages.push(["agent", `已根据 ${req.id} 创建项目 ${project.id}，下一步建议生成首标批次。`]);
}

function createBatch(projectId) {
  const project = state.data.projects.find((item) => item.id === projectId);
  if (!project) return;
  const req = state.data.requirements.find((item) => item.id === project.requirementId);
  const batch = {
    id: nextId("BATCH", state.data.batches),
    projectId,
    type: "首标",
    supplier: project.supplier === "待选配" ? "Vendor-02" : project.supplier,
    volume: Math.min(Number(req?.volume || 1000), 2000),
    unit: `${req?.modality === "音频" ? "小时" : "张"}/人天`,
    estimateEfficiency: req?.modality === "音频" ? 10 : 800,
    actualEfficiency: "",
    status: "待启动",
    plannedEnd: req?.dueDate || today(),
    actualEnd: "",
    risk: "待供应商确认排期"
  };
  project.stage = "供应商执行";
  project.status = "执行中";
  project.supplier = batch.supplier;
  state.data.batches.unshift(batch);
  saveData();
  state.messages.push(["agent", `已为 ${projectId} 生成批次 ${batch.id}。`]);
}

function advanceStage(projectId) {
  const stages = ["需求评估", "工具配置", "供应商选择", "供应商执行", "质检", "验收", "结算", "已交付"];
  const project = state.data.projects.find((item) => item.id === projectId);
  if (!project) return;
  const index = stages.indexOf(project.stage);
  project.stage = stages[Math.min(index + 1, stages.length - 1)];
  project.status = project.stage === "已交付" ? "已交付" : "执行中";
  saveData();
}

function completeBatch(batchId) {
  const batch = state.data.batches.find((item) => item.id === batchId);
  if (!batch) return;
  batch.status = "已完成";
  batch.actualEnd = today();
  batch.actualEfficiency = batch.estimateEfficiency;
  batch.risk = "已完成，等待质检或验收";
  saveData();
}

function recheckSettlement(settlementId) {
  const set = state.data.settlements.find((item) => item.id === settlementId);
  if (!set) return;
  const open = state.data.qualityEvents.filter((item) => item.projectId === set.projectId && item.status !== "已关闭");
  if (open.length) {
    set.status = "暂不可结算";
    set.checkResult = `存在 ${open.length} 条未关闭质量事件，需先关闭返修。`;
  } else {
    set.status = "可复核";
    set.checkResult = "未发现开放质量事件，可进入运营和财务复核。";
  }
  saveData();
}

el.agentSend.addEventListener("click", () => {
  const text = el.agentInput.value.trim();
  if (!text) return;
  state.messages.push(["user", text]);
  state.messages.push(["agent", agentReply(text)]);
  el.agentInput.value = "";
  render();
});
el.agentInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) el.agentSend.click();
});

document.querySelectorAll(".role-btn").forEach((btn) => btn.addEventListener("click", () => {
  state.role = btn.dataset.role;
  state.view = "workspace";
  render();
}));

el.content.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.createProject) createProject(target.dataset.createProject);
  if (target.dataset.createBatch) createBatch(target.dataset.createBatch);
  if (target.dataset.stageProject) advanceStage(target.dataset.stageProject);
  if (target.dataset.completeBatch) completeBatch(target.dataset.completeBatch);
  if (target.dataset.closeQuality) {
    const item = state.data.qualityEvents.find((q) => q.id === target.dataset.closeQuality);
    if (item) item.status = "已关闭";
    saveData();
  }
  if (target.dataset.completeOp) {
    const item = state.data.operations.find((op) => op.id === target.dataset.completeOp);
    if (item) item.status = "已完成";
    saveData();
  }
  if (target.dataset.markEvaluate) {
    const item = state.data.requirements.find((req) => req.id === target.dataset.markEvaluate);
    if (item) item.status = "评估中";
    saveData();
  }
  if (target.dataset.checkSettlement) recheckSettlement(target.dataset.checkSettlement);
  render();
});

el.saveBtn.addEventListener("click", () => {
  saveData();
  state.messages.push(["agent", "当前数据已保存到浏览器本地。"]);
  renderAgent();
});

el.exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `dataops-agent-export-${today()}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
});

el.resetBtn.addEventListener("click", () => {
  if (!confirm("确认重置为初始样例数据？当前浏览器本地数据会被覆盖。")) return;
  localStorage.removeItem(STORAGE_KEY);
  state.data = structuredClone(window.DATAOPS_SEED);
  state.messages = [];
  render();
});

render();
