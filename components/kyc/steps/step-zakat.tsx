import React, { useState, useEffect } from "react";
import { KycApplication, ZakatData } from "@/lib/kyc/types";
import { Moon, RefreshCw, AlertCircle, Info } from "lucide-react";

interface StepZakatProps {
  application: KycApplication;
  password: string;
  onUpdateStep: (step: "zakat", payload: any) => Promise<any>;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
  onDraftUpdate?: (data: ZakatData) => void;
}

export function StepZakat({ application, password, onUpdateStep, onNext, onBack, loading, onDraftUpdate }: StepZakatProps) {
  const [zakat, setZakat] = useState<ZakatData>({
    status: application.zakat.status || "5",
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      onDraftUpdate?.(zakat);
    }, 300);
    return () => clearTimeout(timer);
  }, [zakat]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await onUpdateStep("zakat", {
        password,
        answers: zakat,
      });
      onNext();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update Zakat status.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Moon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Step 7: Zakat Exemption Status (Page 54.4)</h2>
            <p className="text-xs text-slate-400">
              Declare your Zakat deduction preference for dividend payouts and Sukuk profit distributions.
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

      <div className="p-4 rounded-2xl bg-[#0F0F1E] border border-slate-800/80 space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Zakat Deduction Category</h3>

        <div className="space-y-3">
          <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
            zakat.status === "5"
              ? "bg-indigo-600/10 border-indigo-500/50 text-white"
              : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
          }`}>
            <input
              type="radio"
              name="zakat_status"
              value="5"
              checked={zakat.status === "5"}
              onChange={(e: any) => setZakat({ status: e.target.value })}
              className="mt-0.5 text-indigo-600 focus:ring-0"
            />
            <div>
              <div className="text-xs font-bold">Muslim — Zakat Deductible (Code 5)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Standard 2.5% statutory deduction applied on eligible cash balances on 1st Ramadan / dividend distributions.
              </div>
            </div>
          </label>

          <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
            zakat.status === "6"
              ? "bg-indigo-600/10 border-indigo-500/50 text-white"
              : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
          }`}>
            <input
              type="radio"
              name="zakat_status"
              value="6"
              checked={zakat.status === "6"}
              onChange={(e: any) => setZakat({ status: e.target.value })}
              className="mt-0.5 text-indigo-600 focus:ring-0"
            />
            <div>
              <div className="text-xs font-bold">Muslim — Non-Deductible (Code 6 - CZ-50 Exemption)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Exempt under Rule 20 of Zakat Collection Rules. Requires uploading a notarized CZ-50 declaration in Step 8.
              </div>
            </div>
          </label>

          <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
            zakat.status === "7"
              ? "bg-indigo-600/10 border-indigo-500/50 text-white"
              : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
          }`}>
            <input
              type="radio"
              name="zakat_status"
              value="7"
              checked={zakat.status === "7"}
              onChange={(e: any) => setZakat({ status: e.target.value })}
              className="mt-0.5 text-indigo-600 focus:ring-0"
            />
            <div>
              <div className="text-xs font-bold">Non-Muslim / Not Applicable (Code 7)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Exempt as a non-Muslim investor. Requires religious declaration affidavit.
              </div>
            </div>
          </label>
        </div>

        {zakat.status !== "5" && (
          <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>Note: You will be prompted to upload proof of exemption (CZ-50 / Affidavit) in the next step.</span>
          </div>
        )}
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
          Save & Proceed to Documents (Page 67)
        </button>
      </div>
    </form>
  );
}
