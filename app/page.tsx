"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { SearchBar } from "@/components/search-bar";
import { FoundationCard } from "@/components/foundation-card";
import { AnalysisDashboard } from "@/components/analysis-dashboard";
import { Loader2, BarChart3 } from "lucide-react";
import type { ProPublicaSearchOrg, AnalysisResult } from "@/lib/types";

export default function Home() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProPublicaSearchOrg[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleAnalyze = useCallback(async (org: ProPublicaSearchOrg) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyze/${org.ein}`);
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
  }, []);

  const handleBack = useCallback(() => {
    setAnalysisResult(null);
  }, []);

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="bg-ma-navy text-white py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <BarChart3 className="h-7 w-7 text-ma-teal" />
            <h1 className="text-2xl font-bold">Foundation Analyzer</h1>
          </div>
          <p className="text-ma-gray-300 text-sm ml-10">
            Analyze foundation giving patterns and Merit America funding fit
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Analysis view */}
        {analysisResult ? (
          <AnalysisDashboard result={analysisResult} onBack={handleBack} />
        ) : (
          <>
            {/* Search */}
            <div className="mb-8">
              <SearchBar
                value={query}
                onChange={handleQueryChange}
                isLoading={isSearching}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="max-w-2xl mx-auto mb-6 bg-ma-red/10 border border-ma-red/30 rounded-lg p-4 text-sm text-ma-red">
                {error}
              </div>
            )}

            {/* Analyzing overlay */}
            {isAnalyzing && (
              <div className="flex flex-col items-center gap-4 py-16">
                <Loader2 className="h-10 w-10 text-ma-teal animate-spin" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-ma-gray-800">
                    Analyzing foundation...
                  </p>
                  <p className="text-sm text-ma-gray-500 mt-1">
                    Fetching 990 data, parsing grants, and calculating fit
                    score. This may take 10-30 seconds.
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
                  <FoundationCard
                    key={org.ein}
                    org={org}
                    onClick={() => handleAnalyze(org)}
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isAnalyzing &&
              !isSearching &&
              query.length >= 2 &&
              searchResults.length === 0 &&
              !error && (
                <div className="text-center text-ma-gray-500 py-12">
                  <p>No organizations found for &quot;{query}&quot;</p>
                  <p className="text-sm mt-1">
                    Try searching by foundation name or EIN
                  </p>
                </div>
              )}

            {/* Landing state */}
            {!isAnalyzing && query.length < 2 && searchResults.length === 0 && (
              <div className="text-center py-16">
                <BarChart3 className="h-16 w-16 text-ma-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-ma-gray-700 mb-2">
                  Search for any foundation
                </h2>
                <p className="text-ma-gray-500 max-w-md mx-auto">
                  Enter a foundation name to analyze their 990 filing data,
                  see their giving composition by cause area, and calculate
                  a Merit America funding fit score.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  {[
                    "Gates Foundation",
                    "Ford Foundation",
                    "Walton Family",
                    "Bloomberg",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleQueryChange(suggestion)}
                      className="px-4 py-2 bg-white border border-ma-gray-200 rounded-full text-sm text-ma-gray-600 hover:border-ma-teal hover:text-ma-teal transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
