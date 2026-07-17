import { NextRequest, NextResponse } from "next/server";

const MOCK_BUCKETS: Record<string, string[]> = {
  OWN_CLOUD: [
    "company-images",
    "company-videos",
    "company-lidar",
    "company-raw-data",
    "company-dataset-prod",
  ],
  THIRD_PARTY: [
    "thirdparty-images",
    "thirdparty-annotations",
    "thirdparty-dataset",
  ],
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider") || "OWN_CLOUD";

    await new Promise((resolve) => setTimeout(resolve, 400));

    const buckets = MOCK_BUCKETS[provider] || ["default-bucket"];
    return NextResponse.json({ success: true, buckets });
  } catch (e) {
    console.error("List buckets error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}