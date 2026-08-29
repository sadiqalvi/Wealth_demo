/**
 * In-memory mock for Liquidity-Wealth demo routes.
 * Enable with NEXT_PUBLIC_DEMO_API_MOCK=true (no server required).
 */
import type {
  AdminLogItem, AdminSnapshot, MarketMode, MarketStatus,
  OrderPayload, OrderResponse, PortfolioHolding, PortfolioSnapshot,
  SahulatApplicationPayload, StockInstrument, SukukInstrument, TaxBreakdown
} from "@/lib/types";

const nowIso = () => new Date().toISOString();

const OPEN_MARKET: MarketStatus = {
  mode: "OPEN", is_open: true, checked_at: nowIso(),
  next_market_open: null, label: "Invest Now", admin_badge: "OPEN"
};

const MOCK_INSTRUMENTS: SukukInstrument[] = [
  {
    ticker: "P01GIS260115", name: "GIS • Dec 2026", face_value: 5000,
    maturity_date: "2026-12-15", coupon_rate: 0, remaining_years: 0.85,
    days_remaining: 310, discount_price: 4725, minimum_investment: 5000,
    yield_to_maturity: 11.4, category: "Sukuk Bonds", bond_price: 94.5,
    ldcp: 94.2, ldcp_pkr: 4710, change_pct: 0.32, change_pkr: 15,
    total_profit_pkr: 275
  },
  {
    ticker: "P02GIS270601", name: "GIS • June 2027", face_value: 5000,
    maturity_date: "2027-06-01", coupon_rate: 0, remaining_years: 1.35,
    days_remaining: 490, discount_price: 4450, minimum_investment: 5000,
    yield_to_maturity: 12.1, category: "Sukuk Bonds", bond_price: 89.0,
    ldcp: 92.8, ldcp_pkr: 4640, change_pct: -0.12, change_pkr: -6,
    total_profit_pkr: 550
  },
  {
    ticker: "P03GIS280301", name: "GIS • March 2028", face_value: 5000,
    maturity_date: "2028-03-01", coupon_rate: 0, remaining_years: 2.1,
    days_remaining: 760, discount_price: 4200, minimum_investment: 5000,
    yield_to_maturity: 12.8, category: "Sukuk Bonds", bond_price: 84.0,
    ldcp: 91.5, ldcp_pkr: 4575, change_pct: 0.08, change_pkr: 4,
    total_profit_pkr: 800
  }
];

const MOCK_STOCKS: StockInstrument[] = [
  {
    ticker: "OGDC", name: "Oil & Gas Dev Co", price: 128.45, change_pct: 2.34,
    change_pkr: 2.94, volume: 12_450_000, market_cap_b: 552,
    sector: "Energy", sparkline_7d: [122.1, 123.8, 125.2, 124.0, 126.5, 127.1, 128.45]
  },
  {
    ticker: "HBL", name: "Habib Bank Ltd", price: 245.80, change_pct: -0.85,
    change_pkr: -2.11, volume: 8_320_000, market_cap_b: 360,
    sector: "Banking", sparkline_7d: [250.2, 248.9, 249.5, 247.0, 246.3, 247.9, 245.80]
  },
  {
    ticker: "LUCK", name: "Lucky Cement", price: 872.50, change_pct: 1.15,
    change_pkr: 9.92, volume: 3_150_000, market_cap_b: 282,
    sector: "Cement", sparkline_7d: [855.0, 860.2, 858.4, 862.8, 868.0, 870.1, 872.50]
  },
  {
    ticker: "ENGRO", name: "Engro Corporation", price: 312.40, change_pct: 0.62,
    change_pkr: 1.93, volume: 5_780_000, market_cap_b: 180,
    sector: "Conglomerate", sparkline_7d: [305.1, 307.8, 306.2, 309.4, 310.8, 311.5, 312.40]
  },
  {
    ticker: "SYS", name: "Systems Limited", price: 485.20, change_pct: 3.41,
    change_pkr: 16.0, volume: 6_920_000, market_cap_b: 115,
    sector: "Technology", sparkline_7d: [462.0, 468.5, 470.2, 475.8, 479.3, 481.0, 485.20]
  },
  {
    ticker: "PPL", name: "Pakistan Petroleum", price: 95.30, change_pct: -1.22,
    change_pkr: -1.18, volume: 9_100_000, market_cap_b: 188,
    sector: "Energy", sparkline_7d: [98.5, 97.8, 96.2, 97.0, 96.1, 95.8, 95.30]
  },
  {
    ticker: "MCB", name: "MCB Bank Ltd", price: 198.60, change_pct: 0.91,
    change_pkr: 1.79, volume: 4_560_000, market_cap_b: 235,
    sector: "Banking", sparkline_7d: [194.2, 195.8, 196.1, 195.5, 197.0, 197.8, 198.60]
  },
  {
    ticker: "UBL", name: "United Bank Ltd", price: 178.90, change_pct: -0.45,
    change_pkr: -0.81, volume: 3_890_000, market_cap_b: 219,
    sector: "Banking", sparkline_7d: [180.5, 179.8, 180.2, 179.0, 179.5, 179.3, 178.90]
  }
];

