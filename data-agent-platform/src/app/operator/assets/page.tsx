import { prisma } from "@/lib/prisma";

function formatDate(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "-";
}

export default async function OperatorAssets() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { datasets: { include: { versions: true } } },
  });

  const totalDatasets = projects.reduce((sum, p) => sum + p.datasets.length, 0);
  const totalItems = projects.reduce(
    (sum, p) => sum + p.datasets.reduce((s, d) => s + (d.itemCount ?? 0), 0),
    0
  );

  return (
    <div className="opWorkbench">
      <div className="opBanner">
        <div className="opBannerIcon">📊</div>
        <div className="opBannerInfo">
          <strong>数据资产管理</strong>
          <p>数据集管理 · 版本控制 · 标签管理 · 数据血缘</p>
        </div>
        <div className="opBannerStats">
          <div>
            <strong>{totalDatasets}</strong>
            <span>数据集</span>
          </div>
          <div>
            <strong>{totalItems.toLocaleString()}</strong>
            <span>总数据量</span>
          </div>
          <div>
            <strong>{projects.length}</strong>
            <span>关联项目</span>
          </div>
        </div>
      </div>

      <div className="workspaceStats">
        <div className="statCard">
          <span className="statIcon">📦</span>
          <div>
            <strong>{totalDatasets}</strong>
            <span>数据集</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">🏷️</span>
          <div>
            <strong>42</strong>
            <span>标签版本</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">🔄</span>
          <div>
            <strong>18</strong>
            <span>数据版本</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">🔗</span>
          <div>
            <strong>6</strong>
            <span>数据血缘链</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <h3 className="cardTitle">数据资产列表</h3>
        </div>
        <div className="cardBody noPadding">
          <div className="projectTable">
            <div className="tableHeadRow">
              <div>数据集名称</div>
              <div>所属项目</div>
              <div>数据量</div>
              <div>数据版本</div>
              <div>数据类型</div>
              <div>存储路径</div>
              <div>更新时间</div>
            </div>
            {projects.flatMap((p) =>
              p.datasets.map((d) => (
                <div className="tableDataRow" key={d.id}>
                  <div className="mono">{d.name}</div>
                  <div>{p.name}</div>
                  <div>{(d.itemCount ?? 0).toLocaleString()}</div>
                  <div>{d.versions.length}</div>
                  <div className="mono">{d.type}</div>
                  <div className="mono">{d.storagePath ?? "-"}</div>
                  <div className="mono">{formatDate(d.updatedAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
