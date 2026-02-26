import { NextRequest, NextResponse } from "next/server";
import { getOrganization } from "@/lib/propublica";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ein: string }> }
) {
  const { ein } = await params;

  try {
    const data = await getOrganization(ein);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch (e) {
    console.error("Organization lookup error:", e);
    return NextResponse.json(
      { error: "Failed to fetch organization data" },
      { status: 502 }
    );
  }
}
