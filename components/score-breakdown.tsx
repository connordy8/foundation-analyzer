"use client";

import type { FitScoreDimension } from "@/lib/types";

interface ScoreBreakdownProps {
  dimensions: FitScoreDimension[];
}

function getBarColor(score: number): string {
  if (score >= 70) return "bg-ma-green";
  if (score >= 50) return "bg-ma-yellow";
  if (score >= 30) return "bg-ma-orange";
  return "bg-ma-red";
}

export function ScoreBreakdown({ dimensions }: ScoreBreakdownProps) {
  const sorted = [...dimensions].sort((a, b) => b.weight - a.weight);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-ma-gray-800 text-sm uppercase tracking-wide">
        Score Breakdown
      </h3>
      {sorted.map((dim) => (
        <div key={dim.name} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-ma-gray-700">
              {dim.name}
              <span className="text-ma-gray-400 ml-1.5 text-xs font-normal">
                ({Math.round(dim.weight * 100)}%)
              </span>
            </span>
            <span className="font-semibold text-ma-gray-800">{dim.score}</span>
          </div>
          <div className="h-2 bg-ma-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getBarColor(dim.score)}`}
              style={{ width: `${dim.score}%` }}
            />
          </div>
          <p className="text-xs text-ma-gray-500">{dim.explanation}</p>
        </div>
      ))}
    </div>
  );
}