function slugify(name: string): string {
  const s = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return s || "guest";
}

function emptyTax(): TaxBreakdown {
  return {
    gross_profit: 0, estimated_wht_filer: 0, estimated_wht_non_filer: 0,
    net_expected_payout_filer: 0, net_expected_payout_non_filer: 0, status_flag: "—"
  };
}

function buildProfile(fullName: string) {
  const slug = slugify(fullName);
  return {
    full_name: fullName, cnic: "35202-1234567-1", date_of_birth: "1994-08-17",
    father_name: "Muhammad Tariq", mobile_number: "+923001234567",
    email: `${slug || "user"}@liquidity.pk`
  };
}

function basePortfolio(userId: string, displayName: string): PortfolioSnapshot {
  const wallet = 200_000;
  return {
    user_id: userId, name: displayName,
    avatar_label: displayName.trim().charAt(0).toUpperCase() || "U",
    wallet_balance: wallet, cash_balance: wallet, holdings: [],
    first_holding_at: null, total_accrued_value: wallet,
    current_balance: wallet, accrual_velocity_pkr_sec: 0,
    synced_at: nowIso(),
    market_status: { ...OPEN_MARKET, checked_at: nowIso() },
    tax_status: "FILER", tax_breakdown: emptyTax(), notifications: [],
    profile: buildProfile(displayName),
    sahulat_account: {
      status: "NOT_STARTED", submitted_at: null,
      broker_name: null, sub_account_id: null
    }
  };
}

const MOCK_VELOCITY_PER_UNIT = 0.012;
let logSeq = 0;
const apiLog: AdminLogItem[] = [];

function pushLog(title: string, payload: Record<string, unknown>) {
  logSeq += 1;
  apiLog.unshift({
    event_id: `mock-${logSeq}`, event_type: "api_log", title,
    endpoint: "/mock", status_code: 200, payload, created_at: nowIso()
  });
  if (apiLog.length > 80) apiLog.pop();
}

const users = new Map<string, PortfolioSnapshot>();
const idempotentOrders = new Map<string, OrderResponse>();

function getInstrument(ticker: string): SukukInstrument | StockInstrument | undefined {
  const upper = ticker.trim().toUpperCase();
  const sukuk = MOCK_INSTRUMENTS.find((i) => i.ticker.toUpperCase() === upper);
  if (sukuk) return sukuk;
  return MOCK_STOCKS.find((s) => s.ticker.toUpperCase() === upper);
}

function portfolioAccrual(holdings: PortfolioHolding[]): number {
  return holdings.reduce((s, h) => s + (h.accrual_velocity_pkr_sec || 0), 0);
}

function revaluePortfolio(p: PortfolioSnapshot, options?: { bumpSyncedAt?: boolean }): PortfolioSnapshot {
  const bumpSynced = options?.bumpSyncedAt !== false;
  const holdingsValue = p.holdings.reduce((s, h) => s + h.position_value, 0);
  const current = holdingsValue + p.cash_balance;
  const t = nowIso();
  return {
    ...p, total_accrued_value: current, current_balance: current,
    accrual_velocity_pkr_sec: portfolioAccrual(p.holdings),
    synced_at: bumpSynced ? t : p.synced_at,
    market_status: { ...p.market_status, checked_at: t }
  };
}

