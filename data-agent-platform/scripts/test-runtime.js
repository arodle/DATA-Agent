const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function callRunAPI(workflowId, question) {
  const res = await fetch("http://localhost:3000/api/agent-console/workflow/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workflowId, question }),
  });
  return res.json();
}

async function callSaveAPI(workflowId) {
  const nodes = [
    { nodeType: "INPUT", nodeName: "用户输入测试", configJson: JSON.stringify({ placeholder: "测试" }), positionX: 100, positionY: 200 },
    { nodeType: "OUTPUT", nodeName: "测试输出", configJson: JSON.stringify({ saveTo: "AgentMessage" }), positionX: 500, positionY: 200 },
  ];
  const res = await fetch("http://localhost:3000/api/agent-console/workflow/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workflowId, nodes, edges: [] }),
  });
  return res.json();
}

(async () => {
  // 测试1: 需求分析 workflow
  console.log("=== Test 1: 需求分析Agent ===");
  const r1 = await callRunAPI("cmru41fsf0000opqkufodfbkm", "我需要标注5万条语音转写数据");
  console.log("Success:", r1.success);
  if (r1.success) {
    console.log("Trace:", r1.trace.id, r1.trace.status);
    console.log("Total Tokens:", r1.trace.totalTokens, "Duration:", r1.trace.durationMs + "ms");
    console.log("Steps:");
    for (const s of r1.trace.nodeSteps) {
      console.log(`  ${s.stepOrder}. ${s.nodeType.padEnd(10)} ${s.nodeName.padEnd(20)} ${String(s.durationMs).padStart(5)}ms ${String(s.tokens).padStart(4)}t ${s.status}`);
    }
  } else {
    console.log("Error:", r1.error);
  }

  // 测试2: 质量诊断 workflow
  console.log("\n=== Test 2: 质量诊断Agent ===");
  const r2 = await callRunAPI("cmru41ftl000jopqkcqqarob1", "PRJ-001质检不合格率上升原因？");
  console.log("Success:", r2.success);
  if (r2.success) {
    console.log("Trace:", r2.trace.id, r2.trace.status, "Tokens:", r2.trace.totalTokens, "Duration:", r2.trace.durationMs + "ms");
    console.log("Steps:", r2.trace.nodeSteps.length);
  } else {
    console.log("Error:", r2.error);
  }

  // 测试3: 保存草稿
  console.log("\n=== Test 3: Save Draft ===");
  const r3 = await callSaveAPI("cmru41fsf0000opqkufodfbkm");
  console.log(JSON.stringify(r3, null, 2));

  // 测试4: 数据库现状
  console.log("\n=== Database State After ===");
  console.log("Traces:", await p.agentSessionTrace.count());
  console.log("Executions:", await p.agentNodeExecution.count());
  console.log("Total Tokens (sum):", (await p.agentSessionTrace.aggregate({ _sum: { totalTokens: true } }))._sum.totalTokens);

  await p.$disconnect();
})();
