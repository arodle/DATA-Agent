import { auth } from "@/auth";
import { createProjectTaskActionPreview } from "@/lib/agent-action-service";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json().catch(() => ({}));
    const result = await createProjectTaskActionPreview({
      ...body,
      userId: body.userId || (session?.user as any)?.id,
    });

    return NextResponse.json({
      ok: true,
      sessionId: result.id,
      project: result.project,
      action: result.actions[0],
    });
  } catch (error: any) {
    console.error("Failed to create agent action preview", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to create preview" }, { status: 500 });
  }
}