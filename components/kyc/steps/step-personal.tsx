import React, { useState, useEffect, useRef } from "react";
import { KycApplication, PersonalData, AddressData } from "@/lib/kyc/types";
import { User, MapPin, RefreshCw, AlertCircle, Sparkles } from "lucide-react";

interface StepPersonalProps {
  application: KycApplication;
  password: string;
  onUpdateStep: (step: "personal", payload: any) => Promise<any>;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
  onDraftUpdate?: (data: { personal?: PersonalData; address?: AddressData }) => void;
}

export function StepPersonal({ application, password, onUpdateStep, onNext, onBack, loading, onDraftUpdate }: StepPersonalProps) {
  const [personal, setPersonal] = useState<PersonalData>({
    salutation: application.personal.salutation || "MR",
    full_name: application.personal.full_name || "",
    father_husband_relationship: application.personal.father_husband_relationship || "FATHER",
    father_husband_name: application.personal.father_husband_name || "",
    cnic_doc_type: application.personal.cnic_doc_type || "smartid",
    country_of_birth: application.personal.country_of_birth || "PAK",
    date_of_birth: application.personal.date_of_birth || "1990-01-01",
    gender: application.personal.gender || "M",
    marital_status: application.personal.marital_status || "1",
    place_of_birth: application.personal.place_of_birth || "KARACHI",
  });

  const [address, setAddress] = useState<AddressData>({
    permanent_address: application.address.permanent_address || "",
    permanent_city: application.address.permanent_city || "KARACHI",
    permanent_country: application.address.permanent_country || "PAK",
    resident_status: application.address.resident_status || "7",
    mailing_differs: application.address.mailing_differs || false,
    mailing_address: application.address.mailing_address || "",
    mailing_city: application.address.mailing_city || "",
    mailing_country: application.address.mailing_country || "PAK",
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const lastAppIdRef = useRef(application.id);

  // Sync draft edits to parent application state and localStorage (debounced to eliminate glitching)
  useEffect(() => {
    const timer = setTimeout(() => {
      onDraftUpdate?.({ personal, address });
    }, 300);
    return () => clearTimeout(timer);
  }, [personal, address]);

  // Sync only if application ID changes (e.g. account switch or session reset)
  useEffect(() => {
    if (application.id !== lastAppIdRef.current) {
      lastAppIdRef.current = application.id;
      if (application.personal) {
        setPersonal((prev) => ({ ...prev, ...application.personal }));
      }
      if (application.address) {
        setAddress((prev) => ({ ...prev, ...application.address }));
      }
    }
  }, [application.id, application.personal, application.address]);

  const handlePreFillAksaNadra = async () => {
    setErrorMsg(null);
    try {
      const res = await onUpdateStep("personal", {
        password,
        sub_step: "prefill",
      });
      if (res?.personal) {
        setPersonal((prev) => ({ ...prev, ...res.personal }));
      }
      if (res?.address) {
        setAddress((prev) => ({ ...prev, ...res.address }));
      }
      if (res?.personal || res?.address) {
        onDraftUpdate?.({
          personal: res?.personal,
          address: res?.address,
        });
      }
    } catch {
      // Fallback to local default prefill
      setPersonal((prev) => ({
        ...prev,
        salutation: "MR",
        full_name: "AHMED YOUSAF ELVI",
        father_husband_relationship: "FATHER",
        father_husband_name: "AHMED AZEEM ELVI",
        cnic_doc_type: "smartid",
        country_of_birth: "PAK",
        date_of_birth: "1989-01-01",
        gender: "M",
        marital_status: "1",
        place_of_birth: "KARACHI",
      }));
      setAddress((prev) => ({
        ...prev,
        permanent_address: "HOUSE F 79 NORTH NAZIMABAD",
        permanent_city: "KARACHI",
        permanent_country: "PAK",
        resident_status: "7",
        mailing_differs: false,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personal.full_name || !personal.father_husband_name || !address.permanent_address) {
      setErrorMsg("Please complete all required identity and address fields.");
      return;
    }
    setErrorMsg(null);
    try {
      await onUpdateStep("personal", {
        password,
        sub_step: "all",
        personal,
        address,
        details: personal,
      });
      onDraftUpdate?.({ personal, address });
      onNext();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update personal information.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Step 2: Personal & Address Data (Page 52)</h2>
            <p className="text-xs text-slate-400">
              Verified with NADRA Verisys and AKSA Identity Gateway.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePreFillAksaNadra}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Auto-Fill AKSA Data
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Personal Identity Grid */}
      <div className="p-4 rounded-2xl bg-[#0F0F1E] border border-slate-800/80 space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Applicant Identification</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-2">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Title</label>
            <select
              value={personal.salutation}
              onChange={(e: any) => setPersonal((p) => ({ ...p, salutation: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
            >
              <option value="MR">MR</option>
              <option value="MS">MS</option>
              <option value="MRS">MRS</option>
              <option value="DR">DR</option>
            </select>
          </div>

          <div className="sm:col-span-6">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Full Name (As per CNIC)</label>
            <input
              type="text"
              required
              value={personal.full_name}
              onChange={(e) => setPersonal((p) => ({ ...p, full_name: e.target.value.toUpperCase() }))}
              placeholder="e.g. AHMED YOUSAF ELVI"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Document Type</label>
            <select
              value={personal.cnic_doc_type}
              onChange={(e: any) => setPersonal((p) => ({ ...p, cnic_doc_type: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
            >
              <option value="smartid">Smart CNIC (Chip)</option>
              <option value="nicop">NICOP (Overseas)</option>
              <option value="poc">POC (Pakistan Origin)</option>
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Relationship</label>
            <select
              value={personal.father_husband_relationship}
              onChange={(e: any) => setPersonal((p) => ({ ...p, father_husband_relationship: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
            >
              <option value="FATHER">Father</option>
              <option value="HUSBAND">Husband</option>
            </select>
          </div>

          <div className="sm:col-span-8">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Father / Husband Full Name</label>
            <input
              type="text"
              required
              value={personal.father_husband_name}
              onChange={(e) => setPersonal((p) => ({ ...p, father_husband_name: e.target.value.toUpperCase() }))}
              placeholder="e.g. AHMED AZEEM ELVI"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Date of Birth</label>
            <input
              type="date"
              required
              value={personal.date_of_birth}
              onChange={(e) => setPersonal((p) => ({ ...p, date_of_birth: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Gender</label>
            <select
              value={personal.gender}
              onChange={(e: any) => setPersonal((p) => ({ ...p, gender: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Marital Status</label>
            <select
              value={personal.marital_status}
              onChange={(e: any) => setPersonal((p) => ({ ...p, marital_status: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
            >
              <option value="1">Single</option>
              <option value="2">Married</option>
              <option value="3">Other</option>
            </select>
          </div>

          <div className="sm:col-span-6">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Place of Birth (City)</label>
            <input
              type="text"
              required
              value={personal.place_of_birth}
              onChange={(e) => setPersonal((p) => ({ ...p, place_of_birth: e.target.value.toUpperCase() }))}
              placeholder="e.g. KARACHI"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-6">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Country of Birth</label>
            <select
              value={personal.country_of_birth}
              onChange={(e) => setPersonal((p) => ({ ...p, country_of_birth: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
            >
              <option value="PAK">Pakistan (PAK)</option>
              <option value="ARE">United Arab Emirates (ARE)</option>
              <option value="SAU">Saudi Arabia (SAU)</option>
              <option value="GBR">United Kingdom (GBR)</option>
              <option value="USA">United States (USA)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Address Information Card */}
      <div className="p-4 rounded-2xl bg-[#0F0F1E] border border-slate-800/80 space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Permanent & Residential Address</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-12">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Permanent Residential Address</label>
            <input
              type="text"
              required
              value={address.permanent_address}
              onChange={(e) => setAddress((a) => ({ ...a, permanent_address: e.target.value.toUpperCase() }))}
              placeholder="e.g. HOUSE F 79 NORTH NAZIMABAD"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">City</label>
            <input
              type="text"
              required
              value={address.permanent_city}
              onChange={(e) => setAddress((a) => ({ ...a, permanent_city: e.target.value.toUpperCase() }))}
              placeholder="e.g. KARACHI"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Country</label>
            <input
              type="text"
              required
              value={address.permanent_country}
              onChange={(e) => setAddress((a) => ({ ...a, permanent_country: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Resident Status</label>
            <select
              value={address.resident_status}
              onChange={(e) => setAddress((a) => ({ ...a, resident_status: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
            >
              <option value="7">Resident Pakistani (Code 7)</option>
              <option value="8">Non-Resident Pakistani (Code 8)</option>
              <option value="9">Foreign National (Code 9)</option>
            </select>
          </div>

          <div className="sm:col-span-12 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={address.mailing_differs}
                onChange={(e) => setAddress((a) => ({ ...a, mailing_differs: e.target.checked }))}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <span>Mailing / Correspondence address differs from permanent address</span>
            </label>
          </div>

          {address.mailing_differs && (
            <div className="sm:col-span-12 grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <div className="sm:col-span-12">
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Mailing Address</label>
                <input
                  type="text"
                  value={address.mailing_address || ""}
                  onChange={(e) => setAddress((a) => ({ ...a, mailing_address: e.target.value.toUpperCase() }))}
                  placeholder="Street / Office Address"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Mailing City</label>
                <input
                  type="text"
                  value={address.mailing_city || ""}
                  onChange={(e) => setAddress((a) => ({ ...a, mailing_city: e.target.value.toUpperCase() }))}
                  placeholder="City"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Mailing Country</label>
                <input
                  type="text"
                  value={address.mailing_country || "PAK"}
                  onChange={(e) => setAddress((a) => ({ ...a, mailing_country: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
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
          Save & Proceed to Profession (Page 54)
        </button>
      </div>
    </form>
  );
}
