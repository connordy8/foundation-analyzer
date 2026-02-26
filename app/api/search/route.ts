import { NextRequest, NextResponse } from "next/server";
import { searchOrganizations } from "@/lib/propublica";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  const page = parseInt(request.nextUrl.searchParams.get("page") || "0", 10);

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  try {
    const results = await searchOrganizations(q.trim(), page);
    return NextResponse.json(results, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch (e) {
    console.error("Search error:", e);
    return NextResponse.json(
      { error: "Failed to search organizations" },
      { status: 502 }
    );
  }
}
