import type {
  AdminSnapshot, MarketMode, OrderPayload, OrderResponse,
  PortfolioSnapshot, SahulatApplicationPayload,
  StockInstrument, SukukInstrument
} from "@/lib/types";
import {
  mockCreateUserSession, mockFetchAdminSnapshot, mockFetchPortfolio,
  mockFetchStocks, mockFetchSukukInstruments, mockPlaceSukukOrder,
  mockReleaseQueuedOrders, mockSetMarketMode, mockSubmitSahulat
} from "@/lib/demo-api-mock";

const DEFAULT_LOCAL_API = "http://127.0.0.1:8000";
const DEFAULT_PRODUCTION_API = "https://api.pypsx.com";

function resolveDemoApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_DEMO_API_BASE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") return DEFAULT_PRODUCTION_API;
  return DEFAULT_LOCAL_API;
}

const API_BASE = resolveDemoApiBase();

function backendReachabilityMessage(): string {
  return `Could not reach API at ${API_BASE}. Set NEXT_PUBLIC_DEMO_API_BASE_URL in your host (e.g. Vercel) if the API URL changed, run pyTrader locally on port 8000 for dev, or set NEXT_PUBLIC_DEMO_API_MOCK=true for an offline demo.`;
}

export function isDemoApiMock(): boolean {
  const v = process.env.NEXT_PUBLIC_DEMO_API_MOCK;
  return v === "true" || v === "1" || v === "yes";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init, signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      cache: "no-store"
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`${backendReachabilityMessage()} (request timed out after 8s).`);
    }
    if (err instanceof TypeError) {
      throw new Error(`${backendReachabilityMessage()} (${err.message})`);
    }
    throw err;
  }
  clearTimeout(timeout);
  if (!response.ok) {
    let detail = "Request failed";
    try {
      const data = await response.json();
      detail = String(data.detail ?? data.message ?? detail);
    } catch { detail = response.statusText || detail; }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

export async function fetchPortfolio(userId = "demo-user"): Promise<PortfolioSnapshot> {
  if (isDemoApiMock()) return mockFetchPortfolio(userId);
  return request<PortfolioSnapshot>(`/v1/users/${userId}/portfolio`);
}

export async function createUserSession(name: string): Promise<PortfolioSnapshot> {
  if (isDemoApiMock()) return mockCreateUserSession(name);
  return request<PortfolioSnapshot>("/v1/users/session", {
    method: "POST", body: JSON.stringify({ name })
  });
}

export async function submitSahulatApplication(
  userId: string, payload: SahulatApplicationPayload
): Promise<PortfolioSnapshot> {
  if (isDemoApiMock()) return mockSubmitSahulat(userId, payload);
  return request<PortfolioSnapshot>(`/v1/users/${userId}/sahulat-application`, {
    method: "POST", body: JSON.stringify(payload)
  });
}

export async function fetchSukukInstruments(): Promise<SukukInstrument[]> {
  if (isDemoApiMock()) return mockFetchSukukInstruments();
  const response = await request<{ data: SukukInstrument[] }>("/v1/instruments/sukuk");
  return response.data;
}

export async function fetchStocks(): Promise<StockInstrument[]> {
  if (isDemoApiMock()) return mockFetchStocks();
  const response = await request<{ data: StockInstrument[] }>("/v1/instruments/stocks");
  return response.data;
}

export async function placeSukukOrder(payload: OrderPayload): Promise<OrderResponse> {
  if (isDemoApiMock()) return mockPlaceSukukOrder(payload);
  return request<OrderResponse>("/v1/orders/sukuk", {
    method: "POST", body: JSON.stringify(payload)
  });
}

export async function fetchAdminSnapshot(): Promise<AdminSnapshot> {
  if (isDemoApiMock()) return mockFetchAdminSnapshot();
  return request<AdminSnapshot>("/v1/admin/partner-view");
}

export async function setMarketMode(mode: MarketMode) {
  if (isDemoApiMock()) return mockSetMarketMode(mode);
  return request("/v1/admin/partner-view/market-mode", {
    method: "POST", body: JSON.stringify({ mode })
  });
}

export async function releaseQueuedOrders() {
  if (isDemoApiMock()) return mockReleaseQueuedOrders();
  return request<{ released_count: number }>("/v1/admin/partner-view/release-queued", {
    method: "POST"
  });
}

export function getAdminStreamUrl(): string {
  if (isDemoApiMock()) return "";
  return `${API_BASE}/v1/admin/partner-view/stream`;
}
