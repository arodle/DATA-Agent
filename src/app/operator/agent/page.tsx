import { prisma } from "@/lib/prisma";

const actionTypeLabel: Record<string, string> = {
  STRUCTURE_REQUIREMENT: "结构化需求预览",
  GENERATE_TOOL_CONFIG: "生成工具配置",
  RUN_OPEN_SOURCE_PRELABEL: "开源模型预标注",
  GENERATE_QUALITY_SCRIPT: "生成质检脚本",
};

const permissionRules = [
  {
    action: "结构化需求预览",
    rule: "需运营授权后方可执行，仅生成预览不直接落库",
  },
  {
    action: "生成工具配置",
    rule: "需运营授权后保存为草稿，发布前需二次审核",
  },
  {
    action: "开源模型预标注",
    rule: "需运营授权后运行，结果仅作为预览不直接交付",
  },
  {
    action: "生成质检脚本",
    rule: "需运营授权后保存，执行前需运营确认脚本内容",
  },
];

function formatDate(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "-";
}

export const dynamic = "force-dynamic";

export default async function AgentManagementPage() {
  let projects: any[] = [];
  try {
    projects = await prisma.project.findMany({
      orderBy: { code: "asc" },
      include: {
        agentSessions: {
          orderBy: { createdAt: "desc" },
          include: {
            messages: { orderBy: { createdAt: "asc" } },
            actions: { orderBy: { createdAt: "asc" } },
          },
        },
      },
    });
  } catch (e) {
    console.error("Database error:", e);
  }

  const allActions = projects.flatMap((p: any) =>
    p.agentSessions.flatMap((s: any) =>
      s.actions.map((a: any) => ({ action: a, session: s, project: p }))
    )
  );

  const pendingActions = allActions.filter((x: any) => x.action.status === "PREVIEW");
  const authorizedActions = allActions.filter((x: any) =>
    ["AUTHORIZED", "EXECUTED", "DONE"].includes(x.action.status)
  );
  const rejectedActions = allActions.filter(
    (x: any) => x.action.status === "REJECTED"
  );
  const activeSessions = projects.flatMap((p: any) =>
    p.agentSessions.map((s: any) => ({ session: s, project: p }))
  );

  return (
    <div className="opWorkbench">
      <div className="agentBanner">
        <div className="agentBannerIcon">🤖</div>
        <div>
          <strong>Agent 运营管理</strong>
          <p>授权执行 · 任务编排 · 动作审计</p>
        </div>
      </div>

      <div className="workspaceStats">
        <div className="statCard">
          <span className="statIcon">💬</span>
          <div>
            <strong>{activeSessions.length}</strong>
            <span>活跃Agent会话</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">⏳</span>
          <div>
            <strong>{pendingActions.length}</strong>
            <span>待授权动作</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">✅</span>
          <div>
            <strong>{authorizedActions.length}</strong>
            <span>已执行动作</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">⚡</span>
          <div>
            <strong>1.2s</strong>
            <span>平均响应时间</span>
          </div>
        </div>
      </div>

      <div className="opMainRow">
        <div className="opMainLeft">
          <div className="card">
            <div className="cardHeader">
              <h3 className="cardTitle">Agent 动作队列</h3>
              <span className="cardTag warning">
                {pendingActions.length} 待授权
              </span>
            </div>
            <div className="cardBody">
              {pendingActions.length > 0 ? (
                pendingActions.map(({ action, project }) => (
                  <div className="agentQueueItem" key={action.id}>
                    <div className="agentQueueHead">
                      <strong>
                        {project.code} · {project.name}
                      </strong>
                      <span className="cardTag">
                        {actionTypeLabel[action.actionType] ?? action.actionType}
                      </span>
                    </div>
                    <div className="agentQueueDesc">
                      动作类型：
                      {actionTypeLabel[action.actionType] ?? action.actionType}
                      ，状态：待授权
                    </div>
                    <div className="agentQueueMeta">
                      <span>提交时间：{formatDate(action.createdAt)}</span>
                      <span>优先级：高</span>
                    </div>
                    <div className="agentQueueActions" style={{ marginTop: 10 }}>
                      <button className="reviewBtn primary">授权执行</button>
                      <button className="reviewBtn">查看详情</button>
                      <button className="reviewBtn danger">拒绝</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="emptyState">暂无待授权动作</div>
              )}
            </div>
          </div>
        </div>

        <div className="opMainRight">
          <div className="card">
            <div className="cardHeader">
              <h3 className="cardTitle">Agent会话概览</h3>
              <span className="cardTag">{activeSessions.length} 会话</span>
            </div>
            <div className="cardBody">
              {activeSessions.length > 0 ? (
                <div className="activityList">
                  {activeSessions.slice(0, 6).map(({ session, project }) => (
                    <div className="activityItem" key={session.id}>
                      <div className="activityDot" />
                      <div className="activityContent">
                        <div className="activityText">
                          <strong>{project.code}</strong>{" "}
                          {session.title ?? session.context}
                        </div>
                        <div className="activityTime">
                          {formatDate(session.createdAt)} · 消息{" "}
                          {session.messages.length} · 动作{" "}
                          {session.actions.length}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="emptyState">暂无Agent会话</div>
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: "14px" }}>
            <div className="cardHeader">
              <h3 className="cardTitle">动作统计</h3>
            </div>
            <div className="cardBody">
              <div className="opQualityRow">
                <span>已授权</span>
                <strong>{authorizedActions.length}</strong>
              </div>
              <div className="opQualityRow">
                <span>待授权</span>
                <strong className="warn">{pendingActions.length}</strong>
              </div>
              <div className="opQualityRow">
                <span>已拒绝</span>
                <strong>{rejectedActions.length}</strong>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: "14px" }}>
            <div className="cardHeader">
              <h3 className="cardTitle">权限规则</h3>
            </div>
            <div className="cardBody">
              {permissionRules.map((r) => (
                <div className="lineageDetailItem" key={r.action}>
                  <strong>{r.action}</strong>
                  <div style={{ color: "#697889", marginTop: 2 }}>{r.rule}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
