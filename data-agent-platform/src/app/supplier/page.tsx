import { prisma } from "@/lib/prisma";
import SupplierTaskActions from "./SupplierTaskActions";

function formatDate(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "-";
}

function taskStatusLabel(status: string) {
  const labels: Record<string, string> = {
    DRAFT: "草稿",
    PUBLISHED: "待启动",
    RUNNING: "执行中",
    SUBMITTED: "审核中",
    COMPLETED: "已完成",
    REJECTED: "已驳回",
  };
  return labels[status] ?? status;
}

function stageLabel(stage: string) {
  const labels: Record<string, string> = {
    ANNOTATION: "数据标注",
    COLLECTION: "数据采集",
    QUALITY: "质量检查",
    DELIVERY: "交付验收",
  };
  return labels[stage] ?? stage;
}

export const dynamic = "force-dynamic";

export default async function SupplierTaskPage() {
  const tasks = await prisma.projectTask.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    include: {
      project: { select: { code: true, name: true, currentStage: true } },
      supplier: { include: { organization: true } },
      qualityEvents: true,
      datasets: true,
    },
  });

  const activeTasks = tasks.filter((t) => ["PUBLISHED", "RUNNING", "SUBMITTED"].includes(t.status));
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");
  const totalAssigned = tasks.reduce((sum, task) => sum + (task.dataVolume ?? 0), 0);
  const totalCompleted = tasks.reduce((sum, task) => {
    if (task.status === "COMPLETED") return sum + (task.dataVolume ?? 0);
    if (task.status === "SUBMITTED") return sum + (task.dataVolume ?? 0);
    if (task.status === "RUNNING") return sum + Math.round((task.dataVolume ?? 0) * 0.45);
    return sum;
  }, 0);
  const totalProgress = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

  return (
    <div className="sPage">
      <div className="agentBanner sBanner">
        <span className="agentBannerIcon">TASK</span>
        <div>
          <strong>任务管理</strong>
          <p>真实 ProjectTask 数据 · Agent 授权后自动同步到供应商端</p>
        </div>
      </div>

      <div className="workspaceStats">
        <div className="statCard"><span className="statIcon">总</span><div><strong>{tasks.length}</strong><span>任务总数</span></div></div>
        <div className="statCard"><span className="statIcon">进</span><div><strong>{activeTasks.length}</strong><span>进行中/待启动</span></div></div>
        <div className="statCard"><span className="statIcon">完</span><div><strong>{completedTasks.length}</strong><span>已完成</span></div></div>
        <div className="statCard"><span className="statIcon">量</span><div><strong>{totalProgress}%</strong><span>整体进度</span></div></div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <h3 className="cardTitle">供应商任务列表</h3>
          <div className="opTableActions">
            <input type="text" placeholder="搜索任务批次..." className="ghostBtn" style={{ width: 180 }} />
            <select className="ghostBtn" defaultValue="ALL">
              <option value="ALL">全部状态</option>
              <option value="PUBLISHED">待启动</option>
              <option value="RUNNING">执行中</option>
              <option value="SUBMITTED">审核中</option>
              <option value="COMPLETED">已完成</option>
            </select>
          </div>
        </div>
        <div className="cardBody noPadding">
          <div className="projectTable">
            <div className="tableHeadRow">
              <div>任务编号</div>
              <div>任务名称</div>
              <div>所属项目</div>
              <div>任务类型</div>
              <div>供应商</div>
              <div>分配量</div>
              <div>进度</div>
              <div>截止日期</div>
              <div>状态</div>
              <div>质量事件 / 操作</div>
            </div>
            {tasks.map((task) => {
              const assigned = task.dataVolume ?? 0;
              const completed = task.status === "COMPLETED" || task.status === "SUBMITTED"
                ? assigned
                : task.status === "RUNNING"
                  ? Math.round(assigned * 0.45)
                  : 0;
              const pct = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
              return (
                <div className="tableDataRow" key={task.id}>
                  <div className="projectCode mono">{task.id.slice(0, 8).toUpperCase()}</div>
                  <div><strong>{task.name}</strong><div style={{ color: "#697889", fontSize: 12 }}>{task.risk || "无风险提示"}</div></div>
                  <div className="mono" style={{ color: "#697889" }}>{task.project.code} · {task.project.name}</div>
                  <div><span className="tinyTag">{stageLabel(task.stage)}</span></div>
                  <div>{task.supplier?.organization.name || "待分配"}</div>
                  <div className="mono">{assigned ? assigned.toLocaleString() : "-"}</div>
                  <div>
                    <div className="sProgressBar"><div className="sProgressFill" style={{ width: `${pct}%` }} /></div>
                    <span style={{ fontSize: 12, color: "#697889" }}>{pct}%</span>
                  </div>
                  <div className="mono">{formatDate(task.plannedEnd)}</div>
                  <div><span className={`pill small ${task.status === "PUBLISHED" ? "pending" : ""}`}>{taskStatusLabel(task.status)}</span></div>
                  <div>
                    <span className="mono" style={{ marginRight: 8 }}>{task.qualityEvents.length}</span>
                    <SupplierTaskActions taskId={task.id} status={task.status} />
                  </div>
                </div>
              );
            })}
          </div>
          {tasks.length === 0 && (
            <div className="emptyState" style={{ padding: 28 }}>
              暂无真实任务。请到运营端 Agent 页面生成待授权动作并授权执行。
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="cardHeader"><h3 className="cardTitle">执行说明</h3><span className="cardTag">Agent 中台闭环</span></div>
        <div className="cardBody">
          <div className="lineageDetailItem"><strong>任务来源</strong><div style={{ color: "#697889", marginTop: 2 }}>运营端授权 CREATE_PROJECT_TASK 后自动创建 ProjectTask。</div></div>
          <div className="lineageDetailItem"><strong>下一步</strong><div style={{ color: "#697889", marginTop: 2 }}>供应商启动任务后进入执行中，提交交付后自动创建质量验收事件。</div></div>
        </div>
      </div>
    </div>
  );
}