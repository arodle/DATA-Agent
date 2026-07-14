import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const currentUser = {
  id: "user-lin",
  name: "林同学",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chatId, isValuable, category, correctedReply, note } = body;

    const existing = await prisma.chatAnnotation.findUnique({
      where: { chatId },
    });

    if (existing) {
      await prisma.chatAnnotation.update({
        where: { chatId },
        data: {
          isValuable,
          category: category || null,
          correctedReply: correctedReply || null,
          note: note || null,
          annotatedBy: currentUser.id,
          annotatedAt: new Date(),
          reviewStatus: "PENDING_ANNOTATION",
        },
      });
    } else {
      await prisma.chatAnnotation.create({
        data: {
          chatId,
          isValuable,
          category: category || null,
          correctedReply: correctedReply || null,
          note: note || null,
          annotatedBy: currentUser.id,
          reviewStatus: "PENDING_ANNOTATION",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
