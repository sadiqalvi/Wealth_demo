import { KycApplication, AccountType, KycStepKey, DocumentItem, JobStatus } from "./types";

interface StoredCredential {
  passwordHash: string;
}


// Initial Staging Profiles from the Integration Guide
const profile1Draft: KycApplication = {
  id: "019234a1-b8c4-7e21-9df1-8e0192a014bc",
  cnic: "4210136069899",
  account_type: "NOR",
  status: "IN_PROGRESS",
  current_page: "50",
  current_step: "identity",
  scans_today_count: 0,
  created_at: "2026-09-23T10:00:00Z",
  updated_at: "2026-09-23T10:00:00Z",
  identity: {
    biometric_acknowledged: true,
    email: "sadiq.alvi.89@gmail.com",
    email_verified: false,
    email_otp_sent: false,
    mobile: "03062486537",
    mobile_owner_type: "Self",
    mobile_verified: false,
    mobile_otp_sent: false,
    iban: "PK32MEZN0001310107513652",
    iban_verified: false,
    bank_name: "Meezan Bank Limited",
    account_title: "AHMED YOUSAF ELVI",
  },
  personal: {
    salutation: "MR",
    full_name: "",
    father_husband_relationship: "FATHER",
    father_husband_name: "",
    cnic_doc_type: "smartid",
    country_of_birth: "PAK",
    date_of_birth: "",
    gender: "M",
    marital_status: "1",
    place_of_birth: "",
  },
  address: {
    permanent_address: "",
    permanent_city: "",
    permanent_country: "PAK",
    resident_status: "7",
    mailing_differs: false,
    mailing_address: "",
    mailing_city: "",
    mailing_country: "",
  },
  profession: {
    source_of_income: "P001",
    gross_annual_income: "J01",
    profession_industry: "Information Technology",
    industry_other: "",
    employer_or_business_name: "",
    job_title: "",
    department: "",
    employer_address: "",
    employer_city: "",
    employer_country: "PAK",
  },
  fatca: {
    is_usa_person: false,
    born_in_usa: false,
    usa_mail_address: false,
    tax_residence_country: "PAK",
    tin: "4210136069899",
  },
  nominee: null,
  sdd: {
    is_pep: false,
    account_open_refused: false,
    offshore_tax_links: false,
    deals_precious_items: false,
    is_dual_national: false,
  },
  zakat: {
    status: "5",
  },
  documents: [],
  discrepancy_flag: false,
  discrepancies: [],
};

