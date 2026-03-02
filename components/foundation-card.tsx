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
      className="w-full text-left bg-white border border-ma-gray-200 rounded-lg p-4 hover:border-ma-teal hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-4 w-4 text-ma-teal shrink-0" />
            <h3 className="font-semibold text-ma-gray-900 truncate">
              {org.name}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-sm text-ma-gray-500">
            {org.city && org.state && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {org.city}, {org.state}
              </span>
            )}
            <span>EIN: {formatEin(String(org.ein))}</span>
            {org.ntee_code && (
              <span className="px-2 py-0.5 bg-ma-gray-100 rounded text-xs">
                {getNteeDescription(org.ntee_code)}
              </span>
            )}
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-ma-gray-300 group-hover:text-ma-teal transition-colors shrink-0 mt-1" />
      </div>
    </button>
  );
}
