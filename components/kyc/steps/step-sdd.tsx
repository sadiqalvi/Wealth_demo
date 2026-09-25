import React, { useState, useEffect } from "react";
import { KycApplication, SddData } from "@/lib/kyc/types";
import { ShieldAlert, RefreshCw, AlertCircle } from "lucide-react";

interface StepSddProps {
  application: KycApplication;
  password: string;
  onUpdateStep: (step: "sdd", payload: any) => Promise<any>;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
  onDraftUpdate?: (data: SddData) => void;
}

export function StepSdd({ application, password, onUpdateStep, onNext, onBack, loading, onDraftUpdate }: StepSddProps) {
  const [sdd, setSdd] = useState<SddData>({
    is_pep: application.sdd.is_pep || false,
    account_open_refused: application.sdd.account_open_refused || false,
    offshore_tax_links: application.sdd.offshore_tax_links || false,
    deals_precious_items: application.sdd.deals_precious_items || false,
    is_dual_national: application.sdd.is_dual_national || false,
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      onDraftUpdate?.(sdd);
    }, 300);
    return () => clearTimeout(timer);
  }, [sdd]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await onUpdateStep("sdd", {
        password,
        answers: sdd,
      });
      onNext();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update AML declarations.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Step 6: Simplified Due Diligence - SDD (Page 55.2)</h2>
            <p className="text-xs text-slate-400">
              Anti-Money Laundering (AML) and Counter Financing of Terrorism (CFT) statutory declarations.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="p-4 rounded-2xl bg-[#0F0F1E] border border-slate-800/80 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Statutory Declarations</h3>

        <div className="space-y-2.5 text-xs text-slate-300">
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
            <div>
              <span className="font-semibold text-white block">Politically Exposed Person (PEP)</span>
              <span className="text-[11px] text-slate-400">Are you, or an immediate family member, a senior government official, politician, or military officer?</span>
            </div>
            <input
              type="checkbox"
              checked={sdd.is_pep}
              onChange={(e) => setSdd((s) => ({ ...s, is_pep: e.target.checked }))}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-950 border-slate-700 ml-4 flex-shrink-0"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
            <div>
              <span className="font-semibold text-white block">Account Opening Refusal</span>
              <span className="text-[11px] text-slate-400">Has any financial institution or brokerage ever declined or closed your trading account?</span>
            </div>
            <input
              type="checkbox"
              checked={sdd.account_open_refused}
              onChange={(e) => setSdd((s) => ({ ...s, account_open_refused: e.target.checked }))}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-950 border-slate-700 ml-4 flex-shrink-0"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
            <div>
              <span className="font-semibold text-white block">Offshore Trusts & Foreign Assets</span>
              <span className="text-[11px] text-slate-400">Do you hold foreign trusts, offshore holding entities, or cross-border tax vehicles?</span>
            </div>
            <input
              type="checkbox"
              checked={sdd.offshore_tax_links}
              onChange={(e) => setSdd((s) => ({ ...s, offshore_tax_links: e.target.checked }))}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-950 border-slate-700 ml-4 flex-shrink-0"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
            <div>
              <span className="font-semibold text-white block">High-Value Dealers & Precious Stones</span>
              <span className="text-[11px] text-slate-400">Are your sources of funds tied to precious metals, stones, or high-value physical goods dealing?</span>
            </div>
            <input
              type="checkbox"
              checked={sdd.deals_precious_items}
              onChange={(e) => setSdd((s) => ({ ...s, deals_precious_items: e.target.checked }))}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-950 border-slate-700 ml-4 flex-shrink-0"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
            <div>
              <span className="font-semibold text-white block">Dual Nationality</span>
              <span className="text-[11px] text-slate-400">Do you hold citizenship or passports of two or more countries?</span>
            </div>
            <input
              type="checkbox"
              checked={sdd.is_dual_national}
              onChange={(e) => setSdd((s) => ({ ...s, is_dual_national: e.target.checked }))}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-950 border-slate-700 ml-4 flex-shrink-0"
            />
          </label>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold transition"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
        >
          {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
          Save & Proceed to Zakat (Page 54.4)
        </button>
      </div>
    </form>
  );
}
