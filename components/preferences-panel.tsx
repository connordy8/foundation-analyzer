"use client";

import { useState } from "react";
import { Settings2, ChevronDown, ChevronUp } from "lucide-react";
import type { UserPreferences, CauseArea, RecipientType } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface PreferencesPanelProps {
  preferences: UserPreferences;
  onChange: (prefs: UserPreferences) => void;
}

const CAUSE_OPTIONS: { label: string; value: CauseArea; color: string }[] = [
  { label: "AI & Technology", value: "AI & Technology", color: "bg-ma-sky text-ma-navy" },
  { label: "Workforce Dev", value: "Workforce Development", color: "bg-ma-teal/20 text-ma-navy" },
  { label: "Economic Mobility", value: "Economic Mobility", color: "bg-ma-yellow/60 text-ma-navy" },
  { label: "Adult Education", value: "Adult Education", color: "bg-ma-mint/60 text-ma-navy" },
  { label: "Racial Equity", value: "Racial Equity & Inclusion", color: "bg-ma-purple/30 text-ma-navy" },
  { label: "K-12 Education", value: "K-12 Education", color: "bg-ma-lavender/60 text-ma-navy" },
  { label: "Higher Education", value: "Higher Education", color: "bg-ma-blue/20 text-ma-navy" },
  { label: "Health", value: "Health", color: "bg-ma-pink/60 text-ma-navy" },
  { label: "Environment", value: "Environment", color: "bg-ma-green/20 text-ma-navy" },
  { label: "Arts & Culture", value: "Arts & Culture", color: "bg-ma-orange/20 text-ma-navy" },
];

const RECIPIENT_OPTIONS: { label: string; value: RecipientType }[] = [
  { label: "Nonprofits", value: "nonprofit" },
  { label: "Universities", value: "university" },
  { label: "Government", value: "government" },
  { label: "Any", value: "any" },
];

const GRANT_SIZE_STOPS = [10_000, 50_000, 100_000, 250_000, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000];

function findClosestIndex(value: number): number {
  let closest = 0;
  let minDiff = Math.abs(GRANT_SIZE_STOPS[0] - value);
  for (let i = 1; i < GRANT_SIZE_STOPS.length; i++) {
    const diff = Math.abs(GRANT_SIZE_STOPS[i] - value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = i;
    }
  }
  return closest;
}

export function PreferencesPanel({ preferences, onChange }: PreferencesPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleCauseArea = (cause: CauseArea) => {
    const current = new Set(preferences.causeAreas);
    if (current.has(cause)) {
      current.delete(cause);
    } else {
      current.add(cause);
    }
    onChange({ ...preferences, causeAreas: [...current] });
  };

  const minIdx = findClosestIndex(preferences.grantSizeMin);
  const maxIdx = findClosestIndex(preferences.grantSizeMax);

  return (
    <div className="max-w-2xl mx-auto mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-full glass-card hover:shadow-md transition-all text-sm font-medium text-ma-navy"
      >
        <Settings2 className="h-4 w-4 text-ma-teal" />
        Customize your search
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="mt-4 glass-card p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Cause Area Priorities */}
          <div>
            <label className="text-sm font-semibold text-ma-navy block mb-3">
              Cause Area Priorities
              <span className="font-normal text-ma-gray-500 ml-2">Select what matters to you</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CAUSE_OPTIONS.map((opt) => {
                const selected = preferences.causeAreas.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleCauseArea(opt.value)}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selected
                        ? `${opt.color} ring-2 ring-ma-teal shadow-sm`
                        : "bg-ma-gray-100 text-ma-gray-400 hover:bg-ma-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grant Size Range */}
          <div>
            <label className="text-sm font-semibold text-ma-navy block mb-3">
              Grant Size Sweet Spot
              <span className="font-normal text-ma-gray-500 ml-2">
                {formatCurrency(preferences.grantSizeMin)} – {formatCurrency(preferences.grantSizeMax)}
              </span>
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-xs text-ma-gray-500 mb-1 block">Min</label>
                <input
                  type="range"
                  min={0}
                  max={GRANT_SIZE_STOPS.length - 1}
                  value={minIdx}
                  onChange={(e) => {
                    const idx = parseInt(e.target.value, 10);
                    const val = GRANT_SIZE_STOPS[idx];
                    if (val < preferences.grantSizeMax) {
                      onChange({ ...preferences, grantSizeMin: val });
                    }
                  }}
                  className="w-full accent-ma-teal"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-ma-gray-500 mb-1 block">Max</label>
                <input
                  type="range"
                  min={0}
                  max={GRANT_SIZE_STOPS.length - 1}
                  value={maxIdx}
                  onChange={(e) => {
                    const idx = parseInt(e.target.value, 10);
                    const val = GRANT_SIZE_STOPS[idx];
                    if (val > preferences.grantSizeMin) {
                      onChange({ ...preferences, grantSizeMax: val });
                    }
                  }}
                  className="w-full accent-ma-purple"
                />
              </div>
            </div>
          </div>

          {/* Recipient Type */}
          <div>
            <label className="text-sm font-semibold text-ma-navy block mb-3">
              Primary Recipient Type
            </label>
            <div className="flex gap-2">
              {RECIPIENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onChange({ ...preferences, recipientType: opt.value })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    preferences.recipientType === opt.value
                      ? "gradient-score text-white shadow-sm"
                      : "bg-ma-gray-100 text-ma-gray-500 hover:bg-ma-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
