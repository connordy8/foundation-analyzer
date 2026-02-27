import { CauseArea, Grant, ClassifiedGrant } from "./types";

// NTEE major group → cause area mapping
// Key is the first letter of the NTEE code
const NTEE_MAJOR_GROUP_MAP: Record<string, { causeArea: CauseArea; relevance: number }> = {
  A: { causeArea: "Arts & Culture", relevance: 0.05 },
  B: { causeArea: "Higher Education", relevance: 0.3 },
  C: { causeArea: "Environment", relevance: 0.05 },
  D: { causeArea: "Environment", relevance: 0.05 },
  E: { causeArea: "Health", relevance: 0.05 },
  F: { causeArea: "Health", relevance: 0.05 },
  G: { causeArea: "Health", relevance: 0.05 },
  H: { causeArea: "Health", relevance: 0.05 },
  I: { causeArea: "Human Services", relevance: 0.15 },
  J: { causeArea: "Workforce Development", relevance: 1.0 },
  K: { causeArea: "Human Services", relevance: 0.15 },
  L: { causeArea: "Human Services", relevance: 0.15 },
  M: { causeArea: "Human Services", relevance: 0.15 },
  N: { causeArea: "Human Services", relevance: 0.15 },
  O: { causeArea: "Youth Development", relevance: 0.3 },
  P: { causeArea: "Human Services", relevance: 0.2 },
  Q: { causeArea: "International", relevance: 0.1 },
  R: { causeArea: "Racial Equity & Inclusion", relevance: 0.5 },
  S: { causeArea: "Community Development", relevance: 0.4 },
  T: { causeArea: "Philanthropy & Intermediary", relevance: 0.1 },
  U: { causeArea: "AI & Technology", relevance: 0.7 },
  V: { causeArea: "Human Services", relevance: 0.15 },
  W: { causeArea: "Human Services", relevance: 0.15 },
  X: { causeArea: "Other", relevance: 0.05 },
  Y: { causeArea: "Other", relevance: 0.05 },
  Z: { causeArea: "Other", relevance: 0.05 },
};

// More specific NTEE sub-code overrides
const NTEE_SUBCODE_MAP: Record<string, { causeArea: CauseArea; relevance: number }> = {
  J2: { causeArea: "Workforce Development", relevance: 1.0 },
  J3: { causeArea: "Workforce Development", relevance: 0.9 },
  B6: { causeArea: "Adult Education", relevance: 0.9 },
  B7: { causeArea: "Adult Education", relevance: 0.85 },
  B8: { causeArea: "K-12 Education", relevance: 0.3 },
  B2: { causeArea: "K-12 Education", relevance: 0.25 },
  B3: { causeArea: "K-12 Education", relevance: 0.25 },
  B4: { causeArea: "Higher Education", relevance: 0.35 },
  B5: { causeArea: "Higher Education", relevance: 0.35 },
  B9: { causeArea: "Higher Education", relevance: 0.3 },
  P2: { causeArea: "Human Services", relevance: 0.25 },
  P8: { causeArea: "Human Services", relevance: 0.3 },
  S2: { causeArea: "Economic Mobility", relevance: 0.6 },
  S4: { causeArea: "Economic Mobility", relevance: 0.55 },
  U5: { causeArea: "AI & Technology", relevance: 0.75 },
};

