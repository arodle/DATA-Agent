import Link from "next/link";
import { prisma } from "@/lib/prisma";

function formatDate(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "-";
}

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

export default async function OperatorCollection() {
  let projects: any[] = [];
  try {
    projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: { creator: true, operator: true, datasets: true, stages: true },
    });
  } catch (e) {
    console.error("Database error:", e);
  }

  const collectionProjects = projects.filter((p) =>
    p.mode === "COLLECTION"
  );

  const activeCount = collectionProjects.filter(
    (p) => !["COMPLETED", "CANCELLED"].includes(p.executionStatus)
  ).length;

  return (
    <div className="opWorkbench">
      <div className="opBanner">
        <div className="opBannerIcon">📡</div>
        <div className="opBannerInfo">
          <strong>数据采集运营</strong>
          <p>采集任务管理 · 数据质量监控 · 采集进度追踪</p>
        </div>
        <div className="opBannerStats">
          <div>
            <strong>{activeCount}</strong>
            <span>进行中</span>
          </div>
          <div>
            <strong>{collectionProjects.length}</strong>
            <span>总项目</span>
          </div>
          <div>
            <strong>100%</strong>
            <span>采集完成率</span>
          </div>
        </div>
      </div>

      <div className="workspaceStats">
        <div className="statCard">
          <span className="statIcon">📡</span>
          <div>
            <strong>{activeCount}</strong>
            <span>进行中采集</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">✅</span>
          <div>
            <strong>
              {collectionProjects.filter((p) => p.executionStatus === "COMPLETED").length}
            </strong>
            <span>已完成</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">📊</span>
          <div>
            <strong>
              {collectionProjects.reduce((sum, p) => sum + (p.datasets[0]?.itemCount ?? 0), 0).toLocaleString()}
            </strong>
            <span>已采集条数</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">⚡</span>
          <div>
            <strong>98.2%</strong>
            <span>采集合格率</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <h3 className="cardTitle">采集项目列表</h3>
          <div className="opTableActions">
            <input type="text" placeholder="搜索项目..." className="ghostBtn" style={{ width: 160 }} />
            <select className="ghostBtn">
              <option>全部状态</option>
              <option>进行中</option>
              <option>已完成</option>
            </select>
          </div>
        </div>
        <div className="cardBody noPadding">
          <div className="projectTable">
            <div className="tableHeadRow">
              <div>项目编号</div>
              <div>项目名称</div>
              <div>状态</div>
              <div>数据量</div>
              <div>当前阶段</div>
              <div>运营负责人</div>
              <div>创建时间</div>
              <div>操作</div>
            </div>
            {collectionProjects.map((p) => (
              <div className="tableDataRow" key={p.id}>
                <div className="projectCode mono">{p.code}</div>
                <div>
                  <Link href={`/operator/projects/${p.code}`} className="projectNameLink">
                    {p.name}
                  </Link>
                </div>
                <div>
                  <span
                    className="detailStatus"
                    style={{
                      background: (statusColor[p.executionStatus] ?? "#9aa7b5") + "20",
                      color: statusColor[p.executionStatus] ?? "#9aa7b5",
                    }}
                  >
                    {statusLabel[p.executionStatus] ?? p.executionStatus}
                  </span>
                </div>
                <div>{(p.datasets[0]?.itemCount ?? 0).toLocaleString()}</div>
                <div>{p.currentStage ?? "-"}</div>
                <div>{p.operator?.name ?? p.operator?.email ?? "-"}</div>
                <div className="mono">{formatDate(p.createdAt)}</div>
                <div>
                  <Link href={`/operator/projects/${p.code}`} className="linkBtn">详情</Link>
                </div>
              </div>
            ))}
            {collectionProjects.length === 0 && (
              <div className="tableDataRow" style={{ justifyContent: "center", color: "#9aa7b5" }}>
                暂无采集项目
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
