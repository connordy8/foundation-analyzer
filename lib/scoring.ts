import {
  ClassifiedGrant,
  FitScoreDimension,
  FitScoreResult,
  GeographicFocus,
  Grant,
  LeadershipSignal,
  UserPreferences,
  DEFAULT_PREFERENCES,
  CauseArea,
} from "./types";

const MERIT_AMERICA_EIN = "842108762";

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

const UNIVERSITY_PATTERNS = /\b(university|college|institute\s*of\s*technology|school\s*of|polytechnic|academia|regent|trustee)/i;
const GOVERNMENT_PATTERNS = /\b(department\s*of|city\s*of|county\s*of|state\s*of|federal|municipal|government|agency|bureau|commission)\b/i;

const REGIONS: Record<string, string[]> = {
  Northeast: ["CT", "ME", "MA", "NH", "RI", "VT", "NJ", "NY", "PA"],
  Southeast: ["AL", "AR", "FL", "GA", "KY", "LA", "MS", "NC", "SC", "TN", "VA", "WV"],
  Midwest: ["IL", "IN", "IA", "KS", "MI", "MN", "MO", "NE", "ND", "OH", "SD", "WI"],
  Southwest: ["AZ", "NM", "OK", "TX"],
  West: ["AK", "CA", "CO", "HI", "ID", "MT", "NV", "OR", "UT", "WA", "WY"],
  "Mid-Atlantic": ["DC", "DE", "MD"],
};

