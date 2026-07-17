import { prisma } from "@/lib/prisma";
import WorkspaceClient from "./WorkspaceClient";

export default async function WorkspacePage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: {
      datasets: true,
    },
  });

  const stageMap: Record<string, string> = {
    CREATE: "创建需求",
    REVIEW: "确认方案",
    EXECUTE: "执行中",
    ACCEPTANCE: "验收",
    COMPLETED: "已完成",
  };

  const allChats = await prisma.supplierChat.findMany({
    where: {
      senderRole: { in: ["USER", "PM", "SUPPLIER_LEADER"] },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const supplierChats = allChats.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  const projectUnreadCounts: Record<string, number> = {};
  allChats.forEach((chat) => {
    if (chat.senderRole === "PM" || chat.senderRole === "SUPPLIER_LEADER") {
      projectUnreadCounts[chat.projectId] = (projectUnreadCounts[chat.projectId] || 0) + 1;
    }
  });

  const serialized = projects.map((p: typeof projects[0]) => {
    const dataCount = p.datasets.reduce((s, d) => s + (d.itemCount ?? 0), 0);
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      executionStatus: p.executionStatus,
      createdAt: p.createdAt.toISOString(),
      stage: stageMap[p.currentStage] ?? p.currentStage,
      dataCount,
      unreadCount: projectUnreadCounts[p.id] || 0,
    };
  });

  return (
    <WorkspaceClient
      projects={serialized}
      initialSupplierChats={supplierChats as any}
    />
  );
}
