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
  FileCheck,
  RotateCcw,
  Mail,
  Phone,
  Lock,
  Building2,
  Check,
  Eye,
  EyeOff,
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

export function normalizeApplication(app: Partial<KycApplication> | null | undefined): KycApplication | null {
  if (!app || !app.id) return null;
  return {
    id: app.id,
    cnic: app.cnic || "",
    status: app.status || "IN_PROGRESS",
    account_type: app.account_type || "NOR",
    broker_code: (app as any).broker_code || "00208",
    broker_name: (app as any).broker_name || "ALPHA CAPITAL (PRIVATE) LIMITED",
    current_page: app.current_page || "",
    current_step: (app.current_step as KycStepKey) || "identity",
    last_error: app.last_error,
    scans_today_count: app.scans_today_count || 0,
    created_at: app.created_at || new Date().toISOString(),
    updated_at: app.updated_at || new Date().toISOString(),
    discrepancy_flag: Boolean(app.discrepancy_flag),
    discrepancies: app.discrepancies || [],
    identity: {
      email: app.identity?.email || "",
      email_verified: Boolean(app.identity?.email_verified),
      email_otp_sent: Boolean(app.identity?.email_otp_sent),
      mobile: app.identity?.mobile || "",
      mobile_verified: Boolean(app.identity?.mobile_verified),
      mobile_otp_sent: Boolean(app.identity?.mobile_otp_sent),
      mobile_owner_type: app.identity?.mobile_owner_type || "Self",
      iban: app.identity?.iban || "",
      iban_verified: Boolean(app.identity?.iban_verified),
      bank_name: app.identity?.bank_name || "",
      account_title: app.identity?.account_title || "",
      biometric_acknowledged: Boolean(app.identity?.biometric_acknowledged),
      ...app.identity,
    },
    personal: {
      salutation: app.personal?.salutation || "MR",
      full_name: app.personal?.full_name || "",
      father_husband_relationship: app.personal?.father_husband_relationship || "FATHER",
      father_husband_name: app.personal?.father_husband_name || "",
      cnic_doc_type: app.personal?.cnic_doc_type || "smartid",
      country_of_birth: app.personal?.country_of_birth || "PAK",
      date_of_birth: app.personal?.date_of_birth || "",
      gender: app.personal?.gender || "M",
      marital_status: app.personal?.marital_status || "1",
      place_of_birth: app.personal?.place_of_birth || "KARACHI",
      ...app.personal,
    },
    address: {
      permanent_address: app.address?.permanent_address || "",
      permanent_city: app.address?.permanent_city || "KARACHI",
      permanent_country: app.address?.permanent_country || "PAK",
      resident_status: app.address?.resident_status || "7",
      mailing_differs: Boolean(app.address?.mailing_differs),
      mailing_address: app.address?.mailing_address || "",
      mailing_city: app.address?.mailing_city || "",
      mailing_country: app.address?.mailing_country || "PAK",
      ...app.address,
    },
    profession: {
      source_of_income: app.profession?.source_of_income || "P001",
      gross_annual_income: app.profession?.gross_annual_income || "J03",
      profession_industry: app.profession?.profession_industry || "Information Technology",
      industry_other: app.profession?.industry_other || "",
      employer_or_business_name: app.profession?.employer_or_business_name || "",
      job_title: app.profession?.job_title || "",
      department: app.profession?.department || "",
      employer_address: app.profession?.employer_address || "",
      employer_city: app.profession?.employer_city || "KARACHI",
      employer_country: app.profession?.employer_country || "PAK",
      ...app.profession,
    },
    nominee: app.nominee ? { ...app.nominee } : null,
    zakat: {
      status: (app.zakat?.status as "5" | "6" | "7") || "5",
      ...app.zakat,
    },
    fatca: {
      tax_residence_country: app.fatca?.tax_residence_country || "PAK",
      tin: app.fatca?.tin || app.cnic || "",
      is_usa_person: Boolean(app.fatca?.is_usa_person),
      born_in_usa: Boolean(app.fatca?.born_in_usa),
      usa_mail_address: Boolean(app.fatca?.usa_mail_address),
      ...app.fatca,
    },
    sdd: {
      is_pep: Boolean(app.sdd?.is_pep),
      account_open_refused: Boolean(app.sdd?.account_open_refused),
      offshore_tax_links: Boolean(app.sdd?.offshore_tax_links),
      deals_precious_items: Boolean(app.sdd?.deals_precious_items),
      is_dual_national: Boolean(app.sdd?.is_dual_national),
      ...app.sdd,
    },
    documents: app.documents || [],
  };
}

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

