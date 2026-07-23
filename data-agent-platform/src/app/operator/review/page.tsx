import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AcceptanceActionButton from "./AcceptanceActionButton";

function formatDate(date?: Date | null) {
  return date ? date.toLocaleString("zh-CN", { hour12: false }) : "-";
}

function severityLabel(severity: string) {
  const labels: Record<string, string> = { HIGH: "高", MEDIUM: "中", LOW: "低", INFO: "提示" };
  return labels[severity] ?? severity;
}

export const dynamic = "force-dynamic";

export default async function ReviewCenterPage() {
  const submittedTasks = await prisma.projectTask.findMany({
    where: { status: "SUBMITTED" },
    orderBy: { updatedAt: "desc" },
    include: {
      project: { include: { creator: true } },
      supplier: { include: { organization: true } },
      qualityEvents: { orderBy: { createdAt: "desc" } },
    },
  });

  const pendingAgentActions = await prisma.agentAction.count({ where: { status: "PREVIEW" } });
  const pendingToolConfigs = await prisma.projectToolConfig.count({ where: { status: { in: ["DRAFT", "PENDING", "PENDING_REVIEW"] } } });
  const openQualityEvents = await prisma.qualityEvent.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: { project: true, task: true },
  });
  const processedToday = await prisma.operationLog.count({
    where: {
      action: { in: ["APPROVE_TASK_ACCEPTANCE", "REJECT_TASK_ACCEPTANCE"] },
      createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
  });

  return (
    <div className="opWorkbench">
      <div className="opBanner">
        <div className="opBannerIcon">OK</div>
        <div className="opBannerInfo">
          <strong>审核中心</strong>
          <p>Agent 动作审核 · 任务交付验收 · 质量事件处理</p>
        </div>
      </div>

      <div className="workspaceStats">
        <div className="statCard"><span className="statIcon">工</span><div><strong>{pendingToolConfigs}</strong><span>待审工具配置</span></div></div>
        <div className="statCard"><span className="statIcon">批</span><div><strong>{submittedTasks.length}</strong><span>待验收批次</span></div></div>
        <div className="statCard"><span className="statIcon">质</span><div><strong>{openQualityEvents.length}</strong><span>开放质量事件</span></div></div>
        <div className="statCard"><span className="statIcon">今</span><div><strong>{processedToday}</strong><span>今日验收处理</span></div></div>
      </div>

      <div className="reviewTabs">
        <button className="reviewTab active">交付验收</button>
        <Link href="/operator/agent" className="reviewTab">Agent 动作 {pendingAgentActions}</Link>
        <Link href="/operator/quality" className="reviewTab">质量事件</Link>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="cardHeader">
          <h3 className="cardTitle">待验收交付批次</h3>
          <span className="cardTag warning">{submittedTasks.length} 待处理</span>
        </div>
        <div className="cardBody">
          {submittedTasks.length > 0 ? submittedTasks.map((task) => (
            <div className="reviewItem" key={task.id} style={{ marginBottom: 12 }}>
              <div className="reviewItemLeft">
                <div className="reviewItemTitle">{task.project.code} · {task.name}</div>
                <div className="reviewItemDesc">
                  供应商：{task.supplier?.organization.name || "待分配"} · 数据量：{task.dataVolume?.toLocaleString() || "-"} · 质量事件：{task.qualityEvents.length}
                </div>
                <div className="reviewItemMeta">
                  <span>提交时间：{formatDate(task.actualEnd || task.updatedAt)}</span>
                  <span>项目：{task.project.name}</span>
                  <span>提交人：{task.supplier?.organization.name || "供应商"}</span>
                </div>
              </div>
              <div className="reviewItemRight">
                <Link href={`/operator/projects/${task.project.code}`} className="reviewBtn">查看项目</Link>
                <AcceptanceActionButton taskId={task.id} action="approve" label="验收通过" className="reviewBtn primary" />
                <AcceptanceActionButton taskId={task.id} action="reject" label="驳回返修" className="reviewBtn danger" />
              </div>
            </div>
          )) : <div className="emptyState">暂无待验收交付批次</div>}
        </div>
      </div>

      <div className="opMainRow">
        <div className="opMainLeft">
          <div className="card">
            <div className="cardHeader">
              <h3 className="cardTitle">开放质量事件</h3>
              <Link href="/operator/quality" className="linkBtn">质量中心 →</Link>
            </div>
            <div className="cardBody">
              {openQualityEvents.map((event) => (
                <div className="qualityEventItem" key={event.id}>
                  <div className="qualityEventLeft">
                    <div className="qualityEventTitle">{event.project.code} · {event.type}</div>
                    <div className="qualityEventMeta">
                      {event.task?.name || "项目级事件"} · {event.impact || event.action || "等待处理"} · {formatDate(event.createdAt)}
                    </div>
                  </div>
                  <span className={`qualitySeverity ${event.severity.toLowerCase()}`}>{severityLabel(event.severity)}</span>
                </div>
              ))}
              {openQualityEvents.length === 0 && <div className="emptyState">暂无开放质量事件</div>}
            </div>
          </div>
        </div>

        <div className="opMainRight">
          <div className="card">
            <div className="cardHeader"><h3 className="cardTitle">验收规则</h3></div>
            <div className="cardBody">
              <div className="lineageDetailItem"><strong>通过</strong><div style={{ color: "#697889", marginTop: 2 }}>任务变为 COMPLETED，开放质量事件自动关闭。</div></div>
              <div className="lineageDetailItem"><strong>驳回</strong><div style={{ color: "#697889", marginTop: 2 }}>任务变为 REJECTED，新增返修质量事件。</div></div>
              <div className="lineageDetailItem"><strong>审计</strong><div style={{ color: "#697889", marginTop: 2 }}>所有验收操作写入 OperationLog，供 Agent 复盘使用。</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}