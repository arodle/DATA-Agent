import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AgentMonitorPage() {
  const [
    traceTotal, traceSuccess, traceFailed, tracePartial, traceRunning,
    execTotal,
    totalTokensResult, totalDurationResult,
    traces,
    sessions,
    actions,
    failedTraces,
  ] = await Promise.all([
    prisma.agentSessionTrace.count(),
    prisma.agentSessionTrace.count({ where: { status: "SUCCESS" } }),
    prisma.agentSessionTrace.count({ where: { status: "FAILED" } }),
    prisma.agentSessionTrace.count({ where: { status: "PARTIAL" } }),
    prisma.agentSessionTrace.count({ where: { status: "RUNNING" } }),
    prisma.agentNodeExecution.count(),
    prisma.agentSessionTrace.aggregate({ _sum: { totalTokens: true } }),
    prisma.agentSessionTrace.aggregate({ _sum: { durationMs: true } }),
    prisma.agentSessionTrace.findMany({
      take: 30,
      orderBy: { startedAt: "desc" },
    }),
    prisma.agentSession.findMany({
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: { user: true, _count: { select: { messages: true, actions: true } } },
    }),
    prisma.agentAction.findMany({ take: 10, orderBy: { createdAt: "desc" } }),
    prisma.agentSessionTrace.findMany({
      where: { status: "FAILED" },
      take: 5,
      orderBy: { startedAt: "desc" },
      include: { nodeSteps: { where: { status: "FAILED" }, take: 1 } },
    }),
  ]);

  const totalTokens = totalTokensResult._sum.totalTokens || 0;
  const totalDuration = totalDurationResult._sum.durationMs || 0;
  const successRate = traceTotal > 0 ? Math.round((traceSuccess / traceTotal) * 100) : 0;
  const avgDuration = traceTotal > 0 ? Math.round(totalDuration / traceTotal) : 0;

  return (
    <div className="agxPage">
      <div className="agxPageHeader">
        <h1>Agent Runtime 监控</h1>
        <p>完整执行链路、节点步骤、Token 消耗、错误追踪</p>
      </div>

      <div className="agxStatGrid agxStatGrid6">
        <div className="agxStat">
          <div className="agxStatLabel">总执行数</div>
          <div className="agxStatValue">{traceTotal}</div>
          <div className="agxStatSub">运行中 {traceRunning}</div>
        </div>
        <div className="agxStat">
          <div className="agxStatLabel">成功</div>
          <div className="agxStatValue good">{traceSuccess}</div>
          <div className="agxStatSub">成功率 {successRate}%</div>
        </div>
        <div className="agxStat">
          <div className="agxStatLabel">失败</div>
          <div className="agxStatValue err">{traceFailed}</div>
          <div className="agxStatSub">部分失败 {tracePartial}</div>
        </div>
        <div className="agxStat">
          <div className="agxStatLabel">节点执行</div>
          <div className="agxStatValue">{execTotal}</div>
          <div className="agxStatSub">总步骤数</div>
        </div>
        <div className="agxStat">
          <div className="agxStatLabel">总 Token</div>
          <div className="agxStatValue">{totalTokens.toLocaleString()}</div>
          <div className="agxStatSub">平均 {(totalTokens / Math.max(traceTotal, 1)).toFixed(0)} / 次</div>
        </div>
        <div className="agxStat">
          <div className="agxStatLabel">平均耗时</div>
          <div className="agxStatValue">{(avgDuration / 1000).toFixed(1)}s</div>
          <div className="agxStatSub">总耗时 {(totalDuration / 1000).toFixed(0)}s</div>
        </div>
      </div>

      {/* 失败追踪 */}
      {failedTraces.length > 0 && (
        <div className="agxCard" style={{ borderLeft: "4px solid #ef4444" }}>
          <div className="agxCardHeader">
            <h3>⚠ 最近失败执行</h3>
            <span className="agxStatus err">{failedTraces.length} 条</span>
          </div>
          <table className="agxTable">
            <thead>
              <tr>
                <th>问题</th>
                <th>Workflow</th>
                <th>失败节点</th>
                <th>错误信息</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              {failedTraces.map((t) => (
                <tr key={t.id}>
                  <td className="agxPrimary" style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.question}</td>
                  <td>{t.workflowName}</td>
                  <td>
                    {t.nodeSteps[0] && (
                      <span className="agxTag err">{t.nodeSteps[0].nodeName} ({t.nodeSteps[0].nodeType})</span>
                    )}
                  </td>
                  <td className="agxMuted" style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.errorMessage || t.nodeSteps[0]?.errorMessage || "-"}
                  </td>
                  <td className="agxMuted">{new Date(t.startedAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="agxCard">
        <div className="agxCardHeader">
          <h3>Runtime Trace 链路（最近 30 条）</h3>
          <Link className="agxLink" href="/operator/agent-console/test">去测试</Link>
        </div>
        <table className="agxTable">
          <thead>
            <tr>
              <th>问题</th>
              <th>Workflow</th>
              <th>版本</th>
              <th>状态</th>
              <th>节点数</th>
              <th>Token</th>
              <th>耗时</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            {traces.length === 0 ? (
              <tr><td colSpan={8} className="agxEmpty">暂无执行记录</td></tr>
            ) : traces.map((t) => (
              <tr key={t.id}>
                <td className="agxPrimary" style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.question}</td>
                <td>{t.workflowName}</td>
                <td className="agxMono">v{t.version}</td>
                <td>
                  <span className={`agxStatus ${t.status === "SUCCESS" ? "ok" : t.status === "FAILED" ? "err" : t.status === "RUNNING" ? "info" : "warn"}`}>
                    {t.status === "SUCCESS" ? "成功" : t.status === "FAILED" ? "失败" : t.status === "RUNNING" ? "运行中" : "部分"}
                  </span>
                </td>
                <td className="agxMuted">
                  <Link href={`/operator/agent-console/test?id=${t.workflowId}`}>查看</Link>
                </td>
                <td>{t.totalTokens.toLocaleString()}</td>
                <td>{(t.durationMs / 1000).toFixed(1)}s</td>
                <td className="agxMuted">{new Date(t.startedAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="agxRow">
        <div className="agxCard" style={{ flex: 1 }}>
          <div className="agxCardHeader">
            <h3>传统 Agent 会话</h3>
            <span className="agxMuted">AgentSession 兼容</span>
          </div>
          <table className="agxTable">
            <thead>
              <tr><th>用户</th><th>消息</th><th>Actions</th><th>更新时间</th></tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr><td colSpan={4} className="agxEmpty">暂无会话</td></tr>
              ) : sessions.map((s) => (
                <tr key={s.id}>
                  <td className="agxPrimary">{s.user?.name || "匿名"}</td>
                  <td>{s._count.messages}</td>
                  <td>{s._count.actions}</td>
                  <td className="agxMuted">{new Date(s.updatedAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="agxCard" style={{ flex: 1 }}>
          <div className="agxCardHeader">
            <h3>AgentAction 执行</h3>
            <span className="agxMuted">业务动作</span>
          </div>
          <table className="agxTable">
            <thead>
              <tr><th>类型</th><th>状态</th><th>目标</th><th>时间</th></tr>
            </thead>
            <tbody>
              {actions.length === 0 ? (
                <tr><td colSpan={4} className="agxEmpty">暂无 Action</td></tr>
              ) : actions.map((a) => (
                <tr key={a.id}>
                  <td className="agxPrimary">{a.actionType}</td>
                  <td><span className={`agxStatus ${a.status === "EXECUTED" ? "ok" : a.status === "FAILED" ? "err" : "warn"}`}>{a.status}</span></td>
                  <td className="agxMuted">{a.targetEntity || a.targetId?.substring(0, 8) || "-"}</td>
                  <td className="agxMuted">{new Date(a.createdAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