export function validateCdcPassword(password: string): string | null {
  if (!password || password.length < 8 || password.length > 16) {
    return "CDC Password must be between 8 and 16 characters long.";
  }
  if (!/[A-Z]/.test(password)) {
    return "CDC Password must contain at least one uppercase letter (A-Z).";
  }
  if (!/[a-z]/.test(password)) {
    return "CDC Password must contain at least one lowercase letter (a-z).";
  }
  const digitMatches = password.match(/[0-9]/g);
  if (!digitMatches || digitMatches.length < 2) {
    return "CDC Password must contain at least two digits (0-9).";
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return "CDC Password must contain at least one special character (e.g. Karachi@2026).";
  }
  return null;
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
  if (!app.nominee) return false;
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
  const hasSig = app.documents.some((d) => d.kind === "signature" && d.status !== "REJECTED");
  return hasFront && hasBack && hasSig;
}

export function getFirstIncompleteStep(app: KycApplication | null | undefined): KycStepKey {
  if (!app) return "identity";
  if (app.current_page) {
    const pageMatched = STEPS_CONFIG.find((s) => s.page === app.current_page);
    if (pageMatched) return pageMatched.key;
  }
  if (!isIdentityStepComplete(app)) return "identity";
  if (!isPersonalStepComplete(app)) return "personal";
  if (!isProfessionStepComplete(app)) return "profession";
  if (!isFatcaStepComplete(app)) return "fatca";
  if (!isNomineeStepComplete(app)) return "nominee";
  if (!isSddStepComplete(app)) return "sdd";
  if (!isZakatStepComplete(app)) return "zakat";
  if (!isDocumentsStepComplete(app)) return "documents";
  return "review";
}