function mergeHolding(portfolio: PortfolioSnapshot, inst: SukukInstrument | StockInstrument, units: number): PortfolioSnapshot {
  const isStock = 'sector' in inst;
  const unitPrice = isStock ? inst.price : inst.discount_price;
  const cost = units * unitPrice;
  const ticker = inst.ticker.toUpperCase();
  const existingIdx = portfolio.holdings.findIndex((h) => h.ticker.toUpperCase() === ticker);
  const firstPurchase = portfolio.holdings.length === 0;

  if (existingIdx >= 0) {
    const h = portfolio.holdings[existingIdx];
    const newUnits = h.units + units;
    const newInvested = h.invested_amount + cost;
    const newPurchase = newInvested / newUnits;
    const newAccrued = unitPrice;
    const newPosition = newAccrued * newUnits;
    const next = [...portfolio.holdings];
    next[existingIdx] = {
      ...h, units: newUnits, purchase_price: newPurchase,
      invested_amount: newInvested, current_accrued: newAccrued,
      position_value: newPosition,
      accrual_velocity_pkr_sec: MOCK_VELOCITY_PER_UNIT * newUnits,
      purchase_date: h.purchase_date ?? nowIso()
    };
    return { ...portfolio, holdings: next };
  }

  const purchaseAt = nowIso();
  const holding: PortfolioHolding = {
    holding_id: `h-${ticker}-${Date.now()}`, ticker: inst.ticker,
    name: inst.name, units, face_value: isStock ? 0 : inst.face_value,
    purchase_price: unitPrice, current_accrued: unitPrice,
    position_value: unitPrice * units, invested_amount: cost,
    maturity_date: isStock ? "" : inst.maturity_date, yield_to_maturity: isStock ? 0 : inst.yield_to_maturity,
    accrual_velocity_pkr_sec: isStock ? 0 : MOCK_VELOCITY_PER_UNIT * units, purchase_date: purchaseAt
  };
  const withHoldings: PortfolioSnapshot = { ...portfolio, holdings: [...portfolio.holdings, holding] };
  if (firstPurchase && !portfolio.first_holding_at) {
    return { ...withHoldings, first_holding_at: nowIso() };
  }
  return withHoldings;
}

function baseAdminSnapshot(): AdminSnapshot {
  return {
    total_aum: 45_500_000, display_aum: 45_522_815, tax_provisioned: 1_200_000,
    active_users: 12_450,
    market_status: { ...OPEN_MARKET, checked_at: nowIso() },
    queued_orders: [], api_log: [...apiLog], webhooks: [], kyc_users: [],
    activity_feed: [], tax_estimation: emptyTax(), onboarding_today: 412,
    kyc_sync_success_rate: 99.4, shared_kyc_events: [],
    kyc_funnel: { received: 120, validating: 45, sent_to_broker: 30, active: 890 },
    user_directory: [], partner_logos: []
  };
}

export async function mockFetchSukukInstruments(): Promise<SukukInstrument[]> {
  pushLog("GET /v1/instruments/sukuk", { mock: true });
  return [...MOCK_INSTRUMENTS];
}

export async function mockFetchStocks(): Promise<StockInstrument[]> {
  pushLog("GET /v1/instruments/stocks", { mock: true });
  return [...MOCK_STOCKS];
}

export async function mockCreateUserSession(name: string): Promise<PortfolioSnapshot> {
  const display = name.trim();
  if (display.length < 2) throw new Error("Please enter at least 2 characters for your name.");
  const userId = `user-${slugify(display)}`;
  const existing = users.get(userId);
  if (existing) {
    const resumed = {
      ...existing, name: display,
      avatar_label: display.charAt(0).toUpperCase() || "U",
      profile: buildProfile(display)
    };
    users.set(userId, resumed);
    pushLog("POST /v1/users/session", { name: display, user_id: userId, resumed: true });
    return revaluePortfolio(resumed);
  }
  const p = basePortfolio(userId, display);
  users.set(userId, p);
  pushLog("POST /v1/users/session", { name: display, user_id: userId });
  return revaluePortfolio(p);
}

export async function mockFetchPortfolio(userId: string): Promise<PortfolioSnapshot> {
  const u = users.get(userId);
  if (!u) throw new Error(`Unknown demo user: ${userId}`);
  pushLog(`GET /v1/users/${userId}/portfolio`, { mock: true });
  return revaluePortfolio({ ...u }, { bumpSyncedAt: false });
}

export async function mockSubmitSahulat(
  userId: string, payload: SahulatApplicationPayload
): Promise<PortfolioSnapshot> {
  const u = users.get(userId);
  if (!u) throw new Error(`Unknown demo user: ${userId}`);
  if (!payload.consent) throw new Error("Consent is required to continue.");
  const subId = `${12990 + userId.length}-${userId.length % 7}`;
  const next: PortfolioSnapshot = {
    ...u, sahulat_account: {
      status: "RECEIVED", submitted_at: nowIso(),
      broker_name: payload.broker_name, sub_account_id: subId
    }
  };
  users.set(userId, next);
  pushLog(`POST /v1/users/${userId}/sahulat-application`, { broker: payload.broker_name, sub_account_id: subId });
  return revaluePortfolio(next);
}

