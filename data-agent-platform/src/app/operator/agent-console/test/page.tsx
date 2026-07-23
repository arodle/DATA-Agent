import { prisma } from "@/lib/db";
import TestRunner from "./TestRunner";

export const dynamic = "force-dynamic";

export default async function AgentTestPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const params = await searchParams;
  const workflowId = params.id;

  const workflows = await prisma.agentWorkflow.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { nodes: true, edges: true, versions: true } },
      nodes: { orderBy: { sortOrder: "asc" } },
    },
  });

  const selectedWorkflow = workflowId
    ? workflows.find((w) => w.id === workflowId) || workflows[0]
    : workflows[0];

  const [testCases, recentTraces] = await Promise.all([
    prisma.agentTestCase.findMany({
      where: selectedWorkflow ? { workflowId: selectedWorkflow.id } : undefined,
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.agentSessionTrace.findMany({
      where: selectedWorkflow ? { workflowId: selectedWorkflow.id } : undefined,
      orderBy: { startedAt: "desc" },
      take: 10,
      include: { nodeSteps: { orderBy: { stepOrder: "asc" } } },
    }),
  ]);

  return (
    <TestRunner
      workflows={JSON.parse(JSON.stringify(workflows))}
      selectedWorkflowId={selectedWorkflow?.id}
      testCases={JSON.parse(JSON.stringify(testCases))}
      recentTraces={JSON.parse(JSON.stringify(recentTraces))}
    />
  );
}
