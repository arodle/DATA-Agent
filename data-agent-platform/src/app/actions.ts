"use server";

import { prisma } from "@/lib/prisma";

const currentUser = {
  id: "user-lin",
  name: "林同学",
  email: "lirenxuan@example.com",
  organizationId: "org-autolab",
  role: "USER",
};

export async function createDraftProject(data: any) {
  try {
    const result = await prisma.project.create({
      data: {
        code: data.code,
        name: data.name,
        mode: data.mode,
        ownerOrgId: data.ownerOrgId,
        creatorId: data.creatorId,
        executionStatus: "DRAFT",
        currentStage: "CREATE",
        priority: data.priority || "NORMAL",
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate) : null,
        budgetName: data.budgetName || null,
        budgetAmount: data.budgetAmount || null,
      },
    });
    return { success: true, projectId: result.id };
  } catch (e) {
    console.error("Failed to create project:", e);
    return { success: false, error: String(e) };
  }
}

export async function submitAgentMessage(sessionId: string, content: string) {
  try {
    const session = await prisma.agentSession.update({
      where: { id: sessionId },
      data: {
        messages: {
          create: {
            role: "USER",
            content,
          },
        },
      },
      include: { messages: true },
    });

    const lastAssistant = session.messages
      .filter((m) => m.role === "ASSISTANT")
      .slice(-1)[0];

    return {
      success: true,
      reply: lastAssistant?.content || "已收到您的消息，正在分析中。",
    };
  } catch (e) {
    console.error("Failed to submit message:", e);
    return { success: false, error: String(e) };
  }
}

export async function authorizeAgentPreview(actionId: string) {
  try {
    await prisma.agentAction.update({
      where: { id: actionId },
      data: {
        status: "AUTHORIZED",
        authorizedBy: currentUser.id,
        authorizedAt: new Date(),
      },
    });
    return { success: true };
  } catch (e) {
    console.error("Failed to authorize action:", e);
    return { success: false, error: String(e) };
  }
}

export async function approveToolReview(configId: string) {
  try {
    const config = await prisma.projectToolConfig.update({
      where: { id: configId },
      data: { status: "APPROVED" },
      include: { project: true },
    });

    await prisma.project.update({
      where: { id: config.projectId },
      data: {
        executionStatus: "SELF_RUNNING",
        currentStage: "EXECUTE",
      },
    });

    return { success: true };
  } catch (e) {
    console.error("Failed to approve tool:", e);
    return { success: false, error: String(e) };
  }
}

export async function sendSupplierChat(
  projectId: string,
  content: string,
  senderRole: string = "USER",
) {
  try {
    const chat = await prisma.supplierChat.create({
      data: {
        projectId,
        senderRole,
        senderId: currentUser.id,
        senderName: senderRole === "USER" ? currentUser.name : "供应商联系人",
        content,
        contentType: "TEXT",
      },
    });
    return { success: true, chat };
  } catch (e) {
    console.error("Failed to send chat:", e);
    return { success: false, error: String(e) };
  }
}

export async function getSupplierChats(projectId: string) {
  try {
    const chats = await prisma.supplierChat.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });
    return { success: true, chats };
  } catch (e) {
    console.error("Failed to get chats:", e);
    return { success: false, chats: [] };
  }
}

export async function getChatsForAnnotation(status?: string) {
  try {
    const where: any = {};
    const chats = await prisma.supplierChat.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        project: { select: { code: true, name: true } },
        annotation: true,
      },
    });

    let filtered = chats;
    if (status === "PENDING") {
      filtered = chats.filter((c) => !c.annotation);
    } else if (status === "ANNOTATED") {
      filtered = chats.filter(
        (c) => c.annotation && c.annotation.reviewStatus === "PENDING_ANNOTATION",
      );
    } else if (status === "REVIEWED") {
      filtered = chats.filter(
        (c) =>
          c.annotation &&
          ["APPROVED", "REJECTED"].includes(c.annotation.reviewStatus),
      );
    }

    return { success: true, chats: filtered };
  } catch (e) {
    console.error("Failed to get chats for annotation:", e);
    return { success: false, chats: [] };
  }
}

export async function annotateChat(
  chatId: string,
  data: {
    isValuable: boolean;
    category?: string;
    correctedReply?: string;
    note?: string;
  },
) {
  try {
    const existing = await prisma.chatAnnotation.findUnique({
      where: { chatId },
    });

    if (existing) {
      await prisma.chatAnnotation.update({
        where: { chatId },
        data: {
          isValuable: data.isValuable,
          category: data.category || null,
          correctedReply: data.correctedReply || null,
          note: data.note || null,
          annotatedBy: currentUser.id,
          annotatedAt: new Date(),
          reviewStatus: "PENDING_ANNOTATION",
        },
      });
    } else {
      await prisma.chatAnnotation.create({
        data: {
          chatId,
          isValuable: data.isValuable,
          category: data.category || null,
          correctedReply: data.correctedReply || null,
          note: data.note || null,
          annotatedBy: currentUser.id,
          reviewStatus: "PENDING_ANNOTATION",
        },
      });
    }
    return { success: true };
  } catch (e) {
    console.error("Failed to annotate chat:", e);
    return { success: false, error: String(e) };
  }
}

export async function approveAnnotation(annotationId: string) {
  try {
    const annotation = await prisma.chatAnnotation.update({
      where: { id: annotationId },
      data: {
        reviewStatus: "APPROVED",
        reviewedBy: currentUser.id,
        reviewedAt: new Date(),
      },
      include: { chat: true },
    });

    if (annotation.isValuable) {
      const training = await prisma.agentTrainingExample.create({
        data: {
          sourceType: "SUPPLIER_CHAT",
          sourceId: annotation.chatId,
          category: annotation.category || undefined,
          input: annotation.chat.content,
          expectedOutput: annotation.correctedReply || annotation.chat.content,
          context: `项目ID: ${annotation.chat.projectId}`,
          approved: true,
        },
      });

      await prisma.chatAnnotation.update({
        where: { id: annotationId },
        data: { trainingId: training.id },
      });
    }

    return { success: true };
  } catch (e) {
    console.error("Failed to approve annotation:", e);
    return { success: false, error: String(e) };
  }
}

export async function rejectAnnotation(annotationId: string) {
  try {
    await prisma.chatAnnotation.update({
      where: { id: annotationId },
      data: {
        reviewStatus: "REJECTED",
        reviewedBy: currentUser.id,
        reviewedAt: new Date(),
      },
    });
    return { success: true };
  } catch (e) {
    console.error("Failed to reject annotation:", e);
    return { success: false, error: String(e) };
  }
}

export async function getTrainingExamples(limit: number = 50) {
  try {
    const examples = await prisma.agentTrainingExample.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return { success: true, examples };
  } catch (e) {
    console.error("Failed to get training examples:", e);
    return { success: false, examples: [] };
  }
}
