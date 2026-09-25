export const STORAGE_APP_KEY = "wealthdemo_kyc_app_v2";
export const STORAGE_STEP_KEY = "wealthdemo_kyc_step_v2";
export const STORAGE_PWD_KEY = "wealthdemo_kyc_pwd_v2";
export const STORAGE_PORTAL_VERIFIED_KEY = "wealthdemo_kyc_portal_verified_v2";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { kycService } from "@/lib/kyc/kyc-sdk";
import { KycApplication, KycStepKey, AccountType, DiscrepancyItem } from "@/lib/kyc/types";
import { StepIdentity } from "./steps/step-identity";
import { StepPersonal } from "./steps/step-personal";
import { StepProfession } from "./steps/step-profession";
import { StepFatca } from "./steps/step-fatca";
import { StepNominee } from "./steps/step-nominee";
import { StepSdd } from "./steps/step-sdd";
import { StepZakat } from "./steps/step-zakat";
import { StepDocuments } from "./steps/step-documents";
import { StepReview } from "./steps/step-review";
import { StepDeclaration } from "./steps/step-declaration";
import { KycDiscrepancyPanel } from "./kyc-discrepancy-panel";
import { KycAuthResumeModal } from "./kyc-auth-resume-modal";
import {
  ShieldCheck,
  UserPlus,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Layers,
  ArrowRight,
  Shield,
  ShieldAlert,
  FileCheck,
  RotateCcw,
} from "lucide-react";

const STEPS_CONFIG: Array<{ key: KycStepKey; page: string; label: string; number: number }> = [
  { key: "identity", page: "50", label: "Identity & Bank", number: 1 },
  { key: "personal", page: "52", label: "Personal Info", number: 2 },
  { key: "profession", page: "54.1", label: "Profession", number: 3 },
  { key: "fatca", page: "55.1", label: "FATCA / Tax", number: 4 },
  { key: "nominee", page: "54.3", label: "Nominee", number: 5 },
  { key: "sdd", page: "55.2", label: "AML & SDD", number: 6 },
  { key: "zakat", page: "54.4", label: "Zakat Status", number: 7 },
  { key: "documents", page: "67", label: "Documents", number: 8 },
  { key: "review", page: "90", label: "Summary Review", number: 9 },
  { key: "declaration", page: "86", label: "Declaration", number: 10 },
];


// Helper functions to determine step completion and first incomplete step
export function isIdentityStepComplete(app: KycApplication | null | undefined): boolean {
  if (!app?.identity) return false;
  return Boolean(
    app.identity.biometric_acknowledged &&
    app.identity.email_verified &&
    app.identity.email &&
    app.identity.mobile_verified &&
    app.identity.mobile &&
    app.identity.iban_verified &&
    app.identity.iban
  );
}

export function isPersonalStepComplete(app: KycApplication | null | undefined): boolean {
  if (!app?.personal || !app?.address) return false;
  return Boolean(
    app.personal.full_name?.trim() &&
    app.personal.father_husband_name?.trim() &&
    app.personal.date_of_birth?.trim() &&
    app.address.permanent_address?.trim() &&
    app.address.permanent_city?.trim()
  );
}

export function isProfessionStepComplete(app: KycApplication | null | undefined): boolean {
  if (!app?.profession) return false;
  return Boolean(
    app.profession.source_of_income &&
    app.profession.gross_annual_income &&
    app.profession.employer_or_business_name?.trim() &&
    app.profession.job_title?.trim()
  );
}

export function isFatcaStepComplete(app: KycApplication | null | undefined): boolean {
  if (!app?.fatca) return false;
  return Boolean(
    app.fatca.tax_residence_country?.trim() &&
    app.fatca.tin?.trim()
  );
}

export function isNomineeStepComplete(app: KycApplication | null | undefined): boolean {
  if (!app) return false;
  if (app.nominee === null) {
    const pastNomineeSteps: KycStepKey[] = ["sdd", "zakat", "documents", "review", "declaration"];
    return pastNomineeSteps.includes(app.current_step);
  }
  return Boolean(
    app.nominee.name?.trim() &&
    app.nominee.cnic_or_passport?.trim() &&
    app.nominee.contact_no?.trim()
  );
}

