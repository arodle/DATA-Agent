import { prisma } from "@/lib/db";
import KnowledgeEditor from "./KnowledgeEditor";

export const dynamic = "force-dynamic";

export default async function KnowledgeOperationPage() {
  // 拉取各种业务数据作为知识来源
  const [qualityEvents, supplierChats, retrospectives, agentMessages, projects, tasks] = await Promise.all([
    prisma.qualityEvent.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { project: true },
    }),
    prisma.supplierChat.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
    prisma.projectRetrospective.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { project: true },
    }),
    prisma.agentMessage.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({
      take: 20,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.projectTask.findMany({
      take: 20,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const candidates = await prisma.knowledge.findMany({
    where: { status: { in: ["DRAFT", "PENDING"] } },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  const sources = [
    ...qualityEvents.map((q) => ({
      type: "QualityEvent",
      id: q.id,
      title: `${q.type} - ${q.severity}`,
      preview: q.impact || q.action || "无内容",
      meta: q.project?.code || "无项目",
      time: new Date(q.createdAt).toLocaleDateString("zh-CN"),
    })),
    ...supplierChats.map((s) => ({
      type: "SupplierChat",
      id: s.id,
      title: `${s.senderName} 的对话`,
      preview: s.content.substring(0, 60),
      meta: s.projectId,
      time: new Date(s.createdAt).toLocaleDateString("zh-CN"),
    })),
    ...retrospectives.map((r) => ({
      type: "ProjectRetrospective",
      id: r.id,
      title: r.outcome,
      preview: r.summary,
      meta: r.project?.code || "无项目",
      time: new Date(r.createdAt).toLocaleDateString("zh-CN"),
    })),
    ...agentMessages.map((m) => ({
      type: "AgentMessage",
      id: m.id,
      title: `Agent ${m.role} 消息`,
      preview: (m.content || "").substring(0, 60),
      meta: "Agent",
      time: new Date(m.createdAt).toLocaleDateString("zh-CN"),
    })),
  ];

  return (
    <KnowledgeEditor
      sources={sources}
      projects={projects.map((p) => ({ id: p.id, code: p.code, name: p.name }))}
      tasks={tasks.map((t) => ({ id: t.id, name: t.name }))}
      qualityEvents={qualityEvents.map((q) => ({ id: q.id, type: q.type, projectCode: q.project?.code }))}
      candidates={candidates.map((c) => ({
        id: c.id,
        title: c.title,
        content: c.content,
        type: c.type,
        category: c.category,
        status: c.status,
        sourceType: c.sourceType,
        sourceId: c.sourceId,
        confidence: c.confidence,
        tags: c.tags,
      }))}
    />
  );
}