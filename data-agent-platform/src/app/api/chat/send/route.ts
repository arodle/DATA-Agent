import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, content, senderRole } = body;

    const chat = await prisma.supplierChat.create({
      data: {
        projectId,
        senderRole: senderRole || "USER",
        senderId: "user-lin",
        senderName: senderRole === "USER" ? "林同学" : "供应商联系人",
        content,
        contentType: "TEXT",
      },
    });

    return NextResponse.json({ success: true, chat });
  } catch (e) {
    console.error("Chat API error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