export function isSddStepComplete(app: KycApplication | null | undefined): boolean {
  if (!app) return false;
  const pastSddSteps: KycStepKey[] = ["zakat", "documents", "review", "declaration"];
  return pastSddSteps.includes(app.current_step);
}

export function isZakatStepComplete(app: KycApplication | null | undefined): boolean {
  if (!app?.zakat) return false;
  const pastZakatSteps: KycStepKey[] = ["documents", "review", "declaration"];
  return pastZakatSteps.includes(app.current_step) || Boolean(app.zakat.status);
}

export function isDocumentsStepComplete(app: KycApplication | null | undefined): boolean {
  if (!app?.documents || app.documents.length === 0) return false;
  const hasFront = app.documents.some((d) => d.kind === "cnic_front" && d.status !== "REJECTED");
  const hasBack = app.documents.some((d) => d.kind === "cnic_back" && d.status !== "REJECTED");
  const hasIncome = app.documents.some((d) => d.kind === "proof_of_income" && d.status !== "REJECTED");
  const hasSig = app.documents.some((d) => d.kind === "signature" && d.status !== "REJECTED");
  return hasFront && hasBack && hasIncome && hasSig;
}

export function getFirstIncompleteStep(app: KycApplication | null | undefined): KycStepKey {
  if (!app) return "identity";
  if (!isIdentityStepComplete(app)) return "identity";
  if (!isPersonalStepComplete(app)) return "personal";
  if (!isProfessionStepComplete(app)) return "profession";
  if (!isFatcaStepComplete(app)) return "fatca";
  if (!isNomineeStepComplete(app)) return "nominee";
  if (!isSddStepComplete(app)) return "sdd";
  if (!isZakatStepComplete(app)) return "zakat";
  if (!isDocumentsStepComplete(app)) return "documents";
  if (app.status === "SUBMITTED") return "review";
  return "review";
}

