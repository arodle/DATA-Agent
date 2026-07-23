import { prisma } from "@/lib/prisma";

function formatDate(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "-";
}

function meta(log: any) {
  return (log.metadata || {}) as Record<string, any>;
}

export const dynamic = "force-dynamic";

export default async function SupplierSettlementPage() {
  const settlements = await prisma.operationLog.findMany({
    where: { action: { in: ["GENERATE_SETTLEMENT", "SETTLEMENT_PAID"] } },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  const totalFinal = settlements.reduce((s, r) => s + Number(meta(r).finalAmount || 0), 0);
  const pendingRecords = settlements.filter((r) => meta(r).status !== "PAID");
  const paidRecords = settlements.filter((r) => meta(r).status === "PAID");
  const totalDeduction = settlements.reduce((s, r) => s + Number(meta(r).deduction || 0), 0);

  return (
    <div className="sPage">
      <div className="agentBanner sBanner">
        <span className="agentBannerIcon">￥</span>
        <div>
          <strong>结算记录</strong>
          <p>验收完成后的供应商结算单、扣款和付款状态</p>
        </div>
      </div>

      <div className="workspaceStats">
        <div className="statCard"><span className="statIcon">金</span><div><strong>{totalFinal.toLocaleString()}</strong><span>累计结算金额</span></div></div>
        <div className="statCard"><span className="statIcon">待</span><div><strong>{pendingRecords.length}</strong><span>待付款</span></div></div>
        <div className="statCard"><span className="statIcon">付</span><div><strong>{paidRecords.length}</strong><span>已付款</span></div></div>
        <div className="statCard"><span className="statIcon">扣</span><div><strong style={{ color: "#c62828" }}>{totalDeduction.toLocaleString()}</strong><span>返修扣款</span></div></div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <h3 className="cardTitle">结算列表</h3>
          <div className="opTableActions"><select className="ghostBtn"><option>全部状态</option><option>待付款</option><option>已付款</option></select></div>
        </div>
        <div className="cardBody noPadding">
          <div className="projectTable">
            <div className="tableHeadRow">
              <div>结算编号</div><div>结算周期</div><div>项目</div><div>任务</div><div>产量</div><div>单价</div><div>小计</div><div>返修扣款</div><div>最终金额</div><div>状态</div>
            </div>
            {settlements.map((log) => {
              const m = meta(log);
              const status = m.status === "PAID" ? "已付款" : "待付款";
              return (
                <div className="tableDataRow" key={log.id}>
                  <div className="mono">{m.settlementId || log.id.slice(0, 8)}</div>
                  <div>{formatDate(log.createdAt)}</div>
                  <div>{m.projectCode || "-"}</div>
                  <div style={{ maxWidth: 220 }}>{m.taskName || "-"}</div>
                  <div className="mono">{Number(m.volume || 0).toLocaleString()}</div>
                  <div className="mono">￥{m.unitPrice ?? "-"}</div>
                  <div className="mono">￥{Number(m.grossAmount || 0).toLocaleString()}</div>
                  <div className="mono" style={{ color: Number(m.deduction || 0) > 0 ? "#c62828" : "#697889" }}>-￥{Number(m.deduction || 0).toLocaleString()}</div>
                  <div className="mono" style={{ fontWeight: 700 }}>￥{Number(m.finalAmount || 0).toLocaleString()}</div>
                  <div><span className="pill small" style={{ background: m.status === "PAID" ? "#e8f5e9" : "#fff3e0", color: m.status === "PAID" ? "#2e7d32" : "#e65100" }}>{status}</span></div>
                </div>
              );
            })}
          </div>
          {settlements.length === 0 && <div className="emptyState" style={{ padding: 24 }}>暂无结算记录</div>}
        </div>
      </div>
    </div>
  );
}