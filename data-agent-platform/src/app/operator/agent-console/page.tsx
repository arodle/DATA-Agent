import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    workflowTotal,
    workflowPublished,
    workflowTesting,
    nodeTotal,
    edgeTotal,
    versionTotal,
    traceTotal,
    traceToday,
    traceSuccess,
    traceFailed,
    execTotal,
    knowledgeTotal,
    knowledgePublished,
    knowledgePending,
    embeddingIndexed,
    relationTotal,
    testCaseTotal,
    testCasePassed,
    projectTotal,
    qualityEventTotal,
    supplierChatTotal,
    actionTotal,
  ] = await Promise.all([
    prisma.agentWorkflow.count(),
    prisma.agentWorkflow.count({ where: { status: "PUBLISHED" } }),
    prisma.agentWorkflow.count({ where: { status: "TESTING" } }),
    prisma.agentWorkflowNode.count(),
    prisma.agentWorkflowEdge.count(),
    prisma.agentVersion.count({ where: { status: "PUBLISHED" } }),
    prisma.agentSessionTrace.count(),
    prisma.agentSessionTrace.count({ where: { startedAt: { gte: todayStart } } }),
    prisma.agentSessionTrace.count({ where: { status: "SUCCESS" } }),
    prisma.agentSessionTrace.count({ where: { status: "FAILED" } }),
    prisma.agentNodeExecution.count(),
    prisma.knowledge.count(),
    prisma.knowledge.count({ where: { status: "PUBLISHED" } }),
    prisma.knowledge.count({ where: { status: "PENDING" } }),
    prisma.knowledgeEmbedding.count({ where: { embeddingStatus: "INDEXED" } }),
    prisma.knowledgeRelation.count(),
    prisma.agentTestCase.count(),
    prisma.agentTestCase.count({ where: { passed: true } }),
    prisma.project.count(),
    prisma.qualityEvent.count(),
    prisma.supplierChat.count(),
    prisma.agentAction.count(),
  ]);

  const traces = await prisma.agentSessionTrace.findMany({ take: 50 });
  const totalTokens = traces.reduce((s, t) => s + (t.totalTokens || 0), 0);
  const totalDuration = traces.reduce((s, t) => s + (t.durationMs || 0), 0);
  const avgDuration = traces.length > 0 ? Math.round(totalDuration / traces.length) : 0;
  const successRate = traceTotal > 0 ? Math.round((traceSuccess / traceTotal) * 100) : 0;

  return {
    workflowTotal, workflowPublished, workflowTesting,
    nodeTotal, edgeTotal, versionTotal,
    traceTotal, traceToday, traceSuccess, traceFailed, tracePartial: traceTotal - traceSuccess - traceFailed,
    execTotal, avgDuration, totalTokens, successRate,
    knowledgeTotal, knowledgePublished, knowledgePending, embeddingIndexed, relationTotal,
    testCaseTotal, testCasePassed,
    projectTotal, qualityEventTotal, supplierChatTotal, actionTotal,
  };
}

async function getRecentTraces() {
  return prisma.agentSessionTrace.findMany({
    take: 8,
    orderBy: { startedAt: "desc" },
  });
}

async function getRecentWorkflows() {
  return prisma.agentWorkflow.findMany({
    take: 5,
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { nodes: true, edges: true, versions: true } },
    },
  });
}

async function getNodeTypeStats() {
  const groups = await prisma.agentWorkflowNode.groupBy({
    by: ["nodeType"],
    _count: { nodeType: true },
  });
  return groups;
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    SUCCESS: { label: "成功", cls: "ok" },
    FAILED: { label: "失败", cls: "err" },
    PARTIAL: { label: "部分成功", cls: "warn" },
    RUNNING: { label: "运行中", cls: "info" },
  };
  const m = map[status] || { label: status, cls: "draft" };
  return <span className={`agxStatus ${m.cls}`}>{m.label}</span>;
}

const NODE_TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  INPUT: { label: "输入", icon: "▸", color: "#5b8def" },
  AGENT: { label: "Agent", icon: "◈", color: "#a06bff" },
  DATA: { label: "数据", icon: "▤", color: "#00b894" },
  KNOWLEDGE: { label: "知识", icon: "▦", color: "#f59e0b" },
  TOOL: { label: "工具", icon: "⚙", color: "#ef6b6b" },
  LLM: { label: "LLM", icon: "✧", color: "#ec4899" },
  CONDITION: { label: "条件", icon: "◇", color: "#94a3b8" },
  OUTPUT: { label: "输出", icon: "◀", color: "#10b981" },
};

