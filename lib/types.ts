export type MarketMode = "AUTO" | "OPEN" | "CLOSED";

export interface MarketStatus {
  mode: MarketMode;
  is_open: boolean;
  checked_at: string;
  next_market_open: string | null;
  label: string;
  admin_badge?: string;
}

export interface SukukInstrument {
  ticker: string;
  name: string;
  face_value: number;
  maturity_date: string;
  coupon_rate: number;
  remaining_years: number;
  days_remaining?: number;
  discount_price: number;
  minimum_investment: number;
  yield_to_maturity: number | null;
  category: string;
  issuer_type?: string;
  instrument_type?: string;
  bond_price?: number;
  ldcp?: number;
  ldcp_pkr?: number;
  change_pct?: number;
  change_pkr?: number;
  total_profit_pkr?: number;
}

export interface StockInstrument {
  ticker: string;
  name: string;
  price: number;
  change_pct: number;
  change_pkr: number;
  volume: number;
  market_cap_b: number;
  sector: string;
  sparkline_7d: number[];
}

export interface PortfolioHolding {
  holding_id: string;
  ticker: string;
  name: string;
  units: number;
  face_value: number;
  purchase_price: number;
  purchase_date?: string;
  current_accrued: number;
  position_value: number;
  invested_amount: number;
  maturity_date: string;
  yield_to_maturity: number | null;
  accrual_velocity_pkr_sec: number;
}

export interface NotificationItem {
  notification_id: string;
  message: string;
  created_at: string;
  payload: Record<string, unknown>;
}

export interface TaxBreakdown {
  gross_profit: number;
  estimated_wht_filer: number;
  estimated_wht_non_filer: number;
  net_expected_payout_filer: number;
  net_expected_payout_non_filer: number;
  status_flag: string;
}

export interface ReadonlyProfile {
  full_name: string;
  cnic: string;
  date_of_birth: string;
  father_name: string;
  mobile_number: string;
  email: string;
}

export interface SahulatApplicationState {
  status: "NOT_STARTED" | "RECEIVED" | "ACTIVE";
  submitted_at: string | null;
  broker_name: string | null;
  sub_account_id: string | null;
}

export interface PortfolioSnapshot {
  user_id: string;
  name: string;
  avatar_label: string;
  wallet_balance: number;
  cash_balance: number;
  holdings: PortfolioHolding[];
  first_holding_at?: string | null;
  total_accrued_value: number;
  current_balance: number;
  accrual_velocity_pkr_sec: number;
  synced_at: string;
  market_status: MarketStatus;
  execution_mode?: string;
  tax_status: "FILER" | "NON_FILER";
  tax_breakdown: TaxBreakdown;
  notifications: NotificationItem[];
  profile: ReadonlyProfile;
  sahulat_account: SahulatApplicationState;
}

export interface UserSessionPayload {
  user_id: string;
  name: string;
}

export interface AdminLogItem {
  event_id: string;
  event_type: string;
  title: string;
  endpoint: string | null;
  status_code: number | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface WebhookItem {
  webhook_id: string;
  event_type: string;
  user_id: string;
  message: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface KycUser {
  kyc_id: string;
  name: string;
  status: string;
  updated_at: string;
}

export interface PartnerLogo {
  name: string;
  tagline: string;
}

export interface AdminSnapshot {
  total_aum: number;
  display_aum: number;
  tax_provisioned: number;
  active_users: number;
  market_status: MarketStatus;
  queued_orders: Array<Record<string, unknown>>;
  api_log: AdminLogItem[];
  webhooks: WebhookItem[];
  kyc_users: KycUser[];
  activity_feed: string[];
  tax_estimation: TaxBreakdown;
  onboarding_today: number;
  kyc_sync_success_rate: number;
  shared_kyc_events: string[];
  kyc_funnel: {
    received: number;
    validating: number;
    sent_to_broker: number;
    active: number;
  };
  user_directory: Array<{
    user_id: string;
    name: string;
    tax_status: string;
    kyc_status: string;
    invested_amount: number;
    tier: string;
  }>;
  partner_logos: PartnerLogo[];
}

export interface SahulatApplicationPayload {
  mother_maiden_name: string;
  occupation: string;
  income_range: string;
  zakat_status: "Yes" | "No";
  broker_name: string;
  consent: boolean;
}

export interface OrderPayload {
  ticker: string;
  side: "BUY" | "SELL";
  amount_pkr: number;
  idempotency_key: string;
  tenant_user_id?: string;
}

export interface OrderResponse {
  order_id: string;
  status: "filled";
  ticker: string;
  amount_pkr: number;
  filled_amount_pkr?: number;
  unit_price_pkr?: number;
  units: number;
  cash_remaining_pkr?: number;
  change_pkr?: number;
  user_id: string;
  user_name: string;
  message: string;
  market_status: MarketStatus;
  queued_for: string | null;
  backend_status: string;
  portfolio_effect: string;
}
