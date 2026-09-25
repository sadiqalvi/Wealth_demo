import React, { useState } from "react";
import { KycApplication, DocumentItem } from "@/lib/kyc/types";
import { FileUp, Trash2, CheckCircle2, AlertCircle, RefreshCw, Eye, Sparkles } from "lucide-react";

interface StepDocumentsProps {
  application: KycApplication;
  password: string;
  onUpdateStep: (step: "documents", payload: any) => Promise<any>;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}

interface DocSlotConfig {
  kind: DocumentItem["kind"];
  title: string;
  description: string;
  required: boolean;
}

export function StepDocuments({ application, password, onUpdateStep, onNext, onBack, loading }: StepDocumentsProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>(application.documents || []);
  const [uploadingKind, setUploadingKind] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const docSlots: DocSlotConfig[] = [
    {
      kind: "cnic_front",
      title: "CNIC / Smart Card (Front)",
      description: "Clear, colored photo of CNIC front with all 4 corners visible.",
      required: true,
    },
    {
      kind: "cnic_back",
      title: "CNIC / Smart Card (Back)",
      description: "Clear, readable copy of CNIC back with legible barcode.",
      required: true,
    },
    {
      kind: "proof_of_income",
      title: "Proof of Income / Salary Slip",
      description: "Recent 3 months salary slip, employer certificate, or bank statement.",
      required: true,
    },
    {
      kind: "signature",
      title: "Specimen Signature Sheet",
      description: "Your official signature signed on blank white paper.",
      required: true,
    },
    {
      kind: "utility_bill",
      title: "Utility Bill / Address Proof",
      description: "Electricity, Gas or Water bill for residential address verification.",
      required: application.address.mailing_differs,
    },
    ...(application.zakat.status !== "5"
      ? [
          {
            kind: "cz50_affidavit" as DocumentItem["kind"],
            title: "CZ-50 Zakat Exemption Affidavit",
            description: "Notarized Form CZ-50 or non-Muslim declaration.",
            required: true,
          },
        ]
      : []),
  ];

  const handleFileUpload = async (kind: DocumentItem["kind"], file: File) => {
    setUploadingKind(kind);
    setErrorMsg(null);
    try {
      // Read as base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      await onUpdateStep("documents", {
        password,
        sub_step: "upload",
        kind,
        filename: file.name,
        content_type: file.type,
        file_base64: base64Data,
        dialog_url: "/cdc/cgp/r/centralized-gateway-portal/investor-documents",
      });

      // Update local state
      setDocuments((prev) => [
        ...prev.filter((d) => d.kind !== kind),
        {
          kind,
          filename: file.name,
          content_type: file.type,
          file_base64: base64Data,
          uploaded_at: new Date().toISOString(),
          status: "VALID",
        },
      ]);
      setSuccessMsg(`Uploaded ${file.name} successfully.`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload document.");
    } finally {
      setUploadingKind(null);
    }
  };

  const handleSampleUpload = async (kind: DocumentItem["kind"], filename: string) => {
    setUploadingKind(kind);
    setErrorMsg(null);
    try {
      await onUpdateStep("documents", {
        password,
        sub_step: "upload",
        kind,
        filename,
        content_type: "image/jpeg",
        file_base64: "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPifDwAEfwHRQh9g4AAAAABJRU5ErkJggg==",
        dialog_url: "/cdc/cgp/r/centralized-gateway-portal/investor-documents",
      });

      setDocuments((prev) => [
        ...prev.filter((d) => d.kind !== kind),
        {
          kind,
          filename,
          content_type: "image/jpeg",
          uploaded_at: new Date().toISOString(),
          status: "VALID",
        },
      ]);
      setSuccessMsg(`Sample ${filename} uploaded.`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload sample document.");
    } finally {
      setUploadingKind(null);
    }
  };

  const handleDeleteDocument = async (doc: DocumentItem) => {
    setUploadingKind(doc.kind);
    setErrorMsg(null);
    try {
      await onUpdateStep("documents", {
        password,
        sub_step: "delete",
        kind: doc.kind,
        page_id: doc.page_id,
        dialog_url: "/cdc/cgp/r/centralized-gateway-portal/investor-documents",
      });

      setDocuments((prev) => prev.filter((d) => d.kind !== doc.kind));
      setSuccessMsg(`Deleted ${doc.filename}.`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete document.");
    } finally {
      setUploadingKind(null);
    }
  };

  const handleUploadAllSamples = async () => {
    for (const slot of docSlots) {
      if (!documents.some((d) => d.kind === slot.kind && d.status === "VALID")) {
        await handleSampleUpload(slot.kind, `${slot.kind}_verified.jpg`);
      }
    }
  };

  const requiredSlots = docSlots.filter((s) => s.required);
  const isReady = requiredSlots.every((s) =>
    documents.some((d) => d.kind === s.kind && d.status === "VALID")
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FileUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Step 8: Investor Documents Upload (Page 67+)</h2>
            <p className="text-xs text-slate-400">
              Upload compliance documents required for Central Depository Company account creation.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleUploadAllSamples}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Auto-Upload All Samples
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Document Slots List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docSlots.map((slot) => {
          const doc = documents.find((d) => d.kind === slot.kind);
          const isUploaded = !!doc;
          const isRejected = doc?.status === "REJECTED";
          const isValid = doc?.status === "VALID";

          return (
            <div
              key={slot.kind}
              className={`p-4 rounded-2xl border transition ${
                isRejected
                  ? "bg-rose-950/20 border-rose-500/40"
                  : isValid
                  ? "bg-[#0F0F1E] border-emerald-500/30"
                  : "bg-[#0F0F1E] border-slate-800"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{slot.title}</span>
                    {slot.required && (
                      <span className="text-[10px] text-amber-400 font-semibold">*Required</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{slot.description}</p>
                </div>

                {isValid && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1 flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3" /> Valid
                  </span>
                )}
                {isRejected && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold flex items-center gap-1 flex-shrink-0">
                    <AlertCircle className="w-3 h-3" /> Flagged
                  </span>
                )}
              </div>

              {/* Rejection notice banner if discrepancy */}
              {isRejected && doc?.rejection_note && (
                <div className="mt-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-[11px] text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <span className="font-bold text-rose-200 block">CDC Reviewer Note:</span>
                    {doc.rejection_note}
                  </div>
                </div>
              )}

              {/* Uploaded File Info or Upload Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                {isUploaded ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-300 truncate max-w-[180px]">
                      <span className="truncate">{doc.filename}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition">
                        <span>Replace</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleFileUpload(slot.kind, e.target.files[0]);
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc)}
                        disabled={uploadingKind === slot.kind}
                        title="Delete document"
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full gap-2">
                    <button
                      type="button"
                      onClick={() => handleSampleUpload(slot.kind, `${slot.kind}_sample.jpg`)}
                      disabled={uploadingKind === slot.kind}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      Sample
                    </button>

                    <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20">
                      {uploadingKind === slot.kind ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileUp className="w-3.5 h-3.5" />
                      )}
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload(slot.kind, e.target.files[0]);
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          );
        })}
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
          onClick={onNext}
          disabled={!isReady || loading}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
        >
          {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
          Proceed to Summary Review (Page 90)
        </button>
      </div>
    </div>
  );
}
