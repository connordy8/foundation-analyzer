import {
  ClassifiedGrant,
  FitScoreDimension,
  FitScoreResult,
  GeographicFocus,
  Grant,
} from "./types";

const MERIT_AMERICA_EIN = "842108762";

// EINs of similar workforce dev organizations
const SIMILAR_ORG_EINS = new Set([
  "842108762", // Merit America
  "133807722", // Year Up
  "271436100", // Per Scholas
  "474139557", // Generation USA
  "813026506", // Opportunity@Work
  "412111590", // JFF (Jobs for the Future)
  "061540907", // Goodwill Industries International
  "521719000", // National Urban League
  "530196605", // UnidosUS (formerly NCLR)
  "133798043", // Robin Hood Foundation
]);

const WORKFORCE_KEYWORDS =
  /\b(workforce|job\s*train|career\s*(train|pathway|readiness)|employment\s*train|upskill|reskill|skills?\s*train|vocational|apprentice|career\s*develop|earn\s*and\s*learn)\b/i;

// Region definitions for geographic focus
const REGIONS: Record<string, string[]> = {
  Northeast: ["CT", "ME", "MA", "NH", "RI", "VT", "NJ", "NY", "PA"],
  Southeast: ["AL", "AR", "FL", "GA", "KY", "LA", "MS", "NC", "SC", "TN", "VA", "WV"],
  Midwest: ["IL", "IN", "IA", "KS", "MI", "MN", "MO", "NE", "ND", "OH", "SD", "WI"],
  Southwest: ["AZ", "NM", "OK", "TX"],
  West: ["AK", "CA", "CO", "HI", "ID", "MT", "NV", "OR", "UT", "WA", "WY"],
  "Mid-Atlantic": ["DC", "DE", "MD"],
};

export function calculateFitScore(grants: ClassifiedGrant[]): FitScoreResult {
  const totalDollars = grants.reduce((sum, g) => sum + g.amount, 0);

  const dimensions: FitScoreDimension[] = [
    scoreCauseAreaAlignment(grants, totalDollars),
    scoreGrantSizeCompatibility(grants),
    scorePriorSimilarFunding(grants),
    scoreDirectServicePreference(grants),
  ];

  const overallScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * d.weight, 0)
  );

  return {
    overallScore: Math.min(100, Math.max(0, overallScore)),
    dimensions,
    grantCount: grants.length,
    totalGrantDollars: totalDollars,
  };
}

function scoreCauseAreaAlignment(
  grants: ClassifiedGrant[],
  totalDollars: number
): FitScoreDimension {
  if (totalDollars === 0) {
    return {
      name: "Cause Area Alignment",
      score: 0,
      weight: 0.45,
      explanation: "No grant data available to assess cause area alignment.",
    };
  }

  // Weighted average: sum(amount * relevanceScore) / totalDollars * 100
  const weightedRelevance = grants.reduce(
    (sum, g) => sum + g.amount * g.relevanceScore,
    0
  );
  const score = Math.round((weightedRelevance / totalDollars) * 100);

  // Find the top cause area by dollars
  const causeAreaTotals = new Map<string, number>();
  for (const g of grants) {
    causeAreaTotals.set(
      g.causeArea,
      (causeAreaTotals.get(g.causeArea) || 0) + g.amount
    );
  }
  const topCause = [...causeAreaTotals.entries()].sort((a, b) => b[1] - a[1])[0];

  let explanation: string;
  if (score >= 70) {
    explanation = `Strong alignment. Top cause area: ${topCause[0]} (${Math.round((topCause[1] / totalDollars) * 100)}% of giving).`;
  } else if (score >= 40) {
    explanation = `Moderate alignment. Top cause area: ${topCause[0]} (${Math.round((topCause[1] / totalDollars) * 100)}% of giving).`;
  } else {
    explanation = `Low alignment. Primarily funds ${topCause[0]} (${Math.round((topCause[1] / totalDollars) * 100)}% of giving).`;
  }

  return { name: "Cause Area Alignment", score, weight: 0.45, explanation };
}

function scoreGrantSizeCompatibility(grants: Grant[]): FitScoreDimension {
  if (grants.length === 0) {
    return {
      name: "Grant Size Fit",
      score: 0,
      weight: 0.2,
      explanation: "No grant data available.",
    };
  }

  const amounts = grants.map((g) => g.amount).sort((a, b) => a - b);
  const median = amounts[Math.floor(amounts.length / 2)];
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const typical = (median + mean) / 2;

  // Sweet spot: $100K - $5M. Gaussian-like scoring.
  const sweetMin = 100_000;
  const sweetMax = 5_000_000;

  let score: number;
  if (typical >= sweetMin && typical <= sweetMax) {
    score = 100;
  } else if (typical < sweetMin) {
    // Below sweet spot: score decreases as grants get smaller
    const ratio = typical / sweetMin;
    score = Math.round(ratio * 100);
  } else {
    // Above sweet spot: still decent (big foundations can give at any level)
    score = Math.round(Math.max(60, 100 - ((typical - sweetMax) / sweetMax) * 40));
  }

  score = Math.min(100, Math.max(0, score));

  const formatAmt = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(0)}K`
        : `$${n}`;

  return {
    name: "Grant Size Fit",
    score,
    weight: 0.2,
    explanation: `Median grant: ${formatAmt(median)}, Mean: ${formatAmt(mean)}. Merit America's sweet spot is $100K-$5M.`,
  };
}

