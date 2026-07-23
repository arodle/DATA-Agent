import { auth } from "@/auth";
import { generateProjectRetrospective } from "@/lib/retrospective-service";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const session = await auth();
    const { projectId } = await params;
    const result = await generateProjectRetrospective(projectId, (session?.user as any)?.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    console.error("Failed to generate project retrospective", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to generate project retrospective" }, { status: 500 });
  }
}
