const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function callRunAPI(workflowName, question) {
  const wf = await p.agentWorkflow.findFirst({ where: { name: workflowName } });
  if (!wf) { console.log("Not found:", workflowName); return; }
  const res = await fetch("http://localhost:3000/api/agent-console/workflow/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workflowId: wf.id, question }),
  });
  return res.json();
}

async function testRAG() {
  // 测试RAG权限过滤
  const r1 = await fetch("http://localhost:3000/api/agent-console/rag/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "标注", topK: 3 }),
  }).then((r) => r.json());

  const r2 = await fetch("http://localhost:3000/api/agent-console/rag/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "标注", topK: 3, userId: "fake-user-id" }),
  }).then((r) => r.json());

  return { r1, r2 };
}

(async () => {
  console.log("=== Test Runtime: 需求分析Agent ===");
  const r1 = await callRunAPI("需求分析Agent", "我需要标注5万条语音转写数据");
  console.log("Status:", r1?.success, "Steps:", r1?.trace?.nodeSteps?.length, "Tokens:", r1?.trace?.totalTokens);

  console.log("\n=== Test Runtime: 质量诊断Agent ===");
  const r2 = await callRunAPI("质量诊断Agent", "PRJ-001质检不合格率上升原因？");
  console.log("Status:", r2?.success, "Steps:", r2?.trace?.nodeSteps?.length);

  console.log("\n=== Test RAG Permission ===");
  const rag = await testRAG();
  console.log("RAG without userId:", rag.r1.total, "results,", rag.r1.permissionApplied ? "permission applied" : "no permission");
  console.log("RAG with fake userId:", rag.r2.total, "results, filtered:", rag.r2.filtered);

  console.log("\n=== Final DB State ===");
  console.log("Traces:", await p.agentSessionTrace.count());
  console.log("Executions:", await p.agentNodeExecution.count());
  console.log("Workflows:", await p.agentWorkflow.count());
  console.log("Knowledge Published:", await p.knowledge.count({ where: { status: "PUBLISHED" } }));

  await p.$disconnect();
})();
