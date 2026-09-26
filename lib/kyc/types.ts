// KYC Type Definitions according to CDC CGP Specification

export type AccountType = "NOR" | "ASN"; // Normal vs Asaan

export type ApplicationStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "BIOMETRIC_PENDING"
  | "TBR" // To Be Rectified (Discrepancy)
  | "APPROVED"
  | "REJECTED";

export type KycStepKey =
  | "identity"
  | "personal"
  | "profession"
  | "fatca"
  | "nominee"
  | "sdd"
  | "zakat"
  | "documents"
  | "review"
  | "declaration";

export interface KycApplication {
  id: string;
  cnic: string;
  account_type: AccountType;
  status: ApplicationStatus;
  current_page: string;
  current_step: KycStepKey;
  last_error?: string;
  scans_today_count: number;
  created_at: string;
  updated_at: string;
  broker_code?: string;
  broker_name?: string;
  
  // Data blocks
  identity: IdentityData;
  personal: PersonalData;
  address: AddressData;
  profession: ProfessionData;
  fatca: FatcaData;
  nominee: NomineeData | null;
  sdd: SddData;
  zakat: ZakatData;
  documents: DocumentItem[];
  declaration?: DeclarationData;

  // Discrepancy details (for TBR status)
  discrepancy_flag: boolean;
  discrepancies: DiscrepancyItem[];
}

export interface IdentityData {
  biometric_acknowledged: boolean;
  email: string;
  email_verified: boolean;
  email_otp_sent: boolean;
  email_value?: string;
  email_status?: string;
  mobile: string;
  mobile_owner_type: "Self" | "Father" | "Husband" | "Mother" | "Son" | "Daughter" | "Business" | "Spouse" | "Child" | string;
  mobile_verified: boolean;
  mobile_otp_sent: boolean;
  mobile_value?: string;
  relative_cnic?: string;
  relative_name?: string;
  mobile_declaration_accepted?: boolean;
  iban: string;
  iban_verified: boolean;
  iban_value?: string;
  iban_status?: string;
  bank_name?: string;
  account_title?: string;
  cnic_editable?: boolean;
  next_step?: string;
  instance?: string;
}

export interface PersonalData {
  salutation: "MR" | "MS" | "MRS" | "DR";
  full_name: string;
  father_husband_relationship: "FATHER" | "HUSBAND";
  father_husband_name: string;
  cnic_doc_type: "smartid" | "nicop" | "poc";
  country_of_birth: string;
  date_of_birth: string;
  gender: "M" | "F" | "O";
  marital_status: "1" | "2" | "3"; // 1: Single, 2: Married, 3: Other
  place_of_birth: string;
}

export interface AddressData {
  permanent_address: string;
  permanent_city: string;
  permanent_country: string;
  resident_status: string; // 7: Resident Pakistani, etc.
  mailing_differs: boolean;
  mailing_address?: string;
  mailing_city?: string;
  mailing_country?: string;
}

export interface ProfessionData {
  source_of_income: string; // P001: Salary, P002: Business, P003: Investments, etc.
  gross_annual_income: string; // J01: Up to 100k, J02: 100k-500k, J03: 500k-1M, J04: 1M-2.5M, J05: 2.5M+
  profession_industry: string;
  industry_other?: string;
  employer_or_business_name: string;
  job_title: string;
  department: string;
  employer_address: string;
  employer_city: string;
  employer_country: string;
}

export interface FatcaData {
  is_usa_person: boolean;
  born_in_usa: boolean;
  usa_mail_address: boolean;
  tax_residence_country: string;
  tin: string; // Tax identification number or CNIC
}

export interface NomineeData {
  relation: "SPOUSE" | "SON" | "DAUGHTER" | "FATHER" | "MOTHER" | "BROTHER" | "SISTER";
  name: string;
  cnic_or_passport: string;
  doc_type: "CNIC" | "PASSPORT" | "NICOP";
  issue_date: string;
  lifetime: boolean;
  contact_no: string;
}

export interface SddData {
  is_pep: boolean;
  account_open_refused: boolean;
  offshore_tax_links: boolean;
  deals_precious_items: boolean;
  is_dual_national: boolean;
}

export interface ZakatData {
  status: "5" | "6" | "7"; // 5: Muslim Zakat Deductible, 6: Muslim Non-Deductible (CZ-50), 7: Not Applicable
}

export interface DocumentItem {
  kind: "cnic_front" | "cnic_back" | "proof_of_income" | "utility_bill" | "signature" | "cz50_affidavit";
  filename: string;
  content_type: string;
  file_base64?: string;
  uploaded_at: string;
  page_id?: string;
  status: "VALID" | "REJECTED" | "PENDING";
  rejection_note?: string;
}

export interface DeclarationData {
  applicant_name: string;
  documents_confirmed: boolean;
  declaration_accepted: boolean;
  submitted_at: string;
}

export interface DiscrepancyItem {
  field_name: string;
  section: string;
  note: string;
  resolve_url?: string;
  step_key: KycStepKey;
  target_kind?: DocumentItem["kind"];
}

export interface JobStatus {
  job_id: string;
  step: string;
  status: "PENDING" | "CLAIMED" | "RETRY" | "COMPLETED" | "FAILED" | "SUPERSEDED";
  attempts: number;
  done: boolean;       // reached a terminal state — stop polling
  succeeded: boolean;  // true only on COMPLETED
  result?: any;        // handler success detail (e.g. { ok, sub_step, detail } or the read_state snapshot)
  error?: string;      // failure reason (on FAILED; last transient reason on RETRY)
  created_at: string;
  updated_at: string;
}