export function KycOnboardingView() {
  const [application, setApplication] = useState<KycApplication | null>(null);
  const [currentStep, setCurrentStep] = useState<KycStepKey>("identity");
  const [portalPassword, setPortalPassword] = useState<string>("Alvi@CDC2026");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Application Initial Form State (Case 1)
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [newCnic, setNewCnic] = useState("4210136069899");
  const [newAccountType, setNewAccountType] = useState<AccountType>("NOR");
  const [newPassword, setNewPassword] = useState("Alvi@CDC2026");

  // Resume Existing Modal State (Case 2)
  const [showResumeModal, setShowResumeModal] = useState(false);

  // Restore active KYC session from localStorage on page refresh
  useEffect(() => {
    try {
      const savedApp = localStorage.getItem(STORAGE_APP_KEY);
      const savedStep = localStorage.getItem(STORAGE_STEP_KEY) as KycStepKey | null;
      const savedPwd = localStorage.getItem(STORAGE_PWD_KEY);

      if (savedApp) {
        const parsedApp = JSON.parse(savedApp);
        if (parsedApp && parsedApp.id) {
          setApplication(parsedApp);
          if (savedPwd) setPortalPassword(savedPwd);

          // Route to first incomplete step so returning users never get stuck on Identity
          const incompleteStep = getFirstIncompleteStep(parsedApp);
          if (!savedStep || (savedStep === "identity" && isIdentityStepComplete(parsedApp))) {
            setCurrentStep(incompleteStep);
          } else {
            setCurrentStep(savedStep);
          }

          // Asynchronously sync with server while preserving local draft edits
          kycService.getApplication(parsedApp.id).then((serverApp) => {
            if (serverApp) {
              setApplication((prev) => {
                if (!prev) return serverApp;
                const merged: KycApplication = {
                  ...serverApp,
                  personal: { ...serverApp.personal, ...prev.personal },
                  address: { ...serverApp.address, ...prev.address },
                  profession: { ...serverApp.profession, ...prev.profession },
                  fatca: { ...serverApp.fatca, ...prev.fatca },
                  nominee: prev.nominee ?? serverApp.nominee,
                  sdd: { ...serverApp.sdd, ...prev.sdd },
                  zakat: { ...serverApp.zakat, ...prev.zakat },
                  identity: { ...serverApp.identity, ...prev.identity },
                };
                localStorage.setItem(STORAGE_APP_KEY, JSON.stringify(merged));
                return merged;
              });
            }
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error("Failed to restore KYC session from localStorage:", err);
    }
  }, []);

  // Persist application state updates to localStorage
  useEffect(() => {
    if (application) {
      try {
        localStorage.setItem(STORAGE_APP_KEY, JSON.stringify(application));
      } catch (e) {
        console.error("Failed to save KYC application to localStorage:", e);
      }
    }
  }, [application]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_STEP_KEY, currentStep);
    } catch {}
  }, [currentStep]);

  useEffect(() => {
    if (portalPassword) {
      try {
        localStorage.setItem(STORAGE_PWD_KEY, portalPassword);
      } catch {}
    }
  }, [portalPassword]);

  const draftDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Draft update callback so field edits across all steps persist dynamically across tab navigation
  const handleDraftUpdate = useCallback((stepKey: KycStepKey, draftData: any) => {
    setApplication((prev) => {
      if (!prev) return prev;
      let next = { ...prev };
      if (stepKey === "personal") {
        if (draftData.personal) next.personal = { ...next.personal, ...draftData.personal };
        if (draftData.address) next.address = { ...next.address, ...draftData.address };
      } else if (stepKey === "identity") {
        next.identity = { ...next.identity, ...draftData };
      } else if (stepKey === "profession") {
        next.profession = { ...next.profession, ...draftData };
      } else if (stepKey === "fatca") {
        next.fatca = { ...next.fatca, ...draftData };
      } else if (stepKey === "nominee") {
        next.nominee = draftData;
      } else if (stepKey === "sdd") {
        next.sdd = { ...next.sdd, ...draftData };
      } else if (stepKey === "zakat") {
        next.zakat = { ...next.zakat, ...draftData };
      } else if (stepKey === "declaration") {
        next.declaration = { ...next.declaration, ...draftData };
      }
      try {
        localStorage.setItem(STORAGE_APP_KEY, JSON.stringify(next));
      } catch {}

      // Debounced background sync to mock API (500ms)
      if (draftDebounceTimerRef.current) {
        clearTimeout(draftDebounceTimerRef.current);
      }
      draftDebounceTimerRef.current = setTimeout(() => {
        const patchPayload = stepKey === "personal" ? draftData : { [stepKey]: draftData };
        kycService.updateApplicationDraft(next.id, patchPayload).catch(() => {});
      }, 500);

      return next;
    });
  }, []);

  // Auto-dismiss success notification after 6 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Map page numbers to step keys
  const mapPageToStep = (page: string): KycStepKey => {
    if (page.startsWith("50")) return "identity";
    if (page.startsWith("52")) return "personal";
    if (page.startsWith("54.1") || page === "54") return "profession";
    if (page.startsWith("54.3")) return "nominee";
    if (page.startsWith("54.4")) return "zakat";
    if (page.startsWith("55.1") || page === "55") return "fatca";
    if (page.startsWith("55.2")) return "sdd";
    if (page.startsWith("67")) return "documents";
    if (page.startsWith("90")) return "review";
    if (page.startsWith("86")) return "declaration";
    return "identity";
  };

  // 1. Create New Application (Case 1)
  const handleStartNewApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCnic || newCnic.length < 13) {
      setErrorMsg("Please enter a valid 13-digit CNIC (e.g. 4210136069899).");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const app = await kycService.createApplication(newCnic, newAccountType, newPassword);
      setApplication(app);
      setPortalPassword(newPassword);
      const startStep = getFirstIncompleteStep(app);
      setCurrentStep(startStep);
      setShowNewAccountModal(false);
      setSuccessMsg(`KYC Application initialized for CNIC ${newCnic} (${newAccountType === "NOR" ? "Normal Account" : "Sahulat Account"}).`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create application.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Resume Existing Application (Case 2)
  const handleResumeExisting = async (cnic: string, pass: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const app = await kycService.resumeExistingApplication(cnic, pass);
      setApplication(app);
      setPortalPassword(pass);
      const step = getFirstIncompleteStep(app);
      setCurrentStep(step);
      setShowResumeModal(false);
      setSuccessMsg(`Welcome back! Session restored at Step ${STEPS_CONFIG.find((s) => s.key === step)?.number || 1} (${STEPS_CONFIG.find((s) => s.key === step)?.label || "Identity"}).`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resume application.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 3. Step Submission with Async Job Polling & Checker
  const handleUpdateStep = async (step: KycStepKey, payload: any): Promise<any> => {
    if (!application) return;
    // Only final declaration submit triggers blocking global overlay; offline steps save instantly
    const isLiveSubmit = step === "declaration";
    if (isLiveSubmit) {
      setLoading(true);
    }
    setErrorMsg(null);
    try {
      const result = await kycService.runStep(application.id, step, {
        ...payload,
        password: portalPassword,
      });
      const updated = await kycService.getApplication(application.id);
      setApplication(updated);
      try {
        localStorage.setItem(STORAGE_APP_KEY, JSON.stringify(updated));
      } catch {}

      // Surface success detail from the checker
      if (result && result.detail) {
        setSuccessMsg(result.detail);
      }
      return result;
    } catch (err: any) {
      console.error(`Step submission error for ${step}:`, err);
      // Offline fallback: save locally so form work is NEVER lost
      if (step !== "identity" && step !== "declaration") {
        handleDraftUpdate(step, payload);
        return { ok: true, step };
      }
      setErrorMsg(err.message || "Step submission failed.");
      throw err;
    } finally {
      if (isLiveSubmit) {
        setLoading(false);
      }
    }
  };


  // 4. Rectify Discrepancy (Case 3)
  const handleRectifyDiscrepancy = (item: DiscrepancyItem) => {
    if (!application) return;
    setCurrentStep(item.step_key || "documents");
  };

  // Refresh status
  const handleRefreshStatus = async () => {
    if (!application) return;
    try {
      const updated = await kycService.getApplication(application.id);
      setApplication(updated);
      setSuccessMsg("Application status synchronized successfully.");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to refresh application status.");
    }
  };

  const handleResetDefaults = async () => {
    setLoading(true);
    try {
      await kycService.resetStagingProfiles();
      setApplication(null);
      setErrorMsg(null);
      localStorage.removeItem(STORAGE_APP_KEY);
      localStorage.removeItem(STORAGE_STEP_KEY);
      localStorage.removeItem(STORAGE_PWD_KEY);
      localStorage.removeItem(STORAGE_PORTAL_VERIFIED_KEY);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset profiles.");
    } finally {
      setLoading(false);
    }
  };

  // Next & Back Navigation Helpers
  const currentStepIdx = STEPS_CONFIG.findIndex((s) => s.key === currentStep);
  const handleNext = () => {
    if (currentStep === "identity" && application && portalPassword) {
      kycService.releaseIdentity(application.id, portalPassword).catch(() => {});
    }
    if (currentStepIdx < STEPS_CONFIG.length - 1) {
      setCurrentStep(STEPS_CONFIG[currentStepIdx + 1].key);
    }
  };
  const handleBack = () => {
    if (currentStep === "identity" && application && portalPassword) {
      kycService.releaseIdentity(application.id, portalPassword).catch(() => {});
    }
    if (currentStepIdx > 0) {
      setCurrentStep(STEPS_CONFIG[currentStepIdx - 1].key);
    }
  };
  const handleSelectStep = (targetStep: KycStepKey) => {
    if (currentStep === "identity" && targetStep !== "identity" && application && portalPassword) {
      kycService.releaseIdentity(application.id, portalPassword).catch(() => {});
    }
    setCurrentStep(targetStep);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Hero Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0D0D1A] via-[#101026] to-[#141432] border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-wider uppercase">
                Official CDC CGP Gateway
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                Direct Onboarding API
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Centralized KYC & Broker Account Opening
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Open your Shariah-compliant paper trading brokerage sub-account with Central Depository Company (CDC)
              instant biometric verification and 1-Link bank account resolution.
            </p>
          </div>

          {/* Action Hub / Account Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowNewAccountModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>1. New KYC Application</span>
            </button>

            <button
              onClick={() => setShowResumeModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white text-xs font-bold transition flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-indigo-400" />
              <span>2. I Already Have an Account</span>
            </button>

            {application && (
              <button
                onClick={handleResetDefaults}
                title="Reset session"
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Case Selection Cards when no active application is chosen */}
      {!application && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
          {/* Case 1 Card */}
          <div
            onClick={() => setShowNewAccountModal(true)}
            className="p-6 rounded-3xl bg-[#0F0F1E] border border-slate-800 hover:border-indigo-500/50 shadow-xl cursor-pointer transition group relative space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Case 1</span>
              <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
                Create Complete New Account
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Step-by-step registration with fresh CNIC, NADRA biometric verification, 2FA OTP relays, IBAN resolution, and document uploads.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-indigo-400">
              <span>Start fresh onboarding</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Case 2 Card */}
          <div
            onClick={() => {
              setShowResumeModal(true);
            }}
            className="p-6 rounded-3xl bg-[#0F0F1E] border border-slate-800 hover:border-violet-500/50 shadow-xl cursor-pointer transition group relative space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block">Case 2</span>
              <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition">
                I Already Have an Account
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Enter your CNIC & Password (or test Profile 1: <strong className="text-slate-300">4210136069899</strong>) to resume directly onto the form where you left off.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-violet-400">
              <span>Login & resume form</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Case 3 Card */}
          <div
            onClick={() => {
              handleResumeExisting("4210156297009", "0300Ajami.");
            }}
            className="p-6 rounded-3xl bg-[#0F0F1E] border border-slate-800 hover:border-amber-500/50 shadow-xl cursor-pointer transition group relative space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Case 3</span>
              <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition">
                Discrepancy Rectification (TBR)
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Test post-submission compliance discrepancies with Profile 2 (<strong className="text-slate-300">4210156297009</strong>) to inspect reviewer notes and replace flagged docs.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <span>Inspect flagged discrepancies</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      )}

      {/* Main Active Application Container */}
      {application && (
        <div className="space-y-6">
          {/* Active Application Status Bar */}
          <div className="p-4 rounded-2xl bg-[#0D0D1A] border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-500 block text-[10px]">Applicant CNIC</span>
                <span className="font-mono font-bold text-white">{application.cnic}</span>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-500 block text-[10px]">Account Type</span>
                <span className="font-bold text-indigo-400">
                  {application.account_type === "NOR" ? "Normal (Full Account)" : "Asaan / Sahulat"}
                </span>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-500 block text-[10px]">Portal Status</span>
                <span
                  className={`font-bold flex items-center gap-1 ${
                    application.status === "APPROVED"
                      ? "text-emerald-400"
                      : application.status === "TBR"
                      ? "text-amber-400"
                      : application.status === "SUBMITTED"
                      ? "text-indigo-400"
                      : "text-slate-300"
                  }`}
                >
                  {application.status === "TBR" && <AlertCircle className="w-3.5 h-3.5" />}
                  {application.status === "SUBMITTED" && <Clock className="w-3.5 h-3.5" />}
                  {application.status === "APPROVED" && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {application.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Background Rescan: 30m Auto-Sync
              </span>
              <button
                onClick={handleRefreshStatus}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Sync Status</span>
              </button>
            </div>
          </div>

          {/* Global Error Banner */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start justify-between gap-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold text-xs">Error Encountered:</strong>
                  <span>{errorMsg}</span>
                </div>
              </div>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-rose-400 hover:text-white text-xs font-semibold px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Global Success Notification Banner */}
          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start justify-between gap-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold text-xs">Action Completed Successfully:</strong>
                  <span>{successMsg}</span>
                </div>
              </div>
              <button
                onClick={() => setSuccessMsg(null)}
                className="text-emerald-400 hover:text-white text-xs font-semibold px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Case 3 Discrepancy Panel if in TBR State */}
          {application.status === "TBR" && application.discrepancy_flag && (
            <KycDiscrepancyPanel
              application={application}
              onRectify={handleRectifyDiscrepancy}
              onRefreshStatus={handleRefreshStatus}
              loading={loading}
            />
          )}

          {/* Post-Submission Success Hub */}
          {application.status === "SUBMITTED" && (
            <div className="p-8 rounded-3xl bg-[#0F0F1E] border border-emerald-500/30 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <FileCheck className="w-8 h-8" />
              </div>

              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-xl font-black text-white">Application Submitted to CDC CGP</h3>
                <p className="text-xs text-slate-400">
                  Your application has been received by CDC compliance officers. Periodic background sync is actively monitoring for status updates.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 max-w-sm mx-auto text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tracking Reference:</span>
                  <span className="font-mono text-white font-bold">{application.id.substring(0, 16)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Applicant:</span>
                  <span className="text-slate-200 font-semibold">{application.personal.full_name || "AHMED YOUSAF ELVI"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Expected Approval:</span>
                  <span className="text-emerald-400 font-bold">1–2 Business Days</span>
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => setCurrentStep("documents")}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition"
                >
                  View Submitted Documents
                </button>
                <button
                  onClick={handleRefreshStatus}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition shadow-lg shadow-indigo-600/20"
                >
                  Check Live Approval Status
                </button>
              </div>
            </div>
          )}

          {/* Stepper Navigation Tracker */}
          {application.status !== "SUBMITTED" && (
            <div className="p-4 rounded-2xl bg-[#0D0D1A] border border-slate-800/80 overflow-x-auto">
              <div className="flex items-center min-w-[760px] justify-between gap-2">
                {STEPS_CONFIG.map((step, idx) => {
                  const isActive = currentStep === step.key;
                  const isCompleted = idx < currentStepIdx;

                  return (
                    <button
                      key={step.key}
                      onClick={() => handleSelectStep(step.key)}
                      className={`flex items-center gap-2 py-1.5 px-2.5 rounded-xl transition text-left ${
                        isActive
                          ? "bg-indigo-600/20 border border-indigo-500/50 text-white"
                          : isCompleted
                          ? "text-emerald-400 hover:bg-slate-900"
                          : "text-slate-500 hover:bg-slate-900 hover:text-slate-400"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                          isActive
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                            : isCompleted
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-900 border border-slate-800 text-slate-500"
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.number}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold truncate">{step.label}</span>
                        <span className="text-[9px] font-mono text-slate-500">Page {step.page}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step Form Rendering */}
          {application.status !== "SUBMITTED" && (
            <div className="p-6 rounded-3xl bg-[#0D0D1A] border border-slate-800 shadow-xl">
              {currentStep === "identity" && (
                <StepIdentity
                  onDraftUpdate={(data: any) => handleDraftUpdate("identity", data)}
                  application={application}
                  password={portalPassword}
                  onUpdateStep={handleUpdateStep}
                  onNext={handleNext}
                  loading={loading}
                />
              )}

              {currentStep === "personal" && (
                <StepPersonal
                  onDraftUpdate={(data: any) => handleDraftUpdate("personal", data)}
                  application={application}
                  password={portalPassword}
                  onUpdateStep={handleUpdateStep}
                  onNext={handleNext}
                  onBack={handleBack}
                  loading={loading}
                />
              )}

              {currentStep === "profession" && (
                <StepProfession
                  onDraftUpdate={(data: any) => handleDraftUpdate("profession", data)}
                  application={application}
                  password={portalPassword}
                  onUpdateStep={handleUpdateStep}
                  onNext={handleNext}
                  onBack={handleBack}
                  loading={loading}
                />
              )}

              {currentStep === "fatca" && (
                <StepFatca
                  onDraftUpdate={(data: any) => handleDraftUpdate("fatca", data)}
                  application={application}
                  password={portalPassword}
                  onUpdateStep={handleUpdateStep}
                  onNext={handleNext}
                  onBack={handleBack}
                  loading={loading}
                />
              )}

              {currentStep === "nominee" && (
                <StepNominee
                  onDraftUpdate={(data: any) => handleDraftUpdate("nominee", data)}
                  application={application}
                  password={portalPassword}
                  onUpdateStep={handleUpdateStep}
                  onNext={handleNext}
                  onBack={handleBack}
                  loading={loading}
                />
              )}

              {currentStep === "sdd" && (
                <StepSdd
                  onDraftUpdate={(data: any) => handleDraftUpdate("sdd", data)}
                  application={application}
                  password={portalPassword}
                  onUpdateStep={handleUpdateStep}
                  onNext={handleNext}
                  onBack={handleBack}
                  loading={loading}
                />
              )}

              {currentStep === "zakat" && (
                <StepZakat
                  onDraftUpdate={(data: any) => handleDraftUpdate("zakat", data)}
                  application={application}
                  password={portalPassword}
                  onUpdateStep={handleUpdateStep}
                  onNext={handleNext}
                  onBack={handleBack}
                  loading={loading}
                />
              )}

              {currentStep === "documents" && (
                <StepDocuments
                  application={application}
                  password={portalPassword}
                  onUpdateStep={handleUpdateStep}
                  onNext={handleNext}
                  onBack={handleBack}
                  loading={loading}
                />
              )}

              {currentStep === "review" && (
                <StepReview
                  application={application}
                  password={portalPassword}
                  onUpdateStep={handleUpdateStep}
                  onNavigateStep={(step) => handleSelectStep(step)}
                  onNext={handleNext}
                  onBack={handleBack}
                  loading={loading}
                />
              )}

              {currentStep === "declaration" && (
                <StepDeclaration
                  onDraftUpdate={(data: any) => handleDraftUpdate("declaration", data)}
                  application={application}
                  password={portalPassword}
                  onUpdateStep={handleUpdateStep}
                  onBack={handleBack}
                  loading={loading}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Case 1: Start New Application Modal */}
      {showNewAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#0F0F1E] border border-slate-800 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowNewAccountModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
            >
              <ArrowRight className="w-4 h-4 rotate-45" />
            </button>

            <div>
              <h2 className="text-lg font-bold text-white">Start New KYC Application</h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure your applicant CNIC and select account type to start the 10-step onboarding process.
              </p>
            </div>

            <form onSubmit={handleStartNewApplication} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">13-Digit Pakistani CNIC</label>
                <input
                  type="text"
                  required
                  value={newCnic}
                  onChange={(e) => setNewCnic(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="4210136069899"
                  maxLength={13}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs font-mono outline-none transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Account Type</label>
                <select
                  value={newAccountType}
                  onChange={(e: any) => setNewAccountType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none transition"
                >
                  <option value="NOR">Normal Brokerage Account (NOR - Full Limits)</option>
                  <option value="ASN">Sahulat / Asaan Account (ASN - Simplified Limits)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">CDC Portal Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Set account password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none transition"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Initializing Application...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Start Onboarding Flow
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Case 2: Resume Modal */}
      <KycAuthResumeModal
        isOpen={showResumeModal}
        onClose={() => setShowResumeModal(false)}
        onResume={handleResumeExisting}
        loading={loading}
      />

      {/* Global Full-Page Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin" />
            <div className="text-center">
              <h3 className="text-xl font-bold text-white tracking-tight">Processing Secure Request</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-sm">
                Communicating with CDC Centralized Gateway Portal. Please wait while we verify your details securely.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
