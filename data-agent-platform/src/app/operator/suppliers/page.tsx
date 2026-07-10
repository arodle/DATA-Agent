import { prisma } from "@/lib/prisma";

const mockSuppliers = [
  {
    name: "数据标注科技A",
    status: "活跃",
    statusType: "blue" as const,
    active: 4,
    done: 28,
    delivery: "98.2%",
    quality: "97.8",
  },
  {
    name: "智能标注B",
    status: "活跃",
    statusType: "blue" as const,
    active: 3,
    done: 21,
    delivery: "96.5%",
    quality: "98.1",
  },
  {
    name: "采集服务C",
    status: "活跃",
    statusType: "blue" as const,
    active: 2,
    done: 16,
    delivery: "95.8%",
    quality: "96.4",
  },
  {
    name: "AI数据D",
    status: "合作中",
    statusType: "pending" as const,
    active: 1,
    done: 9,
    delivery: "94.2%",
    quality: "97.0",
  },
  {
    name: "精标注E",
    status: "活跃",
    statusType: "blue" as const,
    active: 3,
    done: 24,
    delivery: "97.6%",
    quality: "98.5",
  },
  {
    name: "速标注F",
    status: "暂停",
    statusType: "pending" as const,
    active: 0,
    done: 12,
    delivery: "92.1%",
    quality: "95.2",
  },
];

export default async function SupplierManagePage() {
  const suppliers = await prisma.supplier.findMany({
    include: { organization: true },
  });
  const activeCount = suppliers.filter((s) => s.status === "ACTIVE").length;

  return (
    <div className="opWorkbench">
      <div className="agentBanner">
        <span className="agentBannerIcon">🏭</span>
        <div>
          <strong>供应商管理</strong>
          <p>供应商分配 · QC管理 · 绩效评估</p>
        </div>
      </div>

      <div className="workspaceStats">
        <div className="statCard">
          <span className="statIcon">🏭</span>
          <div>
            <strong>{suppliers.length || 8}</strong>
            <span>合作供应商</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">⚡</span>
          <div>
            <strong>{activeCount || 5}</strong>
            <span>活跃供应商</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">📦</span>
          <div>
            <strong>96.2%</strong>
            <span>平均交付率</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">📊</span>
          <div>
            <strong>97.8</strong>
            <span>平均质量分</span>
          </div>
        </div>
      </div>

      <div className="supplierGrid">
        {mockSuppliers.map((s) => (
          <div className="supplierCard" key={s.name}>
            <div className="supplierCardHead">
              <strong>{s.name}</strong>
              <span className={`statusBadge ${s.statusType}`}>{s.status}</span>
            </div>
            <div className="supplierCardBody">
              <div className="supplierStat">
                <span>在执项目</span>
                <strong>{s.active}</strong>
              </div>
              <div className="supplierStat">
                <span>完成项目</span>
                <strong>{s.done}</strong>
              </div>
              <div className="supplierStat">
                <span>交付率</span>
                <strong>{s.delivery}</strong>
              </div>
              <div className="supplierStat">
                <span>质量分</span>
                <strong>{s.quality}</strong>
              </div>
            </div>
            <div className="supplierCardFooter">
              <button className="ghostBtn">分配项目</button>
              <button className="ghostBtn">查看详情</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