const profile2Discrepancy: KycApplication = {
  id: "019234b2-c9d5-8f32-0ea2-9f0293b025cd",
  cnic: "4210156297009",
  account_type: "NOR",
  status: "TBR", // To Be Rectified
  current_page: "86",
  current_step: "declaration",
  scans_today_count: 3,
  created_at: "2026-09-20T10:00:00Z",
  updated_at: "2026-09-22T08:15:00Z",
  identity: {
    biometric_acknowledged: true,
    email: "ajami.broker@example.com",
    email_verified: true,
    email_otp_sent: true,
    mobile: "03001234567",
    mobile_owner_type: "Self",
    mobile_verified: true,
    mobile_otp_sent: true,
    iban: "PK78HABB0001234567890123",
    iban_verified: true,
    bank_name: "Habib Bank Limited",
    account_title: "AJAMI INVESTOR",
  },
  personal: {
    salutation: "MR",
    full_name: "MUHAMMAD AJAMI",
    father_husband_relationship: "FATHER",
    father_husband_name: "GHULAM AJAMI",
    cnic_doc_type: "smartid",
    country_of_birth: "PAK",
    date_of_birth: "1985-05-15",
    gender: "M",
    marital_status: "2",
    place_of_birth: "LAHORE",
  },
  address: {
    permanent_address: "Bungalow 42-C Gulberg III",
    permanent_city: "LAHORE",
    permanent_country: "PAK",
    resident_status: "7",
    mailing_differs: false,
  },
  profession: {
    source_of_income: "P002",
    gross_annual_income: "J04",
    profession_industry: "Textile & Apparel",
    employer_or_business_name: "Ajami Textiles",
    job_title: "Managing Director",
    department: "Executive",
    employer_address: "Industrial Area Kot Lakhpat",
    employer_city: "LAHORE",
    employer_country: "PAK",
  },
  fatca: {
    is_usa_person: false,
    born_in_usa: false,
    usa_mail_address: false,
    tax_residence_country: "PAK",
    tin: "4210156297009",
  },
  nominee: {
    relation: "SON",
    name: "BILAL AJAMI",
    cnic_or_passport: "4210199887766",
    doc_type: "CNIC",
    issue_date: "2022-03-10",
    lifetime: true,
    contact_no: "03009876543",
  },
  sdd: {
    is_pep: false,
    account_open_refused: false,
    offshore_tax_links: false,
    deals_precious_items: false,
    is_dual_national: false,
  },
  zakat: {
    status: "5",
  },
  documents: [
    {
      kind: "cnic_front",
      filename: "cnic_front_ajami.jpg",
      content_type: "image/jpeg",
      uploaded_at: "2026-09-20T10:15:00Z",
      page_id: "67",
      status: "VALID",
    },
    {
      kind: "cnic_back",
      filename: "cnic_back_blurry.jpg",
      content_type: "image/jpeg",
      uploaded_at: "2026-09-20T10:16:00Z",
      page_id: "68",
      status: "REJECTED",
      rejection_note: "PLEASE UPLOAD CLEAR AND LEGIBLE COPY OF CNIC BACK",
    },
    {
      kind: "proof_of_income",
      filename: "salary_slip_sept.pdf",
      content_type: "application/pdf",
      uploaded_at: "2026-09-20T10:18:00Z",
      page_id: "69",
      status: "VALID",
    },
    {
      kind: "signature",
      filename: "specimen_sig.png",
      content_type: "image/png",
      uploaded_at: "2026-09-20T10:20:00Z",
      page_id: "70",
      status: "VALID",
    },
  ],
  declaration: {
    applicant_name: "MUHAMMAD AJAMI",
    documents_confirmed: true,
    declaration_accepted: true,
    submitted_at: "2026-09-20T10:25:00Z",
  },
  discrepancy_flag: true,
  discrepancies: [
    {
      field_name: "CNIC Back",
      section: "Investor Documents",
      note: "PLEASE UPLOAD CLEAR AND LEGIBLE COPY OF CNIC BACK (Edges clipped, text unreadable)",
      resolve_url: "/cdc/cgp/r/centralized-gateway-portal/investor-documents",
      step_key: "documents",
      target_kind: "cnic_back",
    },
  ],
};

// Global in-memory application store with presets
class MockKycStore {
  private applications: Map<string, KycApplication> = new Map();
  private credentials: Map<string, string> = new Map(); // cnic -> password
  private jobs: Map<string, JobStatus & { appId: string }> = new Map();

  constructor() {
    this.resetToDefaults();
  }

  public patchApplication(id: string, partial: any): KycApplication {
    const app = this.applications.get(id);
    if (!app) {
      throw new Error(`Application with id ${id} not found.`);
    }
    if (partial.personal) app.personal = { ...app.personal, ...partial.personal };
    if (partial.address) app.address = { ...app.address, ...partial.address };
    if (partial.profession) app.profession = { ...app.profession, ...partial.profession };
    if (partial.fatca) app.fatca = { ...app.fatca, ...partial.fatca };
    if (partial.nominee !== undefined) app.nominee = partial.nominee;
    if (partial.sdd) app.sdd = { ...app.sdd, ...partial.sdd };
    if (partial.zakat) app.zakat = { ...app.zakat, ...partial.zakat };
    if (partial.identity) app.identity = { ...app.identity, ...partial.identity };
    if (partial.current_step) app.current_step = partial.current_step;
    if (partial.current_page) app.current_page = partial.current_page;

    // Direct root-level fallbacks if step object was passed unwrapped:
    if (partial.employer_or_business_name !== undefined || partial.source_of_income !== undefined) {
      app.profession = { ...app.profession, ...partial };
    }
    if (partial.tax_residence_country !== undefined || partial.is_usa_person !== undefined) {
      app.fatca = { ...app.fatca, ...partial };
    }
    if (partial.is_pep !== undefined || partial.account_open_refused !== undefined) {
      app.sdd = { ...app.sdd, ...partial };
    }
    if (partial.status !== undefined && ["1","2","3","4","5"].includes(String(partial.status))) {
      app.zakat = { ...app.zakat, ...partial };
    }
    app.updated_at = new Date().toISOString();
    return app;
  }