function scorePriorSimilarFunding(grants: Grant[]): FitScoreDimension {
  if (grants.length === 0) {
    return {
      name: "Prior Similar Funding",
      score: 0,
      weight: 0.2,
      explanation: "No grant data available.",
    };
  }

  // Check for direct Merit America funding
  const directFunding = grants.find(
    (g) =>
      g.recipientEin === MERIT_AMERICA_EIN ||
      /merit\s*america/i.test(g.recipientName)
  );
  if (directFunding) {
    return {
      name: "Prior Similar Funding",
      score: 100,
      weight: 0.2,
      explanation: `Has funded Merit America directly ($${directFunding.amount.toLocaleString()}).`,
    };
  }

  // Check for similar org funding
  const similarOrgGrants = grants.filter(
    (g) => g.recipientEin && SIMILAR_ORG_EINS.has(g.recipientEin)
  );

  // Check for workforce keywords in grant purposes
  const workforceGrants = grants.filter(
    (g) => WORKFORCE_KEYWORDS.test(g.purposeText) || WORKFORCE_KEYWORDS.test(g.recipientName)
  );

  const totalGrants = grants.length;
  const similarCount = similarOrgGrants.length + workforceGrants.length;
  const similarPct = similarCount / totalGrants;

  let score: number;
  if (similarOrgGrants.length > 0) {
    // Funded known similar orgs - strong signal
    score = Math.min(90, 50 + similarOrgGrants.length * 10 + workforceGrants.length * 5);
  } else if (workforceGrants.length > 0) {
    // Has workforce-related grants
    score = Math.min(70, Math.round(similarPct * 200));
  } else {
    score = 0;
  }

  const names = [
    ...similarOrgGrants.map((g) => g.recipientName),
    ...workforceGrants.slice(0, 3).map((g) => g.recipientName),
  ];
  const uniqueNames = [...new Set(names)].slice(0, 3);

  let explanation: string;
  if (score > 0) {
    explanation = `Found ${similarCount} related grant(s). Similar recipients: ${uniqueNames.join(", ") || "N/A"}.`;
  } else {
    explanation = "No prior funding to workforce development organizations found.";
  }

  return { name: "Prior Similar Funding", score, weight: 0.2, explanation };
}

function scoreDirectServicePreference(grants: ClassifiedGrant[]): FitScoreDimension {
  if (grants.length === 0) {
    return {
      name: "Direct Service Preference",
      score: 0,
      weight: 0.15,
      explanation: "No grant data available.",
    };
  }

  const directServicePattern =
    /\b(program|service|training|participant|client|student|learner|direct|provide|deliver|operate|enroll)/i;
  const intermediaryPattern =
    /\b(regrant|pass[\s-]through|sub[\s-]grant|intermediar|fiscal\s*sponsor|redistribute|capacity\s*build|advocacy|research|policy|convening)/i;

  let directDollars = 0;
  let intermediaryDollars = 0;

  for (const grant of grants) {
    const text = `${grant.purposeText} ${grant.recipientName}`;
    const isDirect = directServicePattern.test(text);
    const isIntermediary = intermediaryPattern.test(text);

    if (isDirect && !isIntermediary) {
      directDollars += grant.amount;
    } else if (isIntermediary && !isDirect) {
      intermediaryDollars += grant.amount;
    } else {
      // Ambiguous - count as half direct
      directDollars += grant.amount * 0.5;
      intermediaryDollars += grant.amount * 0.5;
    }
  }

  const total = directDollars + intermediaryDollars;
  const directPct = total > 0 ? directDollars / total : 0.5;
  const score = Math.round(directPct * 100);

  return {
    name: "Direct Service Preference",
    score,
    weight: 0.15,
    explanation: `${Math.round(directPct * 100)}% of grant dollars appear directed to service-delivery organizations.`,
  };
}

export function calculateGeographicFocus(grants: Grant[]): GeographicFocus {
  const states = grants
    .map((g) => g.recipientState)
    .filter((s): s is string => !!s);

  if (states.length === 0) {
    return { type: "National", states: [], label: "National (insufficient data)" };
  }

  const uniqueStates = [...new Set(states)];

  if (uniqueStates.length >= 10) {
    return { type: "National", states: uniqueStates, label: "National" };
  }

  // Determine if concentrated in a region
  for (const [region, regionStates] of Object.entries(REGIONS)) {
    const inRegion = uniqueStates.filter((s) => regionStates.includes(s));
    if (inRegion.length >= uniqueStates.length * 0.6 && uniqueStates.length < 10) {
      return {
        type: "Regional",
        states: uniqueStates,
        label: `Regional: ${region} (${uniqueStates.join(", ")})`,
      };
    }
  }

  if (uniqueStates.length <= 3) {
    return {
      type: "Regional",
      states: uniqueStates,
      label: `Regional: ${uniqueStates.join(", ")}`,
    };
  }

  return {
    type: "National",
    states: uniqueStates,
    label: `National (${uniqueStates.length} states)`,
  };
}
