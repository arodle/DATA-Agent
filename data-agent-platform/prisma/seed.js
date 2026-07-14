const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function upsertOrganization(data) {
  return prisma.organization.upsert({
    where: { id: data.id },
    update: data,
    create: data,
  });
}

async function upsertUser(data) {
  return prisma.user.upsert({
    where: { id: data.id },
    update: data,
    create: data,
  });
}

async function main() {
  const customerOrg = await upsertOrganization({
    id: "org-autolab",
    name: "AutoLab",
    type: "CUSTOMER",
    description: "自动驾驶感知算法团队",
  });
  const eduOrg = await upsertOrganization({
    id: "org-edu-studio",
    name: "Edu Studio",
    type: "SCHOOL",
    description: "面向中小学生的 AI 实验课程团队",
  });
  const researchOrg = await upsertOrganization({
    id: "org-research-team",
    name: "Research Team",
    type: "CUSTOMER",
    description: "高校视觉实验室",
  });
  const internalOrg = await upsertOrganization({
    id: "org-dataops",
    name: "DataOps 运营中心",
    type: "INTERNAL",
    description: "负责项目审核、供应商调度与质量闭环",
  });
  const supplierOrg = await upsertOrganization({
    id: "org-supplier-a",
    name: "供应商 A",
    type: "SUPPLIER",
    description: "图像标注与质检执行团队",
  });

  const userLin = await upsertUser({
    id: "user-lin",
    name: "林同学",
    email: "lirenxuan@example.com",
    phone: "13800000001",
  });
  const teacher = await upsertUser({
    id: "user-teacher",
    name: "教师账号",
    email: "teacher@example.com",
    phone: "13800000002",
  });
  const userB = await upsertUser({
    id: "user-b",
    name: "用户 B",
    email: "research@example.com",
    phone: "13800000003",
  });
  const operatorA = await upsertUser({
    id: "user-operator-a",
    name: "运营 A",
    email: "operator-a@example.com",
  });
  const operatorB = await upsertUser({
    id: "user-operator-b",
    name: "运营 B",
    email: "operator-b@example.com",
  });

  const supplier = await prisma.supplier.upsert({
    where: { organizationId: supplierOrg.id },
    update: {
      capabilityTags: ["2D框", "图像质检", "返修"],
      supportedModes: ["PROFESSIONAL"],
      qualityLevel: "A",
      efficiencyRange: "800-1200 张/人天",
      riskNote: "仅运营授权后可分配供应商任务",
      status: "ACTIVE",
    },
    create: {
      id: "supplier-a",
      organizationId: supplierOrg.id,
      capabilityTags: ["2D框", "图像质检", "返修"],
      supportedModes: ["PROFESSIONAL"],
      qualityLevel: "A",
      efficiencyRange: "800-1200 张/人天",
      riskNote: "仅运营授权后可分配供应商任务",
      status: "ACTIVE",
    },
  });

  const projectInputs = [
    {
      id: "project-vehicle-2d",
      code: "P-20260708-001",
      name: "城市道路车辆 2D 框标注",
      mode: "PROFESSIONAL",
      ownerOrgId: customerOrg.id,
      creatorId: userLin.id,
      operatorId: operatorA.id,
      executionStatus: "PENDING_REVIEW",
      operationStatus: "PENDING_REVIEW",
      currentStage: "审核",
      priority: "P1",
      startDate: new Date("2026-07-08"),
      expectedEndDate: new Date("2026-07-18"),
      budgetName: "DEMO-预算单-001",
      budgetAmount: 18000,
      companyName: "AutoLab",
      departmentName: "感知算法组",
      contactName: "林同学",
      contactInfo: "lirenxuan@example.com",
      currentRisk: "低",
      nextAction: "运营确认工具配置与验收阈值",
    },
    {
      id: "project-school-waste",
      code: "P-20260708-002",
      name: "校园垃圾分类图像采集",
      mode: "EDUCATION",
      ownerOrgId: eduOrg.id,
      creatorId: teacher.id,
      operatorId: operatorA.id,
      executionStatus: "DRAFT",
      operationStatus: "NO_NEED",
      currentStage: "创建",
      priority: "P2",
      startDate: new Date("2026-07-09"),
      expectedEndDate: new Date("2026-07-12"),
      budgetName: "免费资源",
      companyName: "Edu Studio",
      departmentName: "AI 课程组",
      contactName: "教师账号",
      contactInfo: "teacher@example.com",
      currentRisk: "中",
      nextAction: "补充类别定义和样例图",
    },
    {
      id: "project-coco-format",
      code: "P-20260708-003",
      name: "公开 COCO 样例数据检索与格式转换",
      mode: "PROFESSIONAL",
      ownerOrgId: researchOrg.id,
      creatorId: userB.id,
      operatorId: operatorB.id,
      executionStatus: "AGENT_RUNNING",
      operationStatus: "APPROVED",
      currentStage: "执行",
      priority: "P2",
      startDate: new Date("2026-07-05"),
      expectedEndDate: new Date("2026-07-10"),
      budgetName: "开源数据",
      companyName: "Research Team",
      departmentName: "视觉实验室",
      contactName: "用户 B",
      contactInfo: "research@example.com",
      currentRisk: "低",
      nextAction: "导出训练集版本并导入模型训练结果",
    },
  ];

  for (const data of projectInputs) {
    await prisma.project.upsert({
      where: { code: data.code },
      update: data,
      create: data,
    });
  }

  const requirements = [
    {
      projectId: "project-vehicle-2d",
      title: "车辆 2D 框标注需求",
      demandType: "标注",
      dataModality: "图像",
      scenario: "城市道路，目标包含车辆、行人、骑行人；上传数据原则上都需要完成标注。",
      estimatedVolume: 6996,
      acceptanceCriteria: "按抽检缺陷率验收，重点检查漏标、框偏移、类别错误。",
      safetyRequirement: "仅使用脱敏样例数据，不上传真实客户原始数据。",
      sampleStatus: "已上传样例",
      agentStructuredJson: { classes: ["car", "person", "rider"], boxType: "2D bbox" },
    },
    {
      projectId: "project-school-waste",
      title: "校园垃圾分类图像采集需求",
      demandType: "采集+分类",
      dataModality: "图像",
      scenario: "学生用手机拍摄可回收物、厨余、其他垃圾的教学样例。",
      estimatedVolume: 300,
      acceptanceCriteria: "图片清晰、类别可辨认、每类不少于 80 张。",
      sampleStatus: "待上传",
      agentStructuredJson: { classes: ["recyclable", "food_waste", "other"], mode: "education" },
    },
    {
      projectId: "project-coco-format",
      title: "COCO 样例检索与格式转换",
      demandType: "公开数据检索+格式转换",
      dataModality: "图像",
      scenario: "从公共数据集提取车辆类别样例，转换为 YOLO 格式。",
      estimatedVolume: 500,
      acceptanceCriteria: "输出 train/val 切分、类别映射、数据集说明文件。",
      sampleStatus: "公共数据可用",
      agentStructuredJson: { source: "COCO", targetFormat: "YOLO" },
    },
  ];

  for (const item of requirements) {
    await prisma.projectRequirement.upsert({
      where: { projectId: item.projectId },
      update: item,
      create: item,
    });
  }

  const stageDefs = [
    ["创建", "DONE", "需求已结构化，等待预览确认", 1],
    ["审核", "CURRENT", "运营确认预算、工具、供应商权限", 2],
    ["执行", "PENDING", "供应商执行或 Agent 工具执行", 3],
    ["验收", "PENDING", "质检、返修、训练效果复盘", 4],
  ];
  for (const project of projectInputs) {
    for (const [type, status, summary, sortOrder] of stageDefs) {
      const finalStatus = type === project.currentStage ? "CURRENT" : sortOrder < stageDefs.find((s) => s[0] === project.currentStage)[3] ? "DONE" : "PENDING";
      await prisma.projectStage.upsert({
        where: { projectId_type: { projectId: project.id, type } },
        update: { status: finalStatus, summary, sortOrder },
        create: { projectId: project.id, type, status: finalStatus, summary, sortOrder },
      });
    }
  }

  await prisma.projectTask.upsert({
    where: { id: "task-vehicle-tool-config" },
    update: {
      projectId: "project-vehicle-2d",
      name: "配置 2D 框标注工具与类别集",
      executorType: "AGENT_TOOL",
      stage: "审核",
      status: "WAITING_REVIEW",
      dataVolume: 6996,
      estimatedEffort: 1.5,
      risk: "等待运营确认后写入正式任务",
    },
    create: {
      id: "task-vehicle-tool-config",
      projectId: "project-vehicle-2d",
      name: "配置 2D 框标注工具与类别集",
      executorType: "AGENT_TOOL",
      stage: "审核",
      status: "WAITING_REVIEW",
      dataVolume: 6996,
      estimatedEffort: 1.5,
      risk: "等待运营确认后写入正式任务",
    },
  });

  await prisma.projectTask.upsert({
    where: { id: "task-vehicle-supplier" },
    update: {
      projectId: "project-vehicle-2d",
      name: "供应商首标执行",
      executorType: "SUPPLIER",
      supplierId: supplier.id,
      stage: "执行",
      status: "DRAFT",
      dataVolume: 6996,
      estimatedEffort: 7,
      risk: "用户不可直接分配，需运营授权",
    },
    create: {
      id: "task-vehicle-supplier",
      projectId: "project-vehicle-2d",
      name: "供应商首标执行",
      executorType: "SUPPLIER",
      supplierId: supplier.id,
      stage: "执行",
      status: "DRAFT",
      dataVolume: 6996,
      estimatedEffort: 7,
      risk: "用户不可直接分配，需运营授权",
    },
  });

  await prisma.dataset.upsert({
    where: { id: "dataset-vehicle-raw" },
    update: {
      projectId: "project-vehicle-2d",
      taskId: "task-vehicle-tool-config",
      name: "城市道路样例原始图像",
      type: "RAW",
      modality: "图像",
      itemCount: 6996,
      format: "jpg",
      storagePath: "/demo/datasets/vehicle/raw",
      source: "用户上传样例",
    },
    create: {
      id: "dataset-vehicle-raw",
      projectId: "project-vehicle-2d",
      taskId: "task-vehicle-tool-config",
      name: "城市道路样例原始图像",
      type: "RAW",
      modality: "图像",
      itemCount: 6996,
      format: "jpg",
      storagePath: "/demo/datasets/vehicle/raw",
      source: "用户上传样例",
    },
  });

  const publicAssets = [
    ["asset-coco", "DATASET", "COCO 2017 样例", "COCO Consortium", "CC-BY", "图像", "目标检测", "COCO JSON", "公开目标检测数据集，可用于教学和格式转换演示", ["coco", "bbox", "open"]],
    ["asset-open-images", "DATASET", "Open Images 子集", "Google", "CC-BY", "图像", "目标检测", "CSV/JSON", "适合检索公开类别样例", ["open-images", "public"]],
    ["asset-ocr", "DATASET", "OCR 票据样例", "Demo", "Demo Only", "图像", "OCR", "image+txt", "用于 OCR 标注规则和质检脚本教学", ["ocr", "education"]],
    ["asset-pointcloud-template", "FORMAT_TEMPLATE", "点云格式模板", "Official", "Internal Demo", "点云", "3D检测", "pcd/json", "点云 3D 框格式说明和样例", ["pointcloud", "3d"]],
  ];
  for (const [id, type, name, source, license, modality, taskType, format, description, tags] of publicAssets) {
    await prisma.publicAsset.upsert({
      where: { id },
      update: { type, name, source, license, modality, taskType, format, description, tags, isOfficial: true },
      create: { id, type, name, source, license, modality, taskType, format, description, tags, isOfficial: true },
    });
  }

  const toolTemplate = await prisma.toolTemplate.upsert({
    where: { id: "tool-2d-bbox" },
    update: {
      name: "2D 框标注工具模板",
      toolType: "ANNOTATION_TOOL",
      modality: "图像",
      taskType: "目标检测",
      configSchema: { classes: "string[]", quality: "iouThreshold" },
      previewMode: "IMAGE_BBOX",
      description: "用于矩形框、类别集、IoU 质检阈值预览",
      isPublic: true,
    },
    create: {
      id: "tool-2d-bbox",
      name: "2D 框标注工具模板",
      toolType: "ANNOTATION_TOOL",
      modality: "图像",
      taskType: "目标检测",
      configSchema: { classes: "string[]", quality: "iouThreshold" },
      previewMode: "IMAGE_BBOX",
      description: "用于矩形框、类别集、IoU 质检阈值预览",
      isPublic: true,
    },
  });

  await prisma.projectToolConfig.upsert({
    where: { id: "config-vehicle-bbox" },
    update: {
      projectId: "project-vehicle-2d",
      templateId: toolTemplate.id,
      name: "车辆 2D 框工具配置草稿",
      configJson: { classes: ["car", "person", "rider"], iouThreshold: 0.75, requiredAllImages: true },
      previewJson: { sampleImage: "demo-road-001.jpg", boxes: 5 },
      status: "WAITING_AUTHORIZATION",
    },
    create: {
      id: "config-vehicle-bbox",
      projectId: "project-vehicle-2d",
      templateId: toolTemplate.id,
      name: "车辆 2D 框工具配置草稿",
      configJson: { classes: ["car", "person", "rider"], iouThreshold: 0.75, requiredAllImages: true },
      previewJson: { sampleImage: "demo-road-001.jpg", boxes: 5 },
      status: "WAITING_AUTHORIZATION",
    },
  });

  await prisma.prelabelRun.upsert({
    where: { id: "prelabel-vehicle-yolo" },
    update: {
      projectId: "project-vehicle-2d",
      modelName: "YOLOv8n open-source prelabel",
      imageName: "demo-road-001.jpg",
      inputPath: "/demo/images/demo-road-001.jpg",
      boxCount: 5,
      status: "PREVIEW",
      resultJson: { boxes: [{ label: "car", x1: 120, y1: 80, x2: 360, y2: 220 }] },
    },
    create: {
      id: "prelabel-vehicle-yolo",
      projectId: "project-vehicle-2d",
      modelName: "YOLOv8n open-source prelabel",
      imageName: "demo-road-001.jpg",
      inputPath: "/demo/images/demo-road-001.jpg",
      boxCount: 5,
      status: "PREVIEW",
      resultJson: { boxes: [{ label: "car", x1: 120, y1: 80, x2: 360, y2: 220 }] },
    },
  });

  const model = await prisma.modelEntity.upsert({
    where: { id: "model-yolov8n-vehicle" },
    update: {
      name: "YOLOv8n 车辆检测",
      taskType: "目标检测",
      ownerOrgId: customerOrg.id,
      source: "open-source",
      description: "用于车辆类预标注与训练效果复盘的轻量检测模型",
    },
    create: {
      id: "model-yolov8n-vehicle",
      name: "YOLOv8n 车辆检测",
      taskType: "目标检测",
      ownerOrgId: customerOrg.id,
      source: "open-source",
      description: "用于车辆类预标注与训练效果复盘的轻量检测模型",
    },
  });

  await prisma.projectModelBinding.upsert({
    where: { projectId_modelId: { projectId: "project-vehicle-2d", modelId: model.id } },
    update: { purpose: "预标注与训练效果分析", status: "BOUND" },
    create: { projectId: "project-vehicle-2d", modelId: model.id, purpose: "预标注与训练效果分析", status: "BOUND" },
  });

  const run = await prisma.modelRun.upsert({
    where: { id: "run-yolo-baseline" },
    update: {
      projectId: "project-vehicle-2d",
      modelId: model.id,
      datasetId: "dataset-vehicle-raw",
      runName: "baseline-001",
      tool: "external notebook",
      status: "IMPORTED",
      metricsJson: { mAP50: 0.68, recall: 0.71, precision: 0.76 },
      badcaseJson: { weakClass: "rider", issue: "远距离骑行人漏检" },
      conclusion: "模型可用于预标注，但骑行人和远距离小目标需要补数据。",
    },
    create: {
      id: "run-yolo-baseline",
      projectId: "project-vehicle-2d",
      modelId: model.id,
      datasetId: "dataset-vehicle-raw",
      runName: "baseline-001",
      tool: "external notebook",
      status: "IMPORTED",
      metricsJson: { mAP50: 0.68, recall: 0.71, precision: 0.76 },
      badcaseJson: { weakClass: "rider", issue: "远距离骑行人漏检" },
      conclusion: "模型可用于预标注，但骑行人和远距离小目标需要补数据。",
    },
  });

  await prisma.trainingRecommendation.upsert({
    where: { id: "rec-more-rider" },
    update: {
      modelRunId: run.id,
      title: "补充骑行人远距离样本",
      reason: "当前 baseline 对小目标骑行人召回偏低。",
      nextDataNeed: "追加 300-500 张远距离骑行人图像，覆盖夜间和雨天。",
      priority: "P1",
    },
    create: {
      id: "rec-more-rider",
      modelRunId: run.id,
      title: "补充骑行人远距离样本",
      reason: "当前 baseline 对小目标骑行人召回偏低。",
      nextDataNeed: "追加 300-500 张远距离骑行人图像，覆盖夜间和雨天。",
      priority: "P1",
    },
  });

  const session = await prisma.agentSession.upsert({
    where: { id: "session-vehicle-review" },
    update: {
      projectId: "project-vehicle-2d",
      userId: userLin.id,
      context: "CUSTOMER_PROJECT",
      title: "车辆 2D 框需求澄清与工具配置",
    },
    create: {
      id: "session-vehicle-review",
      projectId: "project-vehicle-2d",
      userId: userLin.id,
      context: "CUSTOMER_PROJECT",
      title: "车辆 2D 框需求澄清与工具配置",
    },
  });

  const actionRows = [
    ["action-tool-config", "GENERATE_TOOL_CONFIG", "ProjectToolConfig", "config-vehicle-bbox", "PREVIEW", { writeTarget: "工具配置草稿", classes: ["car", "person", "rider"], iouThreshold: 0.75 }],
    ["action-prelabel", "RUN_OPEN_SOURCE_PRELABEL", "PrelabelRun", "prelabel-vehicle-yolo", "PREVIEW", { model: "YOLOv8n", image: "demo-road-001.jpg", boxCount: 5 }],
    ["action-quality-script", "GENERATE_QUALITY_SCRIPT", "QualityScript", null, "PREVIEW", { targetError: "漏标", method: "抽检标注结果与预标注候选框差异" }],
  ];
  for (const [id, actionType, targetEntity, targetId, status, previewJson] of actionRows) {
    await prisma.agentAction.upsert({
      where: { id },
      update: { sessionId: session.id, projectId: "project-vehicle-2d", actionType, targetEntity, targetId, status, previewJson },
      create: { id, sessionId: session.id, projectId: "project-vehicle-2d", actionType, targetEntity, targetId, status, previewJson },
    });
  }

  const logCount = await prisma.operationLog.count({ where: { projectId: "project-vehicle-2d" } });
  if (logCount === 0) {
    await prisma.operationLog.createMany({
      data: [
        { projectId: "project-vehicle-2d", userId: userLin.id, actorRole: "USER", action: "提交需求", detail: "用户提交城市道路车辆 2D 框标注需求。", entityType: "ProjectRequirement" },
        { projectId: "project-vehicle-2d", userId: userLin.id, actorRole: "AGENT", action: "结构化需求", detail: "Agent 提取数据模态、需求类型、预估数据量和验收口径。", entityType: "ProjectRequirement" },
        { projectId: "project-vehicle-2d", userId: operatorA.id, actorRole: "OPERATOR", action: "进入审核", detail: "运营查看草稿，要求确认 6996 张是否全部完成。", entityType: "Project" },
        { projectId: "project-vehicle-2d", userId: userLin.id, actorRole: "AGENT", action: "生成授权预览", detail: "Agent 准备写入工具配置和开源模型预标注任务，等待用户授权。", entityType: "AgentAction" },
      ],
    });
  }

  await prisma.skill.upsert({
    where: { id: "skill-leak-check" },
    update: {
      authorId: userLin.id,
      name: "漏标差异检查 Skill",
      category: "质检脚本",
      description: "对比预标注候选框与人工标注框，提示疑似漏标区域。",
      visibility: "PUBLIC",
      official: false,
      usageCount: 18,
      rating: 4.6,
    },
    create: {
      id: "skill-leak-check",
      authorId: userLin.id,
      name: "漏标差异检查 Skill",
      category: "质检脚本",
      description: "对比预标注候选框与人工标注框，提示疑似漏标区域。",
      visibility: "PUBLIC",
      official: false,
      usageCount: 18,
      rating: 4.6,
    },
  });

  await prisma.officialPost.upsert({
    where: { id: "post-free-compute" },
    update: {
      title: "官方福利：教育模式开放轻量训练额度",
      type: "BENEFIT",
      content: "面向教学项目提供小模型训练额度，用于快速完成采集、标注、训练、结论展示闭环。",
      visibility: "PUBLIC",
    },
    create: {
      id: "post-free-compute",
      title: "官方福利：教育模式开放轻量训练额度",
      type: "BENEFIT",
      content: "面向教学项目提供小模型训练额度，用于快速完成采集、标注、训练、结论展示闭环。",
      visibility: "PUBLIC",
    },
  });

  const chats = [
    {
      projectId: "project-vehicle-2d",
      senderRole: "USER",
      senderId: "user-lin",
      senderName: "林同学",
      content: "你好，我们项目的标注标准需要更新一下：车辆被遮挡超过50%的情况，应该标记为'truncated'而不是'occluded'，麻烦跟标注团队同步一下。",
      contentType: "TEXT",
    },
    {
      projectId: "project-vehicle-2d",
      senderRole: "SUPPLIER_LEADER",
      senderId: "supplier-a-leader",
      senderName: "张经理",
      content: "收到，林同学。这个标准变更影响比较大，目前已经有2000张按旧标准标注了。需要返工吗？",
      contentType: "TEXT",
    },
    {
      projectId: "project-vehicle-2d",
      senderRole: "USER",
      senderId: "user-lin",
      senderName: "林同学",
      content: "已标注的2000张不需要返工，从今天新分配的批次开始执行新标准就行。另外，夜间场景的标注，如果车灯亮着但是车身看不清，也归到truncated类别。",
      contentType: "TEXT",
    },
    {
      projectId: "project-vehicle-2d",
      senderRole: "SUPPLIER_LEADER",
      senderId: "supplier-a-leader",
      senderName: "张经理",
      content: "好的，我马上更新标注规范文档，下午发给你确认。另外昨晚的质检报告显示，有一批数据框的贴合度偏低，主要是小目标（远距离车辆）偏差较大，建议把小目标的框放大10%作为容差？",
      contentType: "TEXT",
    },
    {
      projectId: "project-vehicle-2d",
      senderRole: "USER",
      senderId: "user-lin",
      senderName: "林同学",
      content: "容差放大10%可以接受，但需要在新版工具配置里加一个校验规则：放大后的框不能和相邻目标框重叠超过20%。你先把规则加上，我审核通过后再发布。",
      contentType: "TEXT",
    },
    {
      projectId: "project-vehicle-2d",
      senderRole: "SUPPLIER_MEMBER",
      senderId: "member-001",
      senderName: "标注员小王",
      content: "@林同学 你好，请问交通标志牌上的文字是否需要单独标注？比如限速牌上的数字。",
      contentType: "TEXT",
    },
    {
      projectId: "project-vehicle-2d",
      senderRole: "USER",
      senderId: "user-lin",
      senderName: "林同学",
      content: "不需要单独标文字。交通标志牌作为一个整体框就行，文字信息不纳入本次标注范围。",
      contentType: "TEXT",
    },
    {
      projectId: "project-vehicle-2d",
      senderRole: "SUPPLIER_MEMBER",
      senderId: "member-001",
      senderName: "标注员小王",
      content: "好的谢谢",
      contentType: "TEXT",
    },
    {
      projectId: "project-coco-format",
      senderRole: "USER",
      senderId: "user-lin",
      senderName: "林同学",
      content: "COCO格式转换的工具配置已经生成了，你们那边能接入吗？我们计划下周开始第一批转换。",
      contentType: "TEXT",
    },
    {
      projectId: "project-coco-format",
      senderRole: "SUPPLIER_LEADER",
      senderId: "supplier-a-leader",
      senderName: "张经理",
      content: "可以接入。我们内部用LabelStudio做标注，导出就是COCO格式。你们需要的是COCO 2017格式对吧？标注类别清单发我一下。",
      contentType: "TEXT",
    },
    {
      projectId: "project-coco-format",
      senderRole: "USER",
      senderId: "user-lin",
      senderName: "林同学",
      content: "对，COCO 2017。类别清单在项目文档里有，总共80类。另外转换时需要保留原始图像的EXIF信息，这个能做到吗？",
      contentType: "TEXT",
    },
    {
      projectId: "project-coco-format",
      senderRole: "SUPPLIER_LEADER",
      senderId: "supplier-a-leader",
      senderName: "张经理",
      content: "EXIF保留没问题，我们转COCO的时候默认就带。不过有个问题：你们原始数据里有些是PNG格式，COCO标准要求JPEG，需要我们先批量转换吗？",
      contentType: "TEXT",
    },
  ];

  for (const chat of chats) {
    await prisma.supplierChat.create({ data: chat });
  }

  console.log("Seed completed: demo projects, assets, agent actions, logs, model results, supplier chats.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
