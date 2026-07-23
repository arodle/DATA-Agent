import { prisma } from "@/lib/db";
import GraphCanvas from "./GraphCanvas";

export const dynamic = "force-dynamic";

export default async function KnowledgeGraphPage() {
  const [knowledge, relations, projects, qualityEvents, datasets] = await Promise.all([
    prisma.knowledge.findMany({
      where: { status: "PUBLISHED" },
      take: 30,
      include: { embedding: true },
    }),
    prisma.knowledgeRelation.findMany({
      take: 100,
    }),
    prisma.project.findMany({ take: 20 }),
    prisma.qualityEvent.findMany({ take: 20 }),
    prisma.dataset.findMany({ take: 20 }),
  ]);

  // 收集所有涉及的 targetId
  const targetIds = relations.map((r) => r.targetId);

  return (
    <GraphCanvas
      knowledge={knowledge.map((k) => ({
        id: k.id,
        title: k.title,
        type: k.type,
        callCount: k.callCount,
        embeddingStatus: k.embedding?.embeddingStatus || "PENDING",
      }))}
      relations={relations.map((r) => ({
        id: r.id,
        knowledgeId: r.knowledgeId,
        relationType: r.relationType,
        targetType: r.targetType,
        targetId: r.targetId,
      }))}
      projects={projects.map((p) => ({ id: p.id, code: p.code, name: p.name }))}
      qualityEvents={qualityEvents.map((q) => ({ id: q.id, type: q.type, severity: q.severity }))}
      datasets={datasets.map((d) => ({ id: d.id, name: d.name }))}
    />
  );
}