export function KycOnboardingView() {
  const [application, setApplication] = useState<KycApplication | null>(null);
  const [currentStep, setCurrentStep] = useState<KycStepKey>("identity");
  const [portalPassword, setPortalPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  // Registration Form State
  const [regStage, setRegStage] = useState<"DETAILS" | "OTP">("DETAILS");
  const [regCnic, setRegCnic] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regAccountType, setRegAccountType] = useState<AccountType>("NOR");
  const [regBrokerCode, setRegBrokerCode] = useState("00208");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [regEmailOtp, setRegEmailOtp] = useState("");
  const [regSmsOtp, setRegSmsOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [createdAppId, setCreatedAppId] = useState<string | null>(null);

  // Dynamic brokers list from CDC
  const [brokersList, setBrokersList] = useState<Array<{ value: string; label: string }>>([
    { value: "00208", label: "ALPHA CAPITAL (PRIVATE) LIMITED" },
  ]);

  const draftDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch broker options
  useEffect(() => {
    kycService
      .getCatalogOptions("brokers")
      .then((res) => {
        if (res?.options?.length) {
          setBrokersList(res.options);
        }
      })
      .catch(() => {});
  }, []);

  // Restore application from storage
  useEffect(() => {
    try {
      const savedAppStr = localStorage.getItem(STORAGE_APP_KEY);
      const savedStep = localStorage.getItem(STORAGE_STEP_KEY);
      const savedPwd = localStorage.getItem(STORAGE_PWD_KEY);

      if (savedPwd) setPortalPassword(savedPwd);

      if (savedAppStr) {
        const rawApp = JSON.parse(savedAppStr);
        const parsedApp = normalizeApplication(rawApp);
        if (parsedApp) {
          setApplication(parsedApp);

          // Fetch latest application state AND draft from server to preserve all inputs
          Promise.all([
            kycService.getApplication(parsedApp.id).catch(() => null),
            kycService.getDraft(parsedApp.id).catch(() => null),
          ]).then(([serverApp, draft]) => {
            if (serverApp && serverApp.id) {
              const draftSections = draft?.sections || {};
              const merged = normalizeApplication({
                ...parsedApp,
                ...serverApp,
                personal: {
                  ...parsedApp.personal,
                  ...serverApp.personal,
                  ...(draftSections.personal?.personal || draftSections.personal),
                },
                address: {
                  ...parsedApp.address,
                  ...serverApp.address,
                  ...(draftSections.personal?.address || draftSections.address),
                },
                profession: {
                  ...parsedApp.profession,
                  ...serverApp.profession,
                  ...(draftSections.profession?.answers || draftSections.profession),
                },
                nominee: draftSections.nominee?.answers || parsedApp.nominee || serverApp.nominee,
                zakat: {
                  ...parsedApp.zakat,
                  ...serverApp.zakat,
                  ...(draftSections.zakat?.answers || draftSections.zakat),
                },
                fatca: {
                  ...parsedApp.fatca,
                  ...serverApp.fatca,
                  ...(draftSections.fatca?.answers || draftSections.fatca),
                },
                sdd: {
                  ...parsedApp.sdd,
                  ...serverApp.sdd,
                  ...(draftSections.sdd?.answers || draftSections.sdd),
                },
              });
              if (merged) {
                setApplication(merged);
                localStorage.setItem(STORAGE_APP_KEY, JSON.stringify(merged));
              }
            }
          });

          if (savedStep) {
            setCurrentStep(savedStep as KycStepKey);
          } else {
            setCurrentStep(getFirstIncompleteStep(parsedApp));
          }
        }
      }
    } catch {}
  }, []);

  // Sync step
  useEffect(() => {
    if (application) {
      try {
        localStorage.setItem(STORAGE_STEP_KEY, currentStep);
      } catch {}
    }
  }, [currentStep, application]);

  // Sync password
  useEffect(() => {
    if (portalPassword) {
      try {
        localStorage.setItem(STORAGE_PWD_KEY, portalPassword);
      } catch {}
    }
  }, [portalPassword]);

  // Resend OTP countdown timer (30-second rule from documentation)
  useEffect(() => {
    let interval: any = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Auto-dismiss success notification
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Real-time draft updating
  const handleDraftUpdate = useCallback((stepKey: KycStepKey, draftData: any) => {
    setApplication((prev) => {
      if (!prev) return null;
      const next: KycApplication = { ...prev };
      if (stepKey === "personal") {
        if (draftData.personal) next.personal = { ...next.personal, ...draftData.personal };
        if (draftData.address) next.address = { ...next.address, ...draftData.address };
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

  // --- Registration Flow: Step 1 Submit (Details + Password) ---
  const handleRegisterSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCnic = regCnic.replace(/[^0-9]/g, "");

    if (!cleanCnic || cleanCnic.length !== 13) {
      setErrorMsg("Please enter a valid 13-digit Pakistani CNIC number (without dashes).");
      return;
    }
    if (!regEmail || !regEmail.includes("@")) {
      setErrorMsg("Please provide a valid email address.");
      return;
    }
    if (!regMobile || regMobile.length < 11) {
      setErrorMsg("Please provide a valid 11-digit Pakistani mobile number (e.g. 03001234567).");
      return;
    }
    const pwdErr = validateCdcPassword(regPassword);
    if (pwdErr) {
      setErrorMsg(pwdErr);
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg("Passwords do not match. Please retype password correctly.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Create or retrieve application
      const app = await kycService.createApplication(cleanCnic, regAccountType, undefined, regBrokerCode);
      const appId = app.id;
      setCreatedAppId(appId);

      // 2. Warm up CDC registration session
      kycService.warm(appId).catch(() => {});

      // 3. Register Identity (Email + Mobile)
      try {
        const idJob = await kycService.registerIdentity(appId, regEmail.trim(), regMobile.trim());
        if (idJob?.job_id) {
          await kycService.awaitJob(appId, idJob.job_id);
        }
      } catch (idErr: any) {
        const idMsg = (idErr?.message || "").toLowerCase();
        if (
          !idMsg.includes("already") &&
          !idMsg.includes("past") &&
          !idMsg.includes("awaiting")
        ) {
          throw idErr;
        }
      }

      // 4. Set Password -> CDC immediately sends OTP code
      try {
        const pwdJob = await kycService.registerPassword(appId, regPassword);
        if (pwdJob?.job_id) {
          await kycService.awaitJob(appId, pwdJob.job_id);
        }
      } catch (pwdErr: any) {
        const pwdMsg = (pwdErr?.message || "").toLowerCase();
        if (
          !pwdMsg.includes("already") &&
          !pwdMsg.includes("past") &&
          !pwdMsg.includes("awaiting")
        ) {
          throw pwdErr;
        }
      }

      // Transition to OTP section
      setRegStage("OTP");
      setResendCooldown(30); // 30s CDC cooldown
      setSuccessMsg(`CDC has sent the verification codes to ${regEmail} and ${regMobile}.`);
    } catch (err: any) {
      setErrorMsg(err.message || "CDC registration request failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- Registration Flow: Step 2 Submit (OTP Verification) ---
  const handleRegisterVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdAppId) return;

    const cleanEmailOtp = regEmailOtp.trim().replace(/[^0-9]/g, "");
    const cleanSmsOtp = regSmsOtp.trim().replace(/[^0-9]/g, "");

    if (!cleanEmailOtp || cleanEmailOtp.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit verification code received on your Email.");
      return;
    }
    if (!cleanSmsOtp || cleanSmsOtp.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit verification code received on your SMS.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Verify both Email & SMS OTPs with CDC
      const otpJob = await kycService.verifyOtp(createdAppId, {
        email_otp: cleanEmailOtp,
        sms_otp: cleanSmsOtp,
      });
      if (otpJob?.job_id) {
        await kycService.awaitJob(createdAppId, otpJob.job_id);
      }

      // 2. Set Account Type
      await kycService.setAccountType(createdAppId, regAccountType).catch(() => {});

      // 3. Save CDC Password in credentials vault
      await kycService.setCredentials(createdAppId, regPassword).catch(() => {});

      // 4. Load initialized application
      const fullApp = await kycService.getApplication(createdAppId);
      const normalized = normalizeApplication(fullApp);
      if (normalized) {
        setApplication(normalized);
        setPortalPassword(regPassword);
        setCurrentStep(getFirstIncompleteStep(normalized));
        try {
          localStorage.setItem(STORAGE_APP_KEY, JSON.stringify(normalized));
          localStorage.setItem(STORAGE_PWD_KEY, regPassword);
        } catch {}
      }

      setShowRegisterModal(false);
      setRegStage("DETAILS");
      setRegEmailOtp("");
      setRegSmsOtp("");
      setSuccessMsg("CDC Account successfully created and verified! Proceed with Identity & Biometric checks.");
    } catch (err: any) {
      setErrorMsg(err.message || "OTP verification failed. Please ensure both codes are entered correctly.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!createdAppId || resendCooldown > 0) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const resendJob = await kycService.resendOtp(createdAppId);
      if (resendJob?.job_id) {
        await kycService.awaitJob(createdAppId, resendJob.job_id);
      }
      setResendCooldown(30);
      setSuccessMsg("A fresh one-time verification code has been dispatched by CDC.");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resend OTP. Please wait 30 seconds before retrying.");
    } finally {
      setLoading(false);
    }
  };

  // --- Sign In / Resume Application ---
  const handleResumeExisting = async (cnic: string, pass: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const app = await kycService.resumeExistingApplication(cnic, pass);
      const normalized = normalizeApplication(app);
      if (!normalized) {
        throw new Error("Failed to load application profile from CDC.");
      }
      setApplication(normalized);
      setPortalPassword(pass);
      try {
        localStorage.setItem(STORAGE_APP_KEY, JSON.stringify(normalized));
        localStorage.setItem(STORAGE_PWD_KEY, pass);
      } catch {}

      // Fetch draft in background to merge any saved form inputs
      kycService.getDraft(normalized.id).then((draft) => {
        if (draft?.sections) {
          const draftSections = draft.sections;
          setApplication((prev) => {
            if (!prev) return null;
            const merged = normalizeApplication({
              ...prev,
              personal: {
                ...prev.personal,
                ...(draftSections.personal?.personal || draftSections.personal),
              },
              address: {
                ...prev.address,
                ...(draftSections.personal?.address || draftSections.address),
              },
              profession: {
                ...prev.profession,
                ...(draftSections.profession?.answers || draftSections.profession),
              },
              nominee: draftSections.nominee?.answers || prev.nominee,
              zakat: {
                ...prev.zakat,
                ...(draftSections.zakat?.answers || draftSections.zakat),
              },
              fatca: {
                ...prev.fatca,
                ...(draftSections.fatca?.answers || draftSections.fatca),
              },
              sdd: {
                ...prev.sdd,
                ...(draftSections.sdd?.answers || draftSections.sdd),
              },
            });
            if (merged) {
              try {
                localStorage.setItem(STORAGE_APP_KEY, JSON.stringify(merged));
              } catch {}
            }
            return merged;
          });
        }
      }).catch(() => {});

      const step = getFirstIncompleteStep(normalized);
      setCurrentStep(step);
      setShowResumeModal(false);
      setSuccessMsg(`Session restored for CNIC ${cnic}. Resuming at ${STEPS_CONFIG.find((s) => s.key === step)?.label || "Identity"}.`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in. Please verify your CNIC and CDC Password.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // --- Step Updates & Submissions ---
  const handleUpdateStep = async (step: KycStepKey, payload: any): Promise<any> => {
    if (!application) return;
    const isLiveSubmit = step === "declaration";
    if (isLiveSubmit) setLoading(true);
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

      if (result && result.detail) {
        setSuccessMsg(result.detail);
      }
      return result;
    } catch (err: any) {
      console.error(`Step error (${step}):`, err);
      if (step !== "identity" && step !== "declaration") {
        handleDraftUpdate(step, payload);
        return { ok: true, step };
      }
      setErrorMsg(err.message || "Step submission failed.");
      throw err;
    } finally {
      if (isLiveSubmit) setLoading(false);
    }
  };

  const handleRectifyDiscrepancy = (item: DiscrepancyItem) => {
    if (!application) return;
    setCurrentStep(item.step_key || "documents");
  };

  const handleRefreshStatus = async () => {
    if (!application) return;
    try {
      const updated = await kycService.getApplication(application.id);
      setApplication(updated);
      setSuccessMsg("Application status refreshed from CDC.");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to refresh application status.");
    }
  };

  const handleResetDefaults = async () => {
    setApplication(null);
    setPortalPassword("");
    setErrorMsg(null);
    localStorage.removeItem(STORAGE_APP_KEY);
    localStorage.removeItem(STORAGE_STEP_KEY);
    localStorage.removeItem(STORAGE_PWD_KEY);
    localStorage.removeItem(STORAGE_PORTAL_VERIFIED_KEY);
  };

  // Stepper navigation
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
                CDC Central Gateway Portal
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                Live KYC Integration
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              CDC Investor Account Onboarding
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Open your Central Depository Company (CDC) investor account with biometric verification, 1-Link RAAST bank confirmation, and stock broker linkage.
            </p>
          </div>

          {/* Action Hub */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setRegStage("DETAILS");
                setShowRegisterModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register CDC Account</span>
            </button>

            <button
              onClick={() => setShowResumeModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white text-xs font-bold transition flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-indigo-400" />
              <span>Sign In to CDC Account</span>
            </button>

            {application && (
              <button
                onClick={handleResetDefaults}
                title="Switch account / Sign out"
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Clean 2-Option Entry Screen when no application is open */}
      {!application && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
          {/* Option 1: Register New Account */}
          <div
            onClick={() => {
              setRegStage("DETAILS");
              setShowRegisterModal(true);
            }}
            className="p-8 rounded-3xl bg-[#0F0F1E] border border-slate-800 hover:border-indigo-500/50 shadow-xl cursor-pointer transition group relative space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <UserPlus className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">New Investor</span>
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition mt-1">
                Register New CDC Account
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Create your CDC Central Gateway Portal account. Enter your CNIC, email, mobile number, set a secure password, and verify with a one-time OTP code.
              </p>
            </div>
            <div className="pt-3 flex items-center gap-2 text-xs font-bold text-indigo-400">
              <span>Start registration</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Option 2: Sign In / Resume */}
          <div
            onClick={() => setShowResumeModal(true)}
            className="p-8 rounded-3xl bg-[#0F0F1E] border border-slate-800 hover:border-violet-500/50 shadow-xl cursor-pointer transition group relative space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
              <KeyRound className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block">Existing Applicant</span>
              <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition mt-1">
                Sign In to CDC Account
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Already created a CDC account? Sign in with your 13-digit CNIC and portal password to restore your saved draft and continue where you left off.
              </p>
            </div>
            <div className="pt-3 flex items-center gap-2 text-xs font-bold text-violet-400">
              <span>Sign in & continue</span>
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
                  {application.account_type === "NOR" ? "Normal (Full Limits)" : "Asaan (Sahulat)"}
                </span>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-500 block text-[10px]">CDC Status</span>
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
              <button
                onClick={handleRefreshStatus}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sync Status</span>
              </button>
            </div>
          </div>

          {/* Error / Success Alerts */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start justify-between gap-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold text-xs">Notice:</strong>
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

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start justify-between gap-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold text-xs">Success:</strong>
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

          {/* TBR Discrepancy Panel */}
          {application.status === "TBR" && application.discrepancy_flag && (
            <KycDiscrepancyPanel
              application={application}
              onRectify={handleRectifyDiscrepancy}
              onRefreshStatus={handleRefreshStatus}
              loading={loading}
            />
          )}

          {/* Stepper Navigation Bar */}
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
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-900 text-slate-500 border border-slate-800"
                        }`}
                      >
                        {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.number}
                      </div>
                      <span className="text-xs font-semibold whitespace-nowrap">{step.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Step Form View */}
          <div className="p-6 rounded-3xl bg-[#0F0F1E] border border-slate-800 shadow-2xl">
            {currentStep === "identity" && (
              <StepIdentity
                application={application}
                password={portalPassword}
                onUpdateStep={handleUpdateStep}
                onDraftUpdate={(data: any) => handleDraftUpdate("personal", data)}
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
        </div>
      )}

      {/* Register CDC Account Modal (Phase 1 Details & Phase 2 OTP) */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-[#0F0F1E] border border-slate-800 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
            >
              <ArrowRight className="w-4 h-4 rotate-45" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {regStage === "DETAILS" ? "Register CDC Investor Account" : "Verify CDC One-Time Code (OTP)"}
                </h2>
                <p className="text-xs text-slate-400">
                  {regStage === "DETAILS"
                    ? "Enter applicant CNIC, contact details, set your CDC password, and select account type."
                    : `CDC has dispatched a verification code to ${regEmail} and ${regMobile}.`}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Stage 1: Registration Form */}
            {regStage === "DETAILS" && (
              <form onSubmit={handleRegisterSubmitDetails} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">13-Digit Pakistani CNIC</label>
                  <input
                    type="text"
                    required
                    value={regCnic}
                    onChange={(e) => setRegCnic(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="e.g. 4210112345671"
                    maxLength={13}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs font-mono outline-none transition"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">{regCnic.length}/13 digits</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="applicant@example.pk"
                        className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none transition"
                      />
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Mobile Number</label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={regMobile}
                        onChange={(e) => setRegMobile(e.target.value)}
                        placeholder="03001234567"
                        maxLength={11}
                        className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs font-mono outline-none transition"
                      />
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Account Type</label>
                    <select
                      value={regAccountType}
                      onChange={(e: any) => setRegAccountType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none transition"
                    >
                      <option value="NOR">Normal Account (Full Limits)</option>
                      <option value="ASN">Asaan Sahulat (Simplified)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Stock Broker</label>
                    <select
                      value={regBrokerCode}
                      onChange={(e) => setRegBrokerCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none transition"
                    >
                      {brokersList.map((b) => (
                        <option key={b.value} value={b.value}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Choose CDC Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="e.g. Karachi@2026"
                        className="w-full px-3.5 py-2.5 pr-9 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 text-xs"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Retype Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full px-3.5 py-2.5 pr-9 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 text-xs"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-300">CDC Password Policy (8–16 chars):</p>
                  <p className="text-[10px] text-slate-400">
                    Must contain at least 1 uppercase letter, 1 lowercase letter, 2 digits, and 1 special character (e.g. <span className="font-mono text-indigo-300">Karachi@2026</span>).
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Communicating with CDC Portal...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" /> Send CDC Verification OTP
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Stage 2: OTP Verification Form */}
            {regStage === "OTP" && (
              <form onSubmit={handleRegisterVerifyOtp} className="space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs space-y-1">
                  <p className="font-semibold text-white">CDC Verification Codes Dispatched</p>
                  <p>
                    CDC sends two separate codes. Enter both the Email code and SMS code below:
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1">
                      <span>Code from the email</span>
                      <span className="text-[10px] text-slate-400 font-normal">{regEmail}</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={regEmailOtp}
                        onChange={(e) => setRegEmailOtp(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="e.g. 123456"
                        maxLength={6}
                        className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-base font-mono tracking-widest outline-none transition"
                      />
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1">
                      <span>Code from the SMS</span>
                      <span className="text-[10px] text-slate-400 font-normal">{regMobile}</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={regSmsOtp}
                        onChange={(e) => setRegSmsOtp(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="e.g. 654321"
                        maxLength={6}
                        className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-base font-mono tracking-widest outline-none transition"
                      />
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setRegStage("DETAILS")}
                    className="text-slate-400 hover:text-white"
                  >
                    ← Edit Details
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className={`font-semibold ${
                      resendCooldown > 0 ? "text-slate-500 cursor-not-allowed" : "text-indigo-400 hover:text-indigo-300"
                    }`}
                  >
                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP Codes"}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Codes & Creating CDC Account...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Verify Codes & Complete Registration
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Sign In / Resume Modal */}
      <KycAuthResumeModal
        isOpen={showResumeModal}
        onClose={() => setShowResumeModal(false)}
        onResume={handleResumeExisting}
        loading={loading}
      />

      {/* Global Processing Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin" />
            <div className="text-center">
              <h3 className="text-xl font-bold text-white tracking-tight">Communicating with CDC Portal</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-sm">
                Please wait while we interact with Central Depository Company (CDC) secure servers.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
