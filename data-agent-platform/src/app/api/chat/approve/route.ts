import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const currentUser = { id: "user-lin", name: "林同学" };

export async function POST(req: NextRequest) {
  try {
    const { annotationId } = await req.json();
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

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
