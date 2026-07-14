import Link from "next/link";
import { prisma } from "@/lib/prisma";

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

function formatDate(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "-";
}

export default async function OperatorWorkbench() {
  let projects: any[] = [];
  try {
    projects = await prisma.project.findMany({
      orderBy: { code: "asc" },
      include: {
        creator: true,
        operator: true,
        stages: { orderBy: { sortOrder: "asc" } },
        datasets: { orderBy: { createdAt: "asc" } },
        toolConfigs: { orderBy: { createdAt: "desc" }, take: 1 },
        agentSessions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { actions: { orderBy: { createdAt: "asc" } } },
        },
        operationLogs: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
  } catch (e) {
    console.error("Database error:", e);
  }

  const activeProjects = projects.filter(
    (p: any) => !["COMPLETED", "CANCELLED"].includes(p.executionStatus)
  );
  const pendingReviewProjects = projects.filter(
    (p: any) => p.executionStatus === "PENDING_REVIEW"
  );
  const totalDataItems = projects.reduce(
    (sum: any, p: any) => sum + p.datasets.reduce((s: any, d: any) => s + (d.itemCount ?? 0), 0),
    0
  );

  const recentLogs = projects
    .flatMap((p: any) => p.operationLogs.map((log: any) => ({ log, project: p })))
    .sort((a: any, b: any) => b.log.createdAt.getTime() - a.log.createdAt.getTime())
    .slice(0, 8);

  const pendingActions = projects.flatMap((p: any) =>
    (p.agentSessions[0]?.actions ?? [])
      .filter((a: any) => a.status === "PREVIEW")
      .map((a: any) => ({ action: a, project: p }))
  );

  return (
    <div className="opWorkbench">
      <div className="opBanner">
        <div className="opBannerIcon">🔧</div>
        <div className="opBannerInfo">
          <strong>运营管理工作台</strong>
          <p>项目审核 · 供应商分配 · 质量监控 · 全链路管理</p>
        </div>
        <div className="opBannerStats">
          <div>
            <strong>{activeProjects.length}</strong>
            <span>进行中项目</span>
          </div>
          <div>
            <strong className="warn">{pendingActions.length}</strong>
            <span>待授权动作</span>
          </div>
          <div>
            <strong>{projects.length}</strong>
            <span>总项目数</span>
          </div>
        </div>
      </div>

      <div className="workspaceStats">
        <div className="statCard">
          <span className="statIcon">📋</span>
          <div>
            <strong>{pendingReviewProjects.length}</strong>
            <span>待审核项目</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">✅</span>
          <div>
            <strong>12</strong>
            <span>待处理审核任务</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">📊</span>
          <div>
            <strong>98.5%</strong>
            <span>平均质检得分</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">🏭</span>
          <div>
            <strong>8</strong>
            <span>合作供应商</span>
          </div>
        </div>
      </div>

      <div className="opMainRow">
        <div className="opMainLeft">
          <div className="card">
            <div className="cardHeader">
              <h3 className="cardTitle">进行中的项目</h3>
              <Link href="/operator/projects" className="linkBtn">查看全部 →</Link>
            </div>
            <div className="cardBody noPadding">
              <div className="projectTable">
                <div className="tableHeadRow">
                  <div></div>
                  <div>项目编号</div>
                  <div>项目名称</div>
                  <div>状态</div>
                  <div>数据量</div>
                  <div>当前阶段</div>
                  <div>运营负责人</div>
                  <div>创建时间</div>
                  <div>操作</div>
                </div>
                {activeProjects.slice(0, 6).map((p: any, i) => (
                  <div className="tableDataRow" key={p.id}>
                    <div className="col-check">{i + 1}</div>
                    <div className="projectCode mono">{p.code}</div>
                    <div>
                      <Link href={`/operator/projects/${p.code}`} className="projectNameLink">
                        {p.name}
                      </Link>
                    </div>
                    <div>
                      <span
                        className="detailStatus"
                        style={{
                          background: (statusColor[p.executionStatus] ?? "#9aa7b5") + "20",
                          color: statusColor[p.executionStatus] ?? "#9aa7b5",
                        }}
                      >
                        {statusLabel[p.executionStatus] ?? p.executionStatus}
                      </span>
                    </div>
                    <div>{p.datasets.reduce((s: any, d: any) => s + (d.itemCount ?? 0), 0).toLocaleString()}</div>
                    <div>{p.currentStage ?? "-"}</div>
                    <div>{p.operator?.name ?? p.operator?.email ?? "-"}</div>
                    <div className="mono">{formatDate(p.createdAt)}</div>
                    <div>
                      <Link href={`/operator/projects/${p.code}`} className="linkBtn">详情</Link>
                    </div>
                  </div>
                ))}
                {activeProjects.length === 0 && (
                  <div className="tableDataRow" style={{ justifyContent: "center", color: "#9aa7b5" }}>
                    暂无进行中的项目
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: "14px" }}>
            <div className="cardHeader">
              <h3 className="cardTitle">待授权 Agent 动作</h3>
              <span className="cardTag warning">{pendingActions.length} 待处理</span>
            </div>
            <div className="cardBody">
              {pendingActions.length > 0 ? (
                <div className="todoList">
                  {pendingActions.map(({ action, project }) => (
                    <div className="todoItem" key={action.id}>
                      <div className="todoContent">
                        <div className="todoTitle">{project.code} · {project.name}</div>
                        <div className="todoDesc">
                          动作类型：{action.actionType} · 状态：待授权
                        </div>
                      </div>
                      <span className="statusBadge pending">待授权</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="emptyState">暂无待授权动作</div>
              )}
            </div>
          </div>
        </div>

        <div className="opMainRight">
          <div className="card">
            <div className="cardHeader">
              <h3 className="cardTitle">待我审核</h3>
              <span className="cardTag warning">12</span>
            </div>
            <div className="cardBody">
              <div className="todoList">
                <div className="todoItem">
                  <div className="todoContent">
                    <div className="todoTitle">PRJ-001 工具配置审核</div>
                    <div className="todoDesc">2D框标注工具配置待审批</div>
                  </div>
                  <span className="statusBadge pending">待审核</span>
                </div>
                <div className="todoItem">
                  <div className="todoContent">
                    <div className="todoTitle">PRJ-002 需求文档审核</div>
                    <div className="todoDesc">V2.0 需求文档变更待确认</div>
                  </div>
                  <span className="statusBadge pending">待审核</span>
                </div>
                <div className="todoItem">
                  <div className="todoContent">
                    <div className="todoTitle">PRJ-003 验收报告审核</div>
                    <div className="todoDesc">第一批次标注数据验收</div>
                  </div>
                  <span className="statusBadge blue">验收中</span>
                </div>
                <div className="todoItem">
                  <div className="todoContent">
                    <div className="todoTitle">PRJ-004 供应商分配</div>
                    <div className="todoDesc">3家候选供应商待分配</div>
                  </div>
                  <span className="statusBadge pending">待分配</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: "14px" }}>
            <div className="cardHeader">
              <h3 className="cardTitle">最近操作</h3>
              <Link href="/operator/logs" className="linkBtn">全部 →</Link>
            </div>
            <div className="cardBody">
              <div className="activityList">
                {recentLogs.map(({ log, project }) => (
                  <div className="activityItem" key={log.id}>
                    <div className="activityDot" />
                    <div className="activityContent">
                      <div className="activityText">
                        <strong>{project.code}</strong> {log.action}：{log.detail}
                      </div>
                      <div className="activityTime">
                        {formatDate(log.createdAt)} · {log.actorRole}
                      </div>
                    </div>
                  </div>
                ))}
                {recentLogs.length === 0 && (
                  <div className="emptyState">暂无操作记录</div>
                )}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: "14px" }}>
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
                <span>缺陷类型</span>
                <strong>漏标 / 错标 / 框偏移</strong>
              </div>
              <div className="opQualityRow">
                <span>未解决事件</span>
                <strong className="warn">3</strong>
              </div>
              <div className="opQualityRow">
                <span>本月已解决</span>
                <strong>44</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
