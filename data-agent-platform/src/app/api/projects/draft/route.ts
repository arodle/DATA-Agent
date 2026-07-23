import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type DraftRequest = {
  prompt?: string;
  name?: string;
  mode?: string;
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }

    const body = await req.json() as DraftRequest;
    const prompt = body.prompt?.trim() || body.name?.trim() || "新建数据项目";
    const projectName = inferProjectName(prompt);
    const mode = body.mode || inferMode(prompt);
    const dataModality = inferModality(prompt);
    const code = await nextProjectCode();

    const orgId = await ensureOwnerOrg(session.user.id, session.user.name || "用户");

    const project = await prisma.project.create({
      data: {
        code,
        name: projectName,
        mode,
        ownerOrgId: orgId,
        creatorId: session.user.id,
        executionStatus: "DRAFT",
        operationStatus: "PENDING_REVIEW",
        currentStage: "CREATE",
        priority: "NORMAL",
        requirement: {
          create: {
            title: projectName,
            demandType: mode,
            dataModality,
            scenario: prompt,
            acceptanceCriteria: "待 Agent 根据需求补全验收标准",
            agentStructuredJson: {
              source: "workspace_agent_draft",
              prompt,
              inferredMode: mode,
              inferredModality: dataModality,
            },
          },
        },
        stages: {
          create: [
            { type: "CREATE", status: "RUNNING", summary: "需求草稿已创建", startedAt: new Date(), sortOrder: 1 },
            { type: "REVIEW", status: "PENDING", summary: "等待方案确认", sortOrder: 2 },
            { type: "EXECUTE", status: "PENDING", summary: "等待执行任务发布", sortOrder: 3 },
            { type: "ACCEPTANCE", status: "PENDING", summary: "等待验收", sortOrder: 4 },
          ],
        },
        agentSessions: {
          create: {
            userId: session.user.id,
            context: "USER_WORKSPACE_PROJECT_DRAFT",
            title: `创建项目：${projectName}`,
            messages: {
              create: [
                { role: "USER", content: prompt },
                { role: "ASSISTANT", content: `已创建项目草稿 ${code}，下一步将补全需求文档和执行方案。` },
              ],
            },
          },
        },
      },
      include: { requirement: true },
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        code: project.code,
        name: project.name,
        mode: project.mode,
        requirementId: project.requirement?.id,
      },
    });
  } catch (error) {
    console.error("Create draft project failed:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "创建项目失败" }, { status: 500 });
  }
}

async function ensureOwnerOrg(userId: string, userName: string) {
  const membership = await prisma.organizationMember.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } });
  if (membership) return membership.organizationId;

  const org = await prisma.organization.create({
    data: {
      name: `${userName}的组织`,
      type: "USER",
      description: "由工作台自动创建的项目归属组织",
      members: { create: { userId, role: "OWNER" } },
    },
  });
  return org.id;
}

async function nextProjectCode() {
  const suffix = Date.now().toString(36).toUpperCase().slice(-6);
  const code = `PRJ-${suffix}`;
  const existing = await prisma.project.findUnique({ where: { code } });
  return existing ? `PRJ-${suffix}-${Math.random().toString(36).slice(2, 4).toUpperCase()}` : code;
}

function inferProjectName(prompt: string) {
  if (/车辆|车道|道路|交通/.test(prompt)) return "城市道路车辆数据项目";
  if (/OCR|文字|票据|文档/.test(prompt)) return "OCR 文档识别数据项目";
  if (/语音|ASR|音频/.test(prompt)) return "语音识别数据项目";
  if (/垃圾|分类/.test(prompt)) return "图像分类数据项目";
  if (/采集/.test(prompt)) return "数据采集项目";
  if (/标注/.test(prompt)) return "数据标注项目";
  return `${prompt.slice(0, 18)}项目`;
}

function inferMode(prompt: string) {
  if (/采集/.test(prompt)) return "COLLECTION";
  if (/清洗/.test(prompt)) return "CLEANING";
  if (/质检|验收/.test(prompt)) return "QUALITY";
  return "ANNOTATION";
}

function inferModality(prompt: string) {
  if (/语音|ASR|音频/.test(prompt)) return "AUDIO";
  if (/文本|文字|OCR|文档/.test(prompt)) return "TEXT";
  if (/视频/.test(prompt)) return "VIDEO";
  return "IMAGE";
}
