import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, category } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const workflow = await prisma.agentWorkflow.create({
      data: {
        name,
        category: category || "GENERAL",
        status: "DRAFT",
        currentVersion: "0.1.0",
      },
      include: {
        nodes: true,
        edges: true,
        versions: true,
      },
    });

    return NextResponse.json(workflow);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
