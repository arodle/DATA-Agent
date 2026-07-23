import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import WorkspaceClient from "./WorkspaceClient";

export default async function WorkspacePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/user/workspace");
  }

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { datasets: true },
  });

  const stageMap: Record<string, string> = {
    CREATE: "创建需求",
    REVIEW: "确认方案",
    EXECUTE: "执行中",
    ACCEPTANCE: "验收",
    COMPLETED: "已完成",
  };

  const allChats = await prisma.supplierChat.findMany({
    where: { senderRole: { in: ["USER", "PM", "SUPPLIER_LEADER"] } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const supplierChats = allChats.map((chat) => ({ ...chat, createdAt: chat.createdAt.toISOString() }));
  const projectUnreadCounts: Record<string, number> = {};
  allChats.forEach((chat) => {
    if (chat.senderRole === "PM" || chat.senderRole === "SUPPLIER_LEADER") {
      projectUnreadCounts[chat.projectId] = (projectUnreadCounts[chat.projectId] || 0) + 1;
    }
  });

  const serialized = projects.map((project) => {
    const dataCount = project.datasets.reduce((sum, dataset) => sum + (dataset.itemCount ?? 0), 0);
    return {
      id: project.id,
      code: project.code,
      name: project.name,
      executionStatus: project.executionStatus,
      createdAt: project.createdAt.toISOString(),
      stage: stageMap[project.currentStage] ?? project.currentStage,
      dataCount,
      unreadCount: projectUnreadCounts[project.id] || 0,
    };
  });

  return (
    <WorkspaceClient
      projects={serialized}
      initialSupplierChats={supplierChats}
      currentUser={{
        id: session.user.id,
        name: session.user.name || "用户",
        email: session.user.email || "",
        avatarUrl: session.user.avatarUrl,
      }}
    />
  );
}
