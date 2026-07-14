import Link from "next/link";
import { prisma } from "@/lib/prisma";

function formatDate(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "-";
}

type ReviewItem = {
  code: string;
  title: string;
  desc: string;
  type: string;
  submittedAt: Date | null;
  submitter: string;
};

export const dynamic = "force-dynamic";

export default async function ReviewCenterPage() {
  let projects: any[] = [];
  try {
    projects = await prisma.project.findMany({
      orderBy: { code: "asc" },
      include: {
        creator: true,
        toolConfigs: { orderBy: { createdAt: "desc" }, take: 5 },
        requirement: true,
        agentSessions: {
          orderBy: { createdAt: "desc" },
          take: 3,
          include: { actions: { orderBy: { createdAt: "asc" } } },
        },
      },
    });
  } catch (e) {
    console.error("Database error:", e);
  }

  const realReviewItems: ReviewItem[] = [];

  for (const p of projects) {
    for (const tc of p.toolConfigs) {
      if (["DRAFT", "PENDING", "PENDING_REVIEW"].includes(tc.status)) {
        realReviewItems.push({
          code: p.code,
          title: `${p.code} ${p.name} · 工具配置审核`,
          desc: `${tc.name} 工具配置待审批`,
          type: "工具配置",
          submittedAt: tc.createdAt,
          submitter: p.creator?.name ?? "-",
        });
      }
    }
    if (p.requirement) {
      realReviewItems.push({
        code: p.code,
        title: `${p.code} ${p.name} · 需求文档审核`,
        desc: `${p.requirement.title} 需求文档待确认`,
        type: "需求文档",
        submittedAt: p.requirement.updatedAt,
        submitter: p.creator?.name ?? "-",
      });
    }
    for (const s of p.agentSessions) {
      for (const a of s.actions) {
        if (a.status === "PREVIEW") {
          realReviewItems.push({
            code: p.code,
            title: `${p.code} ${p.name} · Agent动作审核`,
            desc: `Agent动作 ${a.actionType} 待授权`,
            type: "Agent动作",
            submittedAt: a.createdAt,
            submitter: p.creator?.name ?? "-",
          });
        }
      }
    }
  }

  const mockReviewItems: ReviewItem[] = [
    {
      code: "PRJ-001",
      title: "PRJ-001 工具配置审核",
      desc: "2D框标注工具配置待审批",
      type: "工具配置",
      submittedAt: new Date(),
      submitter: "张明",
    },
    {
      code: "PRJ-002",
      title: "PRJ-002 需求文档审核",
      desc: "V2.0需求文档变更待确认",
      type: "需求文档",
      submittedAt: new Date(),
      submitter: "李华",
    },
    {
      code: "PRJ-003",
      title: "PRJ-003 验收报告审核",
      desc: "第一批次标注数据验收",
      type: "验收报告",
      submittedAt: new Date(),
      submitter: "王芳",
    },
    {
      code: "PRJ-004",
      title: "PRJ-004 供应商分配",
      desc: "3家候选供应商待分配",
      type: "供应商分配",
      submittedAt: new Date(),
      submitter: "赵强",
    },
    {
      code: "PRJ-001",
      title: "PRJ-001 质检脚本审核",
      desc: "AI生成质检脚本待确认",
      type: "质检脚本",
      submittedAt: new Date(),
      submitter: "Agent",
    },
  ];

  const reviewItems =
    realReviewItems.length > 0 ? realReviewItems : mockReviewItems;

  const pendingToolConfigs = projects.reduce(
    (sum: any, p: any) =>
      sum +
      p.toolConfigs.filter((t: any) =>
        ["DRAFT", "PENDING", "PENDING_REVIEW"].includes(t.status)
      ).length,
    0
  );
  const pendingRequirements = projects.filter((p: any) => p.requirement).length;
  const pendingAcceptance = 3;
  const processedToday = 12;

  return (
    <div className="opWorkbench">
      <div className="opBanner">
        <div className="opBannerIcon">✅</div>
        <div className="opBannerInfo">
          <strong>审核中心</strong>
          <p>工具配置审核 · 需求文档审核 · 验收报告审核</p>
        </div>
      </div>

      <div className="workspaceStats">
        <div className="statCard">
          <span className="statIcon">🔧</span>
          <div>
            <strong>{pendingToolConfigs}</strong>
            <span>待审核工具配置</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">📄</span>
          <div>
            <strong>{pendingRequirements}</strong>
            <span>待审核需求文档</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">📦</span>
          <div>
            <strong>{pendingAcceptance}</strong>
            <span>待验收批次</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">✅</span>
          <div>
            <strong>{processedToday}</strong>
            <span>已处理今日</span>
          </div>
        </div>
      </div>

      <div className="reviewTabs">
        <button className="reviewTab active">全部</button>
        <button className="reviewTab">工具配置</button>
        <button className="reviewTab">需求文档</button>
        <button className="reviewTab">验收报告</button>
      </div>

      {reviewItems.map((item, i) => (
        <div className="reviewItem" key={i}>
          <div className="reviewItemLeft">
            <div className="reviewItemTitle">{item.title}</div>
            <div className="reviewItemDesc">{item.desc}</div>
            <div className="reviewItemMeta">
              <span>提交时间：{formatDate(item.submittedAt)}</span>
              <span>提交人：{item.submitter}</span>
              <span>类型：{item.type}</span>
            </div>
          </div>
          <div className="reviewItemRight">
            <Link
              href={`/operator/projects/${item.code}`}
              className="reviewBtn"
            >
              查看详情
            </Link>
            <button className="reviewBtn primary">批准</button>
            <button className="reviewBtn danger">拒绝</button>
          </div>
        </div>
      ))}

      {reviewItems.length === 0 && (
        <div className="emptyState">暂无待审核事项</div>
      )}
    </div>
  );
}
