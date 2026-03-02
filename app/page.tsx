"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { SearchBar } from "@/components/search-bar";
import { FoundationCard } from "@/components/foundation-card";
import { AnalysisDashboard } from "@/components/analysis-dashboard";
import { PreferencesPanel } from "@/components/preferences-panel";
import { Loader2, Sparkles, TrendingUp } from "lucide-react";
import type { ProPublicaSearchOrg, AnalysisResult, UserPreferences } from "@/lib/types";
import { DEFAULT_PREFERENCES } from "@/lib/types";

export default function Home() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProPublicaSearchOrg[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fa-preferences");
      if (saved) setPreferences(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  // Save preferences to localStorage
  const handlePreferencesChange = useCallback((prefs: UserPreferences) => {
    setPreferences(prefs);
    try {
      localStorage.setItem("fa-preferences", JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults(data.organizations || []);
    } catch {
      setError("Failed to search. Please try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      setAnalysisResult(null);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => search(value), 350);
    },
    [search]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleAnalyze = useCallback(
    async (org: ProPublicaSearchOrg) => {
      setIsAnalyzing(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          grantSizeMin: String(preferences.grantSizeMin),
          grantSizeMax: String(preferences.grantSizeMax),
          causeAreas: preferences.causeAreas.join(","),
          recipientType: preferences.recipientType,
        });
        const res = await fetch(`/api/analyze/${org.ein}?${params}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Analysis failed");
        }
        const data: AnalysisResult = await res.json();
        setAnalysisResult(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
      } finally {
        setIsAnalyzing(false);
      }
    },
    [preferences]
  );

  const handleBack = useCallback(() => {
    setAnalysisResult(null);
  }, []);

  return (
    <main className="min-h-screen relative">
      {/* Animated background blobs */}
      <div className="blob-container">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      {/* Header — Merit America branded */}
      <div className="bg-ma-navy text-white py-5 px-4 relative overflow-hidden">
        {/* Subtle gradient accent line at top */}
        <div className="absolute top-0 left-0 right-0 h-1 gradient-hero" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* MA-style upward triangle mark */}
              <svg viewBox="0 0 36 36" className="w-9 h-9 shrink-0">
                <polygon points="18,4 32,30 4,30" fill="#2DD7B9" opacity="0.9" />
                <polygon points="18,10 26,28 10,28" fill="#001846" opacity="0.4" />
              </svg>
              <div>
                <h1 className="ma-heading text-[22px] leading-tight">
                  <span>foundation</span>{" "}
                  <span className="ma-label">ANALYZER</span>
                </h1>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-white/50 text-xs">
              <span>powered by</span>
              <span className="text-ma-teal font-semibold">merit</span>
              <span className="text-white/70 font-semibold text-[10px] tracking-widest uppercase">America</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        {/* Analysis view */}
        {analysisResult ? (
          <AnalysisDashboard result={analysisResult} onBack={handleBack} />
        ) : (
          <>
            {/* Search */}
            <div className="mb-4">
              <SearchBar value={query} onChange={handleQueryChange} isLoading={isSearching} />
            </div>

            {/* Preferences */}
            <PreferencesPanel preferences={preferences} onChange={handlePreferencesChange} />

            {/* Error */}
            {error && (
              <div className="max-w-2xl mx-auto mb-6 glass-card p-4 text-sm text-ma-red border-l-4 border-ma-red">
                {error}
              </div>
            )}

            {/* Analyzing overlay */}
            {isAnalyzing && (
              <div className="flex flex-col items-center gap-4 py-16">
                <div className="relative">
                  <Loader2 className="h-12 w-12 text-ma-teal animate-spin" />
                  <Sparkles className="h-5 w-5 text-ma-purple absolute -top-1 -right-1 animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-ma-navy">Analyzing foundation...</p>
                  <p className="text-sm text-ma-gray-500 mt-1 max-w-md">
                    Fetching 990 data, parsing grants, scanning press coverage, and calculating your custom fit score. This may take 15-30 seconds.
                  </p>
                </div>
              </div>
            )}

            {/* Search results */}
            {!isAnalyzing && searchResults.length > 0 && (
              <div className="max-w-2xl mx-auto space-y-2">
                <p className="text-sm text-ma-gray-500 mb-3">
                  {searchResults.length} result(s) — click to analyze
                </p>
                {searchResults.map((org) => (
                  <FoundationCard key={org.ein} org={org} onClick={() => handleAnalyze(org)} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isAnalyzing && !isSearching && query.length >= 2 && searchResults.length === 0 && !error && (
              <div className="text-center text-ma-gray-500 py-12">
                <p>No organizations found for &quot;{query}&quot;</p>
                <p className="text-sm mt-1">Try searching by foundation name or EIN</p>
              </div>
            )}

            {/* Landing state */}
            {!isAnalyzing && query.length < 2 && searchResults.length === 0 && (
              <div className="text-center py-12">
                {/* MA-style triangle icon */}
                <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-ma-navy flex items-center justify-center shadow-lg">
                  <svg viewBox="0 0 40 40" className="w-10 h-10">
                    <polygon points="20,6 36,34 4,34" fill="#2DD7B9" />
                    <polygon points="20,14 28,32 12,32" fill="#001846" opacity="0.3" />
                  </svg>
                </div>
                <h2 className="ma-heading text-3xl text-ma-navy mb-4">
                  Discover your next funder
                </h2>
                <div className="max-w-2xl mx-auto space-y-3 text-ma-gray-600 leading-relaxed">
                  <p>
                    <span className="font-semibold text-ma-navy">Foundation Analyzer</span> uses publicly available IRS Form 990 data to break down any foundation&apos;s giving by cause area, surface their largest grant recipients, and scan recent press coverage for alignment signals — all from a single name search.
                  </p>
                  <p>
                    It calculates a customizable <span className="font-semibold text-ma-teal">Merit America Fit Score</span> across five dimensions — cause area alignment, grant size compatibility, prior similar funding, recipient type match, and leadership signals — with user-configurable priorities for cause areas, grant size ranges, and recipient types.
                  </p>
                  <p className="text-sm text-ma-gray-500">
                    Powered by the ProPublica Nonprofit Explorer API and IRS XML e-files. No API keys required.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-8">
                  {["Gates Foundation", "Ford Foundation", "Walton Family", "Bloomberg Philanthropies", "Ballmer Group"].map(
                    (suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleQueryChange(suggestion)}
                        className="pill-btn glass-card !bg-white/60 text-ma-navy hover:!bg-ma-teal/10 hover:text-ma-teal transition-all text-sm"
                      >
                        {suggestion}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
