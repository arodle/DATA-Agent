"use client";

import { useSupplierRole } from "../SupplierRoleContext";

interface SettlementRecord {
  id: string;
  period: string;
  batchCount: number;
  totalAmount: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
  reworkDeduction: number;
  finalAmount: number;
  status: "待确认" | "已确认" | "已结算";
  paidAt?: string;
}

const settlementRecords: SettlementRecord[] = [
  {
    id: "SET-2026-07-W2",
    period: "7月第2周（07/07 - 07/13）",
    batchCount: 3,
    totalAmount: 17200,
    unit: "张/条",
    unitPrice: 0.8,
    subtotal: 13760,
    reworkDeduction: 380,
    finalAmount: 13380,
    status: "待确认",
  },
  {
    id: "SET-2026-07-W1",
    period: "7月第1周（07/01 - 07/06）",
    batchCount: 2,
    totalAmount: 12000,
    unit: "张",
    unitPrice: 0.8,
    subtotal: 9600,
    reworkDeduction: 120,
    finalAmount: 9480,
    status: "已结算",
    paidAt: "2026-07-08",
  },
  {
    id: "SET-2026-06-W4",
    period: "6月第4周（06/24 - 06/30）",
    batchCount: 4,
    totalAmount: 25600,
    unit: "张",
    unitPrice: 0.8,
    subtotal: 20480,
    reworkDeduction: 560,
    finalAmount: 19920,
    status: "已结算",
    paidAt: "2026-07-01",
  },
  {
    id: "SET-2026-06-W3",
    period: "6月第3周（06/17 - 06/23）",
    batchCount: 3,
    totalAmount: 18800,
    unit: "张",
    unitPrice: 0.8,
    subtotal: 15040,
    reworkDeduction: 240,
    finalAmount: 14800,
    status: "已结算",
    paidAt: "2026-06-24",
  },
];

export default function SupplierSettlementPage() {
  const { role } = useSupplierRole();

  if (role === "worker") {
    return (
      <div className="sPage">
        <div className="agentBanner">
          <span className="agentBannerIcon">🔒</span>
          <div>
            <strong>无访问权限</strong>
            <p>结算记录功能仅对供应商负责人开放</p>
          </div>
        </div>
        <div className="sEmptyState">
          <div className="sEmptyIcon">⛔</div>
          <p>您当前为员工角色，无权访问结算记录模块</p>
          <p style={{ color: "#697889", fontSize: 13 }}>如需查看，请联系供应商负责人</p>
        </div>
      </div>
    );
  }

  const totalFinal = settlementRecords.reduce((s, r) => s + r.finalAmount, 0);
  const pendingRecords = settlementRecords.filter((r) => r.status === "待确认");
  const totalDeduction = settlementRecords.reduce((s, r) => s + r.reworkDeduction, 0);
  const settledCount = settlementRecords.filter((r) => r.status === "已结算").length;

  return (
    <div className="sPage">
      <div className="agentBanner sBanner">
        <span className="agentBannerIcon">💰</span>
        <div>
          <strong>结算记录</strong>
          <p>周期结算数据查看与确认</p>
        </div>
      </div>

      <div className="workspaceStats">
        <div className="statCard">
          <span className="statIcon">💰</span>
          <div>
            <strong>{totalFinal.toLocaleString()}</strong>
            <span>累计结算金额</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">📋</span>
          <div>
            <strong>{pendingRecords.length}</strong>
            <span>待确认</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">✅</span>
          <div>
            <strong>{settledCount}</strong>
            <span>已结算</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">📉</span>
          <div>
            <strong style={{ color: "#c62828" }}>{totalDeduction.toLocaleString()}</strong>
            <span>返修扣款</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <h3 className="cardTitle">结算列表</h3>
          <div className="opTableActions">
            <select className="ghostBtn">
              <option>全部状态</option>
              <option>待确认</option>
              <option>已确认</option>
              <option>已结算</option>
            </select>
            <button className="ghostBtn">导出报表</button>
          </div>
        </div>
        <div className="cardBody noPadding">
          <div className="projectTable">
            <div className="tableHeadRow">
              <div>结算编号</div>
              <div>结算周期</div>
              <div>批次数量</div>
              <div>总产量</div>
              <div>单价</div>
              <div>小计</div>
              <div>返修扣款</div>
              <div>最终金额</div>
              <div>状态</div>
              <div>操作</div>
            </div>
            {settlementRecords.map((r) => (
              <div className="tableDataRow" key={r.id}>
                <div className="mono">{r.id}</div>
                <div style={{ maxWidth: 180 }}>{r.period}</div>
                <div className="mono">{r.batchCount}</div>
                <div className="mono">{r.totalAmount.toLocaleString()} {r.unit}</div>
                <div className="mono">¥{r.unitPrice}</div>
                <div className="mono">¥{r.subtotal.toLocaleString()}</div>
                <div className="mono" style={{ color: r.reworkDeduction > 0 ? "#c62828" : "#697889" }}>
                  -¥{r.reworkDeduction.toLocaleString()}
                </div>
                <div className="mono" style={{ fontWeight: 700 }}>¥{r.finalAmount.toLocaleString()}</div>
                <div>
                  <span className="pill small"
                    style={{
                      background: r.status === "已结算" ? "#e8f5e9" : r.status === "已确认" ? "#e3f2fd" : "#fff3e0",
                      color: r.status === "已结算" ? "#2e7d32" : r.status === "已确认" ? "#1565c0" : "#e65100",
                    }}
                  >{r.status}</span>
                </div>
                <div>
                  {r.status === "待确认" && <button className="primaryBtn" style={{ height: 28, fontSize: 12 }}>确认</button>}
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
