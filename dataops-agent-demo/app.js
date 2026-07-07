const state = {
  view: "agent",
  scenario: "createTask",
  activeProjectId: "PRJ-002",
  drafts: JSON.parse(localStorage.getItem("dataopsDrafts") || "[]")
};

const data = window.DATAOPS_DEMO;

const el = {
  chat: document.getElementById("chat"),
  promptInput: document.getElementById("promptInput"),
  sendBtn: document.getElementById("sendBtn"),
  mainSurface: document.getElementById("mainSurface"),
  inspector: document.getElementById("inspector"),
  toolLog: document.getElementById("toolLog"),
  viewLabel: document.getElementById("viewLabel"),
  viewTitle: document.getElementById("viewTitle"),
  saveDraftBtn: document.getElementById("saveDraftBtn"),
  confirmWriteBtn: document.getElementById("confirmWriteBtn"),
  activeProjectName: document.getElementById("activeProjectName"),
  activeProjectStage: document.getElementById("activeProjectStage"),
  activeProjectId: document.getElementById("activeProjectId"),
  activeProjectVolume: document.getElementById("activeProjectVolume"),
  activeProjectRisk: document.getElementById("activeProjectRisk")
};

const scenarios = {
  createTask: {
    user: "帮我根据这个人体关键点需求创建任务草稿，并检查提交前风险。",
    title: "创建任务草稿",
    label: "Agent Workspace",
    reply: `
      <p>我已读取需求、项目、规则和供应商信息，生成了一个“待运营确认”的任务草稿。</p>
      <p>提交前有三个关键风险：预算单待确认、24 点最终版本待确认、供应商 1 需要先做小批量复测。</p>
      <div class="mini-grid">
        <div class="mini-card"><b>执行范围</b><span>6996 张图片</span></div>
        <div class="mini-card"><b>交付格式</b><span>JSON</span></div>
        <div class="mini-card"><b>主供应商</b><span>Vendor-02 先接 2000 张</span></div>
        <div class="mini-card"><b>写入策略</b><span>先保存草稿，人工确认后提交</span></div>
      </div>
    `,
    prompt: "生成客户确认话术，并保留任务为草稿。"
  },
  repair: {
    user: "供应商试标里脚踝点偏低，帮我生成返修说明。",
    title: "质量返修说明",
    label: "Quality Workflow",
    reply: `
      <p>我已将这次问题整理为质量事件草稿：类型为点位偏移，严重级别建议 P2，影响范围为 100 张抽检样本。</p>
      <p>返修说明应引用人体关键点规则：脚踝点应标在脚踝骨节上方，不能落在脚面；不可见点不标，不需要脑补。</p>
      <div class="mini-grid">
        <div class="mini-card"><b>事件类型</b><span>点位偏移</span></div>
        <div class="mini-card"><b>规则依据</b><span>RULE-010</span></div>
        <div class="mini-card"><b>处理动作</b><span>小批量复测</span></div>
        <div class="mini-card"><b>状态</b><span>待复查</span></div>
      </div>
    `,
    prompt: "生成供应商返修话术，并写入质量事件草稿。"
  },
  settlement: {
    user: "这个项目能结算了吗？帮我做结算前检查。",
    title: "结算前复核",
    label: "Settlement Check",
    reply: `
      <p>当前不建议进入结算。原因是预算单仍待确认，供应商 1 的小批量复测未关闭，且 24 点最终版本还需要需求方确认。</p>
      <p>我已生成结算前复核清单，建议先关闭质量事件和规则冲突，再进入验收与结算。</p>
      <div class="mini-grid">
        <div class="mini-card"><b>任务完成</b><span>未完成</span></div>
        <div class="mini-card"><b>质量事件</b><span>待复查</span></div>
        <div class="mini-card"><b>预算单</b><span>待确认</span></div>
        <div class="mini-card"><b>结论</b><span>暂不结算</span></div>
      </div>
    `,
    prompt: "生成结算前复核清单。"
  }
};

function project() {
  return data.projects.find((item) => item.id === state.activeProjectId) || data.projects[0];
}

function requirement() {
  return data.requirements.find((item) => item.id === project().requirementId) || data.requirements[0];
}

