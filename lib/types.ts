// ProPublica API types

export interface ProPublicaSearchOrg {
  ein: number;
  name: string;
  city: string;
  state: string;
  ntee_code: string;
  subseccd: number;
  score: number;
}

export interface ProPublicaSearchResult {
  total_results: number;
  organizations: ProPublicaSearchOrg[];
}

export interface ProPublicaOrganization {
  ein: number;
  name: string;
  careofname: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  ntee_code: string;
  subseccd: number;
  classification_codes: string;
  ruling_date: string;
  tax_period: number;
  asset_amt: number;
  income_amt: number;
  revenue_amt: number;
  sort_name: string;
}

export interface ProPublicaFiling {
  ein: number;
  tax_prd: number;
  tax_prd_yr: number;
  formtype: number; // 0=990, 1=990-EZ, 2=990-PF
  pdf_url: string;
  totrevenue: number;
  totfuncexpns: number;
  totassetsend: number;
  totliabend: number;
  totcntrbgfts: number;
  prgmservrev: number;
  invstmntinc: number;
  txexmptbndsproceeds: number;
  royaltsinc: number;
  grsrntsreal: number;
  grsrntsprsnl: number;
  netgnls: number;
  grsincfndrsng: number;
  grsincgaming: number;
  grsalesminusret: number;
  othrevnue: number;
  compnsatncurrofcr: number;
  othrsalwages: number;
  payrolltx: number;
  profndraising: number;
  totnetassetend: number;
}

export interface ProPublicaOrgResponse {
  organization: ProPublicaOrganization;
  filings_with_data: ProPublicaFiling[];
  filings_without_data: Array<{
    ein: number;
    tax_prd: number;
    tax_prd_yr: number;
    formtype: number;
    pdf_url: string;
  }>;
}

// Grant data parsed from XML

export interface Grant {
  recipientName: string;
  recipientEin?: string;
  amount: number;
  purposeText: string;
  recipientState?: string;
  recipientCity?: string;
}

// Cause area classification

export type CauseArea =
  | "Workforce Development"
  | "Adult Education"
  | "AI & Technology"
  | "Economic Mobility"
  | "Racial Equity & Inclusion"
  | "Youth Development"
  | "K-12 Education"
  | "Higher Education"
  | "Health"
  | "Human Services"
  | "Arts & Culture"
  | "Environment"
  | "Community Development"
  | "Philanthropy & Intermediary"
  | "International"
  | "Other";

export interface ClassifiedGrant extends Grant {
  causeArea: CauseArea;
  relevanceScore: number;
}

// User preferences for customizable scoring

export type RecipientType = "nonprofit" | "university" | "government" | "any";

export interface UserPreferences {
  grantSizeMin: number;   // e.g. 100000
  grantSizeMax: number;   // e.g. 5000000
  causeAreas: CauseArea[]; // selected cause areas get relevance=1.0
  recipientType: RecipientType;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  grantSizeMin: 100_000,
  grantSizeMax: 5_000_000,
  causeAreas: ["Workforce Development", "AI & Technology", "Economic Mobility", "Adult Education", "Racial Equity & Inclusion"],
  recipientType: "nonprofit",
};

// Scoring types

export interface FitScoreDimension {
  name: string;
  score: number; // 0-100
  weight: number; // 0-1
  explanation: string;
}

export interface FitScoreResult {
  overallScore: number; // 0-100
  dimensions: FitScoreDimension[];
  grantCount: number;
  totalGrantDollars: number;
}

export interface GeographicFocus {
  type: "National" | "Regional";
  states: string[];
  label: string;
}

export interface CauseAreaBreakdown {
  causeArea: CauseArea;
  totalDollars: number;
  grantCount: number;
  percentage: number;
  relevanceScore: number;
}

// Leadership signals / news scraping

export interface NewsArticle {
  title: string;
  url: string;
  publishedDate: string;
  source: string;
  snippet: string;
}

export interface LeadershipSignal {
  articles: NewsArticle[];
  relevantQuotes: string[];
  keywordsFound: string[];
  score: number; // 0-100
}

// Full analysis result

export interface AnalysisResult {
  organization: ProPublicaOrganization;
  filing: ProPublicaFiling;
  taxYear: number;
  grants: ClassifiedGrant[];
  causeAreaBreakdown: CauseAreaBreakdown[];
  topRecipients: ClassifiedGrant[];
  fitScore: FitScoreResult;
  geographicFocus: GeographicFocus;
  leadershipSignals: LeadershipSignal;
  hasGrantData: boolean;
}
