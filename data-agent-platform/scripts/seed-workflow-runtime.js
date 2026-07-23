const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 开始初始化 Workflow Runtime 数据...\n");

  // 1. 准备用户和组织
  const org = await prisma.organization.findFirst();
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: { name: "系统管理员", email: "admin@example.com" }
    });
  }

  // 2. 清空已有数据（按依赖顺序）
  await prisma.agentNodeExecution.deleteMany({});
  await prisma.agentSessionTrace.deleteMany({});
  await prisma.agentWorkflowEdge.deleteMany({});
  await prisma.agentWorkflowNode.deleteMany({});
  await prisma.agentVersion.deleteMany({});
  await prisma.agentTestCase.deleteMany({});
  await prisma.agentWorkflow.deleteMany({});

  console.log("✓ 清理旧数据完成");

  // 3. 创建 Workflow 1: 需求分析Agent
  const wf1 = await prisma.agentWorkflow.create({
    data: {
      name: "需求分析Agent",
      description: "接收用户原始需求 → 解析结构化字段 → 检索知识库补充 → 给出完整需求文档",
      category: "需求分析",
      status: "PUBLISHED",
      version: "1.2.0",
      currentVersion: "1.2.0",
      creatorId: user.id,
      publishedAt: new Date(),
    }
  });

  const wf1Input = await prisma.agentWorkflowNode.create({
    data: {
      workflowId: wf1.id, nodeType: "INPUT", nodeName: "用户输入",
      configJson: JSON.stringify({ placeholder: "请输入您的数据需求...", multiline: true }),
      positionX: 80, positionY: 200, sortOrder: 1,
    }
  });
  const wf1Agent = await prisma.agentWorkflowNode.create({
    data: {
      workflowId: wf1.id, nodeType: "AGENT", nodeName: "需求理解Agent",
      configJson: JSON.stringify({
        skill: "requirement_parser", skillVersion: "1.0.0",
        prompt: "你是需求分析专家，请从用户输入中提取：数据类型、数据量、验收标准、紧急程度",
        businessScope: ["ProjectRequirement", "Project"],
        knowledgeScope: ["标注规则", "SOP"],
        dataScope: ["Project", "ProjectTask"],
        toolPermission: ["entity_extract", "data_query"]
      }),
      positionX: 320, positionY: 200, sortOrder: 2,
    }
  });
  const wf1Knowledge = await prisma.agentWorkflowNode.create({
    data: {
      workflowId: wf1.id, nodeType: "KNOWLEDGE", nodeName: "知识库检索",
      configJson: JSON.stringify({
        knowledgeTypes: ["标注规则", "SOP流程", "项目经验"],
        topK: 5, minScore: 0.6,
        filterByProject: true, filterByTask: true
      }),
      positionX: 560, positionY: 200, sortOrder: 3,
    }
  });
  const wf1LLM = await prisma.agentWorkflowNode.create({
    data: {
      workflowId: wf1.id, nodeType: "LLM", nodeName: "DeepSeek生成",
      configJson: JSON.stringify({
        model: "deepseek-chat", temperature: 0.3, maxTokens: 2048,
        systemPrompt: "基于需求解析结果和知识库内容，生成完整的需求文档"
      }),
      positionX: 800, positionY: 200, sortOrder: 4,
    }
  });
  const wf1Output = await prisma.agentWorkflowNode.create({
    data: {
      workflowId: wf1.id, nodeType: "OUTPUT", nodeName: "需求文档",
      configJson: JSON.stringify({ saveTo: "ProjectRequirement", notifyUser: true }),
      positionX: 1040, positionY: 200, sortOrder: 5,
    }
  });

  // 连线
  const edges1 = [
    { src: wf1Input.id, tgt: wf1Agent.id, cond: "always" },
    { src: wf1Agent.id, tgt: wf1Knowledge.id, cond: "always" },
    { src: wf1Knowledge.id, tgt: wf1LLM.id, cond: "always" },
    { src: wf1LLM.id, tgt: wf1Output.id, cond: "always" },
  ];
  for (let i = 0; i < edges1.length; i++) {
    await prisma.agentWorkflowEdge.create({
      data: {
        workflowId: wf1.id, sourceNodeId: edges1[i].src, targetNodeId: edges1[i].tgt,
        condition: edges1[i].cond, sourcePort: "out", targetPort: "in", sortOrder: i + 1,
      }
    });
  }

  // 4. 创建 Workflow 2: 质量诊断Agent
  const wf2 = await prisma.agentWorkflow.create({
    data: {
      name: "质量诊断Agent",
      description: "从QualityEvent出发，定位根因 → 检索历史案例 → 给出修复建议",
      category: "质量诊断",
      status: "PUBLISHED",
      version: "2.0.0",
      currentVersion: "2.0.0",
      creatorId: user.id,
      publishedAt: new Date(),
    }
  });

  const wf2Input = await prisma.agentWorkflowNode.create({
    data: {
      workflowId: wf2.id, nodeType: "INPUT", nodeName: "质量事件ID",
      configJson: JSON.stringify({ inputType: "QualityEvent.id" }),
      positionX: 80, positionY: 200, sortOrder: 1,
    }
  });
  const wf2DataQuery = await prisma.agentWorkflowNode.create({
    data: {
      workflowId: wf2.id, nodeType: "DATA", nodeName: "查询质量事件",
      configJson: JSON.stringify({
        businessObject: "QualityEvent",
        fields: ["type", "severity", "location", "impact", "rootCause"],
        filter: "id = ${input}",
        outputSchema: { type: "object", fields: ["type", "severity", "location", "impact"] }
      }),
      positionX: 320, positionY: 200, sortOrder: 2,
    }
  });
  const wf2DataTask = await prisma.agentWorkflowNode.create({
    data: {
      workflowId: wf2.id, nodeType: "DATA", nodeName: "查询关联任务",
      configJson: JSON.stringify({
        businessObject: "ProjectTask",
        fields: ["name", "status", "dataVolume", "supplierId"],
        filter: "id = ${qualityEvent.taskId}",
        outputSchema: { type: "object", fields: ["name", "status"] }
      }),
      positionX: 320, positionY: 360, sortOrder: 3,
    }
  });
  const wf2Condition = await prisma.agentWorkflowNode.create({
    data: {
      workflowId: wf2.id, nodeType: "CONDITION", nodeName: "严重度路由",
      configJson: JSON.stringify({
        condition: "${qualityEvent.severity}",
        rules: [
          { when: "equals:HIGH", goTo: "node_urgent" },
          { when: "equals:MEDIUM", goTo: "node_normal" },
          { when: "default", goTo: "node_normal" }
        ]
      }),
      positionX: 560, positionY: 280, sortOrder: 4,
    }
  });
  const wf2Knowledge = await prisma.agentWorkflowNode.create({
    data: {
      workflowId: wf2.id, nodeType: "KNOWLEDGE", nodeName: "检索历史案例",
      configJson: JSON.stringify({
        knowledgeTypes: ["质量案例"],
        topK: 3, minScore: 0.7,
        filterByType: "${qualityEvent.type}"
      }),
      positionX: 800, positionY: 200, sortOrder: 5,
    }
  });
  const wf2Agent = await prisma.agentWorkflowNode.create({
    data: {
      workflowId: wf2.id, nodeType: "AGENT", nodeName: "根因分析Agent",
      configJson: JSON.stringify({
        skill: "root_cause_analysis", skillVersion: "2.0.0",
        prompt: "结合质量事件详情、关联任务、历史案例，分析根本原因并给出修复建议",
        businessScope: ["QualityEvent", "ProjectTask"],
        knowledgeScope: ["质量案例", "SOP流程"],
        toolPermission: ["data_query", "knowledge_search"]
      }),
      positionX: 1040, positionY: 200, sortOrder: 6,
    }
  });
  const wf2LLM = await prisma.agentWorkflowNode.create({
    data: {
      workflowId: wf2.id, nodeType: "LLM", nodeName: "DeepSeek生成",
      configJson: JSON.stringify({ model: "deepseek-chat", temperature: 0.2, maxTokens: 1500 }),
      positionX: 1280, positionY: 200, sortOrder: 7,
    }
  });
  const wf2Output = await prisma.agentWorkflowNode.create({
    data: {
      workflowId: wf2.id, nodeType: "OUTPUT", nodeName: "诊断报告",
      configJson: JSON.stringify({ saveTo: "QualityEvent.action", notifyOperator: true }),
      positionX: 1520, positionY: 200, sortOrder: 8,
    }
  });

  const edges2 = [
    { src: wf2Input.id, tgt: wf2DataQuery.id, cond: "always" },
    { src: wf2Input.id, tgt: wf2DataTask.id, cond: "always" },
    { src: wf2DataQuery.id, tgt: wf2Condition.id, cond: "always" },
    { src: wf2Condition.id, tgt: wf2Knowledge.id, cond: "always" },
    { src: wf2Knowledge.id, tgt: wf2Agent.id, cond: "always" },
    { src: wf2Agent.id, tgt: wf2LLM.id, cond: "always" },
    { src: wf2LLM.id, tgt: wf2Output.id, cond: "always" },
  ];
  for (let i = 0; i < edges2.length; i++) {
    await prisma.agentWorkflowEdge.create({
      data: {
        workflowId: wf2.id, sourceNodeId: edges2[i].src, targetNodeId: edges2[i].tgt,
        condition: edges2[i].cond, sourcePort: "out", targetPort: "in", sortOrder: i + 1,
      }
    });
  }

  // 5. 创建 Workflow 3: 供应商问题推送Agent
  const wf3 = await prisma.agentWorkflow.create({
    data: {
      name: "供应商问题推送Agent",
      description: "检测供应商问题 → 匹配知识库SOP → 自动生成推送消息",
      category: "供应商评估",
      status: "TESTING",
      version: "0.9.0",
      currentVersion: "0.9.0",
      creatorId: user.id,
    }
  });

  const wf3Input = await prisma.agentWorkflowNode.create({
    data: { workflowId: wf3.id, nodeType: "INPUT", nodeName: "触发条件", positionX: 80, positionY: 200, sortOrder: 1,
      configJson: JSON.stringify({ trigger: "QualityEvent.needRework = true" }) }
  });
  const wf3Data = await prisma.agentWorkflowNode.create({
    data: { workflowId: wf3.id, nodeType: "DATA", nodeName: "查询供应商", positionX: 320, positionY: 200, sortOrder: 2,
      configJson: JSON.stringify({ businessObject: "Supplier", fields: ["organizationId", "qualityLevel"], outputSchema: {} }) }
  });
  const wf3Tool = await prisma.agentWorkflowNode.create({
    data: { workflowId: wf3.id, nodeType: "TOOL", nodeName: "通知推送", positionX: 560, positionY: 200, sortOrder: 3,
      configJson: JSON.stringify({ templateId: "supplier_rework_notice", configId: "default" }) }
  });
  const wf3Output = await prisma.agentWorkflowNode.create({
    data: { workflowId: wf3.id, nodeType: "OUTPUT", nodeName: "SupplierChat", positionX: 800, positionY: 200, sortOrder: 4,
      configJson: JSON.stringify({ saveTo: "SupplierChat", senderRole: "OPERATOR" }) }
  });
  for (let i = 0; i < 3; i++) {
    const arr = [wf3Data.id, wf3Tool.id, wf3Output.id];
    const prev = i === 0 ? wf3Input.id : arr[i - 1];
    await prisma.agentWorkflowEdge.create({
      data: { workflowId: wf3.id, sourceNodeId: prev, targetNodeId: arr[i], condition: "always", sortOrder: i + 1 }
    });
  }

  // 6. 创建发布版本快照
  await prisma.agentVersion.create({
    data: {
      workflowId: wf1.id, version: "1.0.0", status: "PUBLISHED", changelog: "初版发布",
      skillVersion: "1.0.0", promptVersion: "1.0",
      nodesSnapshot: JSON.stringify([wf1Input, wf1Agent, wf1Knowledge, wf1LLM, wf1Output]),
      edgesSnapshot: JSON.stringify(edges1),
      createdBy: user.id, publishedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000),
    }
  });
  await prisma.agentVersion.create({
    data: {
      workflowId: wf1.id, version: "1.1.0", status: "PUBLISHED", changelog: "优化Prompt与知识检索TopK",
      skillVersion: "1.0.0", promptVersion: "1.1",
      createdBy: user.id, publishedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000),
    }
  });
  await prisma.agentVersion.create({
    data: {
      workflowId: wf1.id, version: "1.2.0", status: "PUBLISHED", changelog: "增加DeepSeek模型版本v2，温度调整到0.3",
      skillVersion: "1.0.0", promptVersion: "1.2", modelVersion: "deepseek-chat-v2",
      createdBy: user.id, publishedAt: new Date(),
    }
  });
  await prisma.agentVersion.create({
    data: {
      workflowId: wf2.id, version: "1.0.0", status: "PUBLISHED", changelog: "初版",
      createdBy: user.id, publishedAt: new Date(Date.now() - 60 * 24 * 3600 * 1000),
    }
  });
  await prisma.agentVersion.create({
    data: {
      workflowId: wf2.id, version: "2.0.0", status: "PUBLISHED", changelog: "增加严重度路由与历史案例检索",
      createdBy: user.id, publishedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
    }
  });

  // 7. 测试用例
  const testCases = [
    { name: "语音转写需求", input: "我需要标注10万条普通话语音转写数据，准确率要求98%", expected: "包含数据量100000、类型speech_asr、模态AUDIO", category: "需求解析" },
    { name: "车辆检测需求", input: "自动驾驶场景，5万张图片2D框标注", expected: "包含数据量50000、模态IMAGE、类型object_detection", category: "需求解析" },
    { name: "质检事件诊断", input: "PRJ-001 任务BATCH-042质检合格率78%低于阈值", expected: "定位到标注员疲劳问题、给出返工建议", category: "质量诊断" },
  ];
  for (const tc of testCases) {
    await prisma.agentTestCase.create({ data: { workflowId: wf1.id, ...tc, passed: Math.random() > 0.3, score: 0.7 + Math.random() * 0.3 } });
  }

  // 8. Runtime Trace 与节点执行记录
  const sampleQuestions = [
    { q: "我需要标注5万条语音转写数据", wf: wf1, wfv: "1.2.0", status: "SUCCESS", tokens: 1820, dur: 4500 },
    { q: "PRJ-001质检不合格率上升原因？", wf: wf2, wfv: "2.0.0", status: "SUCCESS", tokens: 2350, dur: 6800 },
    { q: "车辆标注任务紧急插单", wf: wf1, wfv: "1.2.0", status: "SUCCESS", tokens: 1650, dur: 3800 },
    { q: "供应商返工通知 SOP", wf: wf3, wfv: "0.9.0", status: "PARTIAL", tokens: 980, dur: 2200 },
    { q: "项目PRJ-002数据拆分建议", wf: wf2, wfv: "2.0.0", status: "FAILED", tokens: 520, dur: 1100 },
    { q: "新建需求：30万行人关键点", wf: wf1, wfv: "1.2.0", status: "SUCCESS", tokens: 2100, dur: 5200 },
  ];

  for (let i = 0; i < sampleQuestions.length; i++) {
    const sq = sampleQuestions[i];
    const trace = await prisma.agentSessionTrace.create({
      data: {
        sessionId: null, workflowId: sq.wf.id, workflowName: sq.wf.name, version: sq.wfv,
        userId: user.id, question: sq.q, status: sq.status,
        totalTokens: sq.tokens, durationMs: sq.dur,
        startedAt: new Date(Date.now() - (sampleQuestions.length - i) * 3600 * 1000),
        completedAt: new Date(Date.now() - (sampleQuestions.length - i) * 3600 * 1000 + sq.dur),
        errorMessage: sq.status === "FAILED" ? "知识库查询超时" : null,
      }
    });

    // 为该trace生成节点执行步骤
    const steps = sq.wf.id === wf1.id
      ? [
          { type: "INPUT", name: "用户输入", dur: 50, tokens: 0, out: { question: sq.q } },
          { type: "AGENT", name: "需求理解Agent", dur: 1500, tokens: 720, out: { entities: { type: "speech_asr", volume: 50000 } } },
          { type: "KNOWLEDGE", name: "知识库检索", dur: 800, tokens: 200, out: { hits: 3, topScore: 0.85 } },
          { type: "LLM", name: "DeepSeek生成", dur: 1800, tokens: 900, out: { document: "需求文档已生成" } },
          { type: "OUTPUT", name: "需求文档", dur: 350, tokens: 0, out: { saved: true, id: "REQ-" + Date.now() } },
        ]
      : [
          { type: "INPUT", name: "质量事件ID", dur: 30, tokens: 0, out: { id: "QE-001" } },
          { type: "DATA", name: "查询质量事件", dur: 220, tokens: 0, out: { type: "AC_RULE_FAIL", severity: "HIGH" } },
          { type: "CONDITION", name: "严重度路由", dur: 50, tokens: 0, out: { route: "node_urgent" } },
          { type: "KNOWLEDGE", name: "检索历史案例", dur: 900, tokens: 250, out: { hits: 3 } },
          { type: "AGENT", name: "根因分析Agent", dur: 2100, tokens: 1100, out: { rootCause: "标注员疲劳" } },
          { type: "LLM", name: "DeepSeek生成", dur: 2800, tokens: 1000, out: { report: "诊断报告已生成" } },
          { type: "OUTPUT", name: "诊断报告", dur: 700, tokens: 0, out: { saved: true } },
        ];

    for (let j = 0; j < steps.length; j++) {
      const s = steps[j];
      const nodeRecord = await prisma.agentWorkflowNode.findFirst({
        where: { workflowId: sq.wf.id, nodeType: s.type }
      });
      await prisma.agentNodeExecution.create({
        data: {
          traceId: trace.id, workflowId: sq.wf.id,
          nodeId: nodeRecord?.id, nodeType: s.type, nodeName: s.name,
          stepOrder: j + 1,
          inputJson: JSON.stringify({ from: j === 0 ? "user" : steps[j - 1].name }),
          outputJson: JSON.stringify(s.out),
          tokens: s.tokens, durationMs: s.dur,
          status: sq.status === "FAILED" && j === steps.length - 1 ? "FAILED" : "SUCCESS",
          errorMessage: sq.status === "FAILED" && j === steps.length - 1 ? "知识库查询超时" : null,
          startedAt: new Date(Date.now() - (sampleQuestions.length - i) * 3600 * 1000 + (j * s.dur)),
          completedAt: new Date(Date.now() - (sampleQuestions.length - i) * 3600 * 1000 + ((j + 1) * s.dur)),
        }
      });
    }
  }

  // 9. 知识库与关联关系（已有Knowledge表，确保有数据）
  const knowledgeCount = await prisma.knowledge.count();
  if (knowledgeCount === 0) {
    const k1 = await prisma.knowledge.create({
      data: {
        title: "人体姿态关节点遮挡处理", content: "当手腕关节点被遮挡时应根据可见手臂延伸方向推断位置",
        type: "标注规则", category: "人体姿态", status: "PUBLISHED", confidence: 96,
        tags: "人体姿态,关节点,遮挡", publishedAt: new Date(),
      }
    });
    const k2 = await prisma.knowledge.create({
      data: {
        title: "语音转写方言处理", content: "粤语、闽南语等方言需单独建立语言模型，准确率阈值90%",
        type: "SOP流程", category: "语音转写", status: "PUBLISHED", confidence: 88,
        tags: "语音,方言,ASR", publishedAt: new Date(),
      }
    });

    const project = await prisma.project.findFirst();
    const qualityEvent = await prisma.qualityEvent.findFirst();
    if (project) {
      await prisma.knowledgeRelation.create({ data: { knowledgeId: k1.id, relationType: "APPLY_TO", targetType: "Project", targetId: project.id, createdBy: user.id } });
    }
    if (qualityEvent) {
      await prisma.knowledgeRelation.create({ data: { knowledgeId: k1.id, relationType: "SOURCE_FROM", targetType: "QualityEvent", targetId: qualityEvent.id, createdBy: user.id } });
    }
    if (project) {
      await prisma.knowledgeRelation.create({ data: { knowledgeId: k2.id, relationType: "APPLY_TO", targetType: "Project", targetId: project.id, createdBy: user.id } });
    }

    await prisma.knowledgeEmbedding.createMany({
      data: [
        { knowledgeId: k1.id, embeddingStatus: "INDEXED", chunkCount: 4, vectorDimension: 1536, modelName: "text-embedding-3-small" },
        { knowledgeId: k2.id, embeddingStatus: "INDEXED", chunkCount: 3, vectorDimension: 1536, modelName: "text-embedding-3-small" },
      ]
    });
  }

  // 统计
  const stats = {
    workflows: await prisma.agentWorkflow.count(),
    nodes: await prisma.agentWorkflowNode.count(),
    edges: await prisma.agentWorkflowEdge.count(),
    versions: await prisma.agentVersion.count(),
    testCases: await prisma.agentTestCase.count(),
    traces: await prisma.agentSessionTrace.count(),
    executions: await prisma.agentNodeExecution.count(),
    knowledge: await prisma.knowledge.count(),
    relations: await prisma.knowledgeRelation.count(),
  };

  console.log("\n✅ Workflow Runtime 数据初始化完成！");
  console.log("📊 统计：", JSON.stringify(stats, null, 2));
}

main()
  .catch((e) => { console.error("❌ 错误：", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
