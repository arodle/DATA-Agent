import { prisma } from "@/lib/db";
import StudioClient from "./StudioClient";

export const dynamic = "force-dynamic";

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const params = await searchParams;
  const workflowId = params.id;

  const [workflows, selectedWorkflow, skills, knowledgeList, tools, models] = await Promise.all([
    prisma.agentWorkflow.findMany({
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { nodes: true, edges: true, versions: true } } },
    }),
    workflowId
      ? prisma.agentWorkflow.findUnique({
          where: { id: workflowId },
          include: {
            nodes: { include: { variables: true }, orderBy: { sortOrder: "asc" } },
            edges: { orderBy: { sortOrder: "asc" } },
            versions: { where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" } },
          },
        })
      : prisma.agentWorkflow.findFirst({
          orderBy: { updatedAt: "desc" },
          include: {
            nodes: { include: { variables: true }, orderBy: { sortOrder: "asc" } },
            edges: { orderBy: { sortOrder: "asc" } },
            versions: { where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" } },
          },
        }),
    prisma.skill.findMany({ orderBy: { name: "asc" } }),
    prisma.knowledge.findMany({ where: { status: "PUBLISHED" }, take: 50, orderBy: { publishedAt: "desc" } }),
    prisma.toolTemplate.findMany({ orderBy: { name: "asc" } }),
    prisma.modelEntity.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <StudioClient
      workflows={JSON.parse(JSON.stringify(workflows))}
      selectedWorkflow={JSON.parse(JSON.stringify(selectedWorkflow))}
      skills={JSON.parse(JSON.stringify(skills))}
      knowledgeList={JSON.parse(JSON.stringify(knowledgeList))}
      tools={JSON.parse(JSON.stringify(tools))}
      models={JSON.parse(JSON.stringify(models))}
    />
  );
}
