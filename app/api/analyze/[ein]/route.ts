import { NextRequest, NextResponse } from "next/server";
import { getOrganization, getXmlObjectIds, fetchXmlContent } from "@/lib/propublica";
import { parseXmlGrants } from "@/lib/xml-parser";
import { classifyGrant } from "@/lib/ntee-codes";
import { calculateFitScore, calculateGeographicFocus } from "@/lib/scoring";
import type { AnalysisResult, CauseAreaBreakdown, ClassifiedGrant } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ein: string }> }
) {
  const { ein } = await params;

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

    // Pick the most recent filing
    const filing = filings_with_data[0];
    const formType = filing.formtype;

    // Step 2: Try to get XML for grant-level data
    let grants: ClassifiedGrant[] = [];
    let hasGrantData = false;

    try {
      const xmlIds = await getXmlObjectIds(ein);

      if (xmlIds.length > 0) {
        // Fetch the most recent XML
        const xmlContent = await fetchXmlContent(xmlIds[0]);
        const rawGrants = parseXmlGrants(xmlContent, formType);

        if (rawGrants.length > 0) {
          grants = rawGrants.map(classifyGrant);
          hasGrantData = true;
        }
      }
    } catch (xmlError) {
      console.error("XML processing error:", xmlError);
      // Continue without grant data
    }

    // Step 3: Calculate scores and breakdowns
    const fitScore = calculateFitScore(grants);
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
    const topRecipients = [...grants]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 20);

    const result: AnalysisResult = {
      organization,
      filing,
      taxYear: filing.tax_prd_yr,
      grants,
      causeAreaBreakdown,
      topRecipients,
      fitScore,
      geographicFocus,
      hasGrantData,
    };

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch (e) {
    console.error("Analysis error:", e);
    return NextResponse.json(
      { error: "Failed to analyze organization" },
      { status: 502 }
    );
  }
}
