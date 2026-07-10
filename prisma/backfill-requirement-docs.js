const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function docVersionsFor(projectCode, projectName) {
  const isVehicle = projectCode === "P-20260708-001" || projectName.includes("车辆") || projectName.includes("2D");
  if (isVehicle) {
    return [
      {
        version: "V1.0",
        fileName: "vehicle-requirement-v1.pdf",
        url: "/requirements/vehicle-requirement-v1.pdf",
        status: "历史版本",
        updatedAt: "2026-07-08 09:30",
        author: "用户",
        changeNote: "初版需求，描述车辆 2D 框标注范围。",
      },
      {
        version: "V1.1",
        fileName: "vehicle-requirement-v2.pdf",
        url: "/requirements/vehicle-requirement-v2.pdf",
        status: "当前版本",
        updatedAt: "2026-07-08 10:20",
        author: "运营审核",
        changeNote: "明确上传数据原则上全部完成，并补充漏标、框偏移、类别错误验收关注点。",
      },
    ];
  }

  return [
    {
      version: "V1.0",
      fileName: "default-requirement-v1.pdf",
      url: "/requirements/default-requirement-v1.pdf",
      status: "当前版本",
      updatedAt: "2026-07-08 09:00",
      author: "用户",
      changeNote: "项目创建时生成的需求文档初版。",
    },
  ];
}

async function main() {
  const requirements = await prisma.projectRequirement.findMany({ include: { project: true } });

  for (const requirement of requirements) {
    const existing = requirement.agentStructuredJson && typeof requirement.agentStructuredJson === "object" && !Array.isArray(requirement.agentStructuredJson)
      ? requirement.agentStructuredJson
      : {};
    const versions = docVersionsFor(requirement.project.code, requirement.project.name);
    const current = versions[versions.length - 1];

    await prisma.projectRequirement.update({
      where: { id: requirement.id },
      data: {
        rawDocumentUrl: current.url,
        agentStructuredJson: {
          ...existing,
          documentVersions: versions,
          currentDocumentVersion: current.version,
          documentReviewStatus: requirement.project.currentStage === "创建" ? "待用户授权" : "已进入流程",
        },
      },
    });
  }

  console.log(`Backfilled requirement document versions for ${requirements.length} requirements.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });