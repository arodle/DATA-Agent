import Link from "next/link";
import { prisma } from "@/lib/prisma";

type BoardMode = "COLLECTION" | "ANNOTATION";

type Props = {
  mode: BoardMode;
  title: string;
  subtitle: string;
  tabs?: string[];
  searchParams?: Record<string, string | string[] | undefined>;
};

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "PENDING_REVIEW", label: "运营审核中" },
  { value: "SUPPLIER_RUNNING", label: "标注中" },
  { value: "ACCEPTANCE", label: "验收中" },
  { value: "COMPLETED", label: "任务完成" },
];

const statusLabel: Record<string, string> = {
  DRAFT: "草稿",
  PENDING_REVIEW: "运营审核中",
  SELF_RUNNING: "用户自执行",
  TOOL_RUNNING: "工具执行中",
  AGENT_RUNNING: "Agent 执行中",
  SUPPLIER_RUNNING: "标注中",
  ACCEPTANCE: "验收中",
  COMPLETED: "任务完成",
  PAUSED: "已暂停",
  CANCELLED: "已取消",
};

const statusClass: Record<string, string> = {
  PENDING_REVIEW: "pending",
  ACCEPTANCE: "pending",
  COMPLETED: "",
  CANCELLED: "danger",
  PAUSED: "warning",
};

