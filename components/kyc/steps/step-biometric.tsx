import React from "react";
import { KycApplication } from "@/lib/kyc/types";
import {
  Fingerprint,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  QrCode,
  Info,
} from "lucide-react";

interface StepBiometricProps {
  application: KycApplication;
  detail?: string | null;
  onProceedCheck: () => Promise<void>;
  loading: boolean;
}

export function StepBiometric({
  application,
  detail,
  onProceedCheck,
  loading,
}: StepBiometricProps) {
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
              NADRA Biometric Verification (CDC Access / Asaan Connect)
            </h2>
            <p className="text-xs text-slate-400">
              Complete your biometric fingerprint scan on the CDC Access or Asaan Connect mobile app.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Biometric Required (CDC: Not Verified)
          </span>
        </div>
      </div>

      {/* CDC Detail Alert / Feedback Box */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-indigo-950/40 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-3 shadow-lg">
        <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-white font-bold block text-xs">
            CDC Central Gateway Notice:
          </strong>
          <p className="text-xs leading-relaxed text-slate-200">
            {detail ||
              "Your biometric verification is not complete yet (CDC: Not Verified). Download the CDC Access app, complete the biometric verification there, then come back here and press Proceed. Email, mobile and bank account (IBAN) verification stay locked until CDC confirms the biometric."}
          </p>
        </div>
      </div>

      {/* Sequential Lock Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-3">
        <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <p className="text-xs leading-relaxed">
          <strong>Step 1 is currently locked:</strong> Subsequent steps (Email verification, Mobile PTA SIM verification, 1-Link IBAN resolution, and Personal info) remain off-limits until CDC confirms your biometric scan.
        </p>
      </div>

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
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            Primary Key
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0B0B16] border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-[10px] text-slate-500">Email Status</div>
              <div className="text-xs font-semibold text-white">
                {emailVerified ? "Saved on CDC" : "Locked (Pending Biometric)"}
              </div>
            </div>
          </div>
          {emailVerified ? (
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Ready
            </span>
          ) : (
            <Lock className="w-3.5 h-3.5 text-slate-600" />
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0B0B16] border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-[10px] text-slate-500">Mobile Status</div>
              <div className="text-xs font-semibold text-white">
                {mobileVerified ? "Saved on CDC" : "Locked (Pending Biometric)"}
              </div>
            </div>
          </div>
          {mobileVerified ? (
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Ready
            </span>
          ) : (
            <Lock className="w-3.5 h-3.5 text-slate-600" />
          )}
        </div>
      </div>

      {/* Main Download & Verification Instructions */}
      <div className="p-6 rounded-3xl bg-[#0F0F23] border border-slate-800 space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Smartphone className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">
            Where and How to Complete Biometric Verification:
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Download Apps */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold flex items-center justify-center">
                1
              </div>
              <h4 className="text-xs font-bold text-white">Download CDC Access / Asaan Connect</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Install the official <strong>CDC Access</strong> app by Central Depository Company of Pakistan or the <strong>Asaan Connect</strong> app on your smartphone.
              </p>
            </div>

            <div className="pt-3 space-y-2 border-t border-slate-800/80">
              <a
                href="https://play.google.com/store/apps/details?id=com.cdc.access"
                target="_blank"
                rel="noreferrer"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition flex items-center justify-between"
              >
                <span>Google Play Store (Android)</span>
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
              </a>
              <a
                href="https://apps.apple.com/app/cdc-access/id1527773228"
                target="_blank"
                rel="noreferrer"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition flex items-center justify-between"
              >
                <span>Apple App Store (iOS)</span>
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
              </a>
            </div>
          </div>

          {/* Card 2: Perform Fingerprint Scan */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold flex items-center justify-center">
                2
              </div>
              <h4 className="text-xs font-bold text-white">Log in & Scan Fingerprints</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Open the app and log in with your CNIC (<span className="font-mono text-indigo-300 font-bold">{application.cnic}</span>) and your CDC Portal password.
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Select <strong>Biometric Verification</strong> and scan your 4 fingers / thumb using your phone camera against a plain background with good lighting.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>Direct NADRA Verisys Integration</span>
            </div>
          </div>

          {/* Card 3: Sync & Proceed */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center justify-center">
                3
              </div>
              <h4 className="text-xs font-bold text-white">Press Proceed Below</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Once the mobile app displays your biometric confirmation, come back here and press the <strong>Proceed & Verify Biometrics</strong> button below.
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Our gateway will poll CDC Oracle servers to verify your NADRA clearance and immediately unlock your onboarding form.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Calls /biometric/check API</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action CTA Box */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0F0F28] via-[#121232] to-[#0F0F28] border border-indigo-500/30 text-center space-y-4 shadow-2xl">
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-base font-bold text-white">
            Have you completed the biometric scan in CDC Access app?
          </h3>
          <p className="text-xs text-slate-400">
            Click Proceed to check clearance with CDC and unlock the next steps.
          </p>
        </div>

        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={onProceedCheck}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Checking Biometric Status with CDC Gateway...</span>
              </>
            ) : (
              <>
                <Fingerprint className="w-4 h-4" />
                <span>Proceed & Check Biometrics</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
