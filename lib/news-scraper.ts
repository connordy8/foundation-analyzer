import { XMLParser } from "fast-xml-parser";
import type { NewsArticle, LeadershipSignal } from "./types";

const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });

const ALIGNMENT_KEYWORDS = [
  "workforce development",
  "workforce",
  "job training",
  "career pathways",
  "upward mobility",
  "economic mobility",
  "upskilling",
  "reskilling",
  "skills training",
  "adult education",
  "artificial intelligence",
  "AI training",
  "AI workforce",
  "digital skills",
  "tech training",
  "coding bootcamp",
  "American Dream",
  "income mobility",
  "economic opportunity",
  "merit america",
];

// Decode Google News RSS redirect URLs
function decodeGoogleNewsUrl(url: string): string {
  // Google News wraps URLs - try to extract the real URL
  if (url.includes("news.google.com/rss/articles/")) {
    // These are encoded and can't easily be decoded without following the redirect
    return url;
  }
  try {
    const parsed = new URL(url);
    const realUrl = parsed.searchParams.get("url") || parsed.searchParams.get("u");
    if (realUrl) return realUrl;
  } catch {
    // ignore
  }
  return url;
}

export async function searchFoundationNews(foundationName: string): Promise<LeadershipSignal> {
  const articles: NewsArticle[] = [];
  const relevantQuotes: string[] = [];
  const keywordsFound = new Set<string>();

  try {
    // Search Google News RSS for the foundation + alignment topics
    const searchTerms = [
      "workforce",
      "education",
      "AI",
      "economic mobility",
      "skills training",
    ];
    const query = `"${foundationName}" (${searchTerms.join(" OR ")})`;
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&when=6m&ceid=US:en&hl=en-US&gl=US`;

    const rssRes = await fetch(rssUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FoundationAnalyzer/1.0)" },
      signal: AbortSignal.timeout(10000),
    });

    if (rssRes.ok) {
      const rssXml = await rssRes.text();
      const parsed = parser.parse(rssXml);

      const items = parsed?.rss?.channel?.item;
      const itemArray = Array.isArray(items) ? items : items ? [items] : [];

      for (const item of itemArray.slice(0, 10)) {
        const title = typeof item.title === "string" ? item.title : "";
        const link = typeof item.link === "string" ? decodeGoogleNewsUrl(item.link) : "";
        const pubDate = typeof item.pubDate === "string" ? item.pubDate : "";
        const source = typeof item.source === "object" ? item.source["#text"] || "" : typeof item.source === "string" ? item.source : "";
        const description = typeof item.description === "string" ? item.description : "";

        // Clean HTML from description
        const snippet = description.replace(/<[^>]*>/g, "").trim();

        articles.push({
          title,
          url: link,
          publishedDate: pubDate ? new Date(pubDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
          source,
          snippet,
        });
      }
    }
  } catch (e) {
    console.error("News RSS fetch error:", e);
  }

  // Try to fetch content from the first few articles to extract quotes
  const articlesToFetch = articles.slice(0, 3);
  for (const article of articlesToFetch) {
    try {
      if (!article.url || article.url.includes("news.google.com")) continue;

      const pageRes = await fetch(article.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; FoundationAnalyzer/1.0)" },
        signal: AbortSignal.timeout(8000),
      });

      if (!pageRes.ok) continue;
      const html = await pageRes.text();

      // Extract text content from article body
      const textContent = extractArticleText(html);

      // Find sentences containing alignment keywords
      const sentences = textContent.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 30 && s.length < 500);

      for (const sentence of sentences) {
        const lower = sentence.toLowerCase();
        for (const keyword of ALIGNMENT_KEYWORDS) {
          if (lower.includes(keyword.toLowerCase())) {
            keywordsFound.add(keyword);
            if (relevantQuotes.length < 5) {
              // Clean up the sentence
              const cleaned = sentence.replace(/\s+/g, " ").trim();
              if (cleaned.length > 40 && !relevantQuotes.includes(cleaned)) {
                relevantQuotes.push(cleaned);
              }
            }
          }
        }
      }
    } catch {
      // Skip failed article fetches
    }
  }

  // Also check article titles and snippets for keywords
  for (const article of articles) {
    const text = `${article.title} ${article.snippet}`.toLowerCase();
    for (const keyword of ALIGNMENT_KEYWORDS) {
      if (text.includes(keyword.toLowerCase())) {
        keywordsFound.add(keyword);
      }
    }
  }

  // Calculate score
  const score = calculateNewsScore(articles.length, relevantQuotes.length, keywordsFound.size);

  return {
    articles: articles.slice(0, 8),
    relevantQuotes,
    keywordsFound: [...keywordsFound],
    score,
  };
}

function extractArticleText(html: string): string {
  // Remove script, style, nav, header, footer elements
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "");

  // Try to get article or main content first
  const articleMatch = text.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const contentArea = articleMatch?.[1] || mainMatch?.[1] || text;

  // Extract paragraph text
  const paragraphs: string[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = pRegex.exec(contentArea)) !== null) {
    const pText = match[1].replace(/<[^>]*>/g, "").trim();
    if (pText.length > 20) {
      paragraphs.push(pText);
    }
  }

  return paragraphs.join(". ");
}

function calculateNewsScore(
  articleCount: number,
  quoteCount: number,
  keywordCount: number
): number {
  if (articleCount === 0) return 0;

  let score = 0;

  // Article volume (up to 40 points)
  if (articleCount >= 5) score += 40;
  else if (articleCount >= 3) score += 30;
  else if (articleCount >= 1) score += 15;

  // Relevant quotes found (up to 35 points)
  if (quoteCount >= 3) score += 35;
  else if (quoteCount >= 1) score += 20;
  else score += 5; // articles exist but no deep quotes

  // Keyword diversity (up to 25 points)
  if (keywordCount >= 5) score += 25;
  else if (keywordCount >= 3) score += 18;
  else if (keywordCount >= 1) score += 10;

  return Math.min(100, score);
}