  public resetToDefaults() {
    this.applications.clear();
    this.credentials.clear();
    this.jobs.clear();

    // Profile 1: Draft
    const p1 = JSON.parse(JSON.stringify(profile1Draft));
    this.applications.set(p1.id, p1);
    this.credentials.set(p1.cnic, "Alvi@CDC2026");

    // Profile 2: Discrepancy
    const p2 = JSON.parse(JSON.stringify(profile2Discrepancy));
    this.applications.set(p2.id, p2);
    this.credentials.set(p2.cnic, "0300Ajami.");
  }

  public getJob(jobId: string): JobStatus | undefined {
    return this.jobs.get(jobId);
  }

  public listJobs(appId: string): JobStatus[] {
    const list: JobStatus[] = [];
    for (const job of Array.from(this.jobs.values())) {
      if (job.appId === appId) {
        list.push(job);
      }
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public createJob(appId: string, step: string, payload: any): JobStatus {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    let result: any = { ok: true, step };
    let error = "";
    let succeeded = true;

    try {
      const app = this.updateStep(appId, step as KycStepKey, payload);

      // Generate realistic detail response according to guide
      if (step === "identity") {
        const sub = payload.sub_step;
        if (sub === "read_state" || sub === "warmup" || sub === "state" || sub === "resume") {
          result = {
            ok: true,
            sub_step: "read_state",
            next_step: app.identity.iban_verified ? "5" : app.identity.mobile_verified ? "4" : app.identity.email_verified ? "3" : "2",
            complete: app.identity.biometric_acknowledged && app.identity.email_verified && app.identity.mobile_verified && app.identity.iban_verified,
            account_type: app.account_type,
            instance: "AB12" + Math.random().toString(36).substring(2, 6).toUpperCase(),
            biometric: app.identity.biometric_acknowledged ? "verified" : "not_verified",
            email: app.identity.email_verified ? "verified" : "not_verified",
            mobile: app.identity.mobile_verified ? "verified" : "not_verified",
            iban: app.identity.iban_verified ? "verified" : "not_verified",
            email_value: app.identity.email ? app.identity.email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : "sa***9@gmail.com",
            mobile_value: app.identity.mobile ? app.identity.mobile.replace(/(\d{4})(\d*)(\d{2})/, "$1****$3") : "0306****37",
            iban_value: app.identity.iban ? app.identity.iban.substring(0, 4) + "****" + app.identity.iban.slice(-4) : "PK32****3652",
            email_status: "Verified with CDC Centralized Gateway Portal",
            iban_status: app.identity.iban_verified ? "1-LINK 1-IBFT active & matched" : "Awaiting IBAN verification",
            cnic_editable: false,
            detail: "Persistent warm session active. Verified identity snapshot retrieved.",
          };
        } else if (sub === "bio_ack" || sub === "biometric") {
          result = { ok: true, sub_step: "bio_ack", detail: "NADRA Biometric verification consent acknowledged." };
        } else if (sub === "email_send" || sub === "email_otp") {
          result = { ok: true, sub_step: "email_send", detail: `6-digit OTP sent to ${app.identity.email || "applicant email"}` };
        } else if (sub === "email_verify" || sub === "verify_email_otp") {
          result = { ok: true, sub_step: "email_verify", detail: "Email address successfully verified with CDC Gateway!" };
        } else if (sub === "sms_send" || sub === "mobile_otp") {
          const owner = payload.belongs_to || app.identity.mobile_owner_type || "Self";
          const relCnic = (payload.relative_cnic || app.identity.relative_cnic || "").replace(/[^0-9]/g, "");
          // Validate relative SIM ownership against PTA database
          if (owner !== "Self") {
            // Real father CNIC for test Profile 1 is 42101-8899001-1; anything else or mismatch fails PTA lookup
            if (!relCnic || (relCnic !== "4210188990011" && relCnic !== "4210199887766")) {
              throw new Error(`PTA SIM Verification Failed: Mobile number is not registered under ${owner}'s CNIC according to Pakistan Telecommunication Authority (PTA) records.`);
            }
          }
          result = { ok: true, sub_step: "sms_send", detail: `SMS OTP dispatched to ${app.identity.mobile || "mobile phone"}` };
        } else if (sub === "sms_verify" || sub === "verify_sms_otp") {
          result = { ok: true, sub_step: "sms_verify", detail: "Mobile phone verified with PTA SIM registry!" };
        } else if (sub === "release" || sub === "close" || sub === "done" || sub === "leave" || sub === "next") {
          result = { ok: true, sub_step: "release", detail: "Warm browser session released. Single-identity worker context returned to pool." };
        }
      } else if (step === "personal") {
        if (payload.sub_step === "prefill") {
          result = {
            ok: true,
            step: "personal",
            sub_step: "prefill",
            detail: "NADRA Verisys & AKSA identity prefill extracted (~1.5s warm fetch).",
            personal: app.personal,
            address: app.address,
          };
        } else {
          result = { ok: true, step: "personal", detail: "Personal information & address saved and validated with NADRA Verisys." };
        }
      } else if (step === "profession") {
        result = { ok: true, step: "profession", detail: "Financial background & source of income recorded." };
      } else if (step === "fatca") {
        result = { ok: true, step: "fatca", detail: "FATCA / CRS tax residency declarations stored." };
      } else if (step === "nominee") {
        result = { ok: true, step: "nominee", detail: app.nominee ? "Nominee appointed." : "Nominee opt-out recorded." };
      } else if (step === "sdd") {
        result = { ok: true, step: "sdd", detail: "Simplified Due Diligence (SDD/AML) statutory answers saved." };
      } else if (step === "zakat") {
        result = { ok: true, step: "zakat", detail: "Zakat exemption declaration saved." };
      } else if (step === "documents") {
        result = { ok: true, step: "documents", detail: payload.sub_step === "upload" ? `Uploaded ${payload.filename || "document"} successfully.` : "Document deleted." };
      } else if (step === "review") {
        result = { ok: true, step: "review", detail: "Summary review closed. Ready for final declaration." };
      } else if (step === "declaration") {
        result = { ok: true, step: "declaration", detail: "Application and statutory declaration submitted to CDC CGP Portal!" };
      }
    } catch (e: any) {
      succeeded = false;
      error = e.message || "Step execution failed.";
    }

    const jobRecord: JobStatus & { appId: string } = {
      job_id: jobId,
      appId,
      step,
      status: succeeded ? "COMPLETED" : "FAILED",
      attempts: 1,
      done: true,
      succeeded,
      result: succeeded ? result : undefined,
      error: succeeded ? "" : error,
      created_at: now,
      updated_at: now,
    };

    this.jobs.set(jobId, jobRecord);
    return jobRecord;
  }


  public getByCnic(cnic: string): KycApplication | undefined {
    const cleanCnic = cnic.replace(/[^0-9]/g, "");
    for (const app of Array.from(this.applications.values())) {
      if (app.cnic === cleanCnic) {
        return app;
      }
    }
    return undefined;
  }

  public getById(id: string): KycApplication | undefined {
    return this.applications.get(id);
  }

  public verifyCredentials(cnic: string, password: string): boolean {
    const cleanCnic = cnic.replace(/[^0-9]/g, "");
    const stored = this.credentials.get(cleanCnic);
    if (!stored) {
      // If we don't have this CNIC yet, allow any password > 4 chars in dev mode
      return password.length >= 4;
    }
    return stored === password;
  }

  public stashPassword(cnic: string, password: string) {
    const cleanCnic = cnic.replace(/[^0-9]/g, "");
    this.credentials.set(cleanCnic, password);
  }

  public createApplication(cnic: string, account_type: AccountType = "NOR", password?: string): KycApplication {
    const cleanCnic = cnic.replace(/[^0-9]/g, "");
    const existing = this.getByCnic(cleanCnic);
    if (existing) {
      if (password) this.stashPassword(cleanCnic, password);
      return existing;
    }

    const id = `019234-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newApp: KycApplication = {
      id,
      cnic: cleanCnic,
      account_type,
      status: "IN_PROGRESS",
      current_page: "50",
      current_step: "identity",
      scans_today_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      identity: {
        biometric_acknowledged: false,
        email: "",
        email_verified: false,
        email_otp_sent: false,
        mobile: "",
        mobile_owner_type: "Self",
        mobile_verified: false,
        mobile_otp_sent: false,
        iban: "",
        iban_verified: false,
      },
      personal: {
        salutation: "MR",
        full_name: "",
        father_husband_relationship: "FATHER",
        father_husband_name: "",
        cnic_doc_type: "smartid",
        country_of_birth: "PAK",
        date_of_birth: "",
        gender: "M",
        marital_status: "1",
        place_of_birth: "",
      },
      address: {
        permanent_address: "",
        permanent_city: "",
        permanent_country: "PAK",
        resident_status: "7",
        mailing_differs: false,
      },
      profession: {
        source_of_income: "P001",
        gross_annual_income: "J01",
        profession_industry: "Information Technology",
        employer_or_business_name: "",
        job_title: "",
        department: "",
        employer_address: "",
        employer_city: "",
        employer_country: "PAK",
      },
      fatca: {
        is_usa_person: false,
        born_in_usa: false,
        usa_mail_address: false,
        tax_residence_country: "PAK",
        tin: cleanCnic,
      },
      nominee: null,
      sdd: {
        is_pep: false,
        account_open_refused: false,
        offshore_tax_links: false,
        deals_precious_items: false,
        is_dual_national: false,
      },
      zakat: {
        status: "5",
      },
      documents: [],
      discrepancy_flag: false,
      discrepancies: [],
    };

    if (password) {
      this.stashPassword(cleanCnic, password);
    }
    this.applications.set(id, newApp);
    return newApp;
  }

  public updateStep(id: string, step: KycStepKey, payload: any): KycApplication {
    const app = this.applications.get(id);
    if (!app) {
      throw new Error(`Application with id ${id} not found.`);
    }

    app.updated_at = new Date().toISOString();

    switch (step) {
      case "identity": {
        const sub = payload.sub_step;
        if (sub === "read_state" || sub === "warmup" || sub === "state" || sub === "resume") {
          // Warm up session and return current identity state
          return app;
        } else if (sub === "bio_ack" || sub === "biometric") {
          app.identity.biometric_acknowledged = true;
        } else if (sub === "email_send" || sub === "email_otp") {
          app.identity.email = payload.email || app.identity.email;
          app.identity.email_otp_sent = true;
          app.identity.email_verified = false;
        } else if (sub === "email_verify" || sub === "verify_email_otp") {
          app.identity.email_verified = true;
          app.identity.email_otp_sent = false;
        } else if (sub === "sms_send" || sub === "mobile_otp") {
          app.identity.mobile = payload.mobile || app.identity.mobile;
          app.identity.mobile_owner_type = payload.belongs_to || payload.owner_type || "Self";
          if (payload.relative_cnic !== undefined) app.identity.relative_cnic = payload.relative_cnic;
          if (payload.relative_name !== undefined) app.identity.relative_name = payload.relative_name;
          if (payload.declaration_accepted !== undefined) app.identity.mobile_declaration_accepted = payload.declaration_accepted;
          app.identity.mobile_otp_sent = true;
          app.identity.mobile_verified = false;
        } else if (sub === "sms_verify" || sub === "verify_sms_otp") {
          app.identity.mobile_verified = true;
          app.identity.mobile_otp_sent = false;
        } else if (sub === "iban_verify" || sub === "verify_iban") {
          app.identity.iban = payload.iban || app.identity.iban;
          app.identity.iban_verified = true;

          // Comprehensive Pakistani bank code resolution
          const cleanIban = (payload.iban || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
          const bankCode = cleanIban.length >= 8 ? cleanIban.substring(4, 8) : "";
          
          const bankMap: Record<string, string> = {
            MEZN: "Meezan Bank Limited",
            HABB: "Habib Bank Limited (HBL)",
            BAHL: "Bank AL Habib Limited",
            UNIL: "United Bank Limited (UBL)",
            UBLP: "United Bank Limited (UBL)",
            MUCB: "MCB Bank Limited",
            MCBL: "MCB Islamic Bank",
            SCBL: "Standard Chartered Bank (Pakistan)",
            FAYS: "Faysal Bank Limited",
            JSBL: "JS Bank Limited",
            ASCR: "Askari Bank Limited",
            AKBL: "Askari Bank Limited",
            ALFH: "Bank Alfalah Limited",
            BAFL: "Bank Alfalah Limited",
            BOPP: "The Bank of Punjab (BOP)",
            ABPA: "Allied Bank Limited (ABL)",
            DIBP: "Dubai Islamic Bank Pakistan",
            BIPK: "BankIslami Pakistan Limited",
            SNBL: "Soneri Bank Limited",
            HMBL: "Habib Metropolitan Bank",
            SBLP: "Samba Bank Limited",
            SILK: "Silkbank Limited",
            FWBL: "First Women Bank Limited",
            NBPA: "National Bank of Pakistan (NBP)",
          };

          app.identity.bank_name = bankMap[bankCode] || (cleanIban.includes("MEZN") ? "Meezan Bank Limited" : cleanIban.includes("HABB") ? "Habib Bank Limited (HBL)" : cleanIban.includes("BAHL") ? "Bank AL Habib Limited" : "Commercial Bank of Pakistan");
          app.identity.account_title = app.personal.full_name || "VALUED APPLICANT";
          app.current_page = "50";
          app.current_step = "identity";

        }
        break;
      }

      case "personal": {
        if (payload.sub_step === "prefill") {
          if (!app.personal.full_name) {
            app.personal = {
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
            };
            app.address = {
              permanent_address: "HOUSE F 79 NORTH NAZIMABAD",
              permanent_city: "KARACHI",
              permanent_country: "PAK",
              resident_status: "7",
              mailing_differs: false,
            };
          }
          return app;
        }
        const pers = payload.personal || payload.details || (payload.full_name ? payload : undefined);
        if (pers) {
          app.personal = { ...app.personal, ...pers };
        }
        if (payload.address) {
          app.address = { ...app.address, ...payload.address };
        } else if (payload.permanent_address) {
          app.address = { ...app.address, permanent_address: payload.permanent_address, permanent_city: payload.permanent_city, permanent_country: payload.permanent_country };
        }
        app.current_page = "54.1";
        app.current_step = "profession";
        break;
      }

      case "profession": {
        if (payload.answers) {
          app.profession = { ...app.profession, ...payload.answers };
        }
        app.current_page = "55.1";
        app.current_step = "fatca";
        break;
      }

      case "fatca": {
        if (payload.answers) {
          app.fatca = { ...app.fatca, ...payload.answers };
        }
        app.current_page = "54.3";
        app.current_step = "nominee";
        break;
      }

      case "nominee": {
        if (payload.answers === null || payload.answers === undefined) {
          app.nominee = null;
        } else {
          app.nominee = { ...payload.answers };
        }
        app.current_page = "55.2";
        app.current_step = "sdd";
        break;
      }

      case "sdd": {
        if (payload.answers) {
          app.sdd = { ...app.sdd, ...payload.answers };
        }
        app.current_page = "54.4";
        app.current_step = "zakat";
        break;
      }

      case "zakat": {
        if (payload.answers) {
          app.zakat = { ...app.zakat, ...payload.answers };
        }
        app.current_page = "67";
        app.current_step = "documents";
        break;
      }

      case "documents": {
        const sub = payload.sub_step;
        if (sub === "upload") {
          const kind = payload.kind as DocumentItem["kind"];
          // Remove old doc of same kind if exists
          app.documents = app.documents.filter((d) => d.kind !== kind);
          app.documents.push({
            kind,
            filename: payload.filename || `${kind}.jpg`,
            content_type: payload.content_type || "image/jpeg",
            file_base64: payload.file_base64,
            uploaded_at: new Date().toISOString(),
            page_id: `${Math.floor(Math.random() * 50) + 60}`,
            status: "VALID",
          });

          // If this was rectifying a discrepancy, clear it!
          if (app.discrepancy_flag) {
            app.discrepancies = app.discrepancies.filter((disc) => disc.target_kind !== kind);
            if (app.discrepancies.length === 0) {
              app.discrepancy_flag = false;
            }
          }
        } else if (sub === "delete") {
          if (payload.page_id) {
            app.documents = app.documents.filter((d) => d.page_id !== payload.page_id);
          } else if (payload.kind) {
            app.documents = app.documents.filter((d) => d.kind !== payload.kind);
          }
        }
        break;
      }

      case "review": {
        app.current_page = "86";
        app.current_step = "declaration";
        break;
      }

      case "declaration": {
        app.declaration = {
          applicant_name: payload.applicant_name || app.personal.full_name || "Applicant",
          documents_confirmed: !!payload.documents_confirmed,
          declaration_accepted: !!payload.declaration_accepted,
          submitted_at: new Date().toISOString(),
        };
        app.status = "SUBMITTED";
        app.current_page = "HUB";
        app.discrepancy_flag = false;
        app.discrepancies = [];
        break;
      }
    }

    return app;
  }
}

export const mockKycStore = new MockKycStore();
