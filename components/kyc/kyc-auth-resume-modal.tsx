import React, { useState } from "react";
import { Lock, X, AlertCircle, RefreshCw, KeyRound, Sparkles, UserCheck, ShieldAlert } from "lucide-react";

interface KycAuthResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResume: (cnic: string, password: string) => Promise<void>;
  loading: boolean;
}

export function KycAuthResumeModal({ isOpen, onClose, onResume, loading }: KycAuthResumeModalProps) {
  const [cnicInput, setCnicInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cnicInput || !passwordInput) {
      setErrorMsg("Please enter both your CNIC and portal password.");
      return;
    }
    setErrorMsg(null);
    try {
      await onResume(cnicInput, passwordInput);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to authenticate CDC credentials.");
    }
  };

  const handleQuickFill = (cnic: string, pass: string) => {
    setCnicInput(cnic);
    setPasswordInput(pass);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg p-6 rounded-3xl bg-[#0F0F1E] border border-slate-800 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Resume Existing KYC Application</h2>
            <p className="text-xs text-slate-400">
              Enter your CNIC and portal password to restore your session right where you left off.
            </p>
          </div>
        </div>

        {/* Quick-Fill Staging Presets from Guide */}
        <div className="p-3.5 rounded-2xl bg-[#0A0A14] border border-slate-800 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" /> Staging Test Profiles (1-Click Load)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill("4210136069899", "Alvi@CDC2026")}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-left transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-indigo-300">Profile 1 (Fresh Start)</span>
                <span className="text-[10px] font-mono text-indigo-400">Page 50</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">4210136069899</div>
              <div className="text-[10px] text-slate-500">First-Time Flow (Post-Biometrics)</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("4210156297009", "0300Ajami.")}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-left transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-amber-300">Profile 2 (Discrepancy)</span>
                <span className="text-[10px] font-mono text-amber-400">TBR / Review</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">4210156297009</div>
              <div className="text-[10px] text-slate-500">Flagged Document Notice</div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">13-Digit Pakistani CNIC</label>
            <input
              type="text"
              required
              value={cnicInput}
              onChange={(e) => setCnicInput(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 4210136069899"
              maxLength={13}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs font-mono outline-none transition"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">CDC Portal Password</label>
            <input
              type="password"
              required
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="••••••••"
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
                <RefreshCw className="w-4 h-4 animate-spin" /> Authenticating & Restoring Form...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" /> Authenticate & Resume Where Left Off
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
