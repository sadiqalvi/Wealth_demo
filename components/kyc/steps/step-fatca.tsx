import React, { useState, useEffect, useRef } from "react";
import { KycApplication, FatcaData } from "@/lib/kyc/types";
import { Globe, RefreshCw, AlertCircle } from "lucide-react";

interface StepFatcaProps {
  application: KycApplication;
  password: string;
  onUpdateStep: (step: "fatca", payload: any) => Promise<any>;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
  onDraftUpdate?: (data: FatcaData) => void;
}

export function StepFatca({ application, password, onUpdateStep, onNext, onBack, loading, onDraftUpdate }: StepFatcaProps) {
  const [fatca, setFatca] = useState<FatcaData>({
    is_usa_person: Boolean(application.fatca?.is_usa_person),
    born_in_usa: Boolean(application.fatca?.born_in_usa),
    usa_mail_address: Boolean(application.fatca?.usa_mail_address),
    tax_residence_country: application.fatca?.tax_residence_country || "PAK",
    tin: application.fatca?.tin || application.cnic || "",
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const lastAppIdRef = useRef(application.id);

  // Debounced draft update to avoid typing glitch
  useEffect(() => {
    const timer = setTimeout(() => {
      onDraftUpdate?.(fatca);
    }, 300);
    return () => clearTimeout(timer);
  }, [fatca]);

  // Sync only if application ID changes
  useEffect(() => {
    if (application.id !== lastAppIdRef.current) {
      lastAppIdRef.current = application.id;
      if (application.fatca) {
        setFatca((p) => ({ ...p, ...application.fatca }));
      }
    }
  }, [application.id, application.fatca]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fatca.tin) {
      setErrorMsg("Please provide your Tax Identification Number (TIN) or CNIC.");
      return;
    }
    setErrorMsg(null);
    try {
      await onUpdateStep("fatca", {
        password,
        answers: fatca,
      });
      onNext();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update FATCA declarations.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Step 4: FATCA & Tax Residency (Page 55.1)</h2>
            <p className="text-xs text-slate-400">
              Foreign Account Tax Compliance Act (FATCA) and Common Reporting Standard (CRS) declaration.
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

      {/* FATCA US Indicator Questions */}
      <div className="p-4 rounded-2xl bg-[#0F0F1E] border border-slate-800/80 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">US Tax Indicia Declarations</h3>

        <div className="space-y-2.5 text-xs text-slate-300">
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
            <span>Are you a US Citizen, Green Card Holder or US Resident Alien?</span>
            <input
              type="checkbox"
              checked={fatca.is_usa_person}
              onChange={(e) => setFatca((f) => ({ ...f, is_usa_person: e.target.checked }))}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-950 border-slate-700"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
            <span>Were you born in the United States or a US Territory?</span>
            <input
              type="checkbox"
              checked={fatca.born_in_usa}
              onChange={(e) => setFatca((f) => ({ ...f, born_in_usa: e.target.checked }))}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-950 border-slate-700"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
            <span>Do you have a current US residence / mailing address or US phone number?</span>
            <input
              type="checkbox"
              checked={fatca.usa_mail_address}
              onChange={(e) => setFatca((f) => ({ ...f, usa_mail_address: e.target.checked }))}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-950 border-slate-700"
            />
          </label>
        </div>
      </div>

      {/* Tax Residence and TIN */}
      <div className="p-4 rounded-2xl bg-[#0F0F1E] border border-slate-800/80 space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Tax Identification & Jurisdiction</h3>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Primary Country of Tax Residence</label>
            <select
              value={fatca.tax_residence_country}
              onChange={(e) => setFatca((f) => ({ ...f, tax_residence_country: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
            >
              <option value="PAK">Pakistan (FBR Jurisdiction)</option>
              <option value="ARE">United Arab Emirates</option>
              <option value="SAU">Saudi Arabia</option>
              <option value="GBR">United Kingdom (HMRC)</option>
              <option value="USA">United States (IRS)</option>
            </select>
          </div>

          <div className="sm:col-span-6">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Tax Identification Number (TIN / NTN / CNIC)</label>
            <input
              type="text"
              required
              value={fatca.tin}
              onChange={(e) => setFatca((f) => ({ ...f, tin: e.target.value }))}
              placeholder="e.g. 4210136069899"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500 font-mono"
            />
          </div>
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
          Save & Proceed to Nominee (Page 54.3)
        </button>
      </div>
    </form>
  );
}
