"use client";

/**
 * Admin activity feed:
 * - KYC: only the cross-tab consumer submission runs the fixed 3-step pipeline (titles are exact; no random KYC variants).
 * - Simulated rows: brokerage, execution, settlement, profit; [MARKET] on a 30–60s timer only.
 */

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Landmark, Search, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { SAHULAT_BROKERS } from "@/lib/brokers";
import {
  NP_DEMO_EVENT_KEY,
  type NPDemoKycEvent,
  persistCrossTabActivitiesAppend,
  readPersistedCrossTabActivities
} from "@/lib/np-demo-cross-tab";

type AccountKind = "Individual" | "Merchant";
type AccountStatus = "ACTIVE" | "PENDING" | "VALIDATING";
type ActivityTone = "success" | "pending";

type ManagedAccount = {
  id: string;
  name: string;
  kind: AccountKind;
  taxStatus: "FILER" | "NON_FILER";
  tier: "Silver" | "Gold" | "Platinum";
  status: AccountStatus;
  investedAmount: number;
  grossProfit: number;
};

type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  tone: ActivityTone;
  createdAt: string;
};

const SAHULAT_LIMIT = 3_000_000;
const AUM_STEPS = [250, 425, 850, 1500, 975, 640];
const INDIVIDUAL_NAMES = [
  "Ahmer", "Sana", "Usman", "Areeba", "Zaid", "Hina", "Hamza", "Maham", "Raza", "Iqra",
  "Ali", "Noor", "Ayesha", "Bilal", "Dua", "Farhan", "Komal", "Hassan", "Muneeb", "Nimra"
];
const MERCHANT_NAMES = [
  "Kashif's Electronics", "Green Valley Mart", "Nawab Traders", "Sapphire Furnishings", "City Medicos",
  "Minaal Textiles", "Orbit Autos", "Al-Hamd Grocers", "Pak Agro Supply", "BluePeak Mobile Hub"
];

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function randomBroker(): string {
  return pick(SAHULAT_BROKERS);
}

function randomIndividualName(): string {
  return pick(INDIVIDUAL_NAMES);
}

/** Simulated feed (excludes KYC pipeline titles and [MARKET] — market uses its own 30–60s timer). */
const SEEDED_EVENT_FACTORIES: Array<() => Omit<ActivityItem, "id" | "createdAt">> = [
  () => ({
    title: "Tax & Profit Update",
    detail: "Daily rental accrual processed for P01GIS250626. Estimated Tax Reserve (30% Non-Filer) set aside for automated settlement.",
    tone: "success"
  }),
  () => ({
    title: "Ledger Update",
    detail: "Transaction finalized. Exact amount of Rs 24,475.25 debited from Liquidity-Wealth Wallet. Portfolio holdings updated.",
    tone: "success"
  }),
  () => ({
    title: "Execution Successful",
    detail: "Brokerage confirms trade execution for P01GIS250626 at Rs 4,895.05/unit. Assets successfully secured in CDC sub-account.",
    tone: "success"
  }),
  () => ({
    title: "Trade Order Routed",
    detail: "Buy request for 5 Units of P01GIS250626 received. Totaling Rs 24,475.25. Routing to Brokerage via pyPSX Gateway...",
    tone: "pending"
  })
];

const MARKET_LIVE_PRICE_ITEM = (): Omit<ActivityItem, "id" | "createdAt"> => ({
  title: "[MARKET] Live Price Update",
  detail: "Latest PSX debt/equity quotes applied across active Sahulat portfolios.",
  tone: "success"
});

function buildManagedAccounts(count = 1280): ManagedAccount[] {
  return Array.from({ length: count }, (_, index) => {
    const isMerchant = index % 5 < 2;
    const kind: AccountKind = isMerchant ? "Merchant" : "Individual";
    const status: AccountStatus = index % 9 === 0 ? "PENDING" : index % 7 === 0 ? "VALIDATING" : "ACTIVE";
    const investedAmount = Math.min(150000 + ((index * 17350) % 2_950_000), SAHULAT_LIMIT);
    const grossProfit = Number((investedAmount * (0.018 + (index % 6) * 0.0015)).toFixed(2));
    const tier = investedAmount >= 2_000_000 ? "Platinum" : investedAmount >= 900_000 ? "Gold" : "Silver";
    const name = isMerchant
      ? `${MERCHANT_NAMES[index % MERCHANT_NAMES.length]} ${Math.floor(index / MERCHANT_NAMES.length) + 1}`
      : `${INDIVIDUAL_NAMES[index % INDIVIDUAL_NAMES.length]} ${Math.floor(index / INDIVIDUAL_NAMES.length) + 1}`;

    return {
      id: `acct-${index + 1}`,
      name,
      kind,
      taxStatus: index % 4 === 0 ? "NON_FILER" : "FILER",
      tier,
      status,
      investedAmount,
      grossProfit
    };
  });
}