function getParam(searchParams: Props["searchParams"], key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function formatDate(date?: Date | null) {
  return date ? date.toLocaleDateString("zh-CN") : "-";
}

function totalItems(project: any) {
  const datasetItems = project.datasets.reduce((sum: number, dataset: any) => sum + (dataset.itemCount || 0), 0);
  const taskItems = project.tasks.reduce((sum: number, task: any) => sum + (task.dataVolume || 0), 0);
  return Math.max(datasetItems, taskItems);
}

function progress(project: any) {
  if (project.executionStatus === "COMPLETED") return 100;
  if (project.executionStatus === "ACCEPTANCE") return 85;
  if (["SUPPLIER_RUNNING", "AGENT_RUNNING", "TOOL_RUNNING", "SELF_RUNNING"].includes(project.executionStatus)) return 55;
  if (project.executionStatus === "PENDING_REVIEW") return 20;
  return 5;
}

function latestOwner(project: any) {
  const latestLog = project.operationLogs[0];
  return project.operator?.name || project.operator?.email || latestLog?.user?.name || latestLog?.user?.email || (latestLog ? "运营确认人" : "未确认");
}

function latestTaskForMode(project: any, mode: BoardMode) {
  const preferredStage = mode === "ANNOTATION" ? "ANNOTATION" : "COLLECTION";
  return project.tasks.find((task: any) => task.stage === preferredStage) || project.tasks[0];
}

export default async function OperationProjectBoard({ mode, title, subtitle, tabs = [], searchParams }: Props) {
  const taskId = getParam(searchParams, "taskId").trim();
  const taskName = getParam(searchParams, "taskName").trim();
  const creator = getParam(searchParams, "creator").trim();
  const operator = getParam(searchParams, "operator").trim();
  const status = getParam(searchParams, "status").trim();
  const onlyAcceptance = getParam(searchParams, "onlyAcceptance") === "1";

  const projects = await prisma.project.findMany({
    where: mode === "ANNOTATION"
      ? { OR: [{ mode: "ANNOTATION" }, { tasks: { some: { stage: "ANNOTATION" } } }] }
      : { OR: [{ mode: "COLLECTION" }, { tasks: { some: { stage: "COLLECTION" } } }] },
    orderBy: { updatedAt: "desc" },
    include: {
      creator: true,
      operator: true,
      ownerOrg: true,
      requirement: true,
      datasets: true,
      tasks: { orderBy: { updatedAt: "desc" }, include: { supplier: { include: { organization: true } } } },
      qualityEvents: true,
      operationLogs: {
        where: { action: { in: ["AUTHORIZE_AGENT_ACTION", "APPROVE_ACCEPTANCE", "REJECT_ACCEPTANCE", "GENERATE_SETTLEMENT", "SETTLEMENT_PAID"] } },
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const filtered = projects.filter((project: any) => {
    const latestTask = latestTaskForMode(project, mode);
    const idMatch = !taskId || project.code.toLowerCase().includes(taskId.toLowerCase()) || project.id.toLowerCase().includes(taskId.toLowerCase()) || latestTask?.id?.toLowerCase().includes(taskId.toLowerCase());
    const nameMatch = !taskName || project.name.toLowerCase().includes(taskName.toLowerCase()) || latestTask?.name?.toLowerCase().includes(taskName.toLowerCase());
    const creatorMatch = !creator || project.creator?.name?.includes(creator) || project.creator?.email?.includes(creator);
    const ownerName = latestOwner(project);
    const operatorMatch = !operator || ownerName.includes(operator);
    const statusMatch = onlyAcceptance ? project.executionStatus === "ACCEPTANCE" : (!status || project.executionStatus === status);
    return idMatch && nameMatch && creatorMatch && operatorMatch && statusMatch;
  });

  const pendingReview = projects.filter((project: any) => project.executionStatus === "PENDING_REVIEW").length;
  const inProduction = projects.filter((project: any) => ["SUPPLIER_RUNNING", "AGENT_RUNNING", "TOOL_RUNNING"].includes(project.executionStatus)).length;
  const inAcceptance = projects.filter((project: any) => project.executionStatus === "ACCEPTANCE").length;
  const completed = projects.filter((project: any) => project.executionStatus === "COMPLETED").length;

  return (
    <div className="opWorkbench denseWorkbench">

      <form className="opBoardFilters">
        <input name="taskId" defaultValue={taskId} placeholder="任务ID" />
        <input name="taskName" defaultValue={taskName} placeholder="任务名称" />
        <input name="creator" defaultValue={creator} placeholder="创建人" />
        <input name="operator" defaultValue={operator} placeholder="运营人员" />
        <select name="status" defaultValue={status}>
          {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <label><input type="checkbox" name="onlyAcceptance" value="1" defaultChecked={onlyAcceptance} /> 只看验收中</label>
        <button type="submit">搜索</button>
        <Link href={mode === "COLLECTION" ? "/operator/collection" : "/operator/annotation"}>重置</Link>
      </form>


      <div className="card">
        <div className="cardBody noPadding">
          <div className="projectTable opWideProjectTable">
            <div className="tableHeadRow opWideHead">
              <div>任务ID</div><div>任务名称</div><div>创建人</div><div>用户端类型</div><div>客户信息</div><div>任务状态</div><div>负责人</div><div>任务进度</div><div>每日进度</div><div>预计完成时间</div><div>任务风险</div><div>操作</div>
            </div>
            {filtered.map((project: any) => {
              const latestTask = latestTaskForMode(project, mode);
              const itemCount = totalItems(project);
              const owner = latestOwner(project);
              const pct = progress(project);
              const openQuality = project.qualityEvents.filter((event: any) => event.status === "OPEN").length;
              return (
                <div className="tableDataRow opWideRow" key={project.id}>
                  <div className="mono">{project.code}</div>
                  <div><Link href={`/operator/projects/${project.code}`} className="projectNameLink">{latestTask?.name || project.name}</Link></div>
                  <div>{project.creator?.name || project.creator?.email || "-"}</div>
                  <div>{project.requirement?.demandType || project.mode}</div>
                  <div>{project.companyName || project.ownerOrg?.name || "-"}</div>
                  <div><span className={`detailStatus ${statusClass[project.executionStatus] || ""}`}>{statusLabel[project.executionStatus] || project.executionStatus}</span></div>
                  <div>{owner}</div>
                  <div><span className="mono">{pct}%</span></div>
                  <div>{itemCount ? `${Math.round(itemCount / 7).toLocaleString()} 条/日` : "-"}</div>
                  <div>{formatDate(project.expectedEndDate || latestTask?.plannedEnd)}</div>
                  <div>{openQuality > 0 ? `${openQuality} 个质量风险` : project.currentRisk || "低"}</div>
                  <div><Link href={`/operator/projects/${project.code}`} className="linkBtn">详情</Link></div>
                </div>
              );
            })}
            {filtered.length === 0 && <div className="tableDataRow opWideRow emptyWideRow">暂无符合条件的任务</div>}
          </div>
        </div>
      </div>
    </div>
  );
}