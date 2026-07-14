import { prisma } from "@/lib/prisma";
import ChatPanel from "@/components/ChatPanel";

export const dynamic = "force-dynamic";

export default async function ProjectChatPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const project = await prisma.project.findUnique({
    where: { code },
    select: { id: true, code: true, name: true },
  });

  if (!project) {
    return (
      <div className="emptyState" style={{ padding: "60px" }}>
        项目不存在
      </div>
    );
  }

  const chats = await prisma.supplierChat.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "asc" },
  });

  const initialChats = chats.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="chatPage">
      <ChatPanel
        projectId={project.id}
        projectCode={project.code}
        projectName={project.name}
        role="user"
        initialChats={initialChats as any}
      />
    </div>
  );
}
