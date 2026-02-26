"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrencyFull } from "@/lib/format";
import type { ClassifiedGrant } from "@/lib/types";

interface GrantRecipientsTableProps {
  grants: ClassifiedGrant[];
}

const CAUSE_COLORS: Record<string, string> = {
  "Workforce Development": "bg-emerald-100 text-emerald-800",
  "Adult Education": "bg-teal-100 text-teal-800",
  "Technology & STEM": "bg-blue-100 text-blue-800",
  "Economic Mobility": "bg-amber-100 text-amber-800",
  "Racial Equity & Inclusion": "bg-purple-100 text-purple-800",
  "Youth Development": "bg-orange-100 text-orange-800",
  "K-12 Education": "bg-indigo-100 text-indigo-800",
  "Higher Education": "bg-cyan-100 text-cyan-800",
  Health: "bg-rose-100 text-rose-800",
  "Human Services": "bg-pink-100 text-pink-800",
  "Arts & Culture": "bg-fuchsia-100 text-fuchsia-800",
  Environment: "bg-green-100 text-green-800",
  "Community Development": "bg-yellow-100 text-yellow-800",
  "Philanthropy & Intermediary": "bg-gray-100 text-gray-800",
  International: "bg-sky-100 text-sky-800",
  Other: "bg-slate-100 text-slate-800",
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
      <h3 className="font-semibold text-ma-gray-800 text-sm uppercase tracking-wide mb-4">
        Top Grant Recipients
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ma-gray-200 text-left">
              <th className="py-2 pr-4 text-ma-gray-500 font-medium w-8">#</th>
              <th className="py-2 pr-4 text-ma-gray-500 font-medium">
                Recipient
              </th>
              <th className="py-2 pr-4 text-ma-gray-500 font-medium text-right">
                Amount
              </th>
              <th className="py-2 pr-4 text-ma-gray-500 font-medium">
                Cause Area
              </th>
              <th className="py-2 text-ma-gray-500 font-medium">Purpose</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((grant, idx) => (
              <tr
                key={`${grant.recipientName}-${idx}`}
                className="border-b border-ma-gray-100 hover:bg-ma-gray-50 transition-colors"
              >
                <td className="py-2.5 pr-4 text-ma-gray-400">{idx + 1}</td>
                <td className="py-2.5 pr-4 font-medium text-ma-gray-800 max-w-xs truncate">
                  {grant.recipientName}
                </td>
                <td className="py-2.5 pr-4 text-right text-ma-gray-700 whitespace-nowrap">
                  {formatCurrencyFull(grant.amount)}
                </td>
                <td className="py-2.5 pr-4">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${CAUSE_COLORS[grant.causeArea] || CAUSE_COLORS.Other}`}
                  >
                    {grant.causeArea}
                  </span>
                </td>
                <td className="py-2.5 text-ma-gray-500 max-w-sm truncate">
                  {grant.purposeText || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {grants.length > 15 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 text-sm text-ma-teal hover:text-ma-teal-light flex items-center gap-1 transition-colors"
        >
          {showAll ? (
            <>
              Show less <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Show all {grants.length} recipients{" "}
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