export default async function AgentConsoleDashboard() {
  const [stats, recentTraces, recentWorkflows, nodeTypeStats] = await Promise.all([
    getStats(), getRecentTraces(), getRecentWorkflows(), getNodeTypeStats(),
  ]);

  const totalNodeInstances = nodeTypeStats.reduce((s, g) => s + g._count.nodeType, 0);

  return (
    <div className="agxPage">
      <div className="agxPageHeader">
        <h1>AI 数据标采 Agent Runtime</h1>
        <p>业务闭环：项目执行 → 质量事件 → 知识沉淀 → RAG → Workflow → Agent → DeepSeek → 业务反馈</p>
      </div>

      {/* 第一行：核心运行指标 */}
      <div className="agxStatGrid agxStatGrid6">
        <div className="agxStat">
          <div className="agxStatLabel">Agent Workflow</div>
          <div className="agxStatValue">{stats.workflowTotal}</div>
          <div className="agxStatSub">已发布 {stats.workflowPublished} · 测试中 {stats.workflowTesting}</div>
        </div>
        <div className="agxStat">
          <div className="agxStatLabel">Runtime 执行</div>
          <div className="agxStatValue good">{stats.traceTotal}</div>
          <div className="agxStatSub">今日 {stats.traceToday} · 节点执行 {stats.execTotal}</div>
        </div>
        <div className="agxStat">
          <div className="agxStatLabel">成功率</div>
          <div className={`agxStatValue ${stats.successRate >= 80 ? "good" : stats.successRate >= 50 ? "warn" : "err"}`}>
            {stats.successRate}%
          </div>
          <div className="agxStatSub">失败 {stats.traceFailed} · 部分 {stats.tracePartial}</div>
        </div>
        <div className="agxStat">
          <div className="agxStatLabel">平均响应</div>
          <div className="agxStatValue">{(stats.avgDuration / 1000).toFixed(1)}s</div>
          <div className="agxStatSub">总Token {stats.totalTokens.toLocaleString()}</div>
        </div>
        <div className="agxStat">
          <div className="agxStatLabel">知识资产</div>
          <div className="agxStatValue">{stats.knowledgeTotal}</div>
          <div className="agxStatSub">已发布 {stats.knowledgePublished} · 向量 {stats.embeddingIndexed}</div>
        </div>
        <div className="agxStat">
          <div className="agxStatLabel">业务规模</div>
          <div className="agxStatValue">{stats.projectTotal}</div>
          <div className="agxStatSub">质量事件 {stats.qualityEventTotal} · 供应商对话 {stats.supplierChatTotal}</div>
        </div>
      </div>

      {/* 业务闭环图 */}
      <div className="agxCard">
        <div className="agxCardHeader">
          <h3>业务闭环</h3>
          <span className="agxMuted">数据驱动 Agent 持续学习</span>
        </div>
        <div className="agxLoop">
          <div className="agxLoopStep">
            <div className="agxLoopIcon" style={{ background: "#5b8def" }}>📋</div>
            <div className="agxLoopName">项目执行</div>
            <div className="agxLoopCount">{stats.projectTotal} 项目</div>
          </div>
          <div className="agxLoopArrow">→</div>
          <div className="agxLoopStep">
            <div className="agxLoopIcon" style={{ background: "#ef6b6b" }}>⚠</div>
            <div className="agxLoopName">质量事件</div>
            <div className="agxLoopCount">{stats.qualityEventTotal} 事件</div>
          </div>
          <div className="agxLoopArrow">→</div>
          <div className="agxLoopStep">
            <div className="agxLoopIcon" style={{ background: "#a06bff" }}>📚</div>
            <div className="agxLoopName">知识沉淀</div>
            <div className="agxLoopCount">{stats.knowledgeTotal} 知识 / {stats.relationTotal} 关联</div>
          </div>
          <div className="agxLoopArrow">→</div>
          <div className="agxLoopStep">
            <div className="agxLoopIcon" style={{ background: "#f59e0b" }}>🔍</div>
            <div className="agxLoopName">RAG 检索</div>
            <div className="agxLoopCount">{stats.embeddingIndexed} 已索引</div>
          </div>
          <div className="agxLoopArrow">→</div>
          <div className="agxLoopStep">
            <div className="agxLoopIcon" style={{ background: "#ec4899" }}>⚡</div>
            <div className="agxLoopName">Workflow</div>
            <div className="agxLoopCount">{stats.workflowTotal} / {stats.versionTotal} 版本</div>
          </div>
          <div className="agxLoopArrow">→</div>
          <div className="agxLoopStep">
            <div className="agxLoopIcon" style={{ background: "#10b981" }}>🤖</div>
            <div className="agxLoopName">Agent</div>
            <div className="agxLoopCount">{stats.actionTotal} 执行</div>
          </div>
          <div className="agxLoopArrow">→</div>
          <div className="agxLoopStep">
            <div className="agxLoopIcon" style={{ background: "#06b6d4" }}>✨</div>
            <div className="agxLoopName">DeepSeek</div>
            <div className="agxLoopCount">{stats.totalTokens.toLocaleString()} tokens</div>
          </div>
          <div className="agxLoopArrow" style={{ background: "transparent" }}>↺</div>
        </div>
      </div>

      <div className="agxRow">
        {/* 节点类型分布 */}
        <div className="agxCard" style={{ flex: 1 }}>
          <div className="agxCardHeader">
            <h3>Workflow 节点类型分布</h3>
            <Link className="agxLink" href="/operator/agent-console/studio">Studio</Link>
          </div>
          <div className="agxNodeStats">
            {nodeTypeStats.length === 0 ? (
              <div className="agxEmpty">暂无节点数据</div>
            ) : (
              nodeTypeStats.map((g) => {
                const meta = NODE_TYPE_LABELS[g.nodeType] || { label: g.nodeType, icon: "○", color: "#94a3b8" };
                const pct = totalNodeInstances > 0 ? Math.round((g._count.nodeType / totalNodeInstances) * 100) : 0;
                return (
                  <div key={g.nodeType} className="agxNodeStatRow">
                    <div className="agxNodeStatIcon" style={{ background: meta.color }}>{meta.icon}</div>
                    <div className="agxNodeStatLabel">{meta.label}</div>
                    <div className="agxNodeStatBarWrap">
                      <div className="agxNodeStatBar" style={{ width: `${pct}%`, background: meta.color }}></div>
                    </div>
                    <div className="agxNodeStatValue">{g._count.nodeType}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 最近 Workflow */}
        <div className="agxCard" style={{ flex: 1 }}>
          <div className="agxCardHeader">
            <h3>最近 Workflow</h3>
            <Link className="agxLink" href="/operator/agent-console/test">测试</Link>
          </div>
          <table className="agxTable">
            <thead>
              <tr>
                <th>名称</th>
                <th>分类</th>
                <th>版本</th>
                <th>节点</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {recentWorkflows.length === 0 ? (
                <tr><td colSpan={5} className="agxEmpty">暂无 Workflow</td></tr>
              ) : recentWorkflows.map((w) => (
                <tr key={w.id}>
                  <td className="agxPrimary">
                    <Link href={`/operator/agent-console/studio?id=${w.id}`}>{w.name}</Link>
                  </td>
                  <td><span className="agxTag">{w.category || "未分类"}</span></td>
                  <td className="agxMono">v{w.currentVersion}</td>
                  <td>{w._count.nodes} / {w._count.edges}</td>
                  <td>
                    <span className={`agxStatus ${w.status === "PUBLISHED" ? "ok" : w.status === "TESTING" ? "warn" : "draft"}`}>
                      {w.status === "PUBLISHED" ? "已发布" : w.status === "TESTING" ? "测试中" : w.status === "OFFLINE" ? "已下线" : "草稿"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="agxRow">
        {/* Runtime Trace 列表 */}
        <div className="agxCard" style={{ flex: 2 }}>
          <div className="agxCardHeader">
            <h3>Runtime 执行链路（最近 8 条）</h3>
            <Link className="agxLink" href="/operator/agent-console/monitor">查看监控</Link>
          </div>
          <table className="agxTable">
            <thead>
              <tr>
                <th>用户问题</th>
                <th>Workflow</th>
                <th>版本</th>
                <th>状态</th>
                <th>Token</th>
                <th>耗时</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              {recentTraces.length === 0 ? (
                <tr><td colSpan={7} className="agxEmpty">暂无执行记录</td></tr>
              ) : recentTraces.map((t) => (
                <tr key={t.id}>
                  <td className="agxPrimary" style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.question}
                  </td>
                  <td>{t.workflowName}</td>
                  <td className="agxMono">v{t.version}</td>
                  <td>{statusBadge(t.status)}</td>
                  <td>{t.totalTokens.toLocaleString()}</td>
                  <td>{(t.durationMs / 1000).toFixed(1)}s</td>
                  <td className="agxMuted">{new Date(t.startedAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 知识状态 */}
        <div className="agxCard" style={{ flex: 1 }}>
          <div className="agxCardHeader">
            <h3>知识与测试</h3>
            <Link className="agxLink" href="/operator/agent-console/knowledge/assets">资产</Link>
          </div>
          <div className="agxMiniList">
            <div className="agxMiniItem">
              <div className="agxMiniLabel">待审核知识</div>
              <div className={`agxMiniValue ${stats.knowledgePending > 0 ? "warn" : ""}`}>{stats.knowledgePending}</div>
            </div>
            <div className="agxMiniItem">
              <div className="agxMiniLabel">已发布知识</div>
              <div className="agxMiniValue good">{stats.knowledgePublished}</div>
            </div>
            <div className="agxMiniItem">
              <div className="agxMiniLabel">知识关联</div>
              <div className="agxMiniValue">{stats.relationTotal}</div>
            </div>
            <div className="agxMiniItem">
              <div className="agxMiniLabel">向量索引</div>
              <div className="agxMiniValue">{stats.embeddingIndexed}</div>
            </div>
            <div className="agxMiniItem">
              <div className="agxMiniLabel">测试用例</div>
              <div className="agxMiniValue">{stats.testCaseTotal}</div>
            </div>
            <div className="agxMiniItem">
              <div className="agxMiniLabel">用例通过</div>
              <div className={`agxMiniValue ${stats.testCasePassed / Math.max(stats.testCaseTotal, 1) >= 0.8 ? "good" : "warn"}`}>
                {stats.testCaseTotal > 0 ? Math.round((stats.testCasePassed / stats.testCaseTotal) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
