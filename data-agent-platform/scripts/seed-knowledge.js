const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany();
  const qualityEvents = await prisma.qualityEvent.findMany();

  // 清空重新创建
  await prisma.knowledgeRelation.deleteMany({});
  await prisma.knowledgeEmbedding.deleteMany({});
  await prisma.knowledge.deleteMany({});

  const knowledgeData = [
    {
      title: "人体姿态标注-手腕关节点遮挡处理",
      content: "当手腕关节点被遮挡时，应根据可见部分的手臂延伸方向推断位置，并在标注属性中标记为occluded。关节点序号保持连续，不能跳号。",
      type: "标注规则",
      category: "人体姿态",
      tags: "人体姿态,关节点,遮挡处理",
      confidence: 96,
      status: "PUBLISHED",
    },
    {
      title: "OCR文本框标注边界控制规范",
      content: "文本框应紧贴文字边缘，留白不超过2像素。对于弯曲文本，应使用多边形标注而非矩形。文本框之间保持3像素以上间距。",
      type: "标注规则",
      category: "OCR",
      tags: "OCR,文本框,边界",
      confidence: 92,
      status: "PUBLISHED",
    },
    {
      title: "B003批次漏标率异常分析与改进",
      content: "PRJ-001项目B003批次漏标率从2%上升至8%。根因分析：1）新供应商培训不足；2）规范更新未及时同步。改进措施：组织规则对齐会议、建立变更通知机制。",
      type: "质量案例",
      category: "漏标",
      tags: "漏标,供应商培训,规则更新",
      confidence: 88,
      status: "PUBLISHED",
    },
    {
      title: "语音转写标注标准操作流程",
      content: "1. 接收任务 2. 试听样本 3. 熟悉规范 4. 开始标注 5. 自检 6. 提交 7. 反馈优化。每个环节都有明确的质量控制点。",
      type: "SOP流程",
      category: "标注流程",
      tags: "语音,标注,SOP",
      confidence: 98,
      status: "PUBLISHED",
    },
    {
      title: "PRJ-001项目经验总结",
      content: "项目执行3个月完成65%进度。关键成功因素：1）需求评审充分；2）供应商选择合理；3）质检机制完善。可改进：1）需求变更响应速度；2）供应商产能预警。",
      type: "项目经验",
      category: "PRJ-001",
      tags: "项目管理,供应商,质检",
      confidence: 94,
      status: "PUBLISHED",
    },
  ];

  const created = [];
  for (const data of knowledgeData) {
    const k = await prisma.knowledge.create({ data });
    created.push(k);
  }

  // 创建关联关系
  if (projects.length > 0) {
    await prisma.knowledgeRelation.create({
      data: {
        knowledgeId: created[0].id,
        relationType: "APPLY_TO",
        targetType: "Project",
        targetId: projects[0].id,
      },
    });
    await prisma.knowledgeRelation.create({
      data: {
        knowledgeId: created[2].id,
        relationType: "SOURCE_FROM",
        targetType: "Project",
        targetId: projects[0].id,
      },
    });
    await prisma.knowledgeRelation.create({
      data: {
        knowledgeId: created[2].id,
        relationType: "APPLY_TO",
        targetType: "Project",
        targetId: projects[0].id,
      },
    });
    await prisma.knowledgeRelation.create({
      data: {
        knowledgeId: created[4].id,
        relationType: "APPLY_TO",
        targetType: "Project",
        targetId: projects[0].id,
      },
    });
  }

  // 创建Embedding记录
  for (const k of created) {
    await prisma.knowledgeEmbedding.create({
      data: {
        knowledgeId: k.id,
        vectorId: `vec_${k.id.substring(0, 8)}`,
        embeddingStatus: "INDEXED",
        chunkCount: Math.floor(Math.random() * 3) + 1,
        vectorDimension: 1536,
        modelName: "text-embedding-3-small",
      },
    });
  }

  // 创建一个待审核的
  await prisma.knowledge.create({
    data: {
      title: "图像分割-边界模糊区域处理",
      content: "对于图像分割中的边界模糊区域，建议先与项目方确认标注口径，必要时标注为uncertain。",
      type: "标注规则",
      category: "图像分割",
      tags: "图像分割,边界",
      confidence: 75,
      status: "PENDING",
    },
  });

  console.log(`✅ 创建了 ${created.length} 条已发布知识 + 1 条待审核`);
  console.log(`✅ 创建了 ${await prisma.knowledgeRelation.count()} 条关联关系`);
  console.log(`✅ 创建了 ${await prisma.knowledgeEmbedding.count()} 条Embedding记录`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());