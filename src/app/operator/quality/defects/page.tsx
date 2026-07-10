const defects = [
  { type: "漏标", count: 156, ratio: "32%", severity: "high" as const, trend: "↑ 上升" },
  { type: "错标", count: 98, ratio: "20%", severity: "medium" as const, trend: "→ 平稳" },
  { type: "框偏移", count: 87, ratio: "18%", severity: "medium" as const, trend: "↓ 下降" },
  { type: "标签错误", count: 76, ratio: "16%", severity: "low" as const, trend: "→ 平稳" },
  { type: "数据缺失", count: 43, ratio: "9%", severity: "low" as const, trend: "↓ 下降" },
  { type: "其他", count: 24, ratio: "5%", severity: "low" as const, trend: "→ 平稳" },
];

const severityLabel: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const tableCols = "1.4fr 100px 90px 110px 100px";

export default function DefectAnalysisPage() {
  return (
    <div className="opWorkbench">
      <div className="agentBanner">
        <span className="agentBannerIcon">🔍</span>
        <div>
          <strong>缺陷分析</strong>
          <p>缺陷类型分布 · 严重程度 · 趋势变化</p>
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <h3 className="cardTitle">缺陷类型分布</h3>
          <span className="cardTag">共 {defects.reduce((s, d) => s + d.count, 0)} 次</span>
        </div>
        <div className="cardBody noPadding">
          <div className="projectTable">
            <div className="tableHeadRow" style={{ gridTemplateColumns: tableCols }}>
              <div>缺陷类型</div>
              <div>发生次数</div>
              <div>占比</div>
              <div>严重程度</div>
              <div>趋势</div>
            </div>
            {defects.map((d) => (
              <div className="tableDataRow" key={d.type} style={{ gridTemplateColumns: tableCols }}>
                <div>{d.type}</div>
                <div>{d.count}</div>
                <div>{d.ratio}</div>
                <div>
                  <span className={`qualitySeverity ${d.severity}`}>
                    {severityLabel[d.severity]}
                  </span>
                </div>
                <div>{d.trend}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
