import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status") || "PENDING";
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

    return NextResponse.json({ success: true, chats: filtered });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, chats: [] }, { status: 500 });
  }
}
