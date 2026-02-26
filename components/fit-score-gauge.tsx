"use client";

import { useEffect, useState } from "react";

interface FitScoreGaugeProps {
  score: number; // 0-100
}

export function FitScoreGauge({ score }: FitScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(interval);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [score]);

  // SVG arc calculation
  const radius = 80;
  const strokeWidth = 12;
  const cx = 100;
  const cy = 100;

  // Semi-circle from 180° to 0° (left to right across top)
  const startAngle = Math.PI;
  const endAngle = 0;
  const sweepAngle = startAngle - endAngle;
  const filledAngle = startAngle - (animatedScore / 100) * sweepAngle;

  const arcX1 = cx + radius * Math.cos(startAngle);
  const arcY1 = cy - radius * Math.sin(startAngle);
  const arcX2 = cx + radius * Math.cos(filledAngle);
  const arcY2 = cy - radius * Math.sin(filledAngle);

  const largeArc = animatedScore > 50 ? 1 : 0;

  const bgPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy}`;
  const fillPath =
    animatedScore > 0
      ? `M ${arcX1} ${arcY1} A ${radius} ${radius} 0 ${largeArc} 1 ${arcX2} ${arcY2}`
      : "";

  const getColor = (s: number) => {
    if (s >= 70) return "#06D6A0"; // green
    if (s >= 50) return "#FFD166"; // yellow
    if (s >= 30) return "#F77F00"; // orange
    return "#EF476F"; // red
  };

  const getLabel = (s: number) => {
    if (s >= 70) return "Strong Fit";
    if (s >= 50) return "Moderate Fit";
    if (s >= 30) return "Weak Fit";
    return "Low Fit";
  };

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-64 h-32">
        {/* Background arc */}
        <path
          d={bgPath}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Filled arc */}
        {fillPath && (
          <path
            d={fillPath}
            fill="none"
            stroke={getColor(animatedScore)}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
        {/* Score text */}
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          className="text-4xl font-bold"
          fill={getColor(animatedScore)}
          fontSize="36"
          fontWeight="700"
        >
          {animatedScore}%
        </text>
      </svg>
      <p
        className="text-lg font-semibold -mt-2"
        style={{ color: getColor(score) }}
      >
        {getLabel(score)}
      </p>
      <p className="text-sm text-ma-gray-500 mt-1">Merit America Fit Score</p>
    </div>
  );
}
