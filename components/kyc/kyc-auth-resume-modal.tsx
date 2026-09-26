import React, { useState } from "react";
import { Lock, X, AlertCircle, RefreshCw, KeyRound, Eye, EyeOff } from "lucide-react";

interface KycAuthResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResume: (cnic: string, password: string) => Promise<void>;
  loading: boolean;
}

export function KycAuthResumeModal({ isOpen, onClose, onResume, loading }: KycAuthResumeModalProps) {
  const [cnicInput, setCnicInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCnic = cnicInput.replace(/[^0-9]/g, "");
    if (!cleanCnic || cleanCnic.length !== 13) {
      setErrorMsg("Please enter a valid 13-digit Pakistani CNIC number.");
      return;
    }
    if (!passwordInput) {
      setErrorMsg("Please enter your CDC portal password.");
      return;
    }
    setErrorMsg(null);
    try {
      await onResume(cleanCnic, passwordInput);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to authenticate CDC credentials.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md p-6 rounded-3xl bg-[#0F0F1E] border border-slate-800 shadow-2xl space-y-5 relative">
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
            <h2 className="text-lg font-bold text-white">Sign In to CDC Account</h2>
            <p className="text-xs text-slate-400">
              Enter your CNIC and CDC Portal password to resume your application.
            </p>
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
              placeholder="e.g. 4210112345671"
              maxLength={13}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs font-mono outline-none transition"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              {cnicInput.length}/13 digits
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">CDC Portal Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter CDC password"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none transition"
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
                <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Credentials...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" /> Sign In & Resume KYC
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
