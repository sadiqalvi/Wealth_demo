import React, { useState, useEffect } from "react";
import { KycApplication, NomineeData } from "@/lib/kyc/types";
import { Users, RefreshCw, AlertCircle } from "lucide-react";

interface StepNomineeProps {
  application: KycApplication;
  password: string;
  onUpdateStep: (step: "nominee", payload: any) => Promise<any>;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
  onDraftUpdate?: (data: NomineeData | null) => void;
}

export function StepNominee({ application, password, onUpdateStep, onNext, onBack, loading, onDraftUpdate }: StepNomineeProps) {
  const [hasNominee, setHasNominee] = useState<boolean>(!!application.nominee);
  const [nominee, setNominee] = useState<NomineeData>({
    relation: application.nominee?.relation || "SPOUSE",
    name: application.nominee?.name || "FATIMA ALVI",
    cnic_or_passport: application.nominee?.cnic_or_passport || "4210112345678",
    doc_type: application.nominee?.doc_type || "CNIC",
    issue_date: application.nominee?.issue_date || "2020-01-01",
    lifetime: application.nominee?.lifetime !== undefined ? application.nominee.lifetime : true,
    contact_no: application.nominee?.contact_no || "03001234567",
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      onDraftUpdate?.(hasNominee ? nominee : null);
    }, 300);
    return () => clearTimeout(timer);
  }, [hasNominee, nominee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasNominee && (!nominee.name || !nominee.cnic_or_passport || !nominee.contact_no)) {
      setErrorMsg("Please provide all required nominee details or opt out.");
      return;
    }
    setErrorMsg(null);
    try {
      await onUpdateStep("nominee", {
        password,
        answers: hasNominee ? nominee : null,
      });
      onNext();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update nominee details.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Step 5: Nominee Details (Page 54.3)</h2>
            <p className="text-xs text-slate-400">
              Appoint a legal beneficiary or nominee for your securities account holdings.
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

      {/* Nominee Opt-in / Opt-out Switch */}
      <div className="p-4 rounded-2xl bg-[#0F0F1E] border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white">Appoint Account Nominee</div>
            <div className="text-[11px] text-slate-400">Would you like to appoint a nominee now? (Optional)</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHasNominee(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                !hasNominee ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-400 border border-slate-800"
              }`}
            >
              Opt-Out
            </button>
            <button
              type="button"
              onClick={() => setHasNominee(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                hasNominee ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-400 border border-slate-800"
              }`}
            >
              Nominate
            </button>
          </div>
        </div>
      </div>

      {/* Nominee Form Details */}
      {hasNominee && (
        <div className="p-4 rounded-2xl bg-[#0F0F1E] border border-slate-800/80 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Beneficiary Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Relationship with Applicant</label>
              <select
                value={nominee.relation}
                onChange={(e: any) => setNominee((n) => ({ ...n, relation: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="SPOUSE">Spouse</option>
                <option value="SON">Son</option>
                <option value="DAUGHTER">Daughter</option>
                <option value="FATHER">Father</option>
                <option value="MOTHER">Mother</option>
                <option value="BROTHER">Brother</option>
                <option value="SISTER">Sister</option>
              </select>
            </div>

            <div className="sm:col-span-8">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Nominee Full Name</label>
              <input
                type="text"
                required
                value={nominee.name}
                onChange={(e) => setNominee((n) => ({ ...n, name: e.target.value.toUpperCase() }))}
                placeholder="e.g. FATIMA ALVI"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Document Type</label>
              <select
                value={nominee.doc_type}
                onChange={(e: any) => setNominee((n) => ({ ...n, doc_type: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="CNIC">CNIC / Smart Card</option>
                <option value="NICOP">NICOP</option>
                <option value="PASSPORT">Passport</option>
              </select>
            </div>

            <div className="sm:col-span-8">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">CNIC / Passport Number</label>
              <input
                type="text"
                required
                value={nominee.cnic_or_passport}
                onChange={(e) => setNominee((n) => ({ ...n, cnic_or_passport: e.target.value }))}
                placeholder="e.g. 4210112345678"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Doc Issue Date</label>
              <input
                type="date"
                required
                value={nominee.issue_date}
                onChange={(e) => setNominee((n) => ({ ...n, issue_date: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Nominee Contact Number</label>
              <input
                type="tel"
                required
                value={nominee.contact_no}
                onChange={(e) => setNominee((n) => ({ ...n, contact_no: e.target.value }))}
                placeholder="03001234567"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="sm:col-span-4 flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={nominee.lifetime}
                  onChange={(e) => setNominee((n) => ({ ...n, lifetime: e.target.checked }))}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-700"
                />
                <span>Lifetime Expiry CNIC</span>
              </label>
            </div>
          </div>
        </div>
      )}

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
          Save & Proceed to Due Diligence (Page 55.2)
        </button>
      </div>
    </form>
  );
}