const ACCOUNTS = buildManagedAccounts();

function buildSeedActivities(): ActivityItem[] {
  // Pre-defined offsets (in seconds) to ensure logical flow: Tax(0) -> Ledger(120) -> Execution(300) -> Routed(310)
  // This means Routed is 310s ago, Execution is 300s ago (10s later), etc.
  const offsets = [0, 120, 300, 310];
  
  return SEEDED_EVENT_FACTORIES.map((factory, index) => {
    const event = factory();
    const offset = offsets[index] || index * 60;
    return {
      id: `seed-${index}`,
      title: event.title,
      detail: event.detail,
      tone: event.tone,
      createdAt: new Date(Date.now() - offset * 1000).toISOString()
    };
  });
}

function mergeActivities(current: ActivityItem[], incoming: ActivityItem[]) {
  const map = new Map<string, ActivityItem>();
  [...incoming, ...current].forEach((item) => map.set(item.id, item));
  return Array.from(map.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 18);
}

function SummaryCard({
  title,
  value,
  accent,
  subtitle
}: {
  title: string;
  value: string;
  accent: "orange" | "teal";
  subtitle?: string;
}) {
  const accentClass =
    accent === "orange"
      ? "border-orange-200 bg-orange-50 text-orange-700"
      : "border-teal-200 bg-teal-50 text-teal-700";

  return (
    <div className="rounded-[28px] border border-rev-border bg-rev-surface p-5 shadow-card">
      <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${accentClass}`}>{title}</div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-rev-ink">{value}</p>
      {subtitle ? <p className="mt-2 text-sm font-medium text-rev-muted">{subtitle}</p> : null}
    </div>
  );
}

function StatusBadge({ status }: { status: AccountStatus }) {
  const styles =
    status === "ACTIVE"
      ? "bg-teal-100 text-teal-700"
      : status === "PENDING"
        ? "bg-orange-100 text-orange-700"
        : "bg-rev-card text-rev-muted";
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>{status}</span>;
}

export function AdminPartnerView() {
  const [aum, setAum] = useState(45_522_815);
  const [taxProvision, setTaxProvision] = useState(1_265_420);
  const [activeAccounts, setActiveAccounts] = useState(12_450);
  const [successRate, setSuccessRate] = useState(99.4);
  const [now, setNow] = useState(new Date());
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"ALL" | AccountKind>("ALL");
  const [activities, setActivities] = useState<ActivityItem[]>(buildSeedActivities());
  const eventIndex = useRef(SEEDED_EVENT_FACTORIES.length);
  const factoryCount = SEEDED_EVENT_FACTORIES.length;
  const crossTabTimeouts = useRef<number[]>([]);
  const marketTickerRef = useRef<number | null>(null);

  const ingestConsumerKycEvent = useRef((payload: NPDemoKycEvent) => {
    const name = payload.name?.trim() || "Investor";
    const broker = payload.broker_name?.trim() || randomBroker();

    const step1: ActivityItem = {
      id: `kyc-${payload.id}-step1`,
      title: "[KYC] Submission Received",
      detail: `KYC packet for ${name} received from Liquidity-Wealth. Validating for pyPSX sync.`,
      tone: "pending",
      createdAt: payload.timestamp || new Date().toISOString()
    };
    persistCrossTabActivitiesAppend([step1]);
    setActivities((current) => mergeActivities(current, [step1]));

    const tid2 = window.setTimeout(() => {
      const step2: ActivityItem = {
        id: `kyc-${payload.id}-step2`,
        title: "[pyPSX] Verification Successful",
        detail: `Identity cleared via Liquidity-Wealth/NADRA link. Profile forwarded to ${broker} for final approval.`,
        tone: "success",
        createdAt: new Date().toISOString()
      };
      persistCrossTabActivitiesAppend([step2]);
      setActivities((current) => mergeActivities(current, [step2]));
    }, 3000);
    crossTabTimeouts.current.push(tid2);

    const tid3 = window.setTimeout(() => {
      const step3: ActivityItem = {
        id: `kyc-${payload.id}-step3`,
        title: "[SAHULAT] Account Opened",
        detail: `Brokerage/CDC onboarding complete. ${name} is now live and cleared for Sukuk trading.`,
        tone: "success",
        createdAt: new Date().toISOString()
      };
      persistCrossTabActivitiesAppend([step3]);
      setActivities((current) => mergeActivities(current, [step3]));
      setActiveAccounts((count) => count + 1);
    }, 5000);
    crossTabTimeouts.current.push(tid3);
  });

  useEffect(() => {
    const persisted = readPersistedCrossTabActivities();
    if (persisted.length) {
      setActivities((current) => mergeActivities(current, persisted));
    }
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== NP_DEMO_EVENT_KEY || event.newValue == null) {
        return;
      }
      try {
        const data = JSON.parse(event.newValue) as NPDemoKycEvent;
        if (data.type !== "SAHULAT_KYC" || typeof data.id !== "string") {
          return;
        }
        ingestConsumerKycEvent.current(data);
      } catch {
        // ignore malformed payloads
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      crossTabTimeouts.current.forEach((id) => window.clearTimeout(id));
      crossTabTimeouts.current = [];
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const step = AUM_STEPS[Math.floor(Math.random() * AUM_STEPS.length)];
      setAum((current) => current + step);
      setTaxProvision((current) => Number((current + step * 0.15).toFixed(2)));
      setActiveAccounts((current) => current + (Math.random() > 0.72 ? 1 : 0));
      setSuccessRate((current) => Number(Math.min(99.9, Math.max(99.2, current + (Math.random() > 0.5 ? 0.02 : -0.01))).toFixed(1)));
    }, 2000);
    return () => window.clearInterval(timer);
  }, []);



  const filteredAccounts = useMemo(() => {
    return ACCOUNTS.filter((account) => {
      const matchesSearch = !search || account.name.toLowerCase().includes(search.toLowerCase());
      const matchesKind = kindFilter === "ALL" || account.kind === kindFilter;
      return matchesSearch && matchesKind;
    });
  }, [kindFilter, search]);

  const kycFunnel = {
    received: 800,
    validating: 120,
    sent: 50,
    active: 630
  };

  return (
    <main className="min-h-screen bg-rev-bg px-4 py-6 text-rev-ink">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex items-center justify-between rounded-[28px] border border-rev-border bg-rev-surface px-6 py-5 shadow-card">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-rev-ink">
              <ArrowLeft className="h-4 w-4" />
              Consumer View
            </Link>
            <h1 className="mt-3 text-3xl font-extrabold">Liquidity-Wealth Admin Dashboard</h1>
          </div>
          <div className="rounded-full bg-rev-shell px-4 py-2 text-sm font-semibold text-rev-muted">
            PKT {now.toLocaleTimeString("en-PK")}
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-4">
          <SummaryCard title="Total Liquidity-Wealth AUM" value={formatCurrency(aum)} accent="orange" />
          <SummaryCard title="Estimated Tax Reserve" value={formatCurrency(taxProvision)} accent="teal" />
          <SummaryCard title="Active Investors" value={activeAccounts.toLocaleString("en-PK")} accent="teal" />
          <SummaryCard title="Onboarding Success" value={`${successRate.toFixed(1)}%`} accent="orange" />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_1.35fr]">
          <div className="space-y-4">
            <div className="rounded-[28px] border border-rev-border bg-rev-surface p-5 shadow-card">
              <div className="mb-4 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-rev-cyan" />
                <p className="text-sm font-semibold text-rev-ink">Investor Onboarding Pipeline</p>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  ["Received", kycFunnel.received],
                  ["Validating", kycFunnel.validating],
                  ["Sent", kycFunnel.sent],
                  ["Active", kycFunnel.active]
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-2xl bg-rev-shell p-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rev-muted">{label}</p>
                    <p className="mt-2 text-xl font-extrabold text-rev-ink">{Number(value).toLocaleString("en-PK")}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-rev-border bg-rev-surface p-5 shadow-card">
              <div className="mb-4 flex items-center gap-3">
                <Landmark className="h-5 w-5 text-rev-purple" />
                <p className="text-sm font-semibold text-rev-ink">Today&apos;s Activity</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-rev-shell p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rev-muted">New Investors Onboarded</p>
                  <p className="mt-2 text-2xl font-extrabold text-rev-ink">412</p>
                </div>
                <div className="rounded-2xl bg-rev-shell p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rev-muted">Active Merchants</p>
                  <p className="mt-2 text-2xl font-extrabold text-rev-ink">
                    {ACCOUNTS.filter((account) => account.kind === "Merchant").length.toLocaleString("en-PK")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-rev-border bg-rev-surface p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-rev-purple" />
                <p className="text-sm font-semibold text-rev-ink">System Activity</p>
              </div>
              <div className="rounded-full bg-rev-shell px-3 py-2 text-xs font-semibold text-rev-muted">
                {activities.length} live updates
              </div>
            </div>
            <div className="scrollbar-thin max-h-[360px] space-y-3 overflow-y-auto">
              {activities.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-3xl border px-4 py-4 ${
                    item.tone === "success" ? "border-teal-200 bg-teal-50" : "border-orange-200 bg-orange-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-sm font-semibold ${item.tone === "success" ? "text-teal-700" : "text-orange-700"}`}>
                      {item.title}
                    </p>
                    <span className="text-[11px] text-rev-muted">{new Date(item.createdAt).toLocaleTimeString("en-PK")}</span>
                  </div>
                  <p className="mt-2 text-sm text-rev-ink">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-rev-border bg-rev-surface p-5 shadow-card">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-rev-cyan" />
              <p className="text-sm font-semibold text-rev-ink">Account Management</p>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rev-muted" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search accounts"
                  className="rounded-full border border-rev-border bg-rev-surface py-2 pl-9 pr-4 text-sm outline-none focus:border-rev-purple"
                />
              </div>
              <div className="flex gap-2">
                {(["ALL", "Individual", "Merchant"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setKindFilter(value)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold ${
                      kindFilter === value ? "bg-rev-purple text-white" : "bg-rev-shell text-rev-muted"
                    }`}
                  >
                    {value === "ALL" ? "All Accounts" : value}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mb-4 flex items-center justify-between rounded-2xl bg-rev-shell px-4 py-3 text-sm">
            <span className="font-semibold text-rev-ink">{filteredAccounts.length.toLocaleString("en-PK")} accounts</span>
            <span className="text-rev-muted">40% merchant participation</span>
          </div>
          <div className="scrollbar-thin max-h-[720px] space-y-4 overflow-y-auto pr-1">
            {filteredAccounts.map((account) => {
              const utilization = Math.min((account.investedAmount / SAHULAT_LIMIT) * 100, 100);
              const isNonFiler = account.taxStatus === "NON_FILER";
              const taxRate = isNonFiler ? 0.30 : 0.15;
              const wht = account.grossProfit * taxRate;
              const netYield = account.grossProfit - wht;
              const taxLabel = isNonFiler ? "Tax (30% Non-Filer)" : "Tax (15% Filer)";
              const barColor = utilization >= 90
                ? "bg-rose-500"
                : utilization >= 75
                  ? "bg-rev-purple"
                  : "bg-rev-cyan";
              return (
                <div key={account.id} className={`rounded-[24px] border p-4 ${utilization >= 90 ? "border-rose-300 bg-rose-50/40" : "border-rev-border bg-rev-surface"}`}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-bold text-rev-ink">
                          {account.name}
                          {account.kind === "Merchant" ? " (Merchant)" : ""}
                        </p>
                        <StatusBadge status={account.status} />
                        <span className="rounded-full bg-rev-card px-3 py-1 text-xs font-semibold text-rev-muted">
                          {account.tier}
                        </span>
                        {utilization >= 90 ? (
                          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600">
                            Upgrade Required
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-rev-muted">
                        {account.kind} • {isNonFiler ? "Non-Filer" : "Filer"} • {formatCurrency(account.investedAmount)} invested in Sukuks
                      </p>
                    </div>
                    <div className="grid gap-3 text-sm text-rev-ink lg:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-rev-muted">Gross Profit</p>
                        <p className="mt-1 font-semibold">{formatCurrency(account.grossProfit)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-rev-muted">{taxLabel}</p>
                        <p className="mt-1 font-semibold text-orange-600">-{formatCurrency(wht)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-rev-muted">Net Yield</p>
                        <p className="mt-1 font-semibold text-teal-700">{formatCurrency(netYield)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-rev-muted">
                      <span>Sahulat Limit Utilization</span>
                      <span className={utilization >= 90 ? "text-rose-600" : ""}>{utilization.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-rev-card">
                      <div
                        className={`h-3 rounded-full ${barColor}`}
                        style={{ width: `${utilization}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
