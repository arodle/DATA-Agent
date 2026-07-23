import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, type, category, tags, confidence, status, sourceType, sourceId, relations } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "标题和内容不能为空" }, { status: 400 });
    }

    // 创建知识记录
    const knowledge = await prisma.knowledge.create({
      data: {
        title,
        content,
        type: type || "标注规则",
        category,
        tags,
        confidence: confidence || 80,
        status: status || "DRAFT",
        sourceType,
        sourceId,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    });

    // 创建关联关系
    if (relations && Array.isArray(relations) && relations.length > 0) {
      for (const r of relations) {
        await prisma.knowledgeRelation.create({
          data: {
            knowledgeId: knowledge.id,
            relationType: r.type || "RELATED_TO",
            targetType: r.targetType || "Project",
            targetId: r.targetId,
          },
        });
      }
    }

    // 如果是已发布状态，触发 Embedding（模拟）
    if (status === "PUBLISHED") {
      await prisma.knowledgeEmbedding.create({
        data: {
          knowledgeId: knowledge.id,
          embeddingStatus: "PROCESSING",
          modelName: "text-embedding-3-small",
        },
      });
    }

    return NextResponse.json({ success: true, knowledge });
  } catch (error: any) {
    console.error("Create knowledge error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  const list = await prisma.knowledge.findMany({
    take: 50,
    orderBy: { updatedAt: "desc" },
    include: { relations: true, embedding: true },
  });
  return NextResponse.json(list);
}