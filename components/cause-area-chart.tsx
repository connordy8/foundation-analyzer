"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/format";
import type { CauseAreaBreakdown } from "@/lib/types";

interface CauseAreaChartProps {
  breakdown: CauseAreaBreakdown[];
}

// MA-aligned psychedelic palette
const COLORS = [
  "#2DD7B9", // teal
  "#BEA0E9", // purple
  "#2DAFFF", // blue
  "#FEE898", // yellow
  "#FBCFCF", // pink
  "#91F0DF", // mint
  "#B8E4FF", // sky
  "#DFCFF4", // lavender
  "#F7A072", // orange
  "#EF476F", // red
  "#001846", // navy
  "#71C8FF", // bright blue
];

interface TooltipPayloadItem {
  payload: {
    causeArea: string;
    totalDollars: number;
    grantCount: number;
    percentage: number;
  };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="glass-card !rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-ma-navy">{data.causeArea}</p>
      <p className="text-ma-gray-600">{formatCurrency(data.totalDollars)} ({data.percentage}%)</p>
      <p className="text-ma-gray-400">{data.grantCount} grant(s)</p>
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
      <h3 className="font-semibold text-ma-navy text-sm uppercase tracking-wide mb-4">
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
                innerRadius={55}
                strokeWidth={2}
                stroke="rgba(255,255,255,0.8)"
              >
                {breakdown.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-ma-navy truncate flex-1">{item.causeArea}</span>
              <span className="text-ma-gray-500 shrink-0 font-medium">{item.percentage}%</span>
              <span className="text-ma-gray-400 shrink-0 text-xs">{formatCurrency(item.totalDollars)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
