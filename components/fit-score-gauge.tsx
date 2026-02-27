"use client";

import { useEffect, useState } from "react";

interface FitScoreGaugeProps {
  score: number;
}

export function FitScoreGauge({ score }: FitScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 1200;
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

  const radius = 80;
  const strokeWidth = 14;
  const cx = 100;
  const cy = 95;

  // Semi-circle arc from left to right (180° to 0°)
  const startAngle = Math.PI;
  const sweepAngle = Math.PI;
  const filledAngle = startAngle - (animatedScore / 100) * sweepAngle;

  const arcX2 = cx + radius * Math.cos(filledAngle);
  const arcY2 = cy - radius * Math.sin(filledAngle);

  const largeArc = animatedScore > 50 ? 1 : 0;

  const bgPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy}`;
  const fillPath =
    animatedScore > 0
      ? `M ${cx - radius} ${cy} A ${radius} ${radius} 0 ${largeArc} 1 ${arcX2} ${arcY2}`
      : "";

  const getLabel = (s: number) => {
    if (s >= 70) return "Strong Fit";
    if (s >= 50) return "Moderate Fit";
    if (s >= 30) return "Weak Fit";
    return "Low Fit";
  };

  const getLabelColor = (s: number) => {
    if (s >= 70) return "#2DD7B9";
    if (s >= 50) return "#2DAFFF";
    if (s >= 30) return "#BEA0E9";
    return "#EF476F";
  };

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-72 h-[140px]">
        <defs>
          {/* Gradient for the arc */}
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EF476F" />
            <stop offset="30%" stopColor="#BEA0E9" />
            <stop offset="60%" stopColor="#2DAFFF" />
            <stop offset="100%" stopColor="#2DD7B9" />
          </linearGradient>
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background arc */}
        <path
          d={bgPath}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Filled arc with gradient */}
        {fillPath && (
          <path
            d={fillPath}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            filter="url(#glow)"
          />
        )}

        {/* Score number */}
        <text
          x={cx}
          y={cy - 20}
          textAnchor="middle"
          fontSize="40"
          fontWeight="800"
          fill="#001846"
        >
          {animatedScore}%
        </text>
      </svg>
      <p
        className="text-lg font-bold -mt-1"
        style={{ color: getLabelColor(score) }}
      >
        {getLabel(score)}
      </p>
      <p className="text-sm text-ma-gray-500 mt-0.5">Merit America Fit Score</p>
    </div>
  );
}
