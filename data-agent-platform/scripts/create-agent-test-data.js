/**
 * 创建Agent测试数据
 * 运行: node scripts/create-agent-test-data.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // 创建组织
  const org = await prisma.organization.upsert({
    where: { id: "org-001" },
    update: {},
    create: {
      id: "org-001",
      name: "示例科技公司",
      type: "ENTERPRISE",
      description: "数据标注业务示例组织",
    },
  });

  // 创建用户
  const user = await prisma.user.upsert({
    where: { email: "lin@example.com" },
    update: {},
    create: {
      id: "user-001",
      name: "李运营",
      email: "lin@example.com",
      password: "$2a$10$test-hash-password",
    },
  });

  // 创建项目 PRJ-001
  const project1 = await prisma.project.upsert({
    where: { code: "PRJ-001" },
    update: {},
    create: {
      id: "proj-001",
      code: "PRJ-001",
      name: "语音转写数据标注项目",
      mode: "COLLECTION",
      ownerOrgId: org.id,
      creatorId: user.id,
      executionStatus: "IN_PROGRESS",
      operationStatus: "IN_OPERATION",
      currentStage: "ANNOTATION",
      priority: "HIGH",
      startDate: new Date("2024-01-15"),
      expectedEndDate: new Date("2024-03-15"),
      currentRisk: "供应商产能可能不足",
      nextAction: "安排第二批数据交付",
      budgetName: "语音标注预算-2024Q1",
      budgetAmount: 150000,
      companyName: "示例科技公司",
      departmentName: "AI研发部",
      contactName: "张经理",
      contactInfo: "zhang@example.com",
    },
  });

  // 创建项目 PRJ-002
  const project2 = await prisma.project.upsert({
    where: { code: "PRJ-002" },
    update: {},
    create: {
      id: "proj-002",
      code: "PRJ-002",
      name: "图像目标检测标注项目",
      mode: "COLLECTION",
      ownerOrgId: org.id,
      creatorId: user.id,
      executionStatus: "DESIGN",
      operationStatus: "IN_OPERATION",
      currentStage: "DESIGN",
      priority: "MEDIUM",
      startDate: new Date("2024-02-01"),
      expectedEndDate: new Date("2024-04-30"),
      currentRisk: null,
      nextAction: "完成方案设计评审",
      budgetName: "图像标注预算-2024Q1",
      budgetAmount: 200000,
    },
  });

  // 创建项目需求
  const requirement = await prisma.projectRequirement.upsert({
    where: { projectId: project1.id },
    update: {},
    create: {
      id: "req-001",
      projectId: project1.id,
      title: "语音数据转写标注需求",
      demandType: "数据采集标注",
      dataModality: "AUDIO",
      scenario: "智能客服场景语音转写",
      estimatedVolume: 10000,
      acceptanceCriteria: "准确率≥98%，响应时间≤24小时",
      safetyRequirement: "不包含敏感信息",
    },
  });

  // 创建项目阶段
  const stages = [
    { type: "CREATE", status: "COMPLETED", sortOrder: 1, summary: "项目创建完成" },
    { type: "DESIGN", status: "COMPLETED", sortOrder: 2, summary: "方案设计已确认" },
    { type: "SUPPLIER_CONFIRM", status: "COMPLETED", sortOrder: 3, summary: "供应商已确认" },
    { type: "ANNOTATION", status: "IN_PROGRESS", sortOrder: 4, summary: "标注进行中" },
    { type: "ACCEPTANCE", status: "PENDING", sortOrder: 5 },
    { type: "SETTLEMENT", status: "PENDING", sortOrder: 6 },
  ];

  for (const stage of stages) {
    await prisma.projectStage.upsert({
      where: { projectId_type: { projectId: project1.id, type: stage.type } },
      update: {},
      create: {
        projectId: project1.id,
        ...stage,
      },
    });
  }

  // 创建供应商
  const supplierOrg = await prisma.organization.upsert({
    where: { id: "supplier-org-001" },
    update: {},
    create: {
      id: "supplier-org-001",
      name: "优质标注服务公司",
      type: "SUPPLIER",
    },
  });

  const supplier = await prisma.supplier.upsert({
    where: { id: "sup-001" },
    update: {},
    create: {
      id: "sup-001",
      organizationId: supplierOrg.id,
      qualityLevel: "A",
      efficiencyRange: "500-1000条/天",
      capabilityTags: ["语音标注", "文本标注"],
      supportedModes: ["COLLECTION", "ANNOTATION"],
      status: "ACTIVE",
    },
  });

  // 创建任务
  const task = await prisma.projectTask.upsert({
    where: { id: "task-001" },
    update: {},
    create: {
      id: "task-001",
      projectId: project1.id,
      name: "第一批语音转写任务",
      executorType: "SUPPLIER",
      supplierId: supplier.id,
      stage: "ANNOTATION",
      status: "IN_PROGRESS",
      dataVolume: 5000,
      estimatedEffort: 100,
      plannedStart: new Date("2024-01-20"),
      plannedEnd: new Date("2024-02-20"),
    },
  });

  // 创建质量事件
  const qualityEvent = await prisma.qualityEvent.upsert({
    where: { id: "qinc-001" },
    update: {},
    create: {
      id: "qinc-001",
      projectId: project1.id,
      taskId: task.id,
      type: "ACCURACY_LOW",
      severity: "MEDIUM",
      status: "OPEN",
      impact: "第一批次数据准确率低于预期",
      action: "要求供应商返修",
      needRework: true,
    },
  });

  console.log("✅ 测试数据创建成功");
  console.log("- 组织:", org.name);
  console.log("- 用户:", user.name, user.email);
  console.log("- 项目:", project1.code, project1.name);
  console.log("- 项目:", project2.code, project2.name);
  console.log("- 供应商:", supplierOrg.name);
  console.log("- 任务:", task.name);
  console.log("- 质量事件:", qualityEvent.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());