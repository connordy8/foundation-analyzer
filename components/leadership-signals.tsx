"use client";

import { Newspaper, ExternalLink, Quote, Sparkles } from "lucide-react";
import type { LeadershipSignal } from "@/lib/types";

interface LeadershipSignalsProps {
  signals: LeadershipSignal;
}

export function LeadershipSignals({ signals }: LeadershipSignalsProps) {
  if (signals.articles.length === 0 && signals.relevantQuotes.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="font-semibold text-ma-navy text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-ma-purple" />
          Leadership & Public Signals
        </h3>
        <p className="text-ma-gray-500 text-sm">
          No recent press coverage found mentioning alignment topics. This doesn&apos;t mean the foundation isn&apos;t aligned — their public communications may not be indexed or may use different terminology.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-ma-navy text-sm uppercase tracking-wide flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-ma-purple" />
          Leadership & Public Signals
        </h3>
        {signals.keywordsFound.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-ma-lavender/40 text-ma-navy text-xs font-medium">
            <Sparkles className="h-3 w-3 text-ma-purple" />
            {signals.keywordsFound.length} keyword(s) matched
          </div>
        )}
      </div>

      {/* Keywords found */}
      {signals.keywordsFound.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {signals.keywordsFound.map((kw) => (
            <span
              key={kw}
              className="px-2.5 py-0.5 rounded-full bg-ma-teal/10 text-ma-teal text-xs font-medium"
            >
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Relevant quotes */}
      {signals.relevantQuotes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-ma-gray-500 uppercase tracking-wide">
            Relevant Excerpts
          </p>
          {signals.relevantQuotes.slice(0, 3).map((quote, i) => (
            <div
              key={i}
              className="flex gap-2.5 p-3 rounded-xl bg-gradient-to-r from-ma-lavender/20 to-ma-mint/20 border border-ma-lavender/30"
            >
              <Quote className="h-4 w-4 text-ma-purple shrink-0 mt-0.5" />
              <p className="text-sm text-ma-navy leading-relaxed">
                &ldquo;{quote}&rdquo;
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Articles */}
      {signals.articles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-ma-gray-500 uppercase tracking-wide">
            Recent Articles ({signals.articles.length})
          </p>
          <div className="space-y-1.5">
            {signals.articles.slice(0, 5).map((article, i) => (
              <a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 p-2.5 rounded-lg hover:bg-ma-gray-50 transition-colors group"
              >
                <ExternalLink className="h-3.5 w-3.5 text-ma-gray-400 group-hover:text-ma-teal shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ma-navy group-hover:text-ma-teal truncate transition-colors">
                    {article.title}
                  </p>
                  <p className="text-xs text-ma-gray-400">
                    {article.source}{article.publishedDate ? ` · ${article.publishedDate}` : ""}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
