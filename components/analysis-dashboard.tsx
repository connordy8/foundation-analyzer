"use client";

import { ArrowLeft, Globe, MapPin, FileText, DollarSign, TrendingUp, Building2 } from "lucide-react";
import { FitScoreGauge } from "./fit-score-gauge";
import { ScoreBreakdown } from "./score-breakdown";
import { CauseAreaChart } from "./cause-area-chart";
import { GrantRecipientsTable } from "./grant-recipients-table";
import { LeadershipSignals } from "./leadership-signals";
import { formatCurrency, formatEin, getFormTypeName } from "@/lib/format";
import { getNteeDescription } from "@/lib/ntee-codes";
import type { AnalysisResult } from "@/lib/types";

interface AnalysisDashboardProps {
  result: AnalysisResult;
  onBack: () => void;
}

export function AnalysisDashboard({ result, onBack }: AnalysisDashboardProps) {
  const { organization, filing, fitScore, causeAreaBreakdown, topRecipients, geographicFocus, leadershipSignals, hasGrantData, taxYear } = result;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={onBack}
          className="mt-1 p-2 rounded-xl hover:bg-ma-lavender/20 transition-colors text-ma-gray-500"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-ma-navy">{organization.name}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-ma-gray-500">
            <span>EIN: {formatEin(String(organization.ein))}</span>
            {organization.city && organization.state && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {organization.city}, {organization.state}
              </span>
            )}
            {organization.ntee_code && (
              <span className="px-2.5 py-0.5 bg-ma-lavender/30 rounded-full text-xs">
                {getNteeDescription(organization.ntee_code)}
              </span>
            )}
            <span className="px-2.5 py-0.5 gradient-score text-white rounded-full text-xs font-medium">
              Form {getFormTypeName(filing.formtype)} | FY{taxYear}
            </span>
          </div>
        </div>
      </div>

      {/* Financial summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<DollarSign className="h-4 w-4" />} label="Total Revenue" value={formatCurrency(filing.totrevenue || 0)} gradient="from-ma-teal/10 to-ma-mint/10" />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Total Expenses" value={formatCurrency(filing.totfuncexpns || 0)} gradient="from-ma-purple/10 to-ma-lavender/10" />
        <StatCard icon={<Building2 className="h-4 w-4" />} label="Total Assets" value={formatCurrency(filing.totassetsend || 0)} gradient="from-ma-blue/10 to-ma-sky/10" />
        <StatCard
          icon={<FileText className="h-4 w-4" />}
          label="Grants Analyzed"
          value={hasGrantData ? `${fitScore.grantCount}` : "N/A"}
          subtitle={hasGrantData ? formatCurrency(fitScore.totalGrantDollars) : undefined}
          gradient="from-ma-yellow/10 to-ma-pink/10"
        />
      </div>

      {/* Geographic focus tag */}
      <div className="flex items-center gap-2">
        {geographicFocus.type === "National" ? (
          <Globe className="h-4 w-4 text-ma-teal" />
        ) : (
          <MapPin className="h-4 w-4 text-ma-purple" />
        )}
        <span className="text-sm font-medium text-ma-navy">Geographic Focus:</span>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            geographicFocus.type === "National"
              ? "bg-ma-teal/10 text-ma-teal"
              : "bg-ma-purple/10 text-ma-purple"
          }`}
        >
          {geographicFocus.label}
        </span>
      </div>

      {!hasGrantData && (
        <div className="glass-card p-4 text-sm text-ma-navy border-l-4 border-ma-yellow">
          <strong>Note:</strong> No XML e-file data was available for this organization. The fit score is based on limited data. Check the{" "}
          <a href={filing.pdf_url} target="_blank" rel="noopener noreferrer" className="text-ma-teal underline font-medium">
            PDF filing
          </a>{" "}
          for complete details.
        </div>
      )}

      {/* Fit Score + Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6 flex items-center justify-center">
          <FitScoreGauge score={fitScore.overallScore} />
        </div>
        <div className="glass-card p-6">
          <ScoreBreakdown dimensions={fitScore.dimensions} />
        </div>
      </div>

      {/* Leadership Signals */}
      <LeadershipSignals signals={leadershipSignals} />

      {/* Cause area chart */}
      {hasGrantData && (
        <div className="glass-card p-6">
          <CauseAreaChart breakdown={causeAreaBreakdown} />
        </div>
      )}

      {/* Grant recipients table */}
      {hasGrantData && (
        <div className="glass-card p-6">
          <GrantRecipientsTable grants={topRecipients} />
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
  gradient,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  gradient: string;
}) {
  return (
    <div className={`glass-card p-4 bg-gradient-to-br ${gradient}`}>
      <div className="flex items-center gap-2 text-ma-gray-500 mb-1">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-bold text-ma-navy">{value}</p>
      {subtitle && <p className="text-xs text-ma-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}
