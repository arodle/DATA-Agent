const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany();
  const users = await prisma.user.findMany();

  if (projects.length === 0 || users.length === 0) {
    console.log("需要先创建项目和用户数据");
    return;
  }

  await prisma.operationLog.deleteMany({});

  const logs = [
    {
      action: "创建项目",
      detail: "创建项目 PRJ-001 语音转写数据标注项目",
      actorRole: "OPERATOR",
      userId: users[0].id,
      projectId: projects[0].id,
      createdAt: new Date("2026-07-05T09:30:00"),
    },
    {
      action: "更新项目状态",
      detail: "项目 PRJ-001 状态变更为 IN_PROGRESS",
      actorRole: "OPERATOR",
      userId: users[0].id,
      projectId: projects[0].id,
      createdAt: new Date("2026-07-06T10:15:00"),
    },
    {
      action: "分配任务",
      detail: "将批次 B001 分配给供应商 SUP-001",
      actorRole: "AGENT",
      userId: users[0].id,
      projectId: projects[0].id,
      createdAt: new Date("2026-07-07T11:00:00"),
    },
    {
      action: "审核通过",
      detail: "审核通过 PRJ-001 第一批数据交付",
      actorRole: "OPERATOR",
      userId: users[0].id,
      projectId: projects[0].id,
      createdAt: new Date("2026-07-08T14:30:00"),
    },
    {
      action: "创建质量事件",
      detail: "PRJ-001 B003批次漏标率异常，需返工处理",
      actorRole: "SUPPLIER",
      userId: users[0].id,
      projectId: projects[0].id,
      createdAt: new Date("2026-07-09T15:45:00"),
    },
    {
      action: "更新需求",
      detail: "更新语音转写标注规则v3",
      actorRole: "OPERATOR",
      userId: users[0].id,
      projectId: projects[0].id,
      createdAt: new Date("2026-07-10T16:20:00"),
    },
    {
      action: "Agent调用",
      detail: "项目分析Agent查询 PRJ-001 进度",
      actorRole: "AGENT",
      userId: users[0].id,
      projectId: projects[0].id,
      createdAt: new Date("2026-07-10T17:00:00"),
    },
    {
      action: "创建知识",
      detail: "发布知识「人体姿态-手腕关节点遮挡处理规则」",
      actorRole: "OPERATOR",
      userId: users[0].id,
      projectId: projects[0].id,
      createdAt: new Date("2026-07-10T17:30:00"),
    },
  ];

  for (const log of logs) {
    await prisma.operationLog.create({
      data: log,
    });
  }

  console.log(`✅ 创建了 ${logs.length} 条操作日志`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());