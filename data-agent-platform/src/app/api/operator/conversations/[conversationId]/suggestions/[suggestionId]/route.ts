import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function isNewRequirementSuggestion(type?: string, title?: string, content?: string) {
  const value = `${type || ""} ${title || ""} ${content || ""}`.toUpperCase();
  return value.includes("NEW_REQUIREMENT") || value.includes("REQUIREMENT_CREATE") || value.includes("CREATE_REQUIREMENT");
}

function draftTitle(body: any, fallback: string) {
  const title = String(body.suggestionTitle || body.title || "").trim();
  if (title) return title.replace(/^AI\s*/i, "").slice(0, 80);
  const content = String(body.suggestionContent || "").trim();
  return content ? content.slice(0, 80) : fallback;
}

export async function POST(req: Request, { params }: { params: Promise<{ conversationId: string; suggestionId: string }> }) {
  try {
    const session = await auth().catch(() => null);
    const { conversationId, suggestionId } = await params;
    const body = await req.json().catch(() => ({}));
    const action = body.action === "REJECT" ? "REJECT" : body.action === "MODIFY_ACCEPT" ? "MODIFY_ACCEPT" : "ACCEPT";

    const agentAction = await prisma.agentAction.findUnique({ where: { id: suggestionId } }).catch(() => null);
    if (agentAction) {
      await prisma.agentAction.update({
        where: { id: suggestionId },
        data: {
          status: action === "REJECT" ? "REJECTED" : "AUTHORIZED",
          authorizedBy: (session?.user as any)?.id,
          authorizedAt: new Date(),
          resultJson: { conversationId, action, note: body.note || null },
        },
      });
    }

    let requirement: { id: string; title: string; conversationId: string } | null = null;
    if (action !== "REJECT" && isNewRequirementSuggestion(body.suggestionType || agentAction?.actionType, body.suggestionTitle, body.suggestionContent)) {
      const requirementId = `draft-${Date.now().toString(36)}`;
      const title = draftTitle(body, "AI discovered Requirement");
      await prisma.operationLog.create({
        data: {
          projectId: agentAction?.projectId || null,
          userId: (session?.user as any)?.id,
          actorRole: "AI_AGENT",
          action: "CREATE_REQUIREMENT_DRAFT",
          detail: title,
          entityType: "REQUIREMENT",
          entityId: requirementId,
          metadata: {
            conversationId,
            requirementId,
            title,
            status: "DRAFT",
            source: "AI_SUGGESTION_ACCEPTED",
            sourceSuggestionId: suggestionId,
            sourceRequirementId: body.requirementId || null,
          },
        },
      });
      requirement = { id: requirementId, title, conversationId };
    }

    const log = await prisma.operationLog.create({
      data: {
        projectId: agentAction?.projectId || null,
        userId: (session?.user as any)?.id,
        actorRole: "OPERATOR",
        action: action === "REJECT" ? "REJECT_AI_SUGGESTION" : "ACCEPT_AI_SUGGESTION",
        detail: body.note || `AI suggestion ${action}`,
        entityType: "AI_SUGGESTION",
        entityId: suggestionId,
        metadata: {
          conversationId,
          suggestionId,
          action,
          suggestionType: body.suggestionType || agentAction?.actionType || null,
          requirementId: body.requirementId || null,
          createdRequirementId: requirement?.id || null,
        },
      },
    });

    return NextResponse.json({ ok: true, action, log, requirement });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Suggestion action failed" }, { status: 500 });
  }
}