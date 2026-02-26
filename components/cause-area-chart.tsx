"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/format";
import type { CauseAreaBreakdown } from "@/lib/types";

interface CauseAreaChartProps {
  breakdown: CauseAreaBreakdown[];
}

const COLORS = [
  "#00B4D8", // teal
  "#06D6A0", // green
  "#FFD166", // yellow
  "#F77F00", // orange
  "#EF476F", // red
  "#118AB2", // blue
  "#073B4C", // dark blue
  "#8338EC", // purple
  "#FF006E", // pink
  "#3A86FF", // bright blue
  "#94A3B8", // gray
  "#FB5607", // bright orange
];

interface TooltipPayloadItem {
  payload: {
    causeArea: string;
    totalDollars: number;
    grantCount: number;
    percentage: number;
  };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white border border-ma-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-ma-gray-800">{data.causeArea}</p>
      <p className="text-ma-gray-600">
        {formatCurrency(data.totalDollars)} ({data.percentage}%)
      </p>
      <p className="text-ma-gray-500">{data.grantCount} grant(s)</p>
    </div>
  );
}

export function CauseAreaChart({ breakdown }: CauseAreaChartProps) {
  if (breakdown.length === 0) {
    return (
      <div className="text-center text-ma-gray-500 py-12">
        No grant data available for cause area analysis.
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-semibold text-ma-gray-800 text-sm uppercase tracking-wide mb-4">
        Giving by Cause Area
      </h3>
      <div className="flex items-start gap-6">
        <div className="w-64 h-64 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={breakdown}
                dataKey="totalDollars"
                nameKey="causeArea"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={50}
              >
                {breakdown.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-1.5 min-w-0">
          {breakdown.map((item, index) => (
            <div key={item.causeArea} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-ma-gray-700 truncate flex-1">
                {item.causeArea}
              </span>
              <span className="text-ma-gray-500 shrink-0">
                {item.percentage}%
              </span>
              <span className="text-ma-gray-400 shrink-0 text-xs">
                {formatCurrency(item.totalDollars)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
