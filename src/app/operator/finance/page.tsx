import { prisma } from "@/lib/prisma";

function formatDate(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "-";
}

const mockBills = [
  { id: "BILL-2026-001", project: "PRJ-001", type: "采集费用", amount: 12800, status: "已结算", date: "2026-07-05" },
  { id: "BILL-2026-002", project: "PRJ-002", type: "标注费用", amount: 25600, status: "待结算", date: "2026-07-08" },
  { id: "BILL-2026-003", project: "PRJ-003", type: "采集费用", amount: 8400, status: "已结算", date: "2026-06-28" },
  { id: "BILL-2026-004", project: "PRJ-004", type: "标注费用", amount: 19200, status: "审核中", date: "2026-07-09" },
  { id: "BILL-2026-005", project: "PRJ-001", type: "质检费用", amount: 3200, status: "已结算", date: "2026-07-01" },
];

export const dynamic = "force-dynamic";

export default async function OperatorFinance() {
  let projects: any[] = [];
  try {
    projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: { datasets: true },
    });
  } catch (e) {
    console.error("Database error:", e);
  }

  const totalAmount = mockBills.reduce((sum, b) => sum + b.amount, 0);
  const settledAmount = mockBills.filter((b) => b.status === "已结算").reduce((sum, b) => sum + b.amount, 0);
  const pendingAmount = mockBills.filter((b) => b.status === "待结算").reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="opWorkbench">
      <div className="opBanner">
        <div className="opBannerIcon">💰</div>
        <div className="opBannerInfo">
          <strong>财务结算中心</strong>
          <p>账单管理 · 结算审核 · 成本分析 · 供应商结算</p>
        </div>
        <div className="opBannerStats">
          <div>
            <strong>¥{totalAmount.toLocaleString()}</strong>
            <span>累计金额</span>
          </div>
          <div>
            <strong>¥{settledAmount.toLocaleString()}</strong>
            <span>已结算</span>
          </div>
          <div>
            <strong>¥{pendingAmount.toLocaleString()}</strong>
            <span>待结算</span>
          </div>
        </div>
      </div>

      <div className="workspaceStats">
        <div className="statCard">
          <span className="statIcon">📄</span>
          <div>
            <strong>{mockBills.length}</strong>
            <span>账单总数</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">💵</span>
          <div>
            <strong>¥{settledAmount.toLocaleString()}</strong>
            <span>已结算</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">⏳</span>
          <div>
            <strong>¥{pendingAmount.toLocaleString()}</strong>
            <span>待结算</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">📈</span>
          <div>
            <strong>¥15.6</strong>
            <span>平均单价/条</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <h3 className="cardTitle">账单列表</h3>
          <div className="opTableActions">
            <select className="ghostBtn">
              <option>全部状态</option>
              <option>已结算</option>
              <option>待结算</option>
              <option>审核中</option>
            </select>
          </div>
        </div>
        <div className="cardBody noPadding">
          <div className="projectTable">
            <div className="tableHeadRow">
              <div>账单编号</div>
              <div>关联项目</div>
              <div>费用类型</div>
              <div>金额</div>
              <div>状态</div>
              <div>创建日期</div>
              <div>操作</div>
            </div>
            {mockBills.map((b) => (
              <div className="tableDataRow" key={b.id}>
                <div className="mono">{b.id}</div>
                <div>{b.project}</div>
                <div>{b.type}</div>
                <div><strong>¥{b.amount.toLocaleString()}</strong></div>
                <div>
                  <span
                    className="detailStatus"
                    style={{
                      background: b.status === "已结算" ? "#0aa86620" : b.status === "待结算" ? "#ffb54720" : "#2d65c720",
                      color: b.status === "已结算" ? "#0aa866" : b.status === "待结算" ? "#9b6400" : "#2d65c7",
                    }}
                  >
                    {b.status}
                  </span>
                </div>
                <div className="mono">{b.date}</div>
                <div>
                  <button className="linkBtn">详情</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
