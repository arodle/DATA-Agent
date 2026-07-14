import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const currentUser = { id: "user-lin", name: "林同学" };

export async function POST(req: NextRequest) {
  try {
    const { annotationId } = await req.json();
    await prisma.chatAnnotation.update({
      where: { id: annotationId },
      data: {
        reviewStatus: "REJECTED",
        reviewedBy: currentUser.id,
        reviewedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
