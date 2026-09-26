import React, { useState } from "react";
import { KycApplication } from "@/lib/kyc/types";
import {
  Fingerprint,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  QrCode,
  Sparkles,
  Lock,
  Mail,
  Phone,
} from "lucide-react";

interface StepBiometricProps {
  application: KycApplication;
  detail?: string | null;
  onProceedCheck: () => Promise<void>;
  loading: boolean;
  onSkipToIdentity?: () => void;
}

export function StepBiometric({
  application,
  detail,
  onProceedCheck,
  loading,
  onSkipToIdentity,
}: StepBiometricProps) {
  const [activeTab, setActiveTab] = useState<"instructions" | "faq">("instructions");

  const emailVerified = Boolean(application?.identity?.email_verified);
  const mobileVerified = Boolean(application?.identity?.mobile_verified);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              NADRA Biometric Verification (Asaan Connect / CDC Access)
            </h2>
            <p className="text-xs text-slate-400">
              Complete your biometric fingerprint scan on the CDC Access or Asaan Connect mobile app.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Awaiting Mobile Biometric
          </span>
        </div>
      </div>

      {/* CDC Detail Alert / Feedback Box */}
      {detail ? (
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs flex items-start gap-3 shadow-lg">
          <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-white font-bold block text-xs">CDC Gateway Status:</strong>
            <p className="text-xs leading-relaxed text-indigo-200/90">{detail}</p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs flex items-start gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-white font-bold block text-xs">CDC Gateway Notice:</strong>
            <p className="text-xs leading-relaxed text-indigo-200/90">
              Download the <strong>CDC Access</strong> or <strong>Asaan Connect</strong> mobile app, complete the biometric verification there, then come back here and press <strong>Proceed</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Verified Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#0B0B16] border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-[10px] text-slate-500">Applicant CNIC</div>
              <div className="text-xs font-mono font-bold text-white">{application.cnic}</div>
            </div>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0B0B16] border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-[10px] text-slate-500">Email Verification</div>
              <div className="text-xs font-semibold text-white">
                {emailVerified ? "Verified with CDC" : "Pending OTP"}
              </div>
            </div>
          </div>
          {emailVerified ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <span className="text-[10px] text-slate-500">Step 1</span>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0B0B16] border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-[10px] text-slate-500">Mobile PTA SIM</div>
              <div className="text-xs font-semibold text-white">
                {mobileVerified ? "Verified with CDC" : "Pending OTP"}
              </div>
            </div>
          </div>
          {mobileVerified ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <span className="text-[10px] text-slate-500">Step 1</span>
          )}
        </div>
      </div>

      {/* Main Instruction Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1 */}
        <div className="p-5 rounded-2xl bg-[#0F0F23] border border-slate-800 space-y-3 relative overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
            1
          </div>
          <h3 className="text-sm font-bold text-white">Download CDC Access App</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Install the official <strong>CDC Access</strong> or <strong>Asaan Connect</strong> app from Google Play Store or Apple App Store on your smartphone.
          </p>
          <div className="pt-2 flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300">
              Android Play Store
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300">
              Apple App Store
            </span>
          </div>
        </div>

        {/* Step 2 */}
        <div className="p-5 rounded-2xl bg-[#0F0F23] border border-slate-800 space-y-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
            2
          </div>
          <h3 className="text-sm font-bold text-white">Scan Your Fingerprints</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Open the app, enter your 13-digit CNIC (<span className="font-mono text-indigo-300">{application.cnic}</span>), and follow the on-screen camera prompts to capture your NADRA biometric scan.
          </p>
          <div className="p-2 rounded-lg bg-slate-900/80 text-[11px] text-indigo-300 flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Ensure good lighting and clean camera lens</span>
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-5 rounded-2xl bg-[#0F0F23] border border-slate-800 space-y-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
            3
          </div>
          <h3 className="text-sm font-bold text-white">Click Proceed Below</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Once you see the confirmation screen in the mobile app, come back here and click the <strong>Proceed</strong> button below to sync your verified status.
          </p>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-[11px] text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Instant sync with CDC Oracle Gateway</span>
          </div>
        </div>
      </div>

      {/* Action CTA Box */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0F0F28] via-[#121232] to-[#0F0F28] border border-indigo-500/30 text-center space-y-4 shadow-2xl">
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-base font-bold text-white">Ready to confirm biometric verification?</h3>
          <p className="text-xs text-slate-400">
            Click Proceed to verify your biometric status with CDC servers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onProceedCheck}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Checking Biometric Status with CDC...</span>
              </>
            ) : (
              <>
                <Fingerprint className="w-4 h-4" />
                <span>Proceed & Check Biometrics</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {onSkipToIdentity && (
            <button
              type="button"
              onClick={onSkipToIdentity}
              className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold transition"
            >
              Continue to Identity Form
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
