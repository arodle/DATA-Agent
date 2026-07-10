import { prisma } from "@/lib/prisma";
import AgentConsoleClient from "./AgentConsoleClient";

export default async function AgentConsolePage() {
  const [skills, actions, sessions, tools] = await Promise.all([
    prisma.skill.findMany({
      orderBy: { usageCount: "desc" },
      take: 50,
    }),
    prisma.agentAction.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        session: {
          include: {
            project: { select: { code: true } },
          },
        },
      },
    }),
    prisma.agentSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        messages: true,
        actions: true,
      },
    }),
    prisma.projectToolConfig.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        project: { select: { code: true } },
      },
    }),
  ]);

  const serializedSkills = skills.map((s: typeof skills[0]) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    description: s.description,
    official: s.official,
    usageCount: s.usageCount,
    rating: s.rating,
  }));

  const serializedActions = actions.map((a: typeof actions[0]) => ({
    id: a.id,
    actionType: a.actionType,
    status: a.status,
    projectCode: a.session?.project?.code ?? null,
    createdAt: a.createdAt,
    authorizedAt: a.authorizedAt,
    executedAt: a.executedAt,
  }));

  const serializedSessions = sessions.map((s: typeof sessions[0]) => ({
    id: s.id,
    title: s.title,
    context: s.context,
    messageCount: s.messages.length,
    actionCount: s.actions.length,
    createdAt: s.createdAt,
  }));

  const toolTypeMap: Record<string, string> = {
    BBOX: "2D 框标注",
    SEGMENTATION: "分割标注",
    KEYPOINT: "关键点标注",
    CLASSIFICATION: "分类标注",
    COLLECTION: "数据采集",
  };

  const serializedTools = tools.map((t: typeof tools[0]) => ({
    id: t.id,
    name: t.name,
    toolType: toolTypeMap[t.status] ?? t.status,
    status: t.status,
    projectCode: t.project?.code ?? null,
    createdAt: t.createdAt,
  }));

  return (
    <AgentConsoleClient
      skills={serializedSkills}
      actions={serializedActions}
      sessions={serializedSessions}
      tools={serializedTools}
    />
  );
}
