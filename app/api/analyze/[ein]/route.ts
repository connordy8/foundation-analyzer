import { NextRequest, NextResponse } from "next/server";
import { getOrganization, getXmlObjectIds, fetchXmlContent } from "@/lib/propublica";
import { parseXmlGrants } from "@/lib/xml-parser";
import { classifyGrant } from "@/lib/ntee-codes";
import { calculateFitScore, calculateGeographicFocus } from "@/lib/scoring";
import { searchFoundationNews } from "@/lib/news-scraper";
import type { AnalysisResult, CauseAreaBreakdown, ClassifiedGrant, UserPreferences, CauseArea } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ein: string }> }
) {
  const { ein } = await params;
  const searchParams = request.nextUrl.searchParams;

  // Parse user preferences from query params
  const preferences: UserPreferences = {
    grantSizeMin: parseInt(searchParams.get("grantSizeMin") || "100000", 10),
    grantSizeMax: parseInt(searchParams.get("grantSizeMax") || "5000000", 10),
    causeAreas: searchParams.get("causeAreas")
      ? (searchParams.get("causeAreas")!.split(",") as CauseArea[])
      : ["Workforce Development", "AI & Technology", "Economic Mobility", "Adult Education", "Racial Equity & Inclusion"],
    recipientType: (searchParams.get("recipientType") as UserPreferences["recipientType"]) || "nonprofit",
  };

  try {
    // Step 1: Get organization data and filings
    const orgData = await getOrganization(ein);
    const { organization, filings_with_data } = orgData;

    if (!filings_with_data || filings_with_data.length === 0) {
      return NextResponse.json(
        { error: "No filings found for this organization" },
        { status: 404 }
      );
    }

    const filing = filings_with_data[0];
    const formType = filing.formtype;

    // Step 2: Fetch XML + news in parallel
    let grants: ClassifiedGrant[] = [];
    let hasGrantData = false;

    const [xmlResult, leadershipSignals] = await Promise.all([
      // XML grant data
      (async () => {
        try {
          const xmlIds = await getXmlObjectIds(ein);
          if (xmlIds.length > 0) {
            const xmlContent = await fetchXmlContent(xmlIds[0]);
            return parseXmlGrants(xmlContent, formType);
          }
        } catch (e) {
          console.error("XML processing error:", e);
        }
        return [];
      })(),
      // News/leadership signals
      searchFoundationNews(organization.name),
    ]);

    if (xmlResult.length > 0) {
      grants = xmlResult.map(classifyGrant);
      hasGrantData = true;
    }

    // Step 3: Calculate scores
    const fitScore = calculateFitScore(grants, leadershipSignals, preferences);
    const geographicFocus = calculateGeographicFocus(grants);

    // Step 4: Cause area breakdown
    const causeAreaMap = new Map<string, { totalDollars: number; grantCount: number; relevanceScore: number }>();
    const totalDollars = grants.reduce((sum, g) => sum + g.amount, 0);

    for (const grant of grants) {
      const existing = causeAreaMap.get(grant.causeArea) || {
        totalDollars: 0,
        grantCount: 0,
        relevanceScore: grant.relevanceScore,
      };
      existing.totalDollars += grant.amount;
      existing.grantCount += 1;
      causeAreaMap.set(grant.causeArea, existing);
    }

    const causeAreaBreakdown: CauseAreaBreakdown[] = [...causeAreaMap.entries()]
      .map(([causeArea, data]) => ({
        causeArea: causeArea as CauseAreaBreakdown["causeArea"],
        totalDollars: data.totalDollars,
        grantCount: data.grantCount,
        percentage: totalDollars > 0 ? Math.round((data.totalDollars / totalDollars) * 100) : 0,
        relevanceScore: data.relevanceScore,
      }))
      .sort((a, b) => b.totalDollars - a.totalDollars);

    // Step 5: Top recipients
    const topRecipients = [...grants].sort((a, b) => b.amount - a.amount).slice(0, 20);

    const result: AnalysisResult = {
      organization,
      filing,
      taxYear: filing.tax_prd_yr,
      grants,
      causeAreaBreakdown,
      topRecipients,
      fitScore,
      geographicFocus,
      leadershipSignals,
      hasGrantData,
    };

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch (e) {
    console.error("Analysis error:", e);
    return NextResponse.json({ error: "Failed to analyze organization" }, { status: 502 });
  }
}
