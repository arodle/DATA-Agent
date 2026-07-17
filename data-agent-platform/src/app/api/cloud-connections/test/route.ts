import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, provider, config } = body;

    // mock 连接测试
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (type === "OWN_CLOUD") {
      return NextResponse.json({ success: true, message: "公司云连接成功" });
    }

    // 第三方云需要密钥
    const key = config?.accessKeyId || config?.accessKey || "";
    if (!key || key.length < 8) {
      return NextResponse.json(
        { success: false, message: "密钥无效，请检查 AccessKey / SecretKey" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: "第三方云存储连接成功" });
  } catch (e) {
    console.error("Test cloud connection error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}