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

const tabs = [
  { key: "info", label: "项目信息" },
  { key: "agent", label: "Agent交互" },
  { key: "tool", label: "工具配置" },
  { key: "logs", label: "操作日志" },
];

function formatDate(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "-";
}

function formatDateTime(date?: Date | null) {
  if (!date) return "-";
  const d = new Date(date);
  return `${d.getMonth() + 1}-${d.getDate().toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getMetric(value: unknown, keys: string[]): string | null {
  const record = toRecord(value);
  for (const key of keys) {
    if (record[key] != null && record[key] !== "") {
      return String(record[key]);
    }
  }
  return null;
}

type PageProps = {
  params: Promise<{ code: string }>;
};

export default async function OperatorProjectDetailPage({ params }: PageProps) {
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
      toolConfigs: { orderBy: { createdAt: "desc" } },
      agentSessions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          messages: { orderBy: { createdAt: "asc" }, take: 20 },
          actions: { orderBy: { createdAt: "asc" } },
        },
      },
      operationLogs: { orderBy: { createdAt: "desc" }, take: 20 },
      modelBindings: { include: { model: true } },
      trainingRuns: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!project) {
    notFound();
  }

  const currentSession = project.agentSessions[0];
  const currentMessages = currentSession?.messages ?? [];
  const currentActions = currentSession?.actions ?? [];
  const currentToolConfig = project.toolConfigs[0];
  const currentTrainingRun = project.trainingRuns[0];

  const totalData = project.datasets.reduce((sum, d) => sum + (d.itemCount ?? 0), 0);
  const progressPercent = project.stages.length
    ? Math.round(
        (project.stages.filter((s) => s.status === "DONE").length /
          project.stages.length) *
          100
      )
    : 0;

  const trainingAccuracy =
    getMetric(currentTrainingRun?.metricsJson, ["accuracy", "acc", "val_accuracy"]) ??
    "-";

  const statusColorValue = statusColor[project.executionStatus] ?? "#9aa7b5";
  const requirementDocName = project.requirement?.rawDocumentUrl?.split("/").pop() ?? "default-requirement-v1.pdf";

  return (
    <>
      <div className="detailHeader">
        <div className="detailHeaderMain">
          <p className="detailBreadcrumb">
            <Link href="/operator" className="linkText">运营工作台</Link>
            <span className="crumbSep">/</span>
            <Link href="/operator/projects" className="linkText">项目管理</Link>
            <span className="crumbSep">/</span>
            <span className="crumbCode">{project.code}</span>
          </p>
          <div className="detailTitleRow">
            <h1 className="detailTitle">{project.name}</h1>
            <span
              className="detailStatus"
              style={{ background: statusColorValue + "20", color: statusColorValue }}
            >
              {statusLabel[project.executionStatus] ?? project.executionStatus}
            </span>
          </div>
          <p className="detailSubtitle">
            项目编号：{project.code} · 创建人：{project.creator?.name ?? "-"} · 更新于 {formatDateTime(project.updatedAt)}
          </p>
        </div>
        <div className="detailHeaderActions">
          <Link href="/operator/projects" className="outlineBtn">← 返回列表</Link>
          <button className="outlineBtn">编辑</button>
          <button className="outlineBtn">分配供应商</button>
        </div>
      </div>

      <div className="detailMetrics">
        <div className="metricCard">
          <div className="metricLabel">数据总量</div>
          <div className="metricValue dark">
            {totalData.toLocaleString()}<span className="metricUnit">条</span>
          </div>
          <div className="metricHint">{project.datasets.length} 个数据集</div>
        </div>
        <div className="metricCard">
          <div className="metricLabel">标注进度</div>
          <div className="metricValue">{progressPercent}<span className="metricUnit">%</span></div>
          <div className="metricProgressBar">
            <div className="metricProgressFill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
        <div className="metricCard">
          <div className="metricLabel">质量得分</div>
          <div className="metricValue">98.5<span className="metricUnit">%</span></div>
          <div className="metricHint">质检通过率 99.1%</div>
        </div>
        <div className="metricCard">
          <div className="metricLabel">训练准确率</div>
          <div className="metricValue dark">{trainingAccuracy}</div>
          <div className="metricHint">
            {currentTrainingRun ? currentTrainingRun.runName : "暂无训练记录"}
          </div>
        </div>
      </div>

      <div className="detailStageLine">
        {project.stages.map((stage, index) => (
          <div
            className={
              stage.status === "CURRENT"
                ? "stageItem current"
                : stage.status === "DONE"
                ? "stageItem done"
                : "stageItem"
            }
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
        {project.stages.length === 0 && (
          <div className="stageItem">
            <div className="stageDot">
              <span className="stageStep">1</span>
            </div>
            <div className="stageContent">
              <div className="stageTitle">{project.currentStage ?? "创建"}</div>
              <div className="stageDesc">尚未生成阶段计划</div>
            </div>
          </div>
        )}
      </div>

      <div className="detailTabs">
        {tabs.map((tab, index) => (
          <button
            key={tab.key}
            className={index === 0 ? "detailTab active" : "detailTab"}
          >
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
                    <span className="infoLabel">项目编号</span>
                    <span className="infoValue mono">{project.code}</span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">项目名称</span>
                    <span className="infoValue">{project.name}</span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">客户组织</span>
                    <span className="infoValue">{project.companyName ?? "-"}</span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">需求文档</span>
                    <span className="infoValue">{requirementDocName}</span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">数据名称</span>
                    <span className="infoValue">
                      {project.datasets[0]?.name ?? "-"}
                    </span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">数据量</span>
                    <span className="infoValue">{totalData.toLocaleString()} 条</span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">存储路径</span>
                    <span className="infoValue mono">
                      {project.datasets[0]?.storagePath ?? "-"}
                    </span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">当前阶段</span>
                    <span className="infoValue">{project.currentStage ?? "-"}</span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">运营负责人</span>
                    <span className="infoValue">
                      {project.operator?.name ?? project.operator?.email ?? "待分配"}
                    </span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">创建时间</span>
                    <span className="infoValue">{formatDate(project.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="cardHeader">
                <h3 className="cardTitle">Agent交互</h3>
                <span className="cardTag green">
                  {currentSession ? currentSession.title ?? "会话" : "无会话"}
                </span>
              </div>
              <div className="cardBody noPadding">
                <div className="chatBox">
                  {currentMessages.length > 0 ? (
                    currentMessages.map((message) => {
                      const isUser = message.role === "USER";
                      return (
                        <div
                          key={message.id}
                          className={
                            isUser ? "chatMessage user" : "chatMessage agent"
                          }
                        >
                          <div className="chatAvatar">{isUser ? "👤" : "🤖"}</div>
                          <div className="chatBubble">
                            <p>{message.content}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="chatMessage agent">
                      <div className="chatAvatar">🤖</div>
                      <div className="chatBubble">
                        <p>暂无 Agent 交互记录。</p>
                      </div>
                    </div>
                  )}
                </div>
                {currentActions.length > 0 && (
                  <div style={{ padding: "16px 18px", borderTop: "1px solid #edf1f5" }}>
                    <div className="cardTitle" style={{ marginBottom: "12px", fontSize: "13px" }}>
                      Agent 执行动作
                    </div>
                    <div className="todoList">
                      {currentActions.map((action) => (
                        <div className="todoItem" key={action.id}>
                          <div className="todoContent">
                            <div className="todoTitle">{action.actionType}</div>
                            <div className="todoDesc">
                              {action.targetEntity ?? "目标对象"} · 状态：{action.status}
                            </div>
                          </div>
                          <span
                            className={
                              action.status === "PREVIEW"
                                ? "statusBadge pending"
                                : action.status === "AUTHORIZED"
                                ? "statusBadge blue"
                                : "statusBadge"
                            }
                          >
                            {action.status === "PREVIEW"
                              ? "待授权"
                              : action.status === "AUTHORIZED"
                              ? "已授权"
                              : action.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="cardHeader">
                <h3 className="cardTitle">工具配置</h3>
                <span className="cardTag">
                  {currentToolConfig ? currentToolConfig.status : "未配置"}
                </span>
              </div>
              <div className="cardBody">
                {currentToolConfig ? (
                  <>
                    <div className="infoGrid2">
                      <div className="infoItem">
                        <span className="infoLabel">配置名称</span>
                        <span className="infoValue">{currentToolConfig.name}</span>
                      </div>
                      <div className="infoItem">
                        <span className="infoLabel">配置状态</span>
                        <span className="infoValue">{currentToolConfig.status}</span>
                      </div>
                      <div className="infoItem">
                        <span className="infoLabel">创建时间</span>
                        <span className="infoValue">{formatDate(currentToolConfig.createdAt)}</span>
                      </div>
                      <div className="infoItem">
                        <span className="infoLabel">更新时间</span>
                        <span className="infoValue">{formatDate(currentToolConfig.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="reviewActions" style={{ marginTop: "16px" }}>
                      <button className="outlineBtn" style={{ marginRight: "10px" }}>
                        驳回
                      </button>
                      <button className="primaryBtn">审核通过</button>
                    </div>
                  </>
                ) : (
                  <div className="emptyState">暂无工具配置</div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="cardHeader">
                <h3 className="cardTitle">操作日志</h3>
                <span className="cardTag">{project.operationLogs.length} 条</span>
              </div>
              <div className="cardBody">
                <div className="activityList">
                  {project.operationLogs.map((log) => (
                    <div className="activityItem" key={log.id}>
                      <div className="activityDot"></div>
                      <div className="activityContent">
                        <div className="activityText">
                          <strong>{log.actorRole}</strong> {log.action}
                          {log.detail ? `：${log.detail}` : ""}
                        </div>
                        <div className="activityTime">{formatDateTime(log.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                  {project.operationLogs.length === 0 && (
                    <div className="emptyState">暂无操作记录</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="detailSide">
            <div className="card">
              <div className="cardHeader">
                <h3 className="cardTitle">项目状态</h3>
              </div>
              <div className="cardBody">
                <div className="infoGrid2">
                  <div className="infoItem">
                    <span className="infoLabel">执行状态</span>
                    <span
                      className="detailStatus"
                      style={{
                        background: statusColorValue + "20",
                        color: statusColorValue,
                      }}
                    >
                      {statusLabel[project.executionStatus] ?? project.executionStatus}
                    </span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">当前阶段</span>
                    <span className="infoValue">{project.currentStage ?? "-"}</span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">项目模式</span>
                    <span className="infoValue">{project.mode}</span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">优先级</span>
                    <span className="infoValue">{project.priority ?? "-"}</span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">开始时间</span>
                    <span className="infoValue">{formatDate(project.startDate)}</span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">预计完成</span>
                    <span className="infoValue">{formatDate(project.expectedEndDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="cardHeader">
                <h3 className="cardTitle">运营权限</h3>
              </div>
              <div className="cardBody">
                <div className="infoGrid2">
                  <div className="infoItem">
                    <span className="infoLabel">运营负责人</span>
                    <span className="infoValue">
                      {project.operator?.name ?? "待分配"}
                    </span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">创建人</span>
                    <span className="infoValue">{project.creator?.name ?? "-"}</span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">运营状态</span>
                    <span className="infoValue">{project.operationStatus}</span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">当前风险</span>
                    <span className="infoValue">{project.currentRisk ?? "无"}</span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">下一步动作</span>
                    <span className="infoValue">{project.nextAction ?? "-"}</span>
                  </div>
                  <div className="infoItem">
                    <span className="infoLabel">任务数</span>
                    <span className="infoValue">{project.tasks.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="cardHeader">
                <h3 className="cardTitle">质量概览</h3>
                <span className="cardTag green">98.5%</span>
              </div>
              <div className="cardBody">
                <div className="opQualityRow">
                  <span>质检通过率</span>
                  <strong>99.1%</strong>
                </div>
                <div className="opQualityRow">
                  <span>平均质量得分</span>
                  <strong>98.5%</strong>
                </div>
                <div className="opQualityRow">
                  <span>数据集数量</span>
                  <strong>{project.datasets.length}</strong>
                </div>
                <div className="opQualityRow">
                  <span>任务数量</span>
                  <strong>{project.tasks.length}</strong>
                </div>
                <div className="opQualityRow">
                  <span>模型绑定</span>
                  <strong>{project.modelBindings.length}</strong>
                </div>
                <div className="opQualityRow">
                  <span>训练记录</span>
                  <strong>{project.trainingRuns.length}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
