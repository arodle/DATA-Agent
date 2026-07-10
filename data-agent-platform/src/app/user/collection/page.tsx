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

const collectionProjectsMock = [
  { id: "COL-001", code: "COL-20240701", name: "城市场景采集 - 白天", type: "图像采集", dataCount: 12000, stage: "采集中", status: "进行中", updatedAt: "2026-07-08" },
  { id: "COL-002", code: "COL-20240615", name: "雨天场景数据采集", type: "图像采集", dataCount: 8500, stage: "质检中", status: "待确认", updatedAt: "2026-07-05" },
  { id: "COL-003", code: "COL-20240528", name: "夜间道路视频采集", type: "视频采集", dataCount: 3200, stage: "已完成", status: "已完成", updatedAt: "2026-06-30" },
];

export default async function CollectionListPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      creator: true,
      stages: true,
      datasets: true,
    },
  });

  return (
    <>
      <header className="roleTopbar">
        <div>
          <p className="crumb">用户视角 / 标采项目 / 采集任务</p>
          <h1>我的采集任务</h1>
        </div>
        <div className="topbarRight">
          <span className="statusTag">共 {collectionProjectsMock.length} 个项目</span>
          <button className="primaryBtn">新建采集任务</button>
        </div>
      </header>

      <section className="listFilters">
        <input placeholder="搜索任务ID / 名称" />
        <select defaultValue="">
          <option value="">全部状态</option>
          <option>采集中</option>
          <option>质检中</option>
          <option>已完成</option>
        </select>
        <select defaultValue="">
          <option value="">全部采集类型</option>
          <option>图像采集</option>
          <option>视频采集</option>
          <option>点云采集</option>
        </select>
        <button className="ghostBtn">搜索</button>
      </section>

      <section className="projectTableWrap">
        <div className="projectTable">
          <div className="tableHeadRow">
            <span className="col-check"><input type="checkbox" /></span>
            <span className="col-code">任务ID</span>
            <span className="col-name">任务名称</span>
            <span className="col-type">采集类型</span>
            <span className="col-data">数据量</span>
            <span className="col-stage">当前阶段</span>
            <span className="col-status">状态</span>
            <span className="col-date">更新时间</span>
            <span className="col-action">操作</span>
          </div>
          {collectionProjectsMock.map((project) => (
            <div className="tableDataRow" key={project.id}>
              <span className="col-check"><input type="checkbox" /></span>
              <span className="col-code projectCode">{project.code}</span>
              <span className="col-name">
                <Link href={`/user/projects/${projects[0]?.code ?? "PRJ-001"}`} className="projectNameLink">
                  {project.name}
                </Link>
              </span>
              <span className="col-type">{project.type}</span>
              <span className="col-data">
                {project.dataCount.toLocaleString()} 条
              </span>
              <span className="col-stage">{project.stage}</span>
              <span className="col-status">
                <span className="pill small">{project.status}</span>
              </span>
              <span className="col-date">{project.updatedAt}</span>
              <span className="col-action">
                <Link href={`/user/projects/${projects[0]?.code ?? "PRJ-001"}`} className="linkText">查看</Link>
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
