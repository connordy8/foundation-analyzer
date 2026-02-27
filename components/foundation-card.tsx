"use client";

import { Building2, MapPin, ArrowRight } from "lucide-react";
import { formatEin } from "@/lib/format";
import { getNteeDescription } from "@/lib/ntee-codes";
import type { ProPublicaSearchOrg } from "@/lib/types";

interface FoundationCardProps {
  org: ProPublicaSearchOrg;
  onClick: () => void;
}

export function FoundationCard({ org, onClick }: FoundationCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left glass-card p-4 hover:shadow-lg hover:scale-[1.01] transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-full gradient-score flex items-center justify-center shrink-0">
              <Building2 className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="font-semibold text-ma-navy truncate">{org.name}</h3>
          </div>
          <div className="flex items-center gap-3 text-sm text-ma-gray-500 ml-9">
            {org.city && org.state && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {org.city}, {org.state}
              </span>
            )}
            <span>EIN: {formatEin(String(org.ein))}</span>
            {org.ntee_code && (
              <span className="px-2 py-0.5 bg-ma-lavender/30 rounded-full text-xs">
                {getNteeDescription(org.ntee_code)}
              </span>
            )}
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-ma-gray-300 group-hover:text-ma-teal group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
      </div>
    </button>
  );
}
