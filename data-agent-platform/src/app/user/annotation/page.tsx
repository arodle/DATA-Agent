import Link from "next/link";
import { prisma } from "@/lib/prisma";

const statusLabel: Record<string, string> = {
  DRAFT: "草稿",
  PENDING_REVIEW: "待确认",
  SELF_RUNNING: "自执行中",
  TOOL_RUNNING: "工具执行中",
  AGENT_RUNNING: "Agent执行中",
  SUPPLIER_RUNNING: "供应商执行中",
  ACCEPTANCE: "验收中",
  COMPLETED: "已完成",
  PAUSED: "已暂停",
  CANCELLED: "已取消",
};

function formatDate(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "-";
}

export default async function AnnotationListPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      creator: true,
      operator: true,
      stages: true,
      datasets: true,
      requirement: true,
    },
  });

  const annotationProjects = projects;

  return (
    <>
      <header className="roleTopbar">
        <div>
          <p className="crumb">用户视角 / 标采项目 / 标注任务</p>
          <h1>我的标注项目</h1>
        </div>
        <div className="topbarRight">
          <span className="statusTag">共 {annotationProjects.length} 个项目</span>
          <Link className="primaryBtn linkButton" href="/projects/new">新建标注任务</Link>
        </div>
      </header>

      <section className="listFilters">
        <input placeholder="搜索任务ID / 名称" />
        <select defaultValue="">
          <option value="">全部状态</option>
          <option>进行中</option>
          <option>待确认</option>
          <option>已完成</option>
        </select>
        <select defaultValue="">
          <option value="">全部标注类型</option>
          <option>2D框</option>
          <option>关键点</option>
          <option>语义分割</option>
          <option>属性标注</option>
        </select>
        <button className="ghostBtn">搜索</button>
      </section>

      <section className="projectTableWrap">
        <div className="projectTable">
          <div className="tableHeadRow">
            <span className="col-check"><input type="checkbox" /></span>
            <span className="col-code">任务ID</span>
            <span className="col-name">任务名称</span>
            <span className="col-type">标注类型</span>
            <span className="col-data">数据量</span>
            <span className="col-stage">当前阶段</span>
            <span className="col-status">状态</span>
            <span className="col-date">更新时间</span>
            <span className="col-action">操作</span>
          </div>
          {annotationProjects.map((project) => (
            <div className="tableDataRow" key={project.id}>
              <span className="col-check"><input type="checkbox" /></span>
              <span className="col-code projectCode">{project.code}</span>
              <span className="col-name">
                <Link href={`/user/projects/${project.code}`} className="projectNameLink">
                  {project.name}
                </Link>
              </span>
              <span className="col-type">2D 框标注</span>
              <span className="col-data">
                {project.datasets.reduce((sum, d) => sum + (d.itemCount ?? 0), 0).toLocaleString()} 条
              </span>
              <span className="col-stage">{project.currentStage ?? "-"}</span>
              <span className="col-status">
                <span className="pill small">{statusLabel[project.executionStatus] ?? project.executionStatus}</span>
              </span>
              <span className="col-date">{formatDate(project.updatedAt)}</span>
              <span className="col-action">
                <Link href={`/user/projects/${project.code}`} className="linkText">查看</Link>
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
