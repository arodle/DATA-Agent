import Link from "next/link";
import { approveToolReview, authorizeAgentPreview, submitAgentMessage } from "@/app/actions";
import { prisma } from "@/lib/prisma";

const navItems = [
  { label: "项目总览", active: true },
  { label: "项目列表" },
  { label: "数据资产", badge: "23" },
  { label: "代理助手" },
  { label: "需求文档" },
  { label: "工具配置" },
  { label: "质量事件", badge: "47" },
  { label: "模型训练" },
  { label: "供应商/质检" },
  { label: "权限管理" },
  { label: "操作日志" },
];

const stageCopy: Record<string, { title: string; desc: string }> = {
  创建: { title: "项目创建", desc: "需求创建、数据绑定" },
  审核: { title: "运营审核", desc: "审核工具配置、样例效果" },
  执行: { title: "执行分配", desc: "分配供应商、监控执行" },
  验收: { title: "验收结算", desc: "质检验收、结算交付" },
};

const statusLabel: Record<string, string> = {
  DRAFT: "草稿",
  PENDING_REVIEW: "待审核",
  SELF_RUNNING: "用户自执行",
  TOOL_RUNNING: "工具执行中",
  AGENT_RUNNING: "Agent执行中",
  SUPPLIER_RUNNING: "供应商执行中",
  ACCEPTANCE: "验收中",
  COMPLETED: "已完成",
  PAUSED: "已暂停",
  CANCELLED: "已取消",
};

const agentActionLabel: Record<string, string> = {
  STRUCTURE_REQUIREMENT: "结构化需求预览",
  GENERATE_TOOL_CONFIG: "生成工具配置",
  RUN_OPEN_SOURCE_PRELABEL: "开源模型预标注",
  GENERATE_QUALITY_SCRIPT: "生成质检脚本",
};

type RequirementDocumentVersion = {
  version: string;
  fileName: string;
  url: string;
  status: string;
  updatedAt: string;
  author: string;
  changeNote: string;
};

