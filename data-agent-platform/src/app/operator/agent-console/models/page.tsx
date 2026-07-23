import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ModelsPage() {
  const [models, runs] = await Promise.all([
    prisma.modelEntity.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.modelRun.findMany({ take: 20, orderBy: { createdAt: "desc" }, include: { model: true, project: true } }),
  ]);

  const successRuns = runs.filter((run) => run.status === "SUCCESS").length;
  const totalTokens = runs.reduce((sum, run) => sum + ((run.metricsJson as { totalTokens?: number } | null)?.totalTokens || 0), 0);

  return (
    <div className="agxPage">
      <div className="agxPageHeader">
        <h1>模型服务</h1>
        <p>管理模型配置、调用记录和 Token 消耗。</p>
      </div>

      <div className="agxStatGrid agxStatGrid4">
        <div className="agxStat"><div className="agxStatLabel">已配置模型</div><div className="agxStatValue">{models.length}</div></div>
        <div className="agxStat"><div className="agxStatLabel">调用次数</div><div className="agxStatValue">{runs.length}</div></div>
        <div className="agxStat"><div className="agxStatLabel">成功率</div><div className="agxStatValue good">{runs.length ? Math.round((successRuns / runs.length) * 100) : 0}%</div></div>
        <div className="agxStat"><div className="agxStatLabel">总 Token</div><div className="agxStatValue">{totalTokens.toLocaleString()}</div></div>
      </div>

      <div className="agxCard">
        <div className="agxCardHeader"><h3>已配置模型</h3></div>
        <table className="agxTable">
          <thead><tr><th>名称</th><th>任务类型</th><th>来源</th><th>描述</th><th>状态</th></tr></thead>
          <tbody>
            {models.length === 0 ? <tr><td colSpan={5} className="agxEmpty">暂无模型</td></tr> : models.map((model) => (
              <tr key={model.id}>
                <td className="agxPrimary">{model.name}</td>
                <td><span className="agxTag">{model.taskType}</span></td>
                <td>{model.source || "-"}</td>
                <td>{model.description || "-"}</td>
                <td><span className="agxStatus ok">可用</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="agxCard" style={{ marginTop: 14 }}>
        <div className="agxCardHeader"><h3>模型调用记录</h3></div>
        <table className="agxTable">
          <thead><tr><th>模型</th><th>项目</th><th>输入 Token</th><th>输出 Token</th><th>状态</th><th>时间</th></tr></thead>
          <tbody>
            {runs.length === 0 ? <tr><td colSpan={6} className="agxEmpty">暂无调用记录</td></tr> : runs.map((run) => {
              const metrics = run.metricsJson as { promptTokens?: number; completionTokens?: number } | null;
              return (
                <tr key={run.id}>
                  <td className="agxPrimary">{run.model?.name || run.modelId}</td>
                  <td>{run.project?.code || "-"}</td>
                  <td>{metrics?.promptTokens || 0}</td>
                  <td>{metrics?.completionTokens || 0}</td>
                  <td><span className={`agxStatus ${run.status === "SUCCESS" ? "ok" : run.status === "FAILED" ? "bad" : "warn"}`}>{run.status}</span></td>
                  <td className="agxMuted">{run.createdAt.toLocaleString("zh-CN")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
