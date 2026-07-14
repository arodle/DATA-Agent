import Link from "next/link";
import { prisma } from "@/lib/prisma";

const statusLabel: Record<string, string> = {
  DRAFT: "草稿",
  PENDING_REVIEW: "待审核",
  SELF_RUNNING: "用户自执行",
  TOOL_RUNNING: "工具执行中",
  AGENT_RUNNING: "Agent执行中",
  SUPPLIER_RUNNING: "供应商执行中",
  ACCEPTANCE: "验收中",
  COMPLETED: "已完成",
  PAUSED: "已暂停",
  CANCELLED: "已取消",
};

const statusColor: Record<string, string> = {
  DRAFT: "#9aa7b5",
  PENDING_REVIEW: "#9b6400",
  SELF_RUNNING: "#2d65c7",
  TOOL_RUNNING: "#2d65c7",
  AGENT_RUNNING: "#2d65c7",
  SUPPLIER_RUNNING: "#2d65c7",
  ACCEPTANCE: "#9b6400",
  COMPLETED: "#0aa866",
  PAUSED: "#9aa7b5",
  CANCELLED: "#c41e3a",
};

const stageOptions = ["创建", "审核", "执行", "验收"];

function formatDate(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "-";
}

export const dynamic = "force-dynamic";

export default async function OperatorProjectsPage() {
  let projects: any[] = [];
  try {
    projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        creator: true,
        operator: true,
        datasets: { orderBy: { createdAt: "asc" } },
        stages: { orderBy: { sortOrder: "asc" } },
      },
    });
  } catch (e) {
    console.error("Database error:", e);
  }

  return (
    <div className="opWorkbench">
      <div className="detailHeader">
        <div className="detailHeaderMain">
          <h1 className="detailTitle">项目管理</h1>
          <p className="detailSubtitle">
            共 {projects.length} 个项目 · 运营全链路管理：审核、分配、监控、验收
          </p>
        </div>
        <div className="detailHeaderActions">
          <Link href="/projects/new" className="outlineBtn">新建项目</Link>
        </div>
      </div>

      <div className="listFilters">
        <input type="text" placeholder="搜索项目编号 / 名称..." />
        <select defaultValue="">
          <option value="">全部状态</option>
          {Object.entries(statusLabel).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select defaultValue="">
          <option value="">全部阶段</option>
          {stageOptions.map((stage) => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </select>
        <button className="ghostBtn">查询</button>
        <button className="ghostBtn">重置</button>
      </div>

      <div className="card">
        <div className="cardHeader">
          <h3 className="cardTitle">项目列表</h3>
          <span className="cardTag">{projects.length} 个项目</span>
        </div>
        <div className="cardBody noPadding">
          <div className="projectTable">
            <div className="tableHeadRow">
              <div className="col-check">
                <input type="checkbox" />
              </div>
              <div>项目编号</div>
              <div>项目名称</div>
              <div>状态</div>
              <div>数据量</div>
              <div>当前阶段</div>
              <div>运营负责人</div>
              <div>创建时间</div>
              <div>操作</div>
            </div>
            {projects.map((p: any) => {
              const dataCount = p.datasets.reduce((s: any, d: any) => s + (d.itemCount ?? 0), 0);
              const color = statusColor[p.executionStatus] ?? "#9aa7b5";
              return (
                <div className="tableDataRow" key={p.id}>
                  <div className="col-check">
                    <input type="checkbox" />
                  </div>
                  <div className="projectCode mono">{p.code}</div>
                  <div>
                    <Link href={`/operator/projects/${p.code}`} className="projectNameLink">
                      {p.name}
                    </Link>
                  </div>
                  <div>
                    <span
                      className="detailStatus"
                      style={{ background: color + "20", color }}
                    >
                      {statusLabel[p.executionStatus] ?? p.executionStatus}
                    </span>
                  </div>
                  <div>{dataCount.toLocaleString()}</div>
                  <div>{p.currentStage ?? "-"}</div>
                  <div>{p.operator?.name ?? p.operator?.email ?? "-"}</div>
                  <div className="mono">{formatDate(p.createdAt)}</div>
                  <div>
                    <Link href={`/operator/projects/${p.code}`} className="linkBtn">详情</Link>
                  </div>
                </div>
              );
            })}
            {projects.length === 0 && (
              <div
                className="tableDataRow"
                style={{ justifyContent: "center", color: "#9aa7b5" }}
              >
                暂无项目
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
