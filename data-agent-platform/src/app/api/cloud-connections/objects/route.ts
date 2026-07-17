import { NextRequest, NextResponse } from "next/server";

const EXT_BY_PROVIDER: Record<string, string[]> = {
  OWN_CLOUD: ["jpg", "png", "mp4", "pcd", "txt"],
  THIRD_PARTY: ["jpg", "png", "json", "xml", "mp4"],
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider") || "OWN_CLOUD";
    const bucket = searchParams.get("bucket") || "default-bucket";
    const prefix = searchParams.get("prefix") || "";

    await new Promise((resolve) => setTimeout(resolve, 300));

    const exts = EXT_BY_PROVIDER[provider] || ["jpg", "png"];

    // 模拟目录和文件
    const dirs = Array.from({ length: 4 }, (_, i) => ({
      key: `${prefix}folder-${i + 1}/`,
      name: `folder-${i + 1}`,
      type: "folder",
      size: 0,
      updatedAt: new Date().toISOString(),
    }));

    const files = Array.from({ length: 12 }, (_, i) => {
      const ext = exts[i % exts.length];
      const name = `${provider === "OWN_CLOUD" ? "company" : "thirdparty"}-${bucket}-${i + 1}.${ext}`;
      return {
        key: `${prefix}${name}`,
        name,
        type: "file",
        size: Math.floor(Math.random() * 5000000) + 100000,
        updatedAt: new Date().toISOString(),
      };
    });

    return NextResponse.json({ success: true, objects: [...dirs, ...files] });
  } catch (e) {
    console.error("List objects error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}