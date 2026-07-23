import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * RAG 检索 API
 *
 * 权限过滤策略：
 * - 默认只能看到 PUBLISHED 状态的知识
 * - 如果传入 userId，需要校验该用户所属 Organization 内的关联知识
 * - 公共知识（无 project 关联的）所有用户可见
 * - 项目级知识（有关联到 Project/Task）需要校验用户对该项目的访问权限
 */
export async function POST(req: NextRequest) {
  try {
    const { query, topK = 5, userId, projectId, taskId } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "查询词不能为空" }, { status: 400 });
    }

    // 1. 解析用户所属组织（用于权限校验）
    let userOrgIds: string[] = [];
    if (userId) {
      const memberships = await prisma.organizationMember.findMany({
        where: { userId },
        select: { organizationId: true },
      });
      userOrgIds = memberships.map((m) => m.organizationId);
    }

    // 2. 查询知识（基础过滤：PUBLISHED + 关键字匹配）
    const knowledge = await prisma.knowledge.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
          { tags: { contains: query } },
        ],
      },
      include: {
        relations: { take: 10 },
        embedding: true,
      },
      take: (topK || 5) * 3, // 多取一些，后面权限过滤后会裁剪
    });

    // 3. 权限过滤：剔除用户没有权限看到的知识
    const filtered = [];
    for (const k of knowledge) {
      // 公共知识：无项目/任务关联，所有人可见
      const hasProjectBinding = k.relations.some((r) => r.targetType === "Project");
      const hasTaskBinding = k.relations.some((r) => r.targetType === "ProjectTask");

      if (!hasProjectBinding && !hasTaskBinding) {
        filtered.push(k);
        continue;
      }

      // 项目级知识：需要校验用户是否是项目成员/创建者/运营
      if (hasProjectBinding) {
        const projectIds = k.relations.filter((r) => r.targetType === "Project").map((r) => r.targetId);
        if (userId && projectIds.length > 0) {
          // 检查用户是否有权访问任一关联项目
          const accessible = await prisma.project.findFirst({
            where: {
              id: { in: projectIds },
              OR: [
                { creatorId: userId },
                { operatorId: userId },
                { members: { some: { userId } } },
                ...(userOrgIds.length > 0 ? [{ ownerOrgId: { in: userOrgIds } }] : []),
              ],
            },
          });
          if (accessible) {
            filtered.push(k);
          }
          // 没有权限则跳过
        } else {
          // 未提供 userId 时默认仅返回公共知识
        }
      }
    }

    const finalKnowledge = filtered.slice(0, topK || 5);

    // 4. 计算相关性分数
    const results = finalKnowledge.map((k) => {
      let score = 0;
      const lowerQuery = query.toLowerCase();
      if (k.title.toLowerCase().includes(lowerQuery)) score += 0.5;
      if (k.content.toLowerCase().includes(lowerQuery)) score += 0.3;
      if (k.tags && k.tags.toLowerCase().includes(lowerQuery)) score += 0.2;
      if (k.category && k.category.toLowerCase().includes(lowerQuery)) score += 0.2;
      score = Math.min(score, 0.99);
      return {
        id: k.id,
        title: k.title,
        type: k.type,
        category: k.category,
        score: score || 0.7,
        snippet: k.content.substring(0, 120) + "...",
        embeddingStatus: k.embedding?.embeddingStatus || "PENDING",
        relations: k.relations.map((r) => ({ type: r.relationType, targetType: r.targetType, targetId: r.targetId })),
      };
    }).sort((a, b) => b.score - a.score);

    return NextResponse.json({
      results,
      total: results.length,
      query,
      filtered: knowledge.length - filtered.length, // 因权限过滤掉的数量
      permissionApplied: !!userId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
