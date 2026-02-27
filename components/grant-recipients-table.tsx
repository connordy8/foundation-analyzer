"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrencyFull } from "@/lib/format";
import type { ClassifiedGrant } from "@/lib/types";

interface GrantRecipientsTableProps {
  grants: ClassifiedGrant[];
}

const CAUSE_COLORS: Record<string, string> = {
  "Workforce Development": "bg-ma-teal/15 text-ma-teal",
  "Adult Education": "bg-ma-mint/30 text-ma-navy",
  "AI & Technology": "bg-ma-sky/40 text-ma-navy",
  "Economic Mobility": "bg-ma-yellow/40 text-ma-navy",
  "Racial Equity & Inclusion": "bg-ma-purple/20 text-ma-navy",
  "Youth Development": "bg-ma-orange/20 text-ma-navy",
  "K-12 Education": "bg-ma-lavender/40 text-ma-navy",
  "Higher Education": "bg-ma-blue/15 text-ma-navy",
  Health: "bg-ma-pink/40 text-ma-navy",
  "Human Services": "bg-ma-pink/25 text-ma-navy",
  "Arts & Culture": "bg-ma-lavender/30 text-ma-navy",
  Environment: "bg-ma-green/15 text-ma-navy",
  "Community Development": "bg-ma-yellow/30 text-ma-navy",
  "Philanthropy & Intermediary": "bg-ma-gray-100 text-ma-gray-600",
  International: "bg-ma-sky/25 text-ma-navy",
  Other: "bg-ma-gray-100 text-ma-gray-600",
};

export function GrantRecipientsTable({ grants }: GrantRecipientsTableProps) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? grants : grants.slice(0, 15);

  if (grants.length === 0) {
    return (
      <div className="text-center text-ma-gray-500 py-12">
        No grant recipient data available.
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-semibold text-ma-navy text-sm uppercase tracking-wide mb-4">
        Top Grant Recipients
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ma-lavender/30 text-left">
              <th className="py-2 pr-4 text-ma-gray-500 font-medium w-8">#</th>
              <th className="py-2 pr-4 text-ma-gray-500 font-medium">Recipient</th>
              <th className="py-2 pr-4 text-ma-gray-500 font-medium text-right">Amount</th>
              <th className="py-2 pr-4 text-ma-gray-500 font-medium">Cause Area</th>
              <th className="py-2 text-ma-gray-500 font-medium">Purpose</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((grant, idx) => (
              <tr
                key={`${grant.recipientName}-${idx}`}
                className="border-b border-ma-gray-100 hover:bg-ma-lavender/5 transition-colors"
              >
                <td className="py-2.5 pr-4 text-ma-gray-400">{idx + 1}</td>
                <td className="py-2.5 pr-4 font-medium text-ma-navy max-w-xs truncate">
                  {grant.recipientName}
                </td>
                <td className="py-2.5 pr-4 text-right text-ma-navy whitespace-nowrap font-medium">
                  {formatCurrencyFull(grant.amount)}
                </td>
                <td className="py-2.5 pr-4">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${CAUSE_COLORS[grant.causeArea] || CAUSE_COLORS.Other}`}
                  >
                    {grant.causeArea}
                  </span>
                </td>
                <td className="py-2.5 text-ma-gray-500 max-w-sm truncate">
                  {grant.purposeText || "\u2014"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {grants.length > 15 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 text-sm text-ma-teal hover:text-ma-navy flex items-center gap-1 transition-colors font-medium"
        >
          {showAll ? (
            <>Show less <ChevronUp className="h-4 w-4" /></>
          ) : (
            <>Show all {grants.length} recipients <ChevronDown className="h-4 w-4" /></>
          )}
        </button>
      )}
    </div>
  );
}
