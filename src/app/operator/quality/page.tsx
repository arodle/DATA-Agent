import Link from "next/link";
import { prisma } from "@/lib/prisma";

const qualityEvents = [
  {
    code: "PRJ-001",
    title: "漏标率超标",
    severity: "high" as const,
    meta: "2026-07-08 · 负责人：张三 · 影响 1200 条数据",
  },
  {
    code: "PRJ-002",
    title: "框偏移缺陷",
    severity: "medium" as const,
    meta: "2026-07-06 · 负责人：李四 · 影响 320 条数据",
  },
  {
    code: "PRJ-003",
    title: "标注一致性不足",
    severity: "medium" as const,
    meta: "2026-07-04 · 负责人：王五 · 影响 86 条数据",
  },
  {
    code: "PRJ-004",
    title: "数据缺失",
    severity: "low" as const,
    meta: "2026-07-02 · 负责人：赵六 · 影响 12 条数据",
  },
];

const severityLabel: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export default async function QualityMonitorPage() {
  let projects: any[] = [];
  try {
    projects = await prisma.project.findMany({
      orderBy: { code: "asc" },
      include: {
        datasets: { orderBy: { createdAt: "asc" } },
        operationLogs: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
  } catch (e) {
    console.error("Database error:", e);
  }

  const totalDatasets = projects.reduce(
    (sum: any, p: any) => sum + p.datasets.reduce((s: any, d: any) => s + (d.itemCount ?? 0), 0),
    0
  );

  return (
    <div className="opWorkbench">
      <div className="agentBanner">
        <span className="agentBannerIcon">📊</span>
        <div>
          <strong>质量监控中心</strong>
          <p>质量事件追踪 · 缺陷分析 · 验收管理</p>
        </div>
      </div>

      <div className="qualitySummary">
        <div className="metricCard">
          <div className="metricIcon">📈</div>
          <div className="metricValue">98.5%</div>
          <strong>平均质量得分</strong>
        </div>
        <div className="metricCard">
          <div className="metricIcon">✅</div>
          <div className="metricValue">99.1%</div>
          <strong>质检通过率</strong>
        </div>
        <div className="metricCard">
          <div className="metricIcon">⚠️</div>
          <div className="metricValue">3</div>
          <strong>未解决事件</strong>
        </div>
        <div className="metricCard">
          <div className="metricIcon">🔧</div>
          <div className="metricValue">44</div>
          <strong>本月已解决</strong>
        </div>
      </div>

      <div className="opMainRow">
        <div className="opMainLeft">
          <div className="card">
            <div className="cardHeader">
              <h3 className="cardTitle">质量事件</h3>
              <Link href="/operator/quality/defects" className="linkBtn">缺陷分析 →</Link>
            </div>
            <div className="cardBody">
              {qualityEvents.map((ev) => (
                <div className="qualityEventItem" key={ev.code}>
                  <div className="qualityEventLeft">
                    <div className="qualityEventTitle">
                      {ev.code} {ev.title}
                    </div>
                    <div className="qualityEventMeta">{ev.meta}</div>
                  </div>
                  <span className={`qualitySeverity ${ev.severity}`}>
                    {severityLabel[ev.severity]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="opMainRight">
          <div className="card">
            <div className="cardHeader">
              <h3 className="cardTitle">质量趋势</h3>
              <span className="cardTag green">近 30 天</span>
            </div>
            <div className="cardBody">
              <div className="opQualityRow">
                <span>本月质量得分</span>
                <strong>98.5%</strong>
              </div>
              <div className="opQualityRow">
                <span>环比上月</span>
                <strong>+1.2%</strong>
              </div>
              <div className="opQualityRow">
                <span>峰值得分</span>
                <strong>99.6%</strong>
              </div>
              <div className="opQualityRow">
                <span>最低得分</span>
                <strong className="warn">96.8%</strong>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: "14px" }}>
            <div className="cardHeader">
              <h3 className="cardTitle">缺陷分布</h3>
            </div>
            <div className="cardBody">
              <div className="opQualityRow">
                <span>漏标</span>
                <strong>32%</strong>
              </div>
              <div className="opQualityRow">
                <span>错标</span>
                <strong>20%</strong>
              </div>
              <div className="opQualityRow">
                <span>框偏移</span>
                <strong>18%</strong>
              </div>
              <div className="opQualityRow">
                <span>标签错误</span>
                <strong>16%</strong>
              </div>
              <div className="opQualityRow">
                <span>数据缺失</span>
                <strong>9%</strong>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: "14px" }}>
            <div className="cardHeader">
              <h3 className="cardTitle">验收统计</h3>
            </div>
            <div className="cardBody">
              <div className="opQualityRow">
                <span>待验收批次</span>
                <strong className="warn">6</strong>
              </div>
              <div className="opQualityRow">
                <span>本月已验收</span>
                <strong>52</strong>
              </div>
              <div className="opQualityRow">
                <span>验收通过率</span>
                <strong>97.4%</strong>
              </div>
              <div className="opQualityRow">
                <span>数据总量</span>
                <strong>{totalDatasets.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
