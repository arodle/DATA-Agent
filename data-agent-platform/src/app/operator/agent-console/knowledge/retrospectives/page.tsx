import { prisma } from "@/lib/prisma";
import Link from "next/link";
import RetrospectiveActionButton from "./RetrospectiveActionButton";

export const dynamic = "force-dynamic";

function formatDate(date?: Date | null) {
  return date ? date.toLocaleString("zh-CN", { hour12: false }) : "-";
}

function scoreTone(score?: number | null) {
  if (!score) return "pending";
  if (score >= 85) return "";
  if (score >= 70) return "warning";
  return "danger";
}

export default async function RetrospectivesPage() {
  const [retrospectives, candidateProjects, trainingCount, knowledgeCount] = await Promise.all([
    prisma.projectRetrospective.findMany({
      include: { project: true },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    prisma.project.findMany({
      where: {
        OR: [
          { executionStatus: "COMPLETED" },
          { tasks: { some: { status: "COMPLETED" } } },
          { operationLogs: { some: { action: "SETTLEMENT_PAID" } } },
        ],
      },
      include: {
        retrospectives: { orderBy: { createdAt: "desc" }, take: 1 },
        tasks: true,
        datasets: true,
        operationLogs: { where: { action: "SETTLEMENT_PAID" }, take: 5, orderBy: { createdAt: "desc" } },
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
    }),
    prisma.agentTrainingExample.count({ where: { sourceType: "PROJECT_RETROSPECTIVE" } }),
    prisma.knowledge.count({ where: { sourceType: "ProjectRetrospective" } }),
  ]);

  const generatedProjectIds = new Set(retrospectives.map((item) => item.projectId));
  const pendingProjects = candidateProjects.filter((project) => !generatedProjectIds.has(project.id));
  const avgScore = retrospectives.length
    ? Math.round(retrospectives.reduce((sum, item) => sum + (item.successScore || 0), 0) / retrospectives.length)
    : 0;

  return (
    <div className="opWorkbench">
      <div className="opBanner">
        <div className="opBannerIcon">训</div>
        <div className="opBannerInfo">
          <strong>Agent 经验沉淀中心</strong>
          <p>项目复盘 · 训练样本 · 知识资产 · 可复用作业模式</p>
        </div>
        <div className="opBannerStats">
          <div><strong>{retrospectives.length}</strong><span>复盘项目</span></div>
          <div><strong>{trainingCount}</strong><span>训练样本</span></div>
          <div><strong>{knowledgeCount}</strong><span>知识资产</span></div>
        </div>
      </div>

      <div className="workspaceStats">
        <div className="statCard"><span className="statIcon">候</span><div><strong>{pendingProjects.length}</strong><span>待沉淀项目</span></div></div>
        <div className="statCard"><span className="statIcon">分</span><div><strong>{avgScore || "-"}</strong><span>平均复盘评分</span></div></div>
        <div className="statCard"><span className="statIcon">知</span><div><strong>{knowledgeCount}</strong><span>已发布知识</span></div></div>
        <div className="statCard"><span className="statIcon">样</span><div><strong>{trainingCount}</strong><span>已审核样本</span></div></div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="cardHeader">
          <h3 className="cardTitle">待沉淀项目</h3>
          <Link className="linkBtn" href="/operator/finance">查看结算中心</Link>
        </div>
        <div className="cardBody noPadding">
          <div className="projectTable">
            <div className="tableHeadRow">
              <div>项目编号</div><div>项目名称</div><div>任务</div><div>资产</div><div>付款记录</div><div>更新时间</div><div>操作</div>
            </div>
            {pendingProjects.map((project) => (
              <div className="tableDataRow" key={project.id}>
                <div className="mono">{project.code}</div>
                <div><strong>{project.name}</strong></div>
                <div className="mono">{project.tasks.length}</div>
                <div className="mono">{project.datasets.length}</div>
                <div className="mono">{project.operationLogs.length}</div>
                <div className="mono">{formatDate(project.updatedAt)}</div>
                <div><RetrospectiveActionButton projectId={project.id} className="reviewBtn primary" /></div>
              </div>
            ))}
          </div>
          {pendingProjects.length === 0 && <div className="emptyState" style={{ padding: 24 }}>暂无待沉淀项目</div>}
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <h3 className="cardTitle">项目复盘库</h3>
          <span className="cardTag">{retrospectives.length}</span>
        </div>
        <div className="cardBody noPadding">
          <div className="projectTable">
            <div className="tableHeadRow">
              <div>项目</div><div>结果</div><div>评分</div><div>训练候选</div><div>脱敏</div><div>摘要</div><div>生成时间</div>
            </div>
            {retrospectives.map((item) => (
              <div className="tableDataRow" key={item.id}>
                <div><strong>{item.project.code}</strong><br /><span className="mutedText">{item.project.name}</span></div>
                <div><span className="detailStatus">{item.outcome}</span></div>
                <div><span className={`detailStatus ${scoreTone(item.successScore)}`}>{item.successScore ?? "-"}</span></div>
                <div>{item.isTrainingCandidate ? "是" : "否"}</div>
                <div>{item.desensitized ? "已脱敏" : "未脱敏"}</div>
                <div>{item.summary.split("\n")[0]}</div>
                <div className="mono">{formatDate(item.createdAt)}</div>
              </div>
            ))}
          </div>
          {retrospectives.length === 0 && <div className="emptyState" style={{ padding: 24 }}>暂无项目复盘</div>}
        </div>
      </div>
    </div>
  );
}
