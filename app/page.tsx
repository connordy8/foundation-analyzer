"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { SearchBar } from "@/components/search-bar";
import { FoundationCard } from "@/components/foundation-card";
import { AnalysisDashboard } from "@/components/analysis-dashboard";
import { PreferencesPanel } from "@/components/preferences-panel";
import { Loader2, Sparkles, BarChart3 } from "lucide-react";
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

      {/* Header */}
      <div className="gradient-hero text-white py-8 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-ma-navy/20" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Foundation Analyzer</h1>
              <p className="text-white/70 text-sm">
                Discover foundation giving patterns & Merit America fit
              </p>
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
                <div className="w-20 h-20 rounded-2xl gradient-hero mx-auto mb-5 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-ma-navy mb-2">
                  Search for any foundation
                </h2>
                <p className="text-ma-gray-500 max-w-lg mx-auto leading-relaxed">
                  Enter a foundation name to analyze their IRS 990 filing, see giving composition by cause area, scan recent press coverage, and calculate a custom fit score.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-6">
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