// Keyword patterns for grant purpose text classification
// Each pattern is [regex, causeArea, relevanceScore]
const KEYWORD_PATTERNS: Array<[RegExp, CauseArea, number]> = [
  // Highest relevance - direct workforce development
  [/\b(workforce\s*develop|job\s*train|career\s*(train|pathway|readiness)|employment\s*train|vocational\s*train|apprentice)/i, "Workforce Development", 1.0],
  [/\b(upskill|reskill|skills?\s*train|career\s*advance|career\s*develop|job\s*place|job\s*read)/i, "Workforce Development", 0.95],
  [/\b(workforce|job\s*corps|staffing|labor\s*market|earn\s*and\s*learn)/i, "Workforce Development", 0.9],

  // High relevance - adult education
  [/\b(adult\s*edu|adult\s*learn|continuing\s*edu|GED|credential|certification\s*program|adult\s*literacy)/i, "Adult Education", 0.9],
  [/\b(postsecondary|community\s*college|two[\s-]year\s*college|technical\s*college)/i, "Adult Education", 0.8],

  // High relevance - tech training
  [/\b(tech\s*(train|edu|career|pathway)|coding|software\s*develop|data\s*(analy|scien)|cyber\s*secur|IT\s*train|digital\s*skill)/i, "AI & Technology", 0.85],
  [/\b(STEM|computer\s*science|artificial\s*intelligence|machine\s*learn)/i, "AI & Technology", 0.7],

  // Medium-high relevance - economic mobility
  [/\b(economic\s*mobil|upward\s*mobil|poverty\s*reduc|financial\s*stabil|income\s*(increas|mobil)|wage\s*gain)/i, "Economic Mobility", 0.75],
  [/\b(low[\s-]income|underserved|disadvantaged|financial\s*empower|economic\s*empower|social\s*mobil)/i, "Economic Mobility", 0.65],
  [/\b(anti[\s-]poverty|working\s*poor|livable?\s*wage|economic\s*opportunit|economic\s*secur)/i, "Economic Mobility", 0.65],

  // Medium relevance - racial equity
  [/\b(racial\s*equit|racial\s*justice|DEI|divers.*inclus|racial\s*disparit)/i, "Racial Equity & Inclusion", 0.6],
  [/\b(Black|African\s*American|Latino|Latina|Latinx|Hispanic|Indigenous|Native\s*American)\b.*\b(communit|popul|support|empower)/i, "Racial Equity & Inclusion", 0.55],
  [/\b(equity|equitable|inclusion|inclusive)\b/i, "Racial Equity & Inclusion", 0.4],

  // Medium relevance - community development
  [/\b(community\s*develop|neighborhood\s*revitaliz|economic\s*develop|small\s*business|entrepreneur)/i, "Community Development", 0.4],
  [/\b(housing|afford.*hous|homeless|shelter)/i, "Community Development", 0.25],

  // Lower relevance categories
  [/\b(youth\s*develop|young\s*(people|adult)|mentor|after[\s-]school|out[\s-]of[\s-]school)/i, "Youth Development", 0.35],
  [/\b(K[\s-]?12|elementar|middle\s*school|high\s*school|primary\s*edu|secondary\s*edu|charter\s*school)/i, "K-12 Education", 0.2],
  [/\b(college|universit|higher\s*edu|undergraduate|graduate\s*school|scholarship)/i, "Higher Education", 0.3],
  [/\b(health|medical|hospital|mental\s*health|clinic|disease|wellness)/i, "Health", 0.05],
  [/\b(human\s*service|social\s*service|social\s*work|basic\s*needs|food\s*(bank|pantry)|child\s*welfare)/i, "Human Services", 0.15],
  [/\b(arts?|culture|museum|theater|music|dance|literary|film)/i, "Arts & Culture", 0.05],
  [/\b(environment|climate|conservation|sustainab|renewable|clean\s*energy)/i, "Environment", 0.05],
  [/\b(international|global|overseas|developing\s*countr|foreign)/i, "International", 0.1],
  [/\b(philanthrop|capacity\s*build|nonprofit\s*support|grantmak|regrant|pass[\s-]through)/i, "Philanthropy & Intermediary", 0.1],
];

export function classifyGrant(grant: Grant): ClassifiedGrant {
  const text = `${grant.purposeText} ${grant.recipientName}`.toLowerCase();

  // Try keyword matching first (highest signal)
  let bestMatch: { causeArea: CauseArea; relevance: number } | null = null;

  for (const [pattern, causeArea, relevance] of KEYWORD_PATTERNS) {
    if (pattern.test(text)) {
      if (!bestMatch || relevance > bestMatch.relevance) {
        bestMatch = { causeArea, relevance };
      }
    }
  }

  if (bestMatch) {
    return { ...grant, causeArea: bestMatch.causeArea, relevanceScore: bestMatch.relevance };
  }

  // Fallback: if we have no keyword match, return "Other" with minimal relevance
  return { ...grant, causeArea: "Other", relevanceScore: 0.05 };
}

export function classifyByNteeCode(nteeCode: string): { causeArea: CauseArea; relevance: number } {
  if (!nteeCode) return { causeArea: "Other", relevance: 0.05 };

  // Try specific sub-code first (first 2 chars)
  const subCode = nteeCode.substring(0, 2).toUpperCase();
  if (NTEE_SUBCODE_MAP[subCode]) {
    return NTEE_SUBCODE_MAP[subCode];
  }

  // Fall back to major group (first char)
  const majorGroup = nteeCode.charAt(0).toUpperCase();
  if (NTEE_MAJOR_GROUP_MAP[majorGroup]) {
    return NTEE_MAJOR_GROUP_MAP[majorGroup];
  }

  return { causeArea: "Other", relevance: 0.05 };
}

export function getNteeDescription(code: string): string {
  const descriptions: Record<string, string> = {
    A: "Arts, Culture & Humanities",
    B: "Education",
    C: "Environment",
    D: "Animal-Related",
    E: "Health Care",
    F: "Mental Health & Crisis",
    G: "Disease & Disorders",
    H: "Medical Research",
    I: "Crime & Legal Related",
    J: "Employment",
    K: "Food, Agriculture & Nutrition",
    L: "Housing & Shelter",
    M: "Public Safety & Disaster",
    N: "Recreation & Sports",
    O: "Youth Development",
    P: "Human Services",
    Q: "International Affairs",
    R: "Civil Rights & Advocacy",
    S: "Community Improvement",
    T: "Philanthropy & Voluntarism",
    U: "Science & Technology",
    V: "Social Science Research",
    W: "Public & Societal Benefit",
    X: "Religion Related",
    Y: "Mutual & Membership Benefit",
    Z: "Unknown",
  };

  if (!code) return "Unknown";
  return descriptions[code.charAt(0).toUpperCase()] || "Unknown";
}
