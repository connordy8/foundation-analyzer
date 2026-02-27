"use client";

import type { FitScoreDimension } from "@/lib/types";

interface ScoreBreakdownProps {
  dimensions: FitScoreDimension[];
}

function getBarGradient(score: number): string {
  if (score >= 70) return "from-ma-teal to-ma-mint";
  if (score >= 50) return "from-ma-blue to-ma-sky";
  if (score >= 30) return "from-ma-purple to-ma-lavender";
  return "from-ma-red to-ma-pink";
}

export function ScoreBreakdown({ dimensions }: ScoreBreakdownProps) {
  const sorted = [...dimensions].sort((a, b) => b.weight - a.weight);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-ma-navy text-sm uppercase tracking-wide">
        Score Breakdown
      </h3>
      {sorted.map((dim) => (
        <div key={dim.name} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-ma-navy">
              {dim.name}
              <span className="text-ma-gray-400 ml-1.5 text-xs font-normal">
                ({Math.round(dim.weight * 100)}%)
              </span>
            </span>
            <span className="font-bold text-ma-navy">{dim.score}</span>
          </div>
          <div className="h-2.5 bg-ma-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${getBarGradient(dim.score)} transition-all duration-700`}
              style={{ width: `${dim.score}%` }}
            />
          </div>
          <p className="text-xs text-ma-gray-500">{dim.explanation}</p>
        </div>
      ))}
    </div>
  );
}
