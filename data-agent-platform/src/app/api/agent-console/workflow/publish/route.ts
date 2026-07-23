import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// 计算下一个版本号
function nextVersion(currentVersion: string): string {
  const parts = (currentVersion || "1.0.0").split(".").map((p) => parseInt(p, 10) || 0);
  while (parts.length < 3) parts.push(0);
  parts[2] = (parts[2] || 0) + 1;
  if (parts[2] >= 10) {
    parts[2] = 0;
    parts[1] = (parts[1] || 0) + 1;
  }
  if (parts[1] >= 10) {
    parts[1] = 0;
    parts[0] = (parts[0] || 0) + 1;
  }
  return parts.join(".");
}

export async function POST(req: NextRequest) {
  try {
    const { workflowId, changelog } = await req.json();
    if (!workflowId) {
      return NextResponse.json({ success: false, error: "缺少 workflowId" }, { status: 400 });
    }

    const workflow = await prisma.agentWorkflow.findUnique({
      where: { id: workflowId },
      include: { nodes: true, edges: true, versions: { where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (!workflow) {
      return NextResponse.json({ success: false, error: "Workflow 不存在" }, { status: 404 });
    }

    const newVersion = nextVersion(workflow.currentVersion);

    // 快照当前节点+连线
    const nodesSnapshot = JSON.stringify(workflow.nodes);
    const edgesSnapshot = JSON.stringify(workflow.edges);

    // 创建新版本
    const version = await prisma.agentVersion.create({
      data: {
        workflowId,
        version: newVersion,
        status: "PUBLISHED",
        changelog: changelog || "发布新版本",
        nodesSnapshot,
        edgesSnapshot,
        publishedAt: new Date(),
      },
    });

    // 更新 workflow 状态
    await prisma.agentWorkflow.update({
      where: { id: workflowId },
      data: {
        status: "PUBLISHED",
        version: newVersion,
        currentVersion: newVersion,
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, version: newVersion, versionId: version.id });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