function formatDate(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "-";
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function getRequirementDocument(value: unknown, fallbackUrl?: string | null) {
  const record = toRecord(value);
  const rawVersions = Array.isArray(record.documentVersions) ? record.documentVersions : [];
  const versions = rawVersions.map((item) => {
    const version = toRecord(item);
    return {
      version: String(version.version ?? "V1.0"),
      fileName: String(version.fileName ?? "requirement.pdf"),
      url: String(version.url ?? fallbackUrl ?? "/requirements/default-requirement-v1.pdf"),
      status: String(version.status ?? "当前版本"),
      updatedAt: String(version.updatedAt ?? "-"),
      author: String(version.author ?? "系统"),
      changeNote: String(version.changeNote ?? "无变更说明"),
    } satisfies RequirementDocumentVersion;
  });

  const fallback = {
    version: "V1.0",
    fileName: "default-requirement-v1.pdf",
    url: fallbackUrl ?? "/requirements/default-requirement-v1.pdf",
    status: "当前版本",
    updatedAt: "-",
    author: "系统",
    changeNote: "默认需求文档版本。",
  } satisfies RequirementDocumentVersion;

  const current = versions.find((version) => version.status === "当前版本") ?? versions.at(-1) ?? fallback;

  return {
    current,
    versions: versions.length > 0 ? versions : [fallback],
    status: String(record.documentReviewStatus ?? "待审核"),
  };
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OperatorPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const projectParam = Array.isArray(params.project) ? params.project[0] : params.project;

  const projects = await prisma.project.findMany({
    orderBy: { code: "asc" },
    include: {
      creator: true,
      operator: true,
      requirement: true,
      stages: { orderBy: { sortOrder: "asc" } },
      tasks: { orderBy: { createdAt: "asc" } },
      datasets: { orderBy: { createdAt: "asc" } },
      toolConfigs: { orderBy: { createdAt: "desc" }, take: 1 },
      prelabelRuns: { orderBy: { createdAt: "desc" }, take: 1 },
      modelBindings: { include: { model: true }, take: 1 },
      trainingRuns: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { recommendations: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
      agentSessions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { messages: { orderBy: { createdAt: "asc" }, take: 8 }, actions: { orderBy: { createdAt: "asc" } } },
      },
      operationLogs: { orderBy: { createdAt: "asc" }, take: 8 },
    },
  });

  const selected = projects.find((project) => project.code === projectParam) ?? projects[0];
  const selectedModel = selected?.modelBindings[0]?.model.name ?? "暂未绑定模型";
  const selectedRun = selected?.trainingRuns[0];
  const selectedRecommendation = selectedRun?.recommendations[0];
  const currentSession = selected?.agentSessions[0];
  const currentActions = currentSession?.actions ?? [];
  const currentMessages = currentSession?.messages ?? [];
  const toolConfig = selected?.toolConfigs[0];
  const toolJson = toRecord(toolConfig?.configJson);
  const toolPreview = toRecord(toolConfig?.previewJson);
  const prelabel = selected?.prelabelRuns[0];
  const requirementDoc = getRequirementDocument(selected?.requirement?.agentStructuredJson, selected?.requirement?.rawDocumentUrl);

  const pendingReviewCount = currentActions.filter((a) => a.status === "PREVIEW").length;

  return (
    <main className="roleShell opsShell">
      <aside className="roleSidebar">
        <div className="roleBrand">Data Agent / 运营端</div>
        <nav className="roleNav">
          {navItems.map((item) => (
            <button className={item.active ? "roleNavItem active" : "roleNavItem"} key={item.label}>
              {item.label}
              {item.badge && <span className="navBadge">{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="roleSwitcher">
          <span>切换角色</span>
          <div className="roleLinks">
            <Link href="/user">用户</Link>
            <Link href="/operator" className="active">运营</Link>
            <Link href="/supplier">供应商</Link>
          </div>
        </div>
      </aside>

      <section className="roleWorkspace">
        <header className="roleTopbar">
          <div>
            <p className="crumb">运营视角 / 进行中的项目</p>
            <h1>{selected ? `${selected.code} ${selected.name}` : "项目总览"}</h1>
          </div>
          <div className="topbarRight">
            <span className="statusTag">运行中 · 权限：负责项目 + 授权明细</span>
            <Link className="primaryBtn linkButton" href="/projects/new">新建任务</Link>
          </div>
        </header>

        {selected && (
          <>
            <section className="filters opsFilters" aria-label="筛选项目">
              <label>任务</label>
              <input placeholder="搜索 ID..." />
              <label>状态</label>
              <select defaultValue="">
                <option value="">全部进行中</option>
              </select>
              <label>模型</label>
              <select>
                <option>{selectedModel}</option>
              </select>
              <button className="primaryBtn">刷新指标</button>
            </section>

            <section className="heroCard">
              <div className="heroInfo">
                <p className="crumb">运营项目 / {selected.code}</p>
                <h2>{selected.name}</h2>
                <span className="stateTag">运营审核中 / {selectedModel}</span>
              </div>
              <div className="metricItem">
                <span>训练准确率</span>
                <strong>94.2%</strong>
              </div>
              <div className="metricItem">
                <span>审计通过率</span>
                <strong>99.1%</strong>
              </div>
              <div className="metricItem dark">
                <span>质检得分</span>
                <strong>98.5%</strong>
              </div>
              <div className="metricItem">
                <span>待审核</span>
                <strong>{pendingReviewCount}</strong>
              </div>
            </section>

            <section className="stageLine">
              {selected.stages.map((stage, index) => (
                <div
                  className={stage.status === "CURRENT" ? "stage current" : stage.status === "DONE" ? "stage done" : "stage"}
                  data-step={index + 1}
                  key={stage.id}
                >
                  {stageCopy[stage.type]?.title ?? stage.type}
                </div>
              ))}
            </section>

            <section className="roleGrid opsGrid">
              <article className="rolePanel">
                <div className="panelHead">
                  <span>运营可见信息</span>
                  <small>v2.1</small>
                </div>
                <div className="panelBody">
                  <div className="infoGrid">
                    <div className="infoRow">
                      <span>项目</span>
                      <strong>{selected.code} {selected.name}</strong>
                    </div>
                    <div className="infoRow">
                      <span>客户组织</span>
                      <strong>{selected.companyName ?? "-"} / {selected.departmentName ?? "-"}</strong>
                    </div>
                    <div className="infoRow">
                      <span>需求文档</span>
                      <strong className="linkText">{requirementDoc.current.fileName}</strong>
                    </div>
                    <div className="infoRow">
                      <span>数据名称</span>
                      <strong>{selected.datasets[0]?.name ?? "暂无数据"}</strong>
                    </div>
                    <div className="infoRow">
                      <span>数据量</span>
                      <strong>{selected.datasets.reduce((sum, d) => sum + (d.itemCount ?? 0), 0).toLocaleString()} 帧</strong>
                    </div>
                    <div className="infoRow">
                      <span>存储路径</span>
                      <strong>{selected.datasets[0]?.storagePath ?? "-"}</strong>
                    </div>
                    <div className="infoRow">
                      <span>权限范围</span>
                      <strong>负责项目全链路</strong>
                    </div>
                    <div className="infoRow">
                      <span>不可查看</span>
                      <strong className="dangerText">非负责项目敏感明细</strong>
                    </div>
                  </div>
                </div>
              </article>

              <article className="rolePanel">
                <div className="panelHead">
                  <span>Agent 交互与审核控制台</span>
                  <small>运营可授权</small>
                </div>
                <div className="terminalBox">
                  <p className="termSystem">[系统] 正在读取 {requirementDoc.current.fileName} 与 AC 验收口径...</p>
                  <p>[Agent] 已生成工具配置和质检脚本草案。</p>
                  <p>[运营] 检查样例预标注与阈值配置。</p>
                  <p className="termMuted">等待运营授权执行 Generate_QC_Script...</p>
                </div>
                <div className="commandLine">
                  <input placeholder="输入运营指令，例如：生成供应商分配建议..." />
                  <button>生成</button>
                </div>
              </article>

              <article className="rolePanel">
                <div className="panelHead">
                  <span>运营待审核动作</span>
                  <small>{pendingReviewCount} 待处理</small>
                </div>
                <div className="panelBody">
                  {currentActions.map((action) => (
                    <div className="queueItem" key={action.id}>
                      <strong>{agentActionLabel[action.actionType] ?? action.actionType}</strong>
                      <span className={action.status === "PREVIEW" ? "tag pending" : "tag blue"}>
                        {action.status === "PREVIEW" ? "待授权" : "已执行"}
                      </span>
                      <div className="queueMeta">
                        <span>目标：{action.actionType}</span>
                      </div>
                      {action.status === "PREVIEW" && (
                        <form action={authorizeAgentPreview} className="queueForm">
                          <input name="projectCode" type="hidden" value={selected.code} />
                          <input name="actionId" type="hidden" value={action.id} />
                          <button type="submit" className="authorizeBtn">授权执行</button>
                        </form>
                      )}
                    </div>
                  ))}
                  {currentActions.length === 0 && (
                    <div className="queueItem">
                      <strong>Assign_Supplier</strong>
                      <span className="tag pending">运营处理</span>
                      <div className="queueMeta">
                        <span>候选供应商 3 家</span>
                      </div>
                    </div>
                  )}
                </div>
              </article>

              <article className="rolePanel">
                <div className="panelHead">
                  <span>审计与质检</span>
                  <small>99.1%</small>
                </div>
                <div className="panelBody">
                  <div className="infoGrid">
                    <div className="infoRow">
                      <span>质量得分</span>
                      <strong>98.5%</strong>
                    </div>
                    <div className="infoRow">
                      <span>缺陷类型</span>
                      <strong>漏标 / 错标 / 框偏移</strong>
                    </div>
                    <div className="infoRow">
                      <span>当前动作</span>
                      <strong>审核工具配置</strong>
                    </div>
                  </div>
                  <div className="previewStrip">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                  {selected.currentStage === "审核" && toolConfig?.status !== "APPROVED" && (
                    <form action={approveToolReview} className="decision">
                      <input name="projectCode" type="hidden" value={selected.code} />
                      <button type="button">拒绝</button>
                      <button type="submit" className="approveBtn">批准</button>
                    </form>
                  )}
                </div>
              </article>
            </section>

            <section className="wideRow">
              <article className="rolePanel">
                <div className="panelHead">
                  <span>权限提醒</span>
                </div>
                <div className="panelBody">
                  <div className="queueItem">
                    <strong>运营只能查看负责项目</strong>
                    <span className="tag">已限制</span>
                  </div>
                  <div className="queueItem">
                    <strong>供应商执行必须运营分配</strong>
                    <span className="tag pending">强规则</span>
                  </div>
                </div>
              </article>

              <article className="rolePanel">
                <div className="panelHead">
                  <span>操作日志</span>
                </div>
                <div className="panelBody">
                  <div className="timeline">
                    {selected.operationLogs.slice().reverse().map((log) => (
                      <div className="timelineItem" key={log.id}>
                        <i className="dot"></i>
                        <div>
                          <span>{formatDate(log.createdAt)} · {log.actorRole}</span>
                          <strong>{log.action}：{log.detail}</strong>
                        </div>
                      </div>
                    ))}
                    {selected.operationLogs.length === 0 && (
                      <div className="timelineItem">
                        <i className="dot"></i>
                        <div>
                          <span>刚刚</span>
                          <strong>项目创建完成，等待运营分配</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