function rows(items, columns) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>${columns.map((column) => `<th>${column.label}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${items.map((item) => `
            <tr>
              ${columns.map((column) => `<td>${item[column.key] || ""}</td>`).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function message(role, html) {
  return `
    <article class="message">
      <div class="avatar ${role === "agent" ? "agent" : ""}">${role === "agent" ? "AI" : "你"}</div>
      <div class="bubble ${role === "agent" ? "agent" : ""}">${html}</div>
    </article>
  `;
}

function renderChat() {
  const scenario = scenarios[state.scenario];
  el.chat.innerHTML = [
    message("user", `<p>${scenario.user}</p>`),
    message("agent", scenario.reply)
  ].join("");
  el.promptInput.value = scenario.prompt;
  el.chat.scrollTop = el.chat.scrollHeight;
}

function renderProjectHeader() {
  const current = project();
  el.activeProjectName.textContent = current.name;
  el.activeProjectStage.textContent = current.stage;
  el.activeProjectId.textContent = current.id;
  el.activeProjectVolume.textContent = current.volume;
  el.activeProjectRisk.textContent = current.risk;
}

function renderTaskDraft() {
  const current = project();
  const req = requirement();
  el.mainSurface.innerHTML = `
    <div class="surface-header">
      <div>
        <h2>新建标注任务</h2>
        <p>Agent 已根据需求和规则生成草稿，等待运营确认后写入平台。</p>
      </div>
      <span class="badge amber">草稿未提交</span>
    </div>
    <div class="surface-body">
      <div class="form-grid">
        <section class="form-section">
          <h3>基础信息</h3>
          <div class="field"><label>任务名称</label><input value="${current.name}"></div>
          <div class="field"><label>关联需求</label><input value="${req.id} · ${req.title}"></div>
          <div class="field"><label>任务类型</label><select><option>${current.type} - 关键点</option></select></div>
          <div class="field"><label>数据模态</label><select><option>${current.modality}</option></select></div>
        </section>
        <section class="form-section">
          <h3>数据与交付</h3>
          <div class="field"><label>数据路径</label><input value="oss://demo-data/${current.id}/frames/"></div>
          <div class="field"><label>执行数据量</label><input value="${current.volume}"></div>
          <div class="field"><label>交付格式</label><input value="${current.format}"></div>
          <div class="field"><label>期望完成</label><input value="${current.deadline}，需供应商排期确认"></div>
        </section>
        <section class="form-section full">
          <h3>标注步骤</h3>
          <div class="step-row">
            <div class="step-number">1</div>
            <div><strong>人体关键点标注</strong><p>0-23 共 24 点，22/23 为左右掌心；遮挡不可见点不标。</p></div>
            <span class="badge green">已填入</span>
          </div>
          <div class="step-row">
            <div class="step-number">2</div>
            <div><strong>质量抽检</strong><p>供应商 1 先抽检 50-100 张，通过后再放量。</p></div>
            <span class="badge amber">建议新增</span>
          </div>
        </section>
        <section class="form-section full">
          <h3>规则摘要</h3>
          <div class="field">
            <label>规则说明</label>
            <textarea>${data.rules[0].requirement}</textarea>
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderRepair() {
  const events = data.qualityEvents.filter((event) => event.projectId === state.activeProjectId || event.projectId === "PRJ-005");
  el.mainSurface.innerHTML = `
    <div class="surface-header">
      <div>
        <h2>质量事件与返修说明</h2>
        <p>把飞书沟通或抽检反馈整理为质量事件、规则依据和返修动作。</p>
      </div>
      <span class="badge red">需复查</span>
    </div>
    <div class="surface-body">
      ${rows(events, [
        { key: "id", label: "事件ID" },
        { key: "projectId", label: "项目" },
        { key: "type", label: "类型" },
        { key: "severity", label: "级别" },
        { key: "location", label: "缺陷定位" },
        { key: "action", label: "动作" },
        { key: "status", label: "状态" }
      ])}
      <section class="form-section full" style="margin-top:12px;">
        <h3>返修说明草稿</h3>
        <div class="field">
          <label>发给供应商</label>
          <textarea>本次抽检发现脚踝关键点偏低，部分点落在脚面。请按 RULE-010 修正：脚踝点应位于脚踝骨节上方；遮挡不可见点不标，不需要脑补。请先完成小批量复测，运营抽检通过后再继续放量。</textarea>
        </div>
      </section>
    </div>
  `;
}

function renderSettlement() {
  el.mainSurface.innerHTML = `
    <div class="surface-header">
      <div>
        <h2>结算前复核清单</h2>
        <p>结算前检查任务完成、返修关闭、质量事件、交付量和预算口径。</p>
      </div>
      <span class="badge amber">暂不结算</span>
    </div>
    <div class="surface-body">
      ${rows([
        { item: "任务是否完成", result: "否", evidence: "供应商 1 小批量复测未关闭", action: "等待复查" },
        { item: "质量事件是否关闭", result: "否", evidence: "QINC-008 待复查", action: "完成抽检" },
        { item: "预算单是否确认", result: "否", evidence: "预算单待补充", action: "催办预算单" },
        { item: "交付格式是否确认", result: "是", evidence: "JSON", action: "保留" },
        { item: "规则版本是否确认", result: "否", evidence: "24 点最终版本需确认", action: "需求方确认" }
      ], [
        { key: "item", label: "检查项" },
        { key: "result", label: "结果" },
        { key: "evidence", label: "依据" },
        { key: "action", label: "下一步" }
      ])}
    </div>
  `;
}

function renderDataView() {
  const viewConfigs = {
    requirements: {
      label: "Data Service Platform",
      title: "需求列表",
      items: data.requirements,
      columns: [
        { key: "id", label: "需求ID" },
        { key: "title", label: "标题" },
        { key: "customer", label: "客户" },
        { key: "type", label: "类型" },
        { key: "modality", label: "模态" },
        { key: "volume", label: "数据量" },
        { key: "status", label: "状态" }
      ]
    },
    tasks: {
      label: "Execution Board",
      title: "任务批次",
      items: data.batches,
      columns: [
        { key: "id", label: "批次ID" },
        { key: "projectId", label: "项目" },
        { key: "type", label: "类型" },
        { key: "team", label: "团队" },
        { key: "volume", label: "数据量" },
        { key: "status", label: "状态" },
        { key: "risk", label: "风险" }
      ]
    },
    quality: {
      label: "Quality Center",
      title: "质量事件",
      items: data.qualityEvents,
      columns: [
        { key: "id", label: "事件ID" },
        { key: "projectId", label: "项目" },
        { key: "type", label: "类型" },
        { key: "severity", label: "级别" },
        { key: "impact", label: "影响" },
        { key: "status", label: "状态" },
        { key: "action", label: "处理动作" }
      ]
    },
    knowledge: {
      label: "Knowledge Base",
      title: "规则与 FAQ",
      items: data.rules,
      columns: [
        { key: "id", label: "规则ID" },
        { key: "version", label: "版本" },
        { key: "name", label: "名称" },
        { key: "modality", label: "模态" },
        { key: "metric", label: "质量度量" }
      ]
    }
  };
  const config = viewConfigs[state.view];
  el.viewLabel.textContent = config.label;
  el.viewTitle.textContent = config.title;
  el.mainSurface.innerHTML = `
    <div class="surface-header">
      <div>
        <h2>${config.title}</h2>
        <p>作品集版使用虚构数据，保留真实业务结构。</p>
      </div>
      <span class="badge blue">${config.items.length} 条记录</span>
    </div>
    <div class="surface-body">${rows(config.items, config.columns)}</div>
  `;
}

function renderInspector() {
  const current = project();
  const vendors = data.vendors.slice(0, 2);
  el.inspector.innerHTML = `
    <section class="inspector-card">
      <h3>Agent 判断</h3>
      <div class="inspector-body">
        <div class="kv"><span>阶段</span><b>${current.stage}</b></div>
        <div class="kv"><span>执行范围</span><b>${current.volume}</b></div>
        <div class="kv"><span>优先依据</span><b>平台任务量 > 模板字段</b></div>
        <div class="kv"><span>风险</span><b>${current.risk}</b></div>
      </div>
    </section>
    <section class="inspector-card">
      <h3>建议下一步</h3>
      <div class="inspector-body">
        <div class="kv"><span>1</span><b>确认 24 点最终版本</b></div>
        <div class="kv"><span>2</span><b>Vendor-02 先执行 2000 张</b></div>
        <div class="kv"><span>3</span><b>Vendor-01 小批量质检</b></div>
        <div class="kv"><span>4</span><b>催办预算单</b></div>
      </div>
    </section>
    <section class="inspector-card">
      <h3>供应商策略</h3>
      <div class="inspector-body">
        ${rows(vendors, [
          { key: "name", label: "供应商" },
          { key: "quality", label: "质量" },
          { key: "risk", label: "策略" }
        ])}
      </div>
    </section>
  `;
}

function renderLog() {
  const logs = {
    createTask: ["read_requirement(REQ-002)", "match_rule(RULE-010)", "fill_task_draft()", "blocked: budget_missing"],
    repair: ["read_quality_feedback()", "match_rule(RULE-010)", "draft_rework_notice()", "pending: inspection"],
    settlement: ["read_batches(PRJ-002)", "check_quality_events()", "check_budget()", "result: not_ready"]
  };
  const viewLogs = state.view === "agent" ? logs[state.scenario] : [`open_table(${state.view})`, "load_demo_records()", "permission: portfolio_data"];
  el.toolLog.innerHTML = viewLogs.map((item) => `<span>${item}</span>`).join("");
}

function renderMain() {
  renderProjectHeader();
  if (state.view === "agent") {
    const scenario = scenarios[state.scenario];
    el.viewLabel.textContent = scenario.label;
    el.viewTitle.textContent = scenario.title;
    if (state.scenario === "createTask") renderTaskDraft();
    if (state.scenario === "repair") renderRepair();
    if (state.scenario === "settlement") renderSettlement();
  } else {
    renderDataView();
  }
  renderInspector();
  renderLog();
}

function setScenario(next) {
  state.scenario = next;
  state.view = "agent";
  document.querySelectorAll(".quick-action").forEach((button) => {
    button.classList.toggle("active", button.dataset.scenario === next);
  });
  document.querySelectorAll(".rail-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === "agent");
  });
  renderChat();
  renderMain();
}

function setView(next) {
  state.view = next;
  document.querySelectorAll(".rail-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === next);
  });
  if (next === "agent") renderChat();
  renderMain();
}

function addUserMessage(text) {
  el.chat.insertAdjacentHTML("beforeend", message("user", `<p>${text}</p>`));
}

function addAgentMessage() {
  const action = {
    createTask: "已保留任务草稿，等待运营确认后写入数据服务平台。",
    repair: "已生成返修说明草稿，并准备创建质量事件记录。",
    settlement: "已生成结算前复核清单，当前结论为暂不结算。"
  };
  el.chat.insertAdjacentHTML("beforeend", message("agent", `<p>${action[state.scenario]}</p><p>这一步是作品集 Demo 的模拟写入，真实版本会进入权限校验、操作留痕和平台 API。</p>`));
  el.chat.scrollTop = el.chat.scrollHeight;
}

function saveDraft() {
  const draft = {
    id: `DRAFT-${String(Date.now()).slice(-5)}`,
    projectId: project().id,
    scenario: state.scenario,
    title: scenarios[state.scenario].title,
    createdAt: new Date().toLocaleString()
  };
  state.drafts.unshift(draft);
  localStorage.setItem("dataopsDrafts", JSON.stringify(state.drafts.slice(0, 10)));
  el.chat.insertAdjacentHTML("beforeend", message("agent", `<p>已保存草稿：${draft.id}。你可以继续修改，也可以确认写入平台。</p>`));
  el.chat.scrollTop = el.chat.scrollHeight;
}

function confirmWrite() {
  el.chat.insertAdjacentHTML("beforeend", message("agent", `<p>模拟写入完成：已将“${scenarios[state.scenario].title}”写入数据服务平台。</p><p>真实版本会记录操作者、依据数据、写入前后差异和回滚入口。</p>`));
  el.chat.scrollTop = el.chat.scrollHeight;
}

document.querySelectorAll(".quick-action").forEach((button) => {
  button.addEventListener("click", () => setScenario(button.dataset.scenario));
});

document.querySelectorAll(".rail-btn").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

el.sendBtn.addEventListener("click", () => {
  const text = el.promptInput.value.trim();
  if (!text) return;
  addUserMessage(text);
  addAgentMessage();
});

el.saveDraftBtn.addEventListener("click", saveDraft);
el.confirmWriteBtn.addEventListener("click", confirmWrite);

renderChat();
renderMain();