export async function mockPlaceSukukOrder(payload: OrderPayload): Promise<OrderResponse> {
  const key = payload.idempotency_key;
  const existing = idempotentOrders.get(key);
  if (existing) return existing;

  const userId = payload.tenant_user_id ?? "";
  const u = users.get(userId);
  if (!u) throw new Error(`User ${userId} was not found`);

  const inst = getInstrument(payload.ticker);
  if (!inst) throw new Error(`Ticker ${payload.ticker} was not found`);
  const isStock = 'sector' in inst;

  if (payload.side !== "BUY" && payload.side !== "SELL") {
    throw new Error("Only BUY and SELL orders are supported in the demo.");
  }
  const amt = payload.amount_pkr;
  if (amt <= 0) throw new Error("Amount must be greater than zero.");
  if (!isStock && amt % 5000 !== 0) throw new Error("Must be in multiples of PKR 5,000");

  const unitPrice = isStock ? inst.price : inst.discount_price;
  const faceVal = isStock ? unitPrice : inst.face_value;

  const units = isStock ? Math.floor(amt / unitPrice) : Math.floor(amt / faceVal);
  if (units < 1) throw new Error("Insufficient amount for at least one unit.");

  const filled = units * unitPrice;
  let next: PortfolioSnapshot;
  let newCash: number;
  let newWallet: number;

  if (payload.side === "BUY") {
    if (u.wallet_balance < filled || u.cash_balance < filled) {
      throw new Error("Insufficient wallet balance for this purchase.");
    }
    next = mergeHolding(u, inst, units);
    newCash = Number((u.cash_balance - filled).toFixed(2));
    newWallet = Number((u.wallet_balance - filled).toFixed(2));
  } else {
    const totalOwned = u.holdings
      .filter((h) => h.ticker.toUpperCase() === inst.ticker.toUpperCase())
      .reduce((s, h) => s + h.units, 0);
    if (totalOwned < units) {
      throw new Error(`Insufficient units to sell. Owned: ${totalOwned}, Requested: ${units}`);
    }
    let unitsRemainingToDeduct = units;
    const nextHoldings = u.holdings
      .map((h) => {
        if (h.ticker.toUpperCase() !== inst.ticker.toUpperCase() || unitsRemainingToDeduct <= 0) return h;
        const deduct = Math.min(h.units, unitsRemainingToDeduct);
        unitsRemainingToDeduct -= deduct;
        if (h.units === deduct) return null;
        return {
          ...h, units: h.units - deduct,
          position_value: (h.units - deduct) * unitPrice,
          invested_amount: h.invested_amount * ((h.units - deduct) / h.units),
          accrual_velocity_pkr_sec: isStock ? 0 : MOCK_VELOCITY_PER_UNIT * (h.units - deduct)
        };
      })
      .filter((h): h is PortfolioHolding => h !== null);
    next = { ...u, holdings: nextHoldings };
    newCash = Number((u.cash_balance + filled).toFixed(2));
    newWallet = Number((u.wallet_balance + filled).toFixed(2));
  }

  next = { ...next, cash_balance: newCash, wallet_balance: newWallet };
  next = revaluePortfolio(next);
  users.set(userId, next);

  const response: OrderResponse = {
    order_id: `mock-${Date.now()}`, status: "filled", ticker: inst.ticker,
    amount_pkr: amt, filled_amount_pkr: filled,
    unit_price_pkr: unitPrice, units,
    cash_remaining_pkr: newCash, change_pkr: 0,
    user_id: userId, user_name: u.name,
    message: payload.side === "BUY" ? "Purchase confirmed." : "Sale confirmed.",
    market_status: { ...OPEN_MARKET, checked_at: nowIso() },
    queued_for: null, backend_status: "filled",
    portfolio_effect: "visible_immediately"
  };
  idempotentOrders.set(key, response);
  pushLog("POST /v1/orders/sukuk", {
    user_id: userId, user_name: u.name,
    ticker: inst.ticker, amount_pkr: amt, units
  });
  return response;
}

export async function mockFetchAdminSnapshot(): Promise<AdminSnapshot> {
  return baseAdminSnapshot();
}

export async function mockSetMarketMode(_mode: MarketMode): Promise<Record<string, unknown>> {
  return { ok: true, mock: true };
}

export async function mockReleaseQueuedOrders(): Promise<{ released_count: number }> {
  return { released_count: 0 };
}
