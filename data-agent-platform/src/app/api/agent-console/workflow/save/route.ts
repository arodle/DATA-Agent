import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workflowId, nodes, edges } = body;

    if (!workflowId) {
      return NextResponse.json({ success: false, error: "缺少 workflowId" }, { status: 400 });
    }

    const existing = await prisma.agentWorkflow.findUnique({ where: { id: workflowId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Workflow 不存在" }, { status: 404 });
    }

    // 1. 取出当前所有节点/连线
    const [oldNodes, oldEdges] = await Promise.all([
      prisma.agentWorkflowNode.findMany({ where: { workflowId } }),
      prisma.agentWorkflowEdge.findMany({ where: { workflowId } }),
    ]);

    const newNodeIds = new Set<string>();
    const clientToDbMap = new Map<string, string>(); // 客户端id -> dbId

    // 2. 处理每个节点
    for (const n of nodes || []) {
      const posX = Number(n.positionX) || 0;
      const posY = Number(n.positionY) || 0;

      if (n.dbId) {
        // 已有节点 -> 更新
        newNodeIds.add(n.dbId);
        await prisma.agentWorkflowNode.update({
          where: { id: n.dbId },
          data: {
            nodeType: n.nodeType, nodeName: n.nodeName,
            description: n.description || null,
            inputSchema: n.inputSchema || null,
            outputSchema: n.outputSchema || null,
            configJson: n.configJson || "{}",
            runtimeConfig: n.runtimeConfig || null,
            positionX: posX, positionY: posY,
          },
        });
        clientToDbMap.set(n.dbId, n.dbId);
      } else {
        // 新节点 -> 创建
        const created = await prisma.agentWorkflowNode.create({
          data: {
            workflowId, nodeType: n.nodeType, nodeName: n.nodeName,
            description: n.description || null,
            inputSchema: n.inputSchema || null,
            outputSchema: n.outputSchema || null,
            configJson: n.configJson || "{}",
            runtimeConfig: n.runtimeConfig || null,
            positionX: posX, positionY: posY, sortOrder: 0,
          },
        });
        newNodeIds.add(created.id);
        clientToDbMap.set(n.id || n.dbId || created.id, created.id);
      }
    }

    // 3. 删除已移除的节点
    const toDelete = oldNodes.filter((o) => !newNodeIds.has(o.id));
    if (toDelete.length > 0) {
      await prisma.agentWorkflowNode.deleteMany({ where: { id: { in: toDelete.map((n) => n.id) } } });
    }

    // 4. 处理连线
    await prisma.agentWorkflowEdge.deleteMany({ where: { workflowId } });

    let savedEdges = 0;
    for (const e of edges || []) {
      const sourceId = clientToDbMap.get(e.sourceNodeId) || e.sourceNodeId;
      const targetId = clientToDbMap.get(e.targetNodeId) || e.targetNodeId;
      // 校验两端存在
      if (!newNodeIds.has(sourceId) || !newNodeIds.has(targetId)) continue;
      await prisma.agentWorkflowEdge.create({
        data: {
          workflowId, sourceNodeId: sourceId, targetNodeId: targetId,
          sourcePort: e.sourcePort || "out", targetPort: e.targetPort || "in",
          condition: e.condition || "always", sortOrder: savedEdges,
        },
      });
      savedEdges++;
    }

    // 5. 更新 workflow 的 workflowJson 备份
    const finalNodes = await prisma.agentWorkflowNode.findMany({ where: { workflowId }, orderBy: { sortOrder: "asc" } });
    const finalEdges = await prisma.agentWorkflowEdge.findMany({ where: { workflowId }, orderBy: { sortOrder: "asc" } });

    await prisma.agentWorkflow.update({
      where: { id: workflowId },
      data: {
        workflowJson: JSON.stringify({ nodes: finalNodes, edges: finalEdges }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      savedNodes: nodes?.length || 0,
      savedEdges,
      deletedNodes: toDelete.length,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
