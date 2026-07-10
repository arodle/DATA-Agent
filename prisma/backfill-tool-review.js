const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function ensureToolTemplate() {
  return prisma.toolTemplate.upsert({
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
}

async function main() {
  const template = await ensureToolTemplate();
  const projects = await prisma.project.findMany({
    include: {
      datasets: { take: 1 },
      toolConfigs: { take: 1 },
      prelabelRuns: { take: 1 },
    },
  });

  for (const project of projects) {
    const dataset = project.datasets[0];
    const status = project.currentStage === "执行" || project.operationStatus === "APPROVED" ? "APPROVED" : "WAITING_REVIEW";

    if (project.toolConfigs.length === 0) {
      await prisma.projectToolConfig.create({
        data: {
          projectId: project.id,
          templateId: template.id,
          name: `${project.name} 工具配置草稿`,
          configJson: {
            toolType: "2D_BBOX",
            classes: ["car", "person", "rider"],
            requiredAllItems: true,
            iouThreshold: 0.75,
            minBoxSize: "12px",
            attributeFields: ["occlusion", "truncation"],
          },
          previewJson: {
            sampleName: dataset?.name ?? "样例数据",
            sampleImage: "demo-road-001.jpg",
            boxCount: 5,
            estimatedPassRate: "92%",
            previewNotes: ["类别集已生成", "IoU 阈值 0.75", "需要运营确认是否保留遮挡属性"],
          },
          status,
        },
      });
    }

    if (project.prelabelRuns.length === 0) {
      await prisma.prelabelRun.create({
        data: {
          projectId: project.id,
          modelName: "YOLOv8n open-source prelabel",
          imageName: "demo-road-001.jpg",
          inputPath: dataset?.storagePath ?? "/storage/demo/vehicle-6996",
          boxCount: 5,
          status: "PREVIEW",
          resultJson: { boxes: [{ label: "car", x1: 120, y1: 80, x2: 360, y2: 220 }] },
        },
      });
    }
  }

  console.log(`Backfilled tool review data for ${projects.length} projects.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });