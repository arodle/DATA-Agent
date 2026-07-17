import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const connections = await prisma.cloudConnection.findMany({
      orderBy: { createdAt: "desc" },
      include: { creator: { select: { name: true } } },
    });
    return NextResponse.json({ success: true, connections });
  } catch (e) {
    console.error("List cloud connections error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, provider, ownerOrgId, config } = body;

    // 模拟当前用户
    const creatorId = "user-lin";

    const connection = await prisma.cloudConnection.create({
      data: {
        name,
        type,
        provider,
        ownerOrgId: ownerOrgId || null,
        creatorId,
        config: config || {},
        status: "ACTIVE",
        lastTestedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, connection });
  } catch (e) {
    console.error("Create cloud connection error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
