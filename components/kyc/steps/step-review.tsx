import React from "react";
import { KycApplication, KycStepKey } from "@/lib/kyc/types";
import { CheckCircle2, FileText, User, Briefcase, Globe, Moon, ShieldAlert, FileUp, Edit3, RefreshCw } from "lucide-react";

interface StepReviewProps {
  application: KycApplication;
  password: string;
  onUpdateStep: (step: "review", payload: any) => Promise<any>;
  onNavigateStep: (step: KycStepKey) => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}

export function StepReview({ application, password, onUpdateStep, onNavigateStep, onNext, onBack, loading }: StepReviewProps) {
  const handleProceedToDeclaration = async () => {
    try {
      await onUpdateStep("review", {
        password,
        sub_step: "close",
        dialog_url: "/cdc/cgp/r/centralized-gateway-portal/review",
      });
      onNext();
    } catch {
      onNext();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Step 9: Application Review & Summary (Page 90)</h2>
            <p className="text-xs text-slate-400">
              Review all entered details before signing the statutory declaration and submitting to CDC.
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> All Sections Complete
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Identity & Bank Summary */}
        <div className="p-4 rounded-2xl bg-[#0F0F1E] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Identity & Bank Account
            </span>
            <button
              onClick={() => onNavigateStep("identity")}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>

          <div className="text-xs text-slate-300 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Applicant CNIC:</span>
              <span className="font-mono font-bold text-white">{application.cnic || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email Address:</span>
              <span className="font-mono text-emerald-400">{application.identity?.email || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Mobile Phone:</span>
              <span className="font-mono text-emerald-400">{application.identity?.mobile || "—"} ({application.identity?.mobile_owner_type || "Self"})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">IBAN / Bank:</span>
              <span className="font-mono text-white text-[11px]">{application.identity?.iban || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Resolved Bank:</span>
              <span className="text-slate-200 font-semibold">{application.identity?.bank_name || "Meezan Bank Limited"}</span>
            </div>
          </div>
        </div>

        {/* Personal & Address Summary */}
        <div className="p-4 rounded-2xl bg-[#0F0F1E] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Personal & Residential
            </span>
            <button
              onClick={() => onNavigateStep("personal")}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>

          <div className="text-xs text-slate-300 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Full Name:</span>
              <span className="font-bold text-white">{application.personal?.salutation || ""} {application.personal?.full_name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{application.personal?.father_husband_relationship || "Father"} Name:</span>
              <span className="text-slate-200">{application.personal?.father_husband_name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date of Birth:</span>
              <span className="text-slate-200 font-mono">{application.personal?.date_of_birth || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Permanent Address:</span>
              <span className="text-slate-200 text-right truncate max-w-[200px]">{application.address?.permanent_address || "—"}, {application.address?.permanent_city || ""}</span>
            </div>
          </div>
        </div>

        {/* Profession & FATCA Summary */}
        <div className="p-4 rounded-2xl bg-[#0F0F1E] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" /> Profession & Tax Status
            </span>
            <button
              onClick={() => onNavigateStep("profession")}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>

          <div className="text-xs text-slate-300 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Employer / Business:</span>
              <span className="font-semibold text-white">{application.profession?.employer_or_business_name || "—"} ({application.profession?.job_title || "—"})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Annual Income Band:</span>
              <span className="text-slate-200 font-mono">{application.profession?.gross_annual_income || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">FATCA US Person:</span>
              <span className="text-slate-200">{application.fatca?.is_usa_person ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tax TIN / NTN:</span>
              <span className="text-slate-200 font-mono">{application.fatca?.tin || "—"}</span>
            </div>
          </div>
        </div>

        {/* Compliance, Zakat & Documents */}
        <div className="p-4 rounded-2xl bg-[#0F0F1E] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
              <FileUp className="w-3.5 h-3.5" /> Compliance & Documents
            </span>
            <button
              onClick={() => onNavigateStep("documents")}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>

          <div className="text-xs text-slate-300 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Nominee:</span>
              <span className="text-slate-200">{application.nominee ? `${application.nominee?.name} (${application.nominee?.relation})` : "Opted Out"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Zakat Status:</span>
              <span className="text-slate-200 font-semibold">{application.zakat?.status === "5" ? "Muslim Deductible (5)" : application.zakat?.status === "6" ? "CZ-50 Exempt (6)" : "Non-Muslim (7)"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Uploaded Documents:</span>
              <span className="text-emerald-400 font-bold">{application.documents.filter((d) => d.status === "VALID").length} Verified Files</span>
            </div>
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
          type="button"
          onClick={handleProceedToDeclaration}
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
        >
          {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
          Confirm & Proceed to Declaration (Page 86)
        </button>
      </div>
    </div>
  );
}
