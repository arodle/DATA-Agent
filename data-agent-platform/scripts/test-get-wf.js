const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const ws = await p.agentWorkflow.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { nodes: true, edges: true } } },
  });
  console.log(JSON.stringify(ws.map((w) => ({ id: w.id, name: w.name, nodes: w._count.nodes, edges: w._count.edges })), null, 2));
  await p.$disconnect();
})();
