import { prisma } from "@/lib/prisma";
import SettlementActionButton from "./SettlementActionButton";
import RetrospectiveActionButton from "../agent-console/knowledge/retrospectives/RetrospectiveActionButton";

function formatDate(date?: Date | null) {
  return date ? date.toLocaleString("zh-CN", { hour12: false }) : "-";
}

function meta(log: any) {
  return (log.metadata || {}) as Record<string, any>;
}

export const dynamic = "force-dynamic";

export default async function OperatorFinance() {
  const completedTasks = await prisma.projectTask.findMany({
    where: { status: "COMPLETED" },
    orderBy: { updatedAt: "desc" },
    include: { project: true, supplier: { include: { organization: true } } },
  });

  const settlements = await prisma.operationLog.findMany({
    where: { action: { in: ["GENERATE_SETTLEMENT", "SETTLEMENT_PAID"] } },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  const settledTaskIds = new Set(settlements.map((s) => meta(s).taskId).filter(Boolean));
  const pendingTasks = completedTasks.filter((task) => !settledTaskIds.has(task.id));
  const totalAmount = settlements.reduce((sum, log) => sum + Number(meta(log).finalAmount || 0), 0);
  const paidAmount = settlements.filter((log) => meta(log).status === "PAID").reduce((sum, log) => sum + Number(meta(log).finalAmount || 0), 0);
  const pendingAmount = totalAmount - paidAmount;

  return (
    <div className="opWorkbench">
      <div className="opBanner">
        <div className="opBannerIcon">￥</div>
        <div className="opBannerInfo">
          <strong>财务结算中心</strong>
          <p>完成任务结算 · 供应商付款确认 · 数据资产沉淀追踪</p>
        </div>
        <div className="opBannerStats">
          <div><strong>￥{totalAmount.toLocaleString()}</strong><span>累计金额</span></div>
          <div><strong>￥{paidAmount.toLocaleString()}</strong><span>已付款</span></div>
          <div><strong>￥{pendingAmount.toLocaleString()}</strong><span>待付款</span></div>
        </div>
      </div>

      <div className="workspaceStats">
        <div className="statCard"><span className="statIcon">单</span><div><strong>{settlements.length}</strong><span>结算单数</span></div></div>
        <div className="statCard"><span className="statIcon">待</span><div><strong>{pendingTasks.length}</strong><span>待生成结算</span></div></div>
        <div className="statCard"><span className="statIcon">付</span><div><strong>￥{paidAmount.toLocaleString()}</strong><span>已付款</span></div></div>
        <div className="statCard"><span className="statIcon">资</span><div><strong>{settlements.filter((s) => meta(s).datasetId).length}</strong><span>沉淀资产</span></div></div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="cardHeader">
          <h3 className="cardTitle">待生成结算的完成任务</h3>
          <span className="cardTag warning">{pendingTasks.length}</span>
        </div>
        <div className="cardBody noPadding">
          <div className="projectTable">
            <div className="tableHeadRow">
              <div>任务编号</div><div>任务名称</div><div>项目</div><div>供应商</div><div>数据量</div><div>完成时间</div><div>操作</div>
            </div>
            {pendingTasks.map((task) => (
              <div className="tableDataRow" key={task.id}>
                <div className="mono">{task.id.slice(0, 8).toUpperCase()}</div>
                <div><strong>{task.name}</strong></div>
                <div>{task.project.code} · {task.project.name}</div>
                <div>{task.supplier?.organization.name || "待分配"}</div>
                <div className="mono">{task.dataVolume?.toLocaleString() || "-"}</div>
                <div className="mono">{formatDate(task.actualEnd || task.updatedAt)}</div>
                <div><SettlementActionButton mode="generate" taskId={task.id} /></div>
              </div>
            ))}
          </div>
          {pendingTasks.length === 0 && <div className="emptyState" style={{ padding: 24 }}>暂无待生成结算的完成任务</div>}
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <h3 className="cardTitle">结算单列表</h3>
          <div className="opTableActions"><select className="ghostBtn"><option>全部状态</option><option>待付款</option><option>已付款</option></select></div>
        </div>
        <div className="cardBody noPadding">
          <div className="projectTable">
            <div className="tableHeadRow">
              <div>结算编号</div><div>关联项目</div><div>供应商</div><div>产量</div><div>单价</div><div>扣款</div><div>最终金额</div><div>状态</div><div>资产</div><div>操作</div>
            </div>
            {settlements.map((log) => {
              const m = meta(log);
              return (
                <div className="tableDataRow" key={log.id}>
                  <div className="mono">{m.settlementId || log.id.slice(0, 8)}</div>
                  <div>{m.projectCode || "-"} · {m.projectName || "-"}</div>
                  <div>{m.supplierName || "-"}</div>
                  <div className="mono">{Number(m.volume || 0).toLocaleString()}</div>
                  <div className="mono">￥{m.unitPrice ?? "-"}</div>
                  <div className="mono" style={{ color: Number(m.deduction || 0) > 0 ? "#c62828" : "#697889" }}>-￥{Number(m.deduction || 0).toLocaleString()}</div>
                  <div><strong>￥{Number(m.finalAmount || 0).toLocaleString()}</strong></div>
                  <div><span className={`detailStatus ${m.status === "PAID" ? "" : "pending"}`}>{m.status === "PAID" ? "已付款" : "待付款"}</span></div>
                  <div className="mono">{m.datasetId ? m.datasetId.slice(0, 8) : "-"}</div>
                  <div>{m.status === "PAID" ? (log.projectId ? <RetrospectiveActionButton projectId={log.projectId} label="生成复盘" /> : <button className="linkBtn">详情</button>) : <SettlementActionButton mode="pay" logId={log.id} />}</div>
                </div>
              );
            })}
          </div>
          {settlements.length === 0 && <div className="emptyState" style={{ padding: 24 }}>暂无结算单</div>}
        </div>
      </div>
    </div>
  );
}

