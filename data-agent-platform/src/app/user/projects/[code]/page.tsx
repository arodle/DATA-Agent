import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

const stageCopy: Record<string, { title: string; desc: string }> = {
  创建: { title: "创建需求", desc: "需求澄清、数据上传、训练目标" },
  审核: { title: "确认方案", desc: "确认 Agent 生成的方案和配置" },
  执行: { title: "执行中", desc: "用户自执行、Agent 工具或供应商执行" },
  验收: { title: "验收", desc: "质检、返修、交付确认、训练复盘" },
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

const tabs = [
  { key: "overview", label: "概览" },
  { key: "agent", label: "当前项目agent" },
  { key: "data", label: "数据资产" },
  { key: "docs", label: "需求文档" },
  { key: "execution", label: "执行记录" },
  { key: "acceptance", label: "验收" },
];

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

function formatDateTime(date?: Date | null) {
  if (!date) return "-";
  const d = new Date(date);
  return `${d.getMonth() + 1}-${d.getDate().toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
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
    status: String(record.documentReviewStatus ?? "待确认"),
  };
}

type PageProps = {
  params: Promise<{ code: string }>;
};

export default async function ProjectDetailPage({ params }: PageProps) {
  const { code } = await params;

  const project = await prisma.project.findFirst({
    where: { code },
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
        include: { messages: { orderBy: { createdAt: "asc" }, take: 12 }, actions: { orderBy: { createdAt: "asc" } } },
      },
      operationLogs: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!project) {
    notFound();
  }

  const selectedModel = project.modelBindings[0]?.model.name ?? "暂未绑定模型";
  const currentSession = project.agentSessions[0];
  const currentMessages = currentSession?.messages ?? [];
  const currentActions = currentSession?.actions ?? [];
  const requirementDoc = getRequirementDocument(project.requirement?.agentStructuredJson, project.requirement?.rawDocumentUrl);

  const progressPercent = project.stages.length
    ? Math.round((project.stages.filter((s) => s.status === "DONE").length / project.stages.length) * 100)
    : 0;

  const pendingCount = currentActions.filter((a) => a.status === "PREVIEW").length;
  const totalData = project.datasets.reduce((sum, d) => sum + (d.itemCount ?? 0), 0);

  return (
    <>
      <div className="detailHeader">
        <div className="detailHeaderMain">
          <p className="detailBreadcrumb">
            <Link href="/user/annotation" className="linkText">标注任务</Link>
            <span className="crumbSep">/</span>
            <span className="crumbCode">{project.code}</span>
          </p>
          <div className="detailTitleRow">
            <h1 className="detailTitle">{project.name}</h1>
            <span className="detailStatus statusGreen">{statusLabel[project.executionStatus] ?? project.executionStatus}</span>
          </div>
          <p className="detailSubtitle">
            项目编号：{project.code} · 创建人：{project.creator?.name ?? "-"} · 更新于 {formatDateTime(project.updatedAt)}
          </p>
        </div>
        <div className="detailHeaderActions">
          <Link href="/user/annotation" className="outlineBtn">← 返回列表</Link>
          <button className="outlineBtn">分享</button>
          <button className="primaryBtn">继续编辑</button>
        </div>
      </div>

      <div className="detailMetrics">
        <div className="metricCard">
          <div className="metricLabel">项目进度</div>
          <div className="metricValue">{progressPercent}<span className="metricUnit">%</span></div>
          <div className="metricProgressBar">
            <div className="metricProgressFill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
        <div className="metricCard">
          <div className="metricLabel">数据量</div>
          <div className="metricValue">{totalData.toLocaleString()}<span className="metricUnit">条</span></div>
          <div className="metricHint">{project.datasets.length} 个数据集</div>
        </div>
        <div className="metricCard">
          <div className="metricLabel">当前阶段</div>
          <div className="metricValue dark">{project.currentStage ?? "-"}</div>
          <div className="metricHint">{selectedModel}</div>
        </div>
        <div className="metricCard">
          <div className="metricLabel">待我确认</div>
          <div className="metricValue warning">{pendingCount}</div>
          <div className="metricHint">待处理事项</div>
        </div>
      </div>

      <div className="detailStageLine">
        {project.stages.map((stage, index) => (
          <div
            className={stage.status === "CURRENT" ? "stageItem current" : stage.status === "DONE" ? "stageItem done" : "stageItem"}
            key={stage.id}
          >
            <div className="stageDot">
              <span className="stageStep">{index + 1}</span>
            </div>
            <div className="stageContent">
              <div className="stageTitle">{stageCopy[stage.type]?.title ?? stage.type}</div>
              <div className="stageDesc">{stageCopy[stage.type]?.desc ?? ""}</div>
            </div>
            {index < project.stages.length - 1 && <div className="stageConnector"></div>}
          </div>
        ))}
      </div>

      <div className="detailTabs">
        {tabs.map((tab, index) => (
          <button key={tab.key} className={index === 0 ? "detailTab active" : "detailTab"}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="detailContent">
        <div className="detailGrid">
          <div className="detailMain">
            <div className="card">
              <div className="cardHeader">
                <h3 className="cardTitle">项目信息</h3>
                <span className="cardTag">基础信息</span>
              </div>
              <div className="cardBody">
                <div className="infoGrid2">
                  <div className="infoItem">
                    <span className="infoLabel">项目名称</span>
                    <span className="infoValue">{project.name}</span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">项目编号</span>
                    <span className="infoValue mono">{project.code}</span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">所属组织</span>
                    <span className="infoValue">{project.companyName ?? "AutoLab"}</span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">所属部门</span>
                    <span className="infoValue">{project.departmentName ?? "感知算法组"}</span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">创建人</span>
                    <span className="infoValue">{project.creator?.name ?? "-"}</span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">运营负责人</span>
                    <span className="infoValue">{project.operator?.name ?? "待分配"}</span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">创建时间</span>
                    <span className="infoValue">{formatDate(project.createdAt)}</span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">更新时间</span>
                    <span className="infoValue">{formatDate(project.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="cardHeader">
                <h3 className="cardTitle">我的 Agent 助手</h3>
                <span className="cardTag green">生成预览</span>
              </div>
              <div className="cardBody noPadding">
                <div className="terminalBox">
                  <p className="termSystem">[系统] 已绑定当前用户和数据资产。</p>
                  {currentMessages.length > 0 ? (
                    currentMessages.map((message) => (
                      <p key={message.id} className={message.role === "USER" ? "termUser" : "termAgent"}>
                        [{message.role === "USER" ? "用户" : "Agent"}] {message.content}
                      </p>
                    ))
                  ) : (
                    <>
                      <p className="termUser">[用户] 我想做车辆拉框，先看看可行方案。</p>
                      <p className="termAgent">[Agent] 已生成需求文档摘要、验收口径和工具配置预览。</p>
                      <p className="termMuted">用户确认前不会进入正式执行。</p>
                    </>
                  )}
                </div>
                <div className="commandLine">
                  <input placeholder="告诉 Agent 你的目标，例如：帮我生成一版需求文档..." />
                  <button>预览</button>
                </div>
              </div>
            </div>
          </div>

          <div className="detailSide">
            <div className="card">
              <div className="cardHeader">
                <h3 className="cardTitle">待确认事项</h3>
                <span className="cardTag warning">{pendingCount} 项</span>
              </div>
              <div className="cardBody">
                <div className="todoList">
                  <div className="todoItem">
                    <div className="todoContent">
                      <div className="todoTitle">需求文档 {requirementDoc.current.version}</div>
                      <div className="todoDesc">结构化摘要 + AC 验收口径</div>
                    </div>
                    <span className="statusBadge pending">待确认</span>
                  </div>
                  <div className="todoItem">
                    <div className="todoContent">
                      <div className="todoTitle">开源模型预标注</div>
                      <div className="todoDesc">可自执行，无需供应商</div>
                    </div>
                    <span className="statusBadge blue">可自执行</span>
                  </div>
                  <div className="todoItem">
                    <div className="todoContent">
                      <div className="todoTitle">供应商执行</div>
                      <div className="todoDesc">需运营分配</div>
                    </div>
                    <span className="statusBadge red">需分配</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="cardHeader">
                <h3 className="cardTitle">需求文档</h3>
                <span className="cardTag">{requirementDoc.current.version}</span>
              </div>
              <div className="cardBody">
                <div className="docItem">
                  <div className="docIcon">📄</div>
                  <div className="docInfo">
                    <div className="docName">{requirementDoc.current.fileName}</div>
                    <div className="docMeta">{requirementDoc.status} · {requirementDoc.current.author}</div>
                  </div>
                </div>
                <button className="blockBtn">查看文档详情</button>
              </div>
            </div>

            <div className="card">
              <div className="cardHeader">
                <h3 className="cardTitle">操作动态</h3>
                <Link href="#" className="linkText small">全部</Link>
              </div>
              <div className="cardBody">
                <div className="activityList">
                  {project.operationLogs.slice(0, 5).map((log) => (
                    <div className="activityItem" key={log.id}>
                      <div className="activityDot"></div>
                      <div className="activityContent">
                        <div className="activityText">
                          <strong>{log.actorRole}</strong> {log.action}
                        </div>
                        <div className="activityTime">{formatDateTime(log.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                  {project.operationLogs.length === 0 && (
                    <div className="activityItem">
                      <div className="activityDot"></div>
                      <div className="activityContent">
                        <div className="activityText">项目已创建</div>
                        <div className="activityTime">刚刚</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
