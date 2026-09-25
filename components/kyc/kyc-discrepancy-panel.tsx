import React from "react";
import { KycApplication, DiscrepancyItem } from "@/lib/kyc/types";
import { AlertCircle, ArrowRight, CheckCircle2, FileUp, RefreshCw, ShieldAlert, Sparkles } from "lucide-react";

interface KycDiscrepancyPanelProps {
  application: KycApplication;
  onRectify: (item: DiscrepancyItem) => void;
  onRefreshStatus: () => Promise<void>;
  loading: boolean;
}

export function KycDiscrepancyPanel({ application, onRectify, onRefreshStatus, loading }: KycDiscrepancyPanelProps) {
  const discrepancies = application.discrepancies || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Discrepancy Notice Header */}
      <div className="p-5 rounded-3xl bg-amber-950/20 border border-amber-500/40 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">CDC Compliance Action Required (TBR)</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  P1_DISCREPANCY_CHECK = 1
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Central Depository Company reviewers identified discrepancies in your application that require rectification.
              </p>
            </div>
          </div>

          <button
            onClick={onRefreshStatus}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh CDC Status
          </button>
        </div>
      </div>

      {/* Flagged Items List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Flagged Discrepancies ({discrepancies.length})
        </h4>

        {discrepancies.map((disc, idx) => (
          <div
            key={`disc-${idx}`}
            className="p-5 rounded-2xl bg-[#0F0F1E] border border-rose-500/30 shadow-xl space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold uppercase">
                    {disc.section}
                  </span>
                  <span className="text-sm font-bold text-white">{disc.field_name}</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 text-xs text-rose-300 mt-2 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <span className="font-bold text-rose-200 block">Reviewer Instruction:</span>
                    {disc.note}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onRectify(disc)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 transition flex items-center gap-1.5 flex-shrink-0"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Rectify Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Post-Rectification instructions */}
      <div className="p-4 rounded-2xl bg-[#0D0D1A] border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>After uploading the replacement document, re-confirm the declaration to resubmit to CDC.</span>
        </div>
      </div>
    </div>
  );
}
