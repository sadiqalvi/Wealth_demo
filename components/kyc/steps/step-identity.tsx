import React, { useState, useEffect, useMemo } from "react";
import { KycApplication, IdentityData, KycStepKey } from "@/lib/kyc/types";
import {
  ShieldCheck,
  Fingerprint,
  Mail,
  Smartphone,
  Landmark,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Edit2,
  Building2,
  Lock,
  Timer,
  AlertTriangle,
  X,
  FileText,
  UserCheck,
  Check,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

interface StepIdentityProps {
  application: KycApplication;
  password: string;
  onUpdateStep: (step: KycStepKey | string, payload: any) => Promise<any>;
  onNext: () => void;
  loading: boolean;
  onDraftUpdate?: (data: IdentityData) => void;
  onOpenBiometric?: () => void;
}

export const PAKISTANI_BANKS: Record<string, { name: string; type: string; color: string }> = {
  MEZN: { name: "Meezan Bank Limited", type: "Islamic Banking", color: "text-amber-400" },
  HABB: { name: "Habib Bank Limited (HBL)", type: "Commercial Banking", color: "text-emerald-400" },
  BAHL: { name: "Bank AL Habib Limited", type: "Commercial Banking", color: "text-blue-400" },
  UNIL: { name: "United Bank Limited (UBL)", type: "Commercial Banking", color: "text-cyan-400" },
  UBLP: { name: "United Bank Limited (UBL)", type: "Commercial Banking", color: "text-cyan-400" },
  MUCB: { name: "MCB Bank Limited", type: "Commercial Banking", color: "text-orange-400" },
  MCBL: { name: "MCB Islamic Bank", type: "Islamic Banking", color: "text-emerald-400" },
  SCBL: { name: "Standard Chartered Bank (Pakistan)", type: "International Banking", color: "text-teal-400" },
  FAYS: { name: "Faysal Bank Limited", type: "Islamic Banking", color: "text-violet-400" },
  JSBL: { name: "JS Bank Limited", type: "Commercial Banking", color: "text-indigo-400" },
  ASCR: { name: "Askari Bank Limited", type: "Commercial Banking", color: "text-rose-400" },
  AKBL: { name: "Askari Bank Limited", type: "Commercial Banking", color: "text-rose-400" },
  ALFH: { name: "Bank Alfalah Limited", type: "Commercial Banking", color: "text-red-400" },
  BAFL: { name: "Bank Alfalah Limited", type: "Commercial Banking", color: "text-red-400" },
  BOPP: { name: "The Bank of Punjab (BOP)", type: "Provincial Commercial", color: "text-yellow-400" },
  ABPA: { name: "Allied Bank Limited (ABL)", type: "Commercial Banking", color: "text-blue-400" },
  DIBP: { name: "Dubai Islamic Bank Pakistan", type: "Islamic Banking", color: "text-emerald-400" },
  BIPK: { name: "BankIslami Pakistan Limited", type: "Islamic Banking", color: "text-emerald-400" },
  SNBL: { name: "Soneri Bank Limited", type: "Commercial Banking", color: "text-amber-400" },
  HMBL: { name: "Habib Metropolitan Bank", type: "Commercial Banking", color: "text-emerald-400" },
  SBLP: { name: "Samba Bank Limited", type: "Commercial Banking", color: "text-sky-400" },
  SILK: { name: "Silkbank Limited", type: "Commercial Banking", color: "text-rose-400" },
  FWBL: { name: "First Women Bank Limited", type: "Specialized Banking", color: "text-pink-400" },
  NBPA: { name: "National Bank of Pakistan (NBP)", type: "State Commercial", color: "text-green-400" },
};

const STORAGE_PORTAL_VERIFIED_PREFIX = "wealthdemo_kyc_portal_verified_";


export function formatCgpErrorMessage(rawError: string, context?: "mobile" | "email" | "iban", ownerType?: string): string {
  if (!rawError) return "Verification failed. Please check your details and try again.";
  const lower = rawError.toLowerCase();

  if (context === "mobile" || lower.includes("sms") || lower.includes("mobile")) {
    if (
      lower.includes("expected \"otp has been sent\"") ||
      lower.includes("did not confirm") ||
      lower.includes("not registered") ||
      lower.includes("mismatch") ||
      lower.includes("pta")
    ) {
      if (ownerType && ownerType !== "Self") {
        return `PTA SIM Verification Failed: The mobile number is not registered under ${ownerType}'s CNIC according to Pakistan Telecommunication Authority (PTA) records. Please verify the mobile number and CNIC details.`;
      }
      return "PTA SIM Verification Failed: Provided mobile number is not registered under your CNIC in the PTA SIM database. Please verify the number or select appropriate family SIM ownership.";
    }
  }

  if (context === "email" || lower.includes("email")) {
    if (lower.includes("expected") || lower.includes("did not confirm")) {
      return "CDC Email Gateway Notice: Could not dispatch OTP to the specified email address. Please verify the email format.";
    }
  }

  if (context === "iban" || lower.includes("iban")) {
    if (lower.includes("expected") || lower.includes("title") || lower.includes("1-link")) {
      return "1-Link 1-IBFT Resolution Failed: Bank account title does not match your registered applicant identity. Please provide an account in your own name.";
    }
  }

  return rawError.replace(/^cgp validation \d+\/[^:]+:\s*/i, "");
}

export function StepIdentity({ application, password, onUpdateStep, onNext, loading, onDraftUpdate, onOpenBiometric }: StepIdentityProps) {
  const [identity, setIdentity] = useState<IdentityData>({
    ...(application.identity || {}),
    email: application.identity?.email || "",
    mobile: application.identity?.mobile || "",
    mobile_owner_type: application.identity?.mobile_owner_type || "Self",
    iban: application.identity?.iban || "",
    bank_name: application.identity?.bank_name || (application.identity?.iban?.includes("MEZN") ? "Meezan Bank Limited" : application.identity?.iban ? "Habib Bank Limited (HBL)" : undefined),
    account_title: application.identity?.account_title || application.personal?.full_name || "",
  });

  // Mobile Ownership Additional Details
  const [relativeCnic, setRelativeCnic] = useState<string>(application.identity?.relative_cnic || "");
  const [relativeName, setRelativeName] = useState<string>(application.identity?.relative_name || "");
  const [declarationAccepted, setDeclarationAccepted] = useState<boolean>(application.identity?.mobile_declaration_accepted ?? false);

  // Stored / Portal Verified Identity Records (Source of Truth on CDC Portal)
  const [portalVerified, setPortalVerified] = useState<{
    email: string;
    email_verified: boolean;
    mobile: string;
    mobile_verified: boolean;
    mobile_owner_type: string;
    iban: string;
    iban_verified: boolean;
    bank_name?: string;
    account_title?: string;
  }>(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(STORAGE_PORTAL_VERIFIED_PREFIX + (application?.id || "default"));
        if (stored) return JSON.parse(stored);
      }
    } catch {}
    return {
      email: application.identity?.email || "",
      email_verified: Boolean(application.identity?.email_verified),
      mobile: application.identity?.mobile || "",
      mobile_verified: Boolean(application.identity?.mobile_verified),
      mobile_owner_type: application.identity?.mobile_owner_type || "Self",
      iban: application.identity?.iban || "",
      iban_verified: Boolean(application.identity?.iban_verified),
      bank_name: application.identity?.bank_name,
      account_title: application.identity?.account_title || application.personal?.full_name || "",
    };
  });

  // Warmup state
  const [isWarmingUp, setIsWarmingUp] = useState<boolean>(false);
  const [warmupDone, setWarmupDone] = useState<boolean>(false);

  // Edit / Re-verify toggles
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(!application.identity?.email_verified);
  const [isEditingMobile, setIsEditingMobile] = useState<boolean>(!application.identity?.mobile_verified);
  const [isEditingIban, setIsEditingIban] = useState<boolean>(!application.identity?.iban_verified);

  // Confirmation Modal for Unlocking an Already-Verified Field
  const [confirmChangeModal, setConfirmChangeModal] = useState<{
    isOpen: boolean;
    field: "email" | "mobile" | "iban" | null;
    title: string;
    description: string;
  }>({
    isOpen: false,
    field: null,
    title: "",
    description: "",
  });

  // Identity Verification Conflict / Choice Modal
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [selectedChoices, setSelectedChoices] = useState<Record<"email" | "mobile" | "iban", "portal" | "form">>({
    email: "portal",
    mobile: "portal",
    iban: "portal",
  });

  // 30-Second Resend Countdown Timers
  const [emailCooldown, setEmailCooldown] = useState<number>(0);
  const [smsCooldown, setSmsCooldown] = useState<number>(0);

  const [emailOtpInput, setEmailOtpInput] = useState("");
  const [smsOtpInput, setSmsOtpInput] = useState("");
    // Section-specific error states & scroll refs for targeted visual feedback
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [ibanError, setIbanError] = useState<string | null>(null);
  const mobileSectionRef = React.useRef<HTMLDivElement | null>(null);
  const emailSectionRef = React.useRef<HTMLDivElement | null>(null);
  const ibanSectionRef = React.useRef<HTMLDivElement | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (emailCooldown > 0) {
      timer = setTimeout(() => setEmailCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [emailCooldown]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (smsCooldown > 0) {
      timer = setTimeout(() => setSmsCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [smsCooldown]);

  // Sync draft updates to parent & localStorage (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      onDraftUpdate?.({
        ...identity,
        relative_cnic: relativeCnic,
        relative_name: relativeName,
        mobile_declaration_accepted: declarationAccepted,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [identity, relativeCnic, relativeName, declarationAccepted]);

  // Initial state is primed from sign-in / biometric check; do not call read_state on mount
  useEffect(() => {
    setWarmupDone(true);
    setIsWarmingUp(false);
  }, []);

  // Live Bank Resolution based on IBAN input
  const cleanIban = useMemo(() => {
    return (identity.iban || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  }, [identity.iban]);

  const cleanPortalIban = useMemo(() => {
    return (portalVerified.iban || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  }, [portalVerified.iban]);

  const liveDetectedBank = useMemo(() => {
    if (cleanIban.length < 8) return null;
    const code = cleanIban.substring(4, 8);
    return PAKISTANI_BANKS[code] || null;
  }, [cleanIban]);

  // Ownership Type Categories
  const isFamilyOwner = useMemo(() => {
    return ["Father", "Husband", "Mother", "Son", "Daughter", "Spouse", "Child"].includes(identity.mobile_owner_type);
  }, [identity.mobile_owner_type]);

  const isBusinessOwner = useMemo(() => {
    return identity.mobile_owner_type === "Business";
  }, [identity.mobile_owner_type]);

  // Check if any verified portal record differs from current form values or is unverified
  const emailConflict = useMemo(() => {
    return !!portalVerified.email && (identity.email !== portalVerified.email || !identity.email_verified);
  }, [portalVerified.email, identity.email, identity.email_verified]);

  const mobileConflict = useMemo(() => {
    return !!portalVerified.mobile && (identity.mobile !== portalVerified.mobile || !identity.mobile_verified);
  }, [portalVerified.mobile, identity.mobile, identity.mobile_verified]);

  const ibanConflict = useMemo(() => {
    return !!cleanPortalIban && (cleanIban !== cleanPortalIban || !identity.iban_verified);
  }, [cleanPortalIban, cleanIban, identity.iban_verified]);

  const hasAnyConflict = emailConflict || mobileConflict || ibanConflict;

  // 1. Biometrics Activation
  const handleAcknowledgeBiometrics = async () => {
    setActionLoading("biometric");
    setErrorMsg(null);
    try {
      const res = await onUpdateStep("identity", { password, sub_step: "bio_ack" });
      setIdentity((prev) => {
        const next = { ...prev, biometric_acknowledged: true };
        onDraftUpdate?.(next);
        return next;
      });
      setSuccessMsg(res?.detail || "Biometric verification session initialized successfully.");
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to initialize biometrics.");
    } finally {
      setActionLoading(null);
    }
  };

  // 2. Email OTP Send
  const handleSendEmailOtp = async () => {
    if (!identity.email || !identity.email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setActionLoading("email_send");
    setErrorMsg(null);
    try {
      const res = await onUpdateStep("identity", { password, sub_step: "email_send", email: identity.email });
      setIdentity((prev) => {
        const next = { ...prev, email_otp_sent: true, email_verified: false };
        onDraftUpdate?.(next);
        return next;
      });
      setEmailCooldown(30);
      setSuccessMsg(res?.detail || `6-digit OTP dispatched to ${identity.email}`);
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to send email OTP.");
    } finally {
      setActionLoading(null);
    }
  };

  // 3. Email OTP Verify
  const handleVerifyEmailOtp = async () => {
    if (emailOtpInput.length < 4) {
      setErrorMsg("Please enter the verification OTP code.");
      return;
    }
    setActionLoading("email_verify");
    setErrorMsg(null);
    try {
      const res = await onUpdateStep("identity", { password, sub_step: "email_verify", otp: emailOtpInput });
      setIdentity((prev) => {
        const next = { ...prev, email_verified: true, email_otp_sent: false };
        onDraftUpdate?.(next);
        return next;
      });
      setPortalVerified((prev) => {
        const next = { ...prev, email: identity.email, email_verified: true };
        try {
          localStorage.setItem(STORAGE_PORTAL_VERIFIED_PREFIX + (application?.id || "default"), JSON.stringify(next));
        } catch {}
        return next;
      });
      setIsEditingEmail(false);
      setEmailOtpInput("");
      setSuccessMsg(res?.detail || "Email successfully verified with CDC Gateway!");
    } catch (e: any) {
      setErrorMsg(e.message || "Email OTP verification failed.");
    } finally {
      setActionLoading(null);
    }
  };

  // 4. SMS OTP Send (with Conditional Family/Business Validation)
  const handleSendSmsOtp = async () => {
    if (!identity.mobile || identity.mobile.length < 10) {
      setErrorMsg("Please enter a valid Pakistani mobile number.");
      return;
    }

    if (isFamilyOwner) {
      if (!relativeCnic || relativeCnic.length < 13) {
        setErrorMsg("Relative CNIC is required (13 digits without dashes) when the SIM belongs to a family member.");
        return;
      }
      if (!relativeName.trim()) {
        setErrorMsg("Relative Name is required when the SIM belongs to a family member.");
        return;
      }
      if (!declarationAccepted) {
        setErrorMsg("Please read and accept the Authorization / Declaration checkbox before proceeding.");
        return;
      }
    } else if (isBusinessOwner) {
      if (!relativeName.trim()) {
        setErrorMsg("Company / Corporate Entity Name is required when the SIM belongs to a business.");
        return;
      }
    }

    setActionLoading("sms_send");
    setErrorMsg(null);
    try {
      const res = await onUpdateStep("identity", {
        password,
        sub_step: "sms_send",
        mobile: identity.mobile,
        belongs_to: identity.mobile_owner_type,
        relative_cnic: isFamilyOwner ? relativeCnic : undefined,
        relative_name: relativeName.trim(),
        declaration_accepted: isFamilyOwner ? declarationAccepted : false,
      });
      setIdentity((prev) => {
        const next = { ...prev, mobile_otp_sent: true, mobile_verified: false };
        onDraftUpdate?.(next);
        return next;
      });
      setSmsCooldown(30);
      setSuccessMsg(res?.detail || `SMS OTP dispatched to ${identity.mobile}`);
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to dispatch SMS OTP.");
    } finally {
      setActionLoading(null);
    }
  };

  // 5. SMS OTP Verify
  const handleVerifySmsOtp = async () => {
    if (smsOtpInput.length < 4) {
      setErrorMsg("Please enter the SMS OTP code.");
      return;
    }
    setActionLoading("sms_verify");
    setErrorMsg(null);
    try {
      const res = await onUpdateStep("identity", {
        password,
        sub_step: "sms_verify",
        otp: smsOtpInput,
        mobile: identity.mobile,
        belongs_to: identity.mobile_owner_type,
        relative_cnic: isFamilyOwner ? relativeCnic : undefined,
        relative_name: relativeName.trim(),
        declaration_accepted: isFamilyOwner ? declarationAccepted : false,
      });
      setIdentity((prev) => {
        const next = { ...prev, mobile_verified: true, mobile_otp_sent: false };
        onDraftUpdate?.(next);
        return next;
      });
      setPortalVerified((prev) => {
        const next = {
          ...prev,
          mobile: identity.mobile,
          mobile_verified: true,
          mobile_owner_type: identity.mobile_owner_type,
        };
        try {
          localStorage.setItem(STORAGE_PORTAL_VERIFIED_PREFIX + (application?.id || "default"), JSON.stringify(next));
        } catch {}
        return next;
      });
      setIsEditingMobile(false);
      setSmsOtpInput("");
      setSuccessMsg(res?.detail || "Mobile phone number verified with PTA SIM registry!");
    } catch (e: any) {
      setErrorMsg(e.message || "SMS OTP verification failed.");
    } finally {
      setActionLoading(null);
    }
  };

  // 6. IBAN Resolution & Verification
  const handleVerifyIban = async () => {
    if (!cleanIban.startsWith("PK")) {
      setErrorMsg("Pakistani IBAN must start with 'PK' (e.g. PK32MEZN0001310107513652).");
      return;
    }
    if (cleanIban.length !== 24) {
      setErrorMsg(`Pakistani IBAN must be exactly 24 characters long (currently ${cleanIban.length} characters).`);
      return;
    }

    const resolvedBankName =
      liveDetectedBank?.name ||
      (cleanIban.includes("MEZN")
        ? "Meezan Bank Limited"
        : cleanIban.includes("HABB")
        ? "Habib Bank Limited (HBL)"
        : cleanIban.includes("BAHL")
        ? "Bank AL Habib Limited"
        : "Commercial Bank of Pakistan");

    setActionLoading("iban");
    setErrorMsg(null);
    try {
      const res = await onUpdateStep("identity", { password, sub_step: "iban_verify", iban: cleanIban });
      const finalBank = res?.bank_name || resolvedBankName;
      const finalTitle = res?.account_title || application.personal?.full_name || "";
      setIdentity((prev) => {
        const next = {
          ...prev,
          iban: cleanIban,
          iban_verified: true,
          bank_name: finalBank,
          account_title: finalTitle,
        };
        onDraftUpdate?.(next);
        return next;
      });
      setPortalVerified((prev) => {
        const next = {
          ...prev,
          iban: cleanIban,
          iban_verified: true,
          bank_name: finalBank,
          account_title: finalTitle,
        };
        try {
          localStorage.setItem(STORAGE_PORTAL_VERIFIED_PREFIX + (application?.id || "default"), JSON.stringify(next));
        } catch {}
        return next;
      });
      setIsEditingIban(false);
      setSuccessMsg(res?.detail || `IBAN verified! 1-Link resolved: ${finalBank}. Click Save & Proceed when ready.`);
    } catch (e: any) {
      setErrorMsg(e.message || "IBAN resolution failed.");
    } finally {
      setActionLoading(null);
    }
  };

  // Request Confirmation before unlocking verified fields
  const requestChangeConfirmation = (field: "email" | "mobile" | "iban") => {
    if (field === "email") {
      setConfirmChangeModal({
        isOpen: true,
        field: "email",
        title: "Change Registered Email Address?",
        description:
          "Changing your email address will require receiving and verifying a fresh 6-digit OTP code through the CDC Gateway Portal. Are you sure you want to proceed?",
      });
    } else if (field === "mobile") {
      setConfirmChangeModal({
        isOpen: true,
        field: "mobile",
        title: "Change Registered Mobile Number?",
        description:
          "Changing your mobile number will require PTA SIM owner re-verification and SMS OTP verification. Are you sure you want to proceed?",
      });
    } else if (field === "iban") {
      setConfirmChangeModal({
        isOpen: true,
        field: "iban",
        title: "Change Bank Account IBAN?",
        description:
          "Changing your bank account details will trigger a fresh 1-Link 1-IBFT title lookup. Are you sure you want to proceed?",
      });
    }
  };

  const handleConfirmChange = () => {
    const field = confirmChangeModal.field;
    if (field === "email") {
      setIsEditingEmail(true);
      setIdentity((prev) => ({ ...prev, email_verified: false, email_otp_sent: false }));
      setEmailOtpInput("");
    } else if (field === "mobile") {
      setIsEditingMobile(true);
      setIdentity((prev) => ({ ...prev, mobile_verified: false, mobile_otp_sent: false }));
      setSmsOtpInput("");
    } else if (field === "iban") {
      setIsEditingIban(true);
      setIdentity((prev) => ({ ...prev, iban_verified: false }));
    }
    setConfirmChangeModal({ isOpen: false, field: null, title: "", description: "" });
  };

  // Open the Identity Conflict & Selection Modal
  const openConflictModal = () => {
    setSelectedChoices({
      email: identity.email_verified ? "form" : "portal",
      mobile: identity.mobile_verified ? "form" : "portal",
      iban: identity.iban_verified ? "form" : "portal",
    });
    setConflictModalOpen(true);
  };

  // Apply User Choices from Conflict Modal
  const handleApplyChoices = async () => {
    setIdentity((prev) => {
      let next = { ...prev };

      // Email Choice
      if (selectedChoices.email === "portal") {
        next.email = portalVerified.email;
        next.email_verified = true;
        setIsEditingEmail(false);
      } else {
        setIsEditingEmail(!prev.email_verified);
      }

      // Mobile Choice
      if (selectedChoices.mobile === "portal") {
        next.mobile = portalVerified.mobile;
        next.mobile_owner_type = (portalVerified.mobile_owner_type as any) || "Self";
        next.mobile_verified = true;
        setIsEditingMobile(false);
      } else {
        setIsEditingMobile(!prev.mobile_verified);
      }

      // IBAN Choice
      if (selectedChoices.iban === "portal") {
        next.iban = portalVerified.iban;
        next.iban_verified = true;
        next.bank_name = portalVerified.bank_name;
        next.account_title = portalVerified.account_title;
        setIsEditingIban(false);
      } else {
        setIsEditingIban(!prev.iban_verified);
      }

      onDraftUpdate?.(next);
      return next;
    });

    setConflictModalOpen(false);

    // Evaluate readiness to proceed
    const emailOk = selectedChoices.email === "portal" || identity.email_verified;
    const mobileOk = selectedChoices.mobile === "portal" || identity.mobile_verified;
    const ibanOk = selectedChoices.iban === "portal" || identity.iban_verified;
    const bioOk = identity.biometric_acknowledged;

    if (emailOk && mobileOk && ibanOk && bioOk) {
      setSuccessMsg("Identity verified! Fetching verified details from CDC Portal before closing session...");
      setActionLoading("proceed");
      try {
        const prefillRes = await onUpdateStep("personal", { password, sub_step: "prefill" });
        if (prefillRes?.personal) {
          onDraftUpdate?.({
            ...identity,
            relative_cnic: relativeCnic,
            relative_name: relativeName,
            mobile_declaration_accepted: declarationAccepted,
          });
        }
      } catch (err) {
        console.warn("Prefill error:", err);
      }
      try {
        await onUpdateStep("identity", { password, sub_step: "release" });
      } catch (err) {
        console.warn("Release error:", err);
      } finally {
        setActionLoading(null);
      }
      onNext();
    } else {
      const pending: string[] = [];
      if (!bioOk) pending.push("Biometric Consent");
      if (!emailOk) pending.push("Email OTP");
      if (!mobileOk) pending.push("SMS OTP");
      if (!ibanOk) pending.push("IBAN");
      setErrorMsg(`You chose to keep unverified values for: ${pending.join(", ")}. Please complete verification below to proceed.`);
    }
  };

  // Main Save & Proceed Button Click Handler
  const handleProceedClick = async () => {
    // If there is any conflict or unverified fields while portal has verified, prompt user!
    if (hasAnyConflict || !isReadyForNext) {
      openConflictModal();
      return;
    }

    setActionLoading("proceed");
    setSuccessMsg("Fetching verified profile information from CDC Portal / AKSA Gateway...");

    // 1. Fetch CDC portal information BEFORE closing the warm session
    try {
      const prefillRes = await onUpdateStep("personal", { password, sub_step: "prefill" });
      if (prefillRes?.personal) {
        onDraftUpdate?.({
          ...identity,
          relative_cnic: relativeCnic,
          relative_name: relativeName,
          mobile_declaration_accepted: declarationAccepted,
        });
      }
    } catch (err) {
      console.warn("Could not prefill personal from CDC, continuing:", err);
    }

    // 2. Now close / release the warm browser session
    try {
      await onUpdateStep("identity", { password, sub_step: "release" });
    } catch (err) {
      console.warn("Session release error:", err);
    } finally {
      setActionLoading(null);
    }

    // 3. Advance to Step 2 (Personal Info)
    onNext();
  };

  const isReadyForNext =
    identity.biometric_acknowledged &&
    identity.email_verified &&
    identity.mobile_verified &&
    identity.iban_verified;

  if (isWarmingUp && !warmupDone) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Step Header */}
        <div className="border-b border-slate-800 pb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Step 1: Identity & Bank Resolution (Page 50)</h2>
              <p className="text-xs text-slate-400">
                Establishing single-identity browser connection with Centralized Gateway Portal...
              </p>
            </div>
          </div>
        </div>

        {/* Dedicated Warmup Loading Screen */}
        <div className="p-8 rounded-3xl bg-gradient-to-b from-[#0F0F23] to-[#0A0A16] border border-indigo-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 blur-3xl rounded-full pointer-events-none" />

          {/* Radar / Pulsing Shield animation */}
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 animate-ping opacity-75" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 border border-indigo-400/40 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cold Start Gateway Initialization</span>
            </div>
            <h3 className="text-lg font-black text-white">
              Connecting to CDC Centralized Gateway Portal...
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Launching dedicated single-identity browser engine and authenticating with Oracle APEX. Loading verified biometric, email, and PTA identity records.
            </p>
          </div>

          {/* Real-time Stage Progression Ticker */}
          <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 text-left">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
              <span className="font-semibold text-slate-300">Gateway Session Pipeline</span>
              <span className="text-[11px] font-mono text-indigo-400 font-bold">~15–20s Cold Start</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Single-Identity Headless Browser Engine Spawned</span>
              </div>
              <div className="flex items-center gap-2.5 text-indigo-300 font-semibold animate-pulse">
                <RefreshCw className="w-4 h-4 flex-shrink-0 animate-spin text-indigo-400" />
                <span>Authenticating Credentials on Oracle APEX (Page 50)...</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-500">
                <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px]">3</div>
                <span>Snapshotting live 2FA OTP & 1-Link IBAN states</span>
              </div>
            </div>

            {/* Smooth animated progress bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 w-full animate-pulse rounded-full" />
            </div>
          </div>

          {/* Educational Notice */}
          <div className="max-w-md mx-auto p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-indigo-300/90 text-xs flex items-start gap-2.5 text-left">
            <Lock className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Why this wait?</strong> Cold-starting the secure APEX session takes 15–20s once. Once warmed, all subsequent OTP relays and NADRA prefill queries will dispatch instantaneously (2–4 seconds).
            </p>
          </div>

          {/* Emergency fallback bypass button if user wishes to fill offline immediately */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setIsWarmingUp(false);
                setWarmupDone(true);
              }}
              className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-4 transition"
            >
              Skip waiting and proceed with offline form
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Step Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Step 1: Identity & Bank Resolution (Page 50)</h2>
            <p className="text-xs text-slate-400">
              Verify your NADRA biometric eligibility, two-factor OTP credentials, and 1-Link IBAN bank account title.
            </p>
          </div>
        </div>

        {/* Conflict Review Button if discrepancies exist */}
        <button
          type="button"
          onClick={openConflictModal}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-2"
        >
          <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Review Portal vs Form Values</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 0. Locked CNIC Info Box */}
      <div className="p-4 rounded-2xl bg-[#0B0B16] border border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">Registered CNIC (Locked Identity)</div>
            <div className="text-[11px] font-mono text-indigo-400 font-semibold">{application.cnic}</div>
          </div>
        </div>
        <span className="text-[10px] text-slate-500 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" /> Non-Editable Primary Key
        </span>
      </div>

      {/* 1. Biometric Status Card */}
      <div className="p-4 rounded-2xl bg-[#0F0F1E] border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                identity.biometric_acknowledged
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}
            >
              <Fingerprint className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">1. NADRA Biometric Verification (CDC Access / Asaan Connect)</div>
              <div className="text-[11px] text-slate-400">Mobile app fingerprint scan via CDC Access / Asaan Connect</div>
            </div>
          </div>
          {identity.biometric_acknowledged ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
            </span>
          ) : (
            <button
              onClick={() => (onOpenBiometric ? onOpenBiometric() : handleAcknowledgeBiometrics())}
              disabled={actionLoading === "biometric"}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              {actionLoading === "biometric" && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Verify on Mobile App</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Email 2FA Relay Card */}
      <div className="p-4 rounded-2xl bg-[#0F0F1E] border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                identity.email_verified && !isEditingEmail
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">2. Email Address Verification</div>
              <div className="text-[11px] text-slate-400">Relay CDC one-time password code</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {identity.email_verified && !isEditingEmail && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
            )}

            {identity.email_verified && !isEditingEmail && (
              <button
                type="button"
                onClick={() => requestChangeConfirmation("email")}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> Change / Re-verify
              </button>
            )}
          </div>
        </div>

        {/* Display Verified Email View */}
        {identity.email_verified && !isEditingEmail && (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Registered Email:</span>
            <span className="font-mono text-emerald-400 font-bold">{identity.email}</span>
          </div>
        )}

                {emailError && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start justify-between gap-2.5 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-rose-200 block text-xs">Email Verification Error</span>
                <p className="text-[11px] leading-relaxed text-rose-300">{emailError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEmailError(null)}
              className="text-rose-400 hover:text-white text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Edit / Verify Email Input Form */}
        {(!identity.email_verified || isEditingEmail) && (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
            <div className="sm:col-span-8">
              <input
                type="email"
                value={identity.email}
                onChange={(e) => { setEmailError(null); setIdentity((prev) => ({ ...prev, email: e.target.value })); }}
                placeholder="name@example.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
              />
            </div>
            <div className="sm:col-span-4 flex gap-2">
              <button
                onClick={handleSendEmailOtp}
                disabled={actionLoading === "email_send" || emailCooldown > 0}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1"
              >
                {actionLoading === "email_send" && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {emailCooldown > 0 ? (
                  <span className="flex items-center gap-1">
                    <Timer className="w-3 h-3" /> Resend in {emailCooldown}s
                  </span>
                ) : identity.email_otp_sent ? (
                  "Resend OTP"
                ) : (
                  "Send OTP"
                )}
              </button>
            </div>

            {identity.email_otp_sent && (
              <div className="sm:col-span-12 flex gap-2 mt-2">
                <input
                  type="text"
                  maxLength={6}
                  value={emailOtpInput}
                  onChange={(e) => setEmailOtpInput(e.target.value)}
                  placeholder="Enter 6-digit Email OTP (e.g. 123456)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-indigo-500/50 text-xs font-mono text-indigo-300 placeholder:text-slate-600 outline-none"
                />
                <button
                  onClick={handleVerifyEmailOtp}
                  disabled={actionLoading === "email_verify"}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1"
                >
                  {actionLoading === "email_verify" && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Verify
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Mobile Number & PTA SIM Ownership Card */}
      <div className="p-4 rounded-2xl bg-[#0F0F1E] border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                identity.mobile_verified && !isEditingMobile
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">3. Mobile Number & PTA SIM Ownership (Page 50)</div>
              <div className="text-[11px] text-slate-400">SIM ownership verification via PTA PMD service</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {identity.mobile_verified && !isEditingMobile && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified ({identity.mobile_owner_type})
              </span>
            )}

            {identity.mobile_verified && !isEditingMobile && (
              <button
                type="button"
                onClick={() => requestChangeConfirmation("mobile")}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> Change / Re-verify
              </button>
            )}
          </div>
        </div>

        {/* Display Verified Mobile View */}
        {identity.mobile_verified && !isEditingMobile && (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Registered Phone ({identity.mobile_owner_type}):</span>
            <span className="font-mono text-emerald-400 font-bold">{identity.mobile}</span>
          </div>
        )}

                {mobileError && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start justify-between gap-2.5 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-rose-200 block text-xs">PTA Mobile Verification Failed</span>
                <p className="text-[11px] leading-relaxed text-rose-300">{mobileError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileError(null)}
              className="text-rose-400 hover:text-white text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Edit / Verify Mobile Input Form */}
        {(!identity.mobile_verified || isEditingMobile) && (
          <div className="space-y-3 pt-2">
            {/* Mobile Number & Ownership Select Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Mobile Number Belongs To</label>
                <select
                  value={identity.mobile_owner_type}
                  onChange={(e: any) => { setMobileError(null); setIdentity((prev) => ({ ...prev, mobile_owner_type: e.target.value })); }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value="Self">SELF (Registered Under My CNIC)</option>
                  <option value="Father">FATHER</option>
                  <option value="Husband">HUSBAND</option>
                  <option value="Mother">MOTHER</option>
                  <option value="Son">SON</option>
                  <option value="Daughter">DAUGHTER</option>
                  <option value="Business">BUSINESS / CORPORATE</option>
                </select>
              </div>

              <div className="sm:col-span-4">
                <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Local Mobile Number (11 digits)</label>
                <input
                  type="tel"
                  value={identity.mobile}
                  onChange={(e) => { setMobileError(null); setIdentity((prev) => ({ ...prev, mobile: e.target.value.replace(/[^0-9]/g, "") })); }}
                  placeholder="03XXXXXXXXX"
                  maxLength={11}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="sm:col-span-3 flex items-end">
                <button
                  type="button"
                  onClick={handleSendSmsOtp}
                  disabled={actionLoading === "sms_send" || smsCooldown > 0}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1"
                >
                  {actionLoading === "sms_send" && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {smsCooldown > 0 ? (
                    <span className="flex items-center gap-1">
                      <Timer className="w-3 h-3" /> Resend in {smsCooldown}s
                    </span>
                  ) : identity.mobile_otp_sent ? (
                    "Resend OTP"
                  ) : (
                    "Generate OTP"
                  )}
                </button>
              </div>
            </div>

            {/* Conditional Fields for Non-Self SIM Ownership */}
            {isFamilyOwner && (
              <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  <span>Family Member SIM Provisioning Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Relative CNIC / SNIC <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={13}
                      value={relativeCnic}
                      onChange={(e) => { setMobileError(null); setRelativeCnic(e.target.value.replace(/[^0-9]/g, "")); }}
                      placeholder="13-digit CNIC (e.g. 4210136069899)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono placeholder:text-slate-500 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Relative Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={relativeName}
                      onChange={(e) => { setMobileError(null); setRelativeName(e.target.value); }}
                      placeholder="Full name as printed on relative's CNIC"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Authorization / Declaration Checkbox */}
                <div className="pt-1 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="mobile_family_decl"
                    checked={declarationAccepted}
                    onChange={(e) => { setMobileError(null); setDeclarationAccepted(e.target.checked); }}
                    className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="mobile_family_decl" className="text-[11px] text-slate-300 leading-relaxed cursor-pointer">
                    I have read, understood and agreed to the{" "}
                    <span className="text-indigo-400 underline font-semibold">
                      Authorization / Declaration for the purpose of provisioning of mobile number of close family member
                    </span>.
                  </label>
                </div>
              </div>
            )}

            {isBusinessOwner && (
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>Corporate / Business SIM Provisioning Details</span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Company / Entity Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={relativeName}
                    onChange={(e) => setRelativeName(e.target.value)}
                    placeholder="Registered Company / Corporate entity name"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-500"
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Document Required:</strong> Submission of Declaration on Company’s letterhead in the Documents section (Step 8) will be required.
                  </span>
                </div>
              </div>
            )}

            {/* OTP Input Row */}
            {identity.mobile_otp_sent && (
              <div className="flex gap-2 pt-1 animate-in fade-in">
                <input
                  type="text"
                  maxLength={6}
                  value={smsOtpInput}
                  onChange={(e) => setSmsOtpInput(e.target.value)}
                  placeholder="Enter 6-digit SMS OTP code (e.g. 654321)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-indigo-500/50 text-xs font-mono text-indigo-300 placeholder:text-slate-600 outline-none"
                />
                <button
                  onClick={handleVerifySmsOtp}
                  disabled={actionLoading === "sms_verify"}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1"
                >
                  {actionLoading === "sms_verify" && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Verify OTP
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Bank Account & 1-Link IBAN Resolution Card */}
      <div className="p-4 rounded-2xl bg-[#0F0F1E] border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                identity.iban_verified && !isEditingIban
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">4. Bank Account Title Resolution (1-Link IBAN)</div>
              <div className="text-[11px] text-slate-400">Direct 1-IBFT title lookup and Raast verification</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {identity.iban_verified && !isEditingIban && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
            )}

            {identity.iban_verified && !isEditingIban && (
              <button
                type="button"
                onClick={() => requestChangeConfirmation("iban")}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> Change / Re-verify
              </button>
            )}
          </div>
        </div>

        {/* Display Verified IBAN View */}
        {identity.iban_verified && !isEditingIban && (
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Resolved Bank:</span>
              <span className="text-white font-bold">{identity.bank_name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Account Title:</span>
              <span className="text-white font-bold">{identity.account_title || application.personal?.full_name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pakistani IBAN:</span>
              <span className="font-mono text-emerald-400 font-bold">{identity.iban}</span>
            </div>
          </div>
        )}

                {ibanError && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start justify-between gap-2.5 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-rose-200 block text-xs">IBAN Resolution Error</span>
                <p className="text-[11px] leading-relaxed text-rose-300">{ibanError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIbanError(null)}
              className="text-rose-400 hover:text-white text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Edit / Verify IBAN Input Form */}
        {(!identity.iban_verified || isEditingIban) && (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-9">
                <input
                  type="text"
                  value={identity.iban}
                  onChange={(e) => { setIbanError(null); setIdentity((prev) => ({ ...prev, iban: e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase() })); }}
                  placeholder="PK32MEZN0001310107513652 (24 characters)"
                  maxLength={24}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 font-mono tracking-wider"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={handleVerifyIban}
                  disabled={actionLoading === "iban"}
                  className="w-full px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-lg shadow-indigo-600/20"
                >
                  {actionLoading === "iban" && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Verify IBAN
                </button>
              </div>
            </div>

            {liveDetectedBank && (
              <div className="p-3 rounded-xl bg-slate-900/80 border border-indigo-500/30 flex items-center justify-between text-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Building2 className={`w-4 h-4 ${liveDetectedBank.color}`} />
                  <div>
                    <span className="font-bold text-white">{liveDetectedBank.name}</span>
                    <span className="text-[10px] text-slate-400 block">{liveDetectedBank.type}</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-indigo-400 font-semibold">
                  Length: {cleanIban.length}/24 chars
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-800">
        <div className="text-[11px] text-slate-400">
          {!isReadyForNext && (
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Complete Biometrics, Email OTP, SMS OTP, and IBAN to proceed directly, or click below to review choices.
            </span>
          )}
          {isReadyForNext && (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> All identity items verified! Click Save & Proceed when ready.
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleProceedClick}
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Save & Proceed to Personal Info (Page 52)"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* IDENTITY VERIFICATION CONFLICT & SELECTION MODAL              */}
      {/* ------------------------------------------------------------- */}
      {conflictModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl p-6 rounded-3xl bg-[#0F0F1E] border border-slate-800 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setConflictModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Identity Verification Values</h3>
                <p className="text-xs text-slate-400">
                  Choose which field values you want to keep: Verified (on CDC portal) or Unverified (on this form).
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Except for Identity, form values you enter always fill everything. For Identity, you can choose to keep the 
              <strong> Verified Portal values</strong> (retains verified status without re-verifying) or 
              <strong> Unverified Form values</strong> (which you will verify with a fresh OTP / 1-Link check).
            </p>

            {/* Quick Action Selection Buttons */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400">Quick selection:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedChoices({ email: "portal", mobile: "portal", iban: "portal" })}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-[11px] font-semibold transition"
                >
                  Use All Verified (Portal)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedChoices({ email: "form", mobile: "form", iban: "form" })}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 text-[11px] font-semibold transition"
                >
                  Use All Form Inputs
                </button>
              </div>
            </div>

            {/* Field Comparison Cards */}
            <div className="space-y-4">
              {/* Field 1: Email Address */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" /> Email Address
                  </span>
                  <span className="text-[10px] text-slate-500">Choice required</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option A: Verified Portal Value */}
                  <label
                    onClick={() => setSelectedChoices((p) => ({ ...p, email: "portal" }))}
                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-1 text-left ${
                      selectedChoices.email === "portal"
                        ? "bg-emerald-500/10 border-emerald-500/60 ring-1 ring-emerald-500/30"
                        : "bg-slate-900 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Verified (CDC Portal)
                      </span>
                      <input
                        type="radio"
                        name="choice_email"
                        checked={selectedChoices.email === "portal"}
                        onChange={() => {}}
                        className="text-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                    <span className="font-mono text-xs text-white font-bold break-all">
                      {portalVerified.email || "—"}
                    </span>
                    <span className="text-[10px] text-slate-400">Keeps active verified status</span>
                  </label>

                  {/* Option B: Unverified Form Input */}
                  <label
                    onClick={() => setSelectedChoices((p) => ({ ...p, email: "form" }))}
                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-1 text-left ${
                      selectedChoices.email === "form"
                        ? "bg-indigo-500/10 border-indigo-500/60 ring-1 ring-indigo-500/30"
                        : "bg-slate-900 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Unverified (Form Input)
                      </span>
                      <input
                        type="radio"
                        name="choice_email"
                        checked={selectedChoices.email === "form"}
                        onChange={() => {}}
                        className="text-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <span className="font-mono text-xs text-white font-bold break-all">
                      {identity.email || "—"}
                    </span>
                    <span className="text-[10px] text-slate-400">Will require fresh OTP verification</span>
                  </label>
                </div>
              </div>

              {/* Field 2: Mobile Number */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-indigo-400" /> Mobile Number & SIM
                  </span>
                  <span className="text-[10px] text-slate-500">Choice required</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option A: Verified Portal Value */}
                  <label
                    onClick={() => setSelectedChoices((p) => ({ ...p, mobile: "portal" }))}
                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-1 text-left ${
                      selectedChoices.mobile === "portal"
                        ? "bg-emerald-500/10 border-emerald-500/60 ring-1 ring-emerald-500/30"
                        : "bg-slate-900 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Verified (CDC Portal)
                      </span>
                      <input
                        type="radio"
                        name="choice_mobile"
                        checked={selectedChoices.mobile === "portal"}
                        onChange={() => {}}
                        className="text-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                    <span className="font-mono text-xs text-white font-bold">
                      {portalVerified.mobile || "—"}
                    </span>
                    <span className="text-[10px] text-slate-400">PTA SIM verified (Self)</span>
                  </label>

                  {/* Option B: Unverified Form Input */}
                  <label
                    onClick={() => setSelectedChoices((p) => ({ ...p, mobile: "form" }))}
                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-1 text-left ${
                      selectedChoices.mobile === "form"
                        ? "bg-indigo-500/10 border-indigo-500/60 ring-1 ring-indigo-500/30"
                        : "bg-slate-900 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Unverified (Form Input)
                      </span>
                      <input
                        type="radio"
                        name="choice_mobile"
                        checked={selectedChoices.mobile === "form"}
                        onChange={() => {}}
                        className="text-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <span className="font-mono text-xs text-white font-bold">
                      {identity.mobile || "—"} ({identity.mobile_owner_type || "Self"})
                    </span>
                    <span className="text-[10px] text-slate-400">Will require fresh SMS OTP</span>
                  </label>
                </div>
              </div>

              {/* Field 3: Bank Account IBAN */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-indigo-400" /> Bank IBAN & Account Title
                  </span>
                  <span className="text-[10px] text-slate-500">Choice required</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option A: Verified Portal Value */}
                  <label
                    onClick={() => setSelectedChoices((p) => ({ ...p, iban: "portal" }))}
                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-1 text-left ${
                      selectedChoices.iban === "portal"
                        ? "bg-emerald-500/10 border-emerald-500/60 ring-1 ring-emerald-500/30"
                        : "bg-slate-900 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Verified (CDC Portal)
                      </span>
                      <input
                        type="radio"
                        name="choice_iban"
                        checked={selectedChoices.iban === "portal"}
                        onChange={() => {}}
                        className="text-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                    <span className="font-mono text-xs text-white font-bold truncate">
                      {portalVerified.iban || "—"}
                    </span>
                    <span className="text-[10px] text-slate-400">{portalVerified.bank_name || "—"}</span>
                  </label>

                  {/* Option B: Unverified Form Input */}
                  <label
                    onClick={() => setSelectedChoices((p) => ({ ...p, iban: "form" }))}
                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-1 text-left ${
                      selectedChoices.iban === "form"
                        ? "bg-indigo-500/10 border-indigo-500/60 ring-1 ring-indigo-500/30"
                        : "bg-slate-900 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Unverified (Form Input)
                      </span>
                      <input
                        type="radio"
                        name="choice_iban"
                        checked={selectedChoices.iban === "form"}
                        onChange={() => {}}
                        className="text-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <span className="font-mono text-xs text-white font-bold truncate">
                      {identity.iban || "—"}
                    </span>
                    <span className="text-[10px] text-slate-400">Will require 1-Link resolution</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConflictModalOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel & Review
              </button>
              <button
                type="button"
                onClick={handleApplyChoices}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-1.5"
              >
                <span>Confirm & Apply Choices</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "Are You Sure?" Modal for Re-verifying a Field */}
      {confirmChangeModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#0F0F1E] border border-amber-500/40 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setConfirmChangeModal({ isOpen: false, field: null, title: "", description: "" })}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{confirmChangeModal.title}</h3>
                <span className="text-[10px] text-amber-400 font-semibold">Verification Reset Required</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{confirmChangeModal.description}</p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmChangeModal({ isOpen: false, field: null, title: "", description: "" })}
                className="py-2 px-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel (Keep Current)
              </button>
              <button
                type="button"
                onClick={handleConfirmChange}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 transition flex items-center justify-center gap-1.5"
              >
                Yes, Change & Re-verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
