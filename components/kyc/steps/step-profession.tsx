import React, { useState, useEffect, useRef } from "react";
import { KycApplication, ProfessionData } from "@/lib/kyc/types";
import { Briefcase, Building2, RefreshCw, AlertCircle } from "lucide-react";

interface StepProfessionProps {
  application: KycApplication;
  password: string;
  onUpdateStep: (step: "profession", payload: any) => Promise<any>;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
  onDraftUpdate?: (data: ProfessionData) => void;
}

export function StepProfession({ application, password, onUpdateStep, onNext, onBack, loading, onDraftUpdate }: StepProfessionProps) {
  const [profession, setProfession] = useState<ProfessionData>({
    source_of_income: application.profession.source_of_income || "P001",
    gross_annual_income: application.profession.gross_annual_income || "J01",
    profession_industry: application.profession.profession_industry || "Information Technology",
    industry_other: application.profession.industry_other || "",
    employer_or_business_name: application.profession.employer_or_business_name || "Tech Corp",
    job_title: application.profession.job_title || "Software Engineer",
    department: application.profession.department || "Engineering",
    employer_address: application.profession.employer_address || "Shahrah-e-Faisal",
    employer_city: application.profession.employer_city || "KARACHI",
    employer_country: application.profession.employer_country || "PAK",
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const lastAppIdRef = useRef(application.id);

  // Debounced draft update to avoid typing glitch
  useEffect(() => {
    const timer = setTimeout(() => {
      onDraftUpdate?.(profession);
    }, 300);
    return () => clearTimeout(timer);
  }, [profession]);

  // Sync only if application ID changes
  useEffect(() => {
    if (application.id !== lastAppIdRef.current) {
      lastAppIdRef.current = application.id;
      if (application.profession) {
        setProfession((p) => ({ ...p, ...application.profession }));
      }
    }
  }, [application.id, application.profession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profession.employer_or_business_name || !profession.job_title) {
      setErrorMsg("Please provide your employer/business name and job title.");
      return;
    }
    setErrorMsg(null);
    try {
      await onUpdateStep("profession", {
        password,
        answers: profession,
      });
      onNext();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profession details.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Step 3: Profession & Financial Background (Page 54.1)</h2>
            <p className="text-xs text-slate-400">
              SECP AML & KYC requirement for investor financial profiling and source of wealth validation.
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

      {/* Income & Sector */}
      <div className="p-4 rounded-2xl bg-[#0F0F1E] border border-slate-800/80 space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Source of Income & Bracket</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Primary Source of Income</label>
            <select
              value={profession.source_of_income}
              onChange={(e) => setProfession((p) => ({ ...p, source_of_income: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
            >
              <option value="P001">Salary / Employment (Code P001)</option>
              <option value="P002">Business / Self-Employed (Code P002)</option>
              <option value="P003">Investments & Dividends (Code P003)</option>
              <option value="P004">Inheritance / Real Estate (Code P004)</option>
              <option value="P005">Remittances / Family Support (Code P005)</option>
            </select>
          </div>

          <div className="sm:col-span-6">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Gross Annual Income Bracket (PKR)</label>
            <select
              value={profession.gross_annual_income}
              onChange={(e) => setProfession((p) => ({ ...p, gross_annual_income: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
            >
              <option value="J01">Up to PKR 500,000 (Band J01)</option>
              <option value="J02">PKR 500,000 – PKR 1,200,000 (Band J02)</option>
              <option value="J03">PKR 1,200,000 – PKR 2,500,000 (Band J03)</option>
              <option value="J04">PKR 2,500,000 – PKR 5,000,000 (Band J04)</option>
              <option value="J05">PKR 5,000,000 – PKR 10,000,000 (Band J05)</option>
              <option value="J06">PKR 10,000,000+ (Band J06)</option>
            </select>
          </div>

          <div className="sm:col-span-6">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Profession / Industry Sector</label>
            <select
              value={profession.profession_industry}
              onChange={(e) => setProfession((p) => ({ ...p, profession_industry: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
            >
              <option value="Information Technology">Information Technology</option>
              <option value="Banking & Financial Services">Banking & Financial Services</option>
              <option value="Engineering & Construction">Engineering & Construction</option>
              <option value="Healthcare & Pharmaceuticals">Healthcare & Pharmaceuticals</option>
              <option value="Textile & Manufacturing">Textile & Manufacturing</option>
              <option value="Education & Academia">Education & Academia</option>
              <option value="Others (Please specify)">Others (Please specify)</option>
            </select>
          </div>

          {profession.profession_industry === "Others (Please specify)" && (
            <div className="sm:col-span-6">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Specify Other Industry</label>
              <input
                type="text"
                required
                value={profession.industry_other || ""}
                onChange={(e) => setProfession((p) => ({ ...p, industry_other: e.target.value }))}
                placeholder="e.g. Telecommunications"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Employer Details */}
      <div className="p-4 rounded-2xl bg-[#0F0F1E] border border-slate-800/80 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Employer / Business Information</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Employer / Company Name</label>
            <input
              type="text"
              required
              value={profession.employer_or_business_name}
              onChange={(e) => setProfession((p) => ({ ...p, employer_or_business_name: e.target.value }))}
              placeholder="e.g. Tech Corp"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Job Title / Designation</label>
            <input
              type="text"
              required
              value={profession.job_title}
              onChange={(e) => setProfession((p) => ({ ...p, job_title: e.target.value }))}
              placeholder="e.g. Software Engineer"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Department</label>
            <input
              type="text"
              value={profession.department}
              onChange={(e) => setProfession((p) => ({ ...p, department: e.target.value }))}
              placeholder="e.g. Engineering"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-6">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Employer Address</label>
            <input
              type="text"
              value={profession.employer_address}
              onChange={(e) => setProfession((p) => ({ ...p, employer_address: e.target.value }))}
              placeholder="e.g. Shahrah-e-Faisal"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">City</label>
            <input
              type="text"
              value={profession.employer_city}
              onChange={(e) => setProfession((p) => ({ ...p, employer_city: e.target.value.toUpperCase() }))}
              placeholder="e.g. KARACHI"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Country</label>
            <input
              type="text"
              value={profession.employer_country}
              onChange={(e) => setProfession((p) => ({ ...p, employer_country: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
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
          Save & Proceed to FATCA / Tax (Page 55)
        </button>
      </div>
    </form>
  );
}
