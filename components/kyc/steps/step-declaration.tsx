import React, { useState } from "react";
import { KycApplication } from "@/lib/kyc/types";
import { ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Lock, Sparkles } from "lucide-react";

interface StepDeclarationProps {
  application: KycApplication;
  password: string;
  onUpdateStep: (step: "declaration", payload: any) => Promise<any>;
  onBack: () => void;
  loading: boolean;
  onDraftUpdate?: (data: any) => void;
}

export function StepDeclaration({ application, password, onUpdateStep, onBack, loading, onDraftUpdate }: StepDeclarationProps) {
  const [applicantName, setApplicantName] = useState(
    application.personal.full_name || "AHMED YOUSAF ELVI"
  );
  const [docsConfirmed, setDocsConfirmed] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName || !docsConfirmed || !termsAccepted) {
      setErrorMsg("Please accept all statutory terms and verify your legal name.");
      return;
    }
    setErrorMsg(null);
    try {
      await onUpdateStep("declaration", {
        password,
        dialog_url: "/cdc/cgp/r/centralized-gateway-portal/declaration",
        applicant_name: applicantName,
        documents_confirmed: docsConfirmed,
        declaration_accepted: termsAccepted,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit final declaration to CDC.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Step 10: Final Statutory Declaration (Page 86)</h2>
            <p className="text-xs text-slate-400">
              Submit your signed compliance declaration to Central Depository Company of Pakistan (CDC).
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

      {/* Declaration Terms Box */}
      <div className="p-4 rounded-2xl bg-[#0F0F1E] border border-slate-800 space-y-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed max-h-48 overflow-y-auto">
          <p className="font-bold text-white uppercase text-[11px]">Terms & Conditions / Statutory Undertaking:</p>
          <p>
            1. I hereby solemnly affirm and declare that the information supplied in this Centralized Gateway Portal (CGP) application is true, accurate, and complete to the best of my knowledge.
          </p>
          <p>
            2. I authorize CDC and my designated securities broker to verify my CNIC and biometric records with NADRA Verisys and banking details via 1-Link 1-IBFT.
          </p>
          <p>
            3. I acknowledge that falsification of any material fact constitutes a punishable offense under SECP regulations and the Securities Act.
          </p>
          <p>
            4. I agree to receive official notices, ledger statements, and corporate actions at my registered email address and mobile number.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs text-slate-200">
            <input
              type="checkbox"
              required
              checked={docsConfirmed}
              onChange={(e) => setDocsConfirmed(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-0 bg-slate-950 border-slate-700 flex-shrink-0"
            />
            <span>I confirm that all uploaded documents are authentic and unedited.</span>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs text-slate-200">
            <input
              type="checkbox"
              required
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-0 bg-slate-950 border-slate-700 flex-shrink-0"
            />
            <span>I accept the statutory declaration terms and authorize CDC CGP processing.</span>
          </label>
        </div>
      </div>

      {/* Signature & Confirmation Name */}
      <div className="p-4 rounded-2xl bg-[#0F0F1E] border border-slate-800 space-y-3">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Digital Signature (Type Full Legal Name)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8">
            <input
              type="text"
              required
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value.toUpperCase())}
              placeholder="e.g. AHMED YOUSAF ELVI"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white uppercase outline-none focus:border-indigo-500"
            />
          </div>
          <div className="sm:col-span-4 flex items-center gap-2 text-[11px] text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>Vault Encrypted Submission</span>
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
          disabled={loading || !docsConfirmed || !termsAccepted || !applicantName}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider transition shadow-xl shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-40"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Submitting to CDC CGP...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Sign & Submit KYC to CDC
            </>
          )}
        </button>
      </div>
    </form>
  );
}
