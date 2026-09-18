const PYPSX_BASE_URL = process.env.PYPSX_BASE_URL || "https://brokerapi.paper.pypsx.com";
const PYPSX_KEY_ID = process.env.PYPSX_ORG_API_KEY_ID || "PYPSX-SANDBOX-WEALTH-21F957D2D5D8";
const PYPSX_SECRET_KEY = process.env.PYPSX_ORG_API_SECRET_KEY || "52_NZhD4NOW7IeDYDTJHWkfPnr9ye6gldeJLuD1TaQc";

export async function pypsxFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${PYPSX_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const headers: Record<string, string> = {
    "PYPSX-ORG-API-KEY-ID": PYPSX_KEY_ID,
    "PYPSX-ORG-API-SECRET-KEY": PYPSX_SECRET_KEY,
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      data?.detail?.[0]?.msg ||
      data?.detail ||
      data?.message ||
      data?.error ||
      `pyPSX request failed with status ${response.status}`;
    const error = new Error(typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg));
    (error as any).status = response.status;
    (error as any).code = data?.code;
    (error as any).data = data;
    throw error;
  }

  return data as T;
}

export interface PyPsxSubAccount {
  account_id: string;
  sub_account_id?: string;
  broker_account_number?: string;
  status: string;
  balance?: {
    cash: number;
    available_cash: number;
    equity: number;
  };
}

export interface PyPsxOrderResponse {
  order_id: string;
  broker_order_id?: string;
  sub_account_id: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price?: number;
  order_type: "MARKET" | "LIMIT" | "STOP" | "STOP_LIMIT" | "STOP_LOSS" | "TAKE_PROFIT";
  order_class?: "SIMPLE" | "BRACKET" | "OCO";
  stop_price?: number;
  stop_loss_price?: number;
  take_profit_price?: number;
  status: string;
  filled_qty?: number;
  avg_fill_price?: number;
  notional?: number;
  commission?: number;
  fees?: Array<{ name: string; amount: number }>;
  fees_total?: number;
  fill_source?: string;
  cash_balance?: number;
  equity?: number;
  created_at: string;
}

export interface PyPsxPortfolio {
  account_id: string;
  cash: number;
  reserved_cash: number;
  available_cash: number;
  positions_market_value: number;
  equity: number;
  total_unrealized_pnl: number;
  positions: Array<{
    symbol: string;
    quantity: number;
    avg_price: number;
    last_price: number;
    market_value: number;
    cost_basis: number;
    unrealized_pnl: number;
    unrealized_pnl_pct: number;
  }>;
  currency: string;
}

export interface DepthEntry {
  price: number;
  qty: number;
  orders: number;
}

export interface MarketDepthData {
  symbol: string;
  bids: DepthEntry[];
  asks: DepthEntry[];
  levels: number;
  is_synthetic: boolean;
  spread?: number;
  spread_pct?: number;
}

export interface PyPsxConfig {
  partner_id: string;
  api_key_id: string;
  environment: string;
  commission_rate: number;
  commission_rate_source: string;
  default_portfolio_value: number;
  default_portfolio_value_source: string;
  currency: string;
  scopes: string[];
  config_version: string;
}

export interface PyPsxFeeStructure {
  mode: string;
  currency: string;
  rates: {
    commission_default_pct: number;
    nccpl_rate: number;
    cdc_transaction_rate: number;
    cdc_transaction_floor_pkr: number;
    cdc_custody_annual_rate: number;
    transactional_rate: number;
    cgt_filer_rate: number;
    cgt_non_filer_rate: number;
  };
  applies: {
    nccpl: boolean;
    cdc_transaction: boolean;
    transactional: boolean;
    cdc_custody: boolean;
    cgt: boolean;
  };
  cgt: {
    filer_rate: number;
    non_filer_rate: number;
  };
  rates_editable?: {
    scope: string;
  };
}

export async function getPypsxConfig(): Promise<PyPsxConfig> {
  try {
    return await pypsxFetch<PyPsxConfig>("/v1/partner-api/config");
  } catch (error) {
    console.warn("Failed to fetch /v1/partner-api/config from pyPSX, using fallback config", error);
    return {
      partner_id: "WEALTH",
      api_key_id: PYPSX_KEY_ID,
      environment: "sandbox",
      commission_rate: 0.55,
      commission_rate_source: "fallback",
      default_portfolio_value: 500000,
      default_portfolio_value_source: "fallback",
      currency: "PKR",
      scopes: ["accounts:read", "accounts:write", "trading:read", "trading:write"],
      config_version: "default",
    };
  }
}

export async function getPypsxFees(): Promise<PyPsxFeeStructure> {
  try {
    return await pypsxFetch<PyPsxFeeStructure>("/v1/partner-api/fees");
  } catch (error) {
    console.warn("Failed to fetch /v1/partner-api/fees from pyPSX, using default fee schedule", error);
    return {
      mode: "PAPER",
      currency: "PKR",
      rates: {
        commission_default_pct: 0.55,
        nccpl_rate: 0.00005,
        cdc_transaction_rate: 0.000036,
        cdc_transaction_floor_pkr: 5,
        cdc_custody_annual_rate: 0.00005625,
        transactional_rate: 0.00003,
        cgt_filer_rate: 0.15,
        cgt_non_filer_rate: 0.15,
      },
      applies: {
        nccpl: true,
        cdc_transaction: false,
        transactional: false,
        cdc_custody: false,
        cgt: true,
      },
      cgt: {
        filer_rate: 0.15,
        non_filer_rate: 0.15,
      },
      rates_editable: {
        scope: "sandbox_only",
      },
    };
  }
}

