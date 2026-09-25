import { KycApplication, JobStatus, AccountType, KycStepKey } from "./types";

export interface KycConfig {
  baseUrl?: string;
}

export class KycService {
  private baseUrl: string;

  constructor(config: KycConfig = {}) {
    this.baseUrl = config.baseUrl || "/api/kyc";
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });

    if (res.status === 204) return {} as T;

    const data = await res.json().catch(() => ({ detail: res.statusText }));

    if (!res.ok) {
      const error: any = new Error(
        data.detail || data.message || data.error || `KYC request failed (${res.status})`
      );
      error.status = res.status;
      error.code = data.code;
      error.problems = data.problems;
      error.data = data;
      throw error;
    }

    return data as T;
  }

  // --- 1. Applications & Password ---
  async createApplication(
    cnic: string,
    accountType: AccountType = "NOR",
    password?: string,
    brokerCode = "00208"
  ): Promise<KycApplication> {
    const cleanCnic = cnic.replace(/[^0-9]/g, "");
    const app = await this.request<KycApplication>("/applications", {
      method: "POST",
      body: JSON.stringify({
        cnic: cleanCnic,
        account_type: accountType,
        broker_code: brokerCode,
      }),
    });

    if (password && app?.id) {
      await this.setCredentials(app.id, password).catch(() => {});
    }

    return app;
  }

  async getApplication(appId: string): Promise<KycApplication> {
    return this.request<KycApplication>(`/applications/${appId}`);
  }

  async resumeExistingApplication(cnic: string, password: string): Promise<KycApplication> {
    const cleanCnic = cnic.replace(/[^0-9]/g, "");
    const app = await this.request<KycApplication>("/applications", {
      method: "POST",
      body: JSON.stringify({
        cnic: cleanCnic,
      }),
    });

    if (app?.id && password) {
      try {
        await this.linkCredentials(app.id, password);
      } catch {
        await this.setCredentials(app.id, password).catch(() => {});
      }
    }

    return app;
  }

  async setCredentials(appId: string, password: string): Promise<void> {
    return this.request<void>(`/applications/${appId}/credentials`, {
      method: "PUT",
      body: JSON.stringify({ password }),
    });
  }

  async linkCredentials(appId: string, password: string): Promise<{ ok: boolean }> {
    return this.request<{ ok: boolean }>(`/applications/${appId}/credentials/link`, {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  }

  async unlinkCredentials(appId: string, scope?: "retained"): Promise<void> {
    const q = scope ? `?scope=${scope}` : "";
    return this.request<void>(`/applications/${appId}/credentials${q}`, {
      method: "DELETE",
    });
  }

  // --- 2. Registration & Biometric ---
  async warm(appId: string): Promise<{ job_id?: string }> {
    return this.request<{ job_id?: string }>(`/applications/${appId}/warm`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  async registerIdentity(appId: string, email: string, mobile: string): Promise<{ job_id: string; step: string; status: string }> {
    return this.request(`/applications/${appId}/identity`, {
      method: "POST",
      body: JSON.stringify({ email, mobile }),
    });
  }

  async registerPassword(appId: string, password: string): Promise<{ job_id: string; step: string; status: string }> {
    return this.request(`/applications/${appId}/password`, {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  }

  async verifyOtp(appId: string, otp: string): Promise<{ job_id: string; step: string; status: string }> {
    return this.request(`/applications/${appId}/otp`, {
      method: "POST",
      body: JSON.stringify({ otp }),
    });
  }

  async resendOtp(appId: string): Promise<{ job_id: string; step: string; status: string }> {
    return this.request(`/applications/${appId}/otp/resend`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  async setAccountType(appId: string, accountType: AccountType): Promise<{ job_id?: string; ok?: boolean }> {
    return this.request(`/applications/${appId}/account-type`, {
      method: "POST",
      body: JSON.stringify({ account_type: accountType }),
    });
  }

  async checkBiometric(appId: string): Promise<{ job_id: string; step: string; status: string }> {
    return this.request(`/applications/${appId}/biometric/check`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  async cancelRegistration(appId: string): Promise<void> {
    return this.request(`/applications/${appId}/cancel`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  async fetchNadraSchema(appId: string): Promise<{ job_id: string; step: string; status: string }> {
    return this.request(`/applications/${appId}/schema`, {
      method: "POST",
      body: JSON.stringify({ sub_step: "nadra" }),
    });
  }

  // --- 3. Identity Verification Steps ---
  async identityStep(appId: string, payload: { sub_step: string; [k: string]: any }): Promise<{ job_id: string; step: string; status: string }> {
    return this.request(`/applications/${appId}/steps/identity`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async releaseIdentity(appId: string, _password?: string): Promise<void> {
    try {
      await this.identityStep(appId, { sub_step: "release" });
    } catch {}
  }

  // --- 4. Jobs & Polling ---
  async getJob(appId: string, jobId: string): Promise<JobStatus> {
    return this.request<JobStatus>(`/applications/${appId}/jobs/${jobId}`);
  }

  async listJobs(appId: string): Promise<{ jobs: JobStatus[] }> {
    return this.request<{ jobs: JobStatus[] }>(`/applications/${appId}/jobs`);
  }

  async awaitJob(appId: string, jobId: string, opts: { intervalMs?: number; timeoutMs?: number } = {}): Promise<any> {
    const intervalMs = opts.intervalMs ?? 800;
    const deadline = Date.now() + (opts.timeoutMs ?? 90_000);
    while (Date.now() < deadline) {
      const job = await this.getJob(appId, jobId);
      if (job.done) {
        if (job.succeeded) return job.result ?? {};
        if (job.status === "SUPERSEDED") return { superseded: true };
        throw new Error(job.error || `Step ${job.step} failed with status: ${job.status}`);
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error(`Timed out waiting for CDC job ${jobId}`);
  }

  // Convenience execution: submit step and await job if returned
  async runStep(
    appId: string,
    step: KycStepKey | string,
    payload: any,
    opts?: { intervalMs?: number; timeoutMs?: number }
  ): Promise<any> {
    if (step === "identity") {
      const res = await this.identityStep(appId, payload);
      if (res.job_id) {
        return this.awaitJob(appId, res.job_id, opts);
      }
      return res;
    }

    if (step === "declaration" || step === "submit") {
      const res = await this.submitApplication(appId, {
        declaration_accepted: payload.declaration_accepted ?? true,
        consent_share_profile: payload.consent_share_profile ?? true,
        terms_accepted: payload.terms_accepted ?? true,
        applicant_name: payload.applicant_name,
        password: payload.password,
      });
      if (res.job_id) {
        return this.awaitJob(appId, res.job_id, { timeoutMs: 180_000, ...opts });
      }
      return res;
    }

    if (["personal", "profession", "nominee", "zakat", "fatca", "sdd"].includes(step as string)) {
      return this.saveDraftSection(appId, step as string, payload);
    }

    return { ok: true, step };
  }

  // --- 5. Draft Sections & Documents ---
  async saveDraftSection(appId: string, section: string, payload: any): Promise<{ ok: boolean; section: string }> {
    return this.request(`/applications/${appId}/draft/${section}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async updateApplicationDraft(appId: string, payload: Record<string, any>): Promise<void> {
    for (const [section, sectionData] of Object.entries(payload)) {
      if (["personal", "profession", "nominee", "zakat", "fatca", "sdd"].includes(section)) {
        await this.saveDraftSection(appId, section, sectionData).catch(() => {});
      }
    }
  }

  async getDraft(appId: string): Promise<{ documents: any[]; section_names: string[]; sections: Record<string, any>; updated_at?: string }> {
    return this.request(`/applications/${appId}/draft`);
  }

  async deleteDraftSection(appId: string, section: string): Promise<void> {
    return this.request(`/applications/${appId}/draft/${section}`, {
      method: "DELETE",
    });
  }

  async uploadDocument(
    appId: string,
    kind: string,
    fileBase64: string,
    filename: string,
    contentType = "image/jpeg"
  ): Promise<{ ok: boolean; kind: string }> {
    return this.request(`/applications/${appId}/draft/documents/${kind}`, {
      method: "PUT",
      body: JSON.stringify({
        file_base64: fileBase64,
        filename,
        content_type: contentType,
      }),
    });
  }

  async deleteDocument(appId: string, kind: string): Promise<void> {
    return this.request(`/applications/${appId}/draft/documents/${kind}`, {
      method: "DELETE",
    });
  }

  // --- 6. Submission ---
  async submitApplication(appId: string, payload: {
    declaration_accepted: boolean;
    consent_share_profile: boolean;
    terms_accepted: boolean;
    applicant_name?: string;
    password?: string;
  }): Promise<{ job_id?: string; step?: string; status?: string; [k: string]: any }> {
    return this.request(`/applications/${appId}/submit`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // --- 7. Catalogs & Rules ---
  async getCatalogsList(): Promise<{ catalogs: string[] }> {
    return this.request<{ catalogs: string[] }>("/catalogs");
  }

  async getCatalogOptions(name: string): Promise<{ name: string; options: Array<{ value: string; label: string }> }> {
    return this.request(`/catalogs/${name}`);
  }

  async getDocRules(accountType: AccountType = "NOR"): Promise<any> {
    return this.request(`/doc-rules?account_type=${accountType}`);
  }

  async getFieldRules(accountType: AccountType = "NOR"): Promise<any> {
    return this.request(`/field-rules?account_type=${accountType}`);
  }

  async resetStagingProfiles(): Promise<void> {
    // Client-side reset helper
  }
}

export const kycService = new KycService();