export function calculateFitScore(
  grants: ClassifiedGrant[],
  leadershipSignals: LeadershipSignal,
  preferences: UserPreferences = DEFAULT_PREFERENCES
): FitScoreResult {
  const totalDollars = grants.reduce((sum, g) => sum + g.amount, 0);

  const dimensions: FitScoreDimension[] = [
    scoreCauseAreaAlignment(grants, totalDollars, preferences),
    scoreGrantSizeCompatibility(grants, preferences),
    scorePriorSimilarFunding(grants),
    scoreDirectServicePreference(grants, preferences),
    scoreLeadershipSignals(leadershipSignals),
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
  totalDollars: number,
  preferences: UserPreferences
): FitScoreDimension {
  if (totalDollars === 0) {
    return {
      name: "Cause Area Alignment",
      score: 0,
      weight: 0.40,
      explanation: "No grant data available to assess cause area alignment.",
    };
  }

  // Build dynamic relevance map from user preferences
  const selectedCauses = new Set(preferences.causeAreas);

  // Calculate weighted relevance using user's selected causes
  const weightedRelevance = grants.reduce((sum, g) => {
    const relevance = selectedCauses.has(g.causeArea) ? 1.0 : 0.1;
    return sum + g.amount * relevance;
  }, 0);
  const score = Math.round((weightedRelevance / totalDollars) * 100);

  // Find top cause area
  const causeAreaTotals = new Map<string, number>();
  for (const g of grants) {
    causeAreaTotals.set(g.causeArea, (causeAreaTotals.get(g.causeArea) || 0) + g.amount);
  }
  const topCause = [...causeAreaTotals.entries()].sort((a, b) => b[1] - a[1])[0];
  const topPct = Math.round((topCause[1] / totalDollars) * 100);

  const isTopSelected = selectedCauses.has(topCause[0] as CauseArea);

  let explanation: string;
  if (score >= 70) {
    explanation = `Strong alignment. Top cause: ${topCause[0]} (${topPct}%)${isTopSelected ? " — matches your priorities" : ""}.`;
  } else if (score >= 40) {
    explanation = `Moderate alignment. Top cause: ${topCause[0]} (${topPct}%).`;
  } else {
    explanation = `Low alignment. Primarily funds ${topCause[0]} (${topPct}%).`;
  }

  return { name: "Cause Area Alignment", score, weight: 0.40, explanation };
}

function scoreGrantSizeCompatibility(
  grants: Grant[],
  preferences: UserPreferences
): FitScoreDimension {
  if (grants.length === 0) {
    return { name: "Grant Size Fit", score: 0, weight: 0.18, explanation: "No grant data available." };
  }

  const amounts = grants.map((g) => g.amount).sort((a, b) => a - b);
  const median = amounts[Math.floor(amounts.length / 2)];
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const typical = (median + mean) / 2;

  const sweetMin = preferences.grantSizeMin;
  const sweetMax = preferences.grantSizeMax;

  let score: number;
  if (typical >= sweetMin && typical <= sweetMax) {
    score = 100;
  } else if (typical < sweetMin) {
    const ratio = typical / sweetMin;
    score = Math.round(ratio * 100);
  } else {
    score = Math.round(Math.max(60, 100 - ((typical - sweetMax) / sweetMax) * 40));
  }
  score = Math.min(100, Math.max(0, score));

  const formatAmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n}`;

  return {
    name: "Grant Size Fit",
    score,
    weight: 0.18,
    explanation: `Median: ${formatAmt(median)}, Mean: ${formatAmt(mean)}. Your target: ${formatAmt(sweetMin)}-${formatAmt(sweetMax)}.`,
  };
}

function scorePriorSimilarFunding(grants: Grant[]): FitScoreDimension {
  if (grants.length === 0) {
    return { name: "Prior Similar Funding", score: 0, weight: 0.18, explanation: "No grant data available." };
  }

  const directFunding = grants.find(
    (g) => g.recipientEin === MERIT_AMERICA_EIN || /merit\s*america/i.test(g.recipientName)
  );
  if (directFunding) {
    return {
      name: "Prior Similar Funding",
      score: 100,
      weight: 0.18,
      explanation: `Has funded Merit America directly ($${directFunding.amount.toLocaleString()}).`,
    };
  }

  const similarOrgGrants = grants.filter((g) => g.recipientEin && SIMILAR_ORG_EINS.has(g.recipientEin));
  const workforceGrants = grants.filter(
    (g) => WORKFORCE_KEYWORDS.test(g.purposeText) || WORKFORCE_KEYWORDS.test(g.recipientName)
  );

  const similarCount = similarOrgGrants.length + workforceGrants.length;
  const similarPct = similarCount / grants.length;

  let score: number;
  if (similarOrgGrants.length > 0) {
    score = Math.min(90, 50 + similarOrgGrants.length * 10 + workforceGrants.length * 5);
  } else if (workforceGrants.length > 0) {
    score = Math.min(70, Math.round(similarPct * 200));
  } else {
    score = 0;
  }

  const names = [...similarOrgGrants.map((g) => g.recipientName), ...workforceGrants.slice(0, 3).map((g) => g.recipientName)];
  const uniqueNames = [...new Set(names)].slice(0, 3);

  return {
    name: "Prior Similar Funding",
    score,
    weight: 0.18,
    explanation: score > 0 ? `Found ${similarCount} related grant(s): ${uniqueNames.join(", ") || "N/A"}.` : "No prior funding to similar organizations found.",
  };
}

function scoreDirectServicePreference(
  grants: ClassifiedGrant[],
  preferences: UserPreferences
): FitScoreDimension {
  if (grants.length === 0) {
    return { name: "Recipient Type Match", score: 0, weight: 0.14, explanation: "No grant data available." };
  }

  if (preferences.recipientType === "any") {
    return { name: "Recipient Type Match", score: 75, weight: 0.14, explanation: "No recipient type preference set — neutral score." };
  }

  let matchDollars = 0;
  let totalDollars = 0;

  for (const grant of grants) {
    const text = `${grant.recipientName} ${grant.purposeText}`;
    totalDollars += grant.amount;

    if (preferences.recipientType === "university" && UNIVERSITY_PATTERNS.test(text)) {
      matchDollars += grant.amount;
    } else if (preferences.recipientType === "government" && GOVERNMENT_PATTERNS.test(text)) {
      matchDollars += grant.amount;
    } else if (preferences.recipientType === "nonprofit") {
      // Default: anything NOT university or government is nonprofit
      if (!UNIVERSITY_PATTERNS.test(text) && !GOVERNMENT_PATTERNS.test(text)) {
        matchDollars += grant.amount;
      }
    }
  }

  const matchPct = totalDollars > 0 ? matchDollars / totalDollars : 0;
  const score = Math.round(matchPct * 100);

  const typeLabel = preferences.recipientType === "nonprofit" ? "nonprofits" : preferences.recipientType === "university" ? "universities" : "government entities";

  return {
    name: "Recipient Type Match",
    score,
    weight: 0.14,
    explanation: `${Math.round(matchPct * 100)}% of grant dollars go to ${typeLabel}.`,
  };
}

function scoreLeadershipSignals(signals: LeadershipSignal): FitScoreDimension {
  return {
    name: "Leadership & Public Signals",
    score: signals.score,
    weight: 0.10,
    explanation: signals.articles.length > 0
      ? `Found ${signals.articles.length} article(s) mentioning ${signals.keywordsFound.slice(0, 3).join(", ") || "relevant topics"}.`
      : "No recent press coverage found with alignment keywords.",
  };
}

export function calculateGeographicFocus(grants: Grant[]): GeographicFocus {
  const states = grants.map((g) => g.recipientState).filter((s): s is string => !!s);

  if (states.length === 0) {
    return { type: "National", states: [], label: "National (insufficient data)" };
  }

  const uniqueStates = [...new Set(states)];

  if (uniqueStates.length >= 10) {
    return { type: "National", states: uniqueStates, label: "National" };
  }

  for (const [region, regionStates] of Object.entries(REGIONS)) {
    const inRegion = uniqueStates.filter((s) => regionStates.includes(s));
    if (inRegion.length >= uniqueStates.length * 0.6 && uniqueStates.length < 10) {
      return { type: "Regional", states: uniqueStates, label: `Regional: ${region} (${uniqueStates.join(", ")})` };
    }
  }

  if (uniqueStates.length <= 3) {
    return { type: "Regional", states: uniqueStates, label: `Regional: ${uniqueStates.join(", ")}` };
  }

  return { type: "National", states: uniqueStates, label: `National (${uniqueStates.length} states)` };
}
