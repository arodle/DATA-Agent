"use client";

import { useSupplierRole } from "../SupplierRoleContext";

const deliveries = [
  {
    id: "DEL-001",
    batch: "BATCH-046",
    name: "交通场景分类标注",
    amount: 6000,
    submittedAt: "2026-07-10",
    reviewedAt: "2026-07-11",
    accepted: 5890,
    rejected: 110,
    status: "已验收",
  },
  {
    id: "DEL-002",
    batch: "BATCH-042",
    name: "车辆 2D 框质检与返修",
    amount: 8000,
    submittedAt: "-",
    reviewedAt: "-",
    accepted: 0,
    rejected: 0,
    status: "执行中",
  },
  {
    id: "DEL-003",
    batch: "BATCH-045",
    name: "语音转写标注",
    amount: 3200,
    submittedAt: "2026-07-12",
    reviewedAt: "-",
    accepted: 0,
    rejected: 0,
    status: "待验收",
  },
];

const workerDeliveries = [
  {
    id: "DEL-003",
    batch: "BATCH-042",
    name: "车辆 2D 框质检与返修",
    submittedCount: 45,
    status: "已提交",
    submittedAt: "2026-07-12",
  },
  {
    id: "DEL-004",
    batch: "BATCH-042",
    name: "车辆 2D 框质检与返修",
    submittedCount: 38,
    status: "待提交",
    submittedAt: "-",
  },
];

export default function SupplierDeliveryPage() {
  const { role } = useSupplierRole();

  if (role === "manager") {
    const totalAccepted = deliveries.reduce((s, d) => s + d.accepted, 0);
    const totalSubmitted = deliveries.reduce((s, d) => s + d.amount, 0);

    return (
      <div className="sPage">
        <div className="agentBanner sBanner">
          <span className="agentBannerIcon">📦</span>
          <div>
            <strong>数据交付</strong>
            <p>向运营方提交已完成的数据成果与验收跟踪</p>
          </div>
        </div>

        <div className="workspaceStats">
          <div className="statCard">
            <span className="statIcon">📋</span>
            <div>
              <strong>{deliveries.length}</strong>
              <span>交付批次</span>
            </div>
          </div>
          <div className="statCard">
            <span className="statIcon">📤</span>
            <div>
              <strong>{totalSubmitted.toLocaleString()}</strong>
              <span>提交总量</span>
            </div>
          </div>
          <div className="statCard">
            <span className="statIcon">✅</span>
            <div>
              <strong>{totalAccepted.toLocaleString()}</strong>
              <span>通过总量</span>
            </div>
          </div>
          <div className="statCard">
            <span className="statIcon">📈</span>
            <div>
              <strong>{totalSubmitted > 0 ? Math.round(totalAccepted / totalSubmitted * 100) : 0}%</strong>
              <span>验收通过率</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardHeader">
            <h3 className="cardTitle">交付记录</h3>
            <button className="primaryBtn">新建交付</button>
          </div>
          <div className="cardBody noPadding">
            <div className="projectTable">
              <div className="tableHeadRow">
                <div>交付编号</div>
                <div>批次</div>
                <div>任务名称</div>
                <div>提交量</div>
                <div>通过量</div>
                <div>驳回量</div>
                <div>提交时间</div>
                <div>验收时间</div>
                <div>状态</div>
                <div>操作</div>
              </div>
              {deliveries.map((d) => (
                <div className="tableDataRow" key={d.id}>
                  <div className="mono">{d.id}</div>
                  <div className="mono">{d.batch}</div>
                  <div><strong>{d.name}</strong></div>
                  <div className="mono">{d.amount.toLocaleString()}</div>
                  <div className="mono" style={{ color: "#2e7d32" }}>{d.accepted.toLocaleString()}</div>
                  <div className="mono" style={{ color: d.rejected > 0 ? "#c62828" : "#697889" }}>{d.rejected.toLocaleString()}</div>
                  <div className="mono">{d.submittedAt}</div>
                  <div className="mono">{d.reviewedAt}</div>
                  <div>
                    <span className="pill small"
                      style={{
                        background: d.status === "已验收" ? "#e8f5e9" : d.status === "待验收" ? "#fff3e0" : "#e3f2fd",
                        color: d.status === "已验收" ? "#2e7d32" : d.status === "待验收" ? "#e65100" : "#1565c0",
                      }}
                    >{d.status}</span>
                  </div>
                  <div>
                    <button className="linkBtn">详情</button>
                    {d.status === "待验收" && <button className="linkBtn">催办</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sPage">
      <div className="agentBanner sBanner">
        <span className="agentBannerIcon">📦</span>
        <div>
          <strong>数据交付</strong>
          <p>提交个人完成的标注成果</p>
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <h3 className="cardTitle">我的交付记录</h3>
          <button className="primaryBtn">提交成果</button>
        </div>
        <div className="cardBody noPadding">
          <div className="projectTable">
            <div className="tableHeadRow">
              <div>批次</div>
              <div>任务名称</div>
              <div>提交数量</div>
              <div>提交时间</div>
              <div>状态</div>
              <div>操作</div>
            </div>
            {workerDeliveries.map((d) => (
              <div className="tableDataRow" key={d.id}>
                <div className="mono">{d.batch}</div>
                <div><strong>{d.name}</strong></div>
                <div className="mono">{d.submittedCount} 张</div>
                <div className="mono">{d.submittedAt}</div>
                <div>
                  <span className="pill small"
                    style={{
                      background: d.status === "已提交" ? "#e8f5e9" : "#fff3e0",
                      color: d.status === "已提交" ? "#2e7d32" : "#e65100",
                    }}
                  >{d.status}</span>
                </div>
                <div>
                  {d.status === "待提交" && <button className="linkBtn" style={{ color: "#356df3" }}>去提交</button>}
                  {d.status === "已提交" && <button className="linkBtn">查看</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
