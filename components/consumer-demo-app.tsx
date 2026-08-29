"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import useSWR from "swr";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ShieldCheck,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  User,
  LogOut,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  PieChart,
  BarChart3,
  DollarSign,
  Briefcase,
  Layers,
  Sparkles,
  ArrowLeft,
  Info,
  ShieldAlert,
  FileText,
  Activity,
  Percent,
  Coins,
} from "lucide-react";

interface KmiInstrument {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  changePct: number;
  bid: number;
  ask: number;
  volume: number;
}

interface PortfolioPosition {
  symbol: string;
  asset?: string;
  quantity: number;
  avg_price: number;
  last_price: number;
  market_value: number;
  cost_basis: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
}

interface PortfolioData {
  account_id: string;
  cash: number;
  reserved_cash: number;
  available_cash: number;
  positions_market_value: number;
  equity: number;
  total_unrealized_pnl: number;
  positions: PortfolioPosition[];
  currency: string;
}

interface OrderRecord {
  order_id: string;
  broker_order_id?: string;
  sub_account_id: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price?: number;
  order_type: string;
  order_class?: string;
  status: string;
  avg_fill_price?: number;
  calculated_commission?: number;
  calculated_cgt?: number;
  created_at: string;
}

interface DepthLevel {
  price: number;
  qty: number;
  orders: number;
}

interface MarketDepthData {
  symbol: string;
  bids: DepthLevel[];
  asks: DepthLevel[];
  levels: number;
  is_synthetic: boolean;
  spread: number;
  spread_pct: number;
}

interface PyPsxBrokerConfig {
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

interface UserSession {
  id: string;
  email: string;
  fullName: string;
  cnic?: string;
  phone?: string;
  brokerAccount?: {
    id: string;
    subAccountId: string;
    brokerAccountNumber?: string;
    status: string;
    kycStatus: string;
  };
}

type OrderType = "MARKET" | "LIMIT" | "STOP_LOSS" | "STOP_LIMIT" | "OCO" | "BRACKET";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ConsumerDemoApp({ initialSymbol }: { initialSymbol?: string }) {
  // Auth state
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  // Active view: "watchlist" | "detail" | "portfolio" | "orders"
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string | null>(initialSymbol || null);
  const [mainTab, setMainTab] = useState<"market" | "portfolio" | "history">("market");
  const [searchQuery, setSearchQuery] = useState("");

  // Trading Terminal State
  const [tradeSide, setTradeSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<OrderType>("MARKET");
  const [tradeQty, setTradeQty] = useState<number>(100);
  const [limitPrice, setLimitPrice] = useState<string>("");
  const [stopPrice, setStopPrice] = useState<string>("");
  const [stopLossPrice, setStopLossPrice] = useState<string>("");
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>("");
  const [tradeSubmitting, setTradeSubmitting] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null);

  // Dynamic Broker Config from pyPSX
  const { data: brokerConfig } = useSWR<PyPsxBrokerConfig>("/api/config", fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
  });

  const commissionPct = brokerConfig?.commission_rate !== undefined ? brokerConfig.commission_rate : 0.55;
  const commissionRate = commissionPct / 100; // e.g. 0.55% -> 0.0055
  const defaultStartingBalance = brokerConfig?.default_portfolio_value || 500000;
  const cgtRate = 0.15; // 15% CGT on positive gain

  // SWR Hooks
  const { data: userData, mutate: mutateUser } = useSWR<{ user: UserSession }>("/api/auth/me", fetcher, {
    refreshInterval: 0,
    onError: () => setIsAuthLoading(false),
  });

  const { data: instrumentsData, mutate: mutateInstruments } = useSWR<{
    instruments: KmiInstrument[];
  }>("/api/market/kmi30-instruments", fetcher, { refreshInterval: 2500 });

  const { data: portfolioData, mutate: mutatePortfolio } = useSWR<{
    portfolio: PortfolioData;
  }>(currentUser ? "/api/portfolio" : null, fetcher, { refreshInterval: 2500 });

  const { data: ordersData, mutate: mutateOrders } = useSWR<{
    orders: OrderRecord[];
  }>(currentUser ? "/api/orders" : null, fetcher, { refreshInterval: 2500 });

  // SWR Hook for Market Depth
  const { data: depthData } = useSWR<MarketDepthData>(
    selectedStockSymbol ? `/api/market/depth/${selectedStockSymbol}?levels=5` : null,
    fetcher,
    { refreshInterval: 1500 }
  );

  const autoOnboardUser = useCallback(async () => {
    try {
      const res = await fetch("/api/account/onboard", { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        if (d.brokerAccount) {
          setCurrentUser((prev) => prev ? { ...prev, brokerAccount: d.brokerAccount } : null);
        }
        mutateUser();
        mutatePortfolio();
      }
    } catch (e) {
      console.error("Auto onboard failed", e);
    }
  }, [mutateUser, mutatePortfolio]);

  useEffect(() => {
    if (userData?.user) {
      setCurrentUser(userData.user);
      setIsAuthLoading(false);
      if (!userData.user.brokerAccount) {
        autoOnboardUser();
      }
    } else {
      setIsAuthLoading(false);
    }
  }, [userData, autoOnboardUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, password: passwordInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Login failed");
        return;
      }
      setCurrentUser(data.user);
      setShowAuthModal(false);
      mutateUser();
      mutatePortfolio();
      mutateOrders();
      if (!data.user.brokerAccount) {
        autoOnboardUser();
      }
    } catch (err: any) {
      setAuthError(err.message || "Failed to log in");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          password: passwordInput,
          fullName: nameInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Registration failed");
        return;
      }
      setCurrentUser(data.user);
      setShowAuthModal(false);
      mutateUser();
      mutatePortfolio();
      mutateOrders();
    } catch (err: any) {
      setAuthError(err.message || "Failed to register");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    mutateUser();
    mutatePortfolio();
    mutateOrders();
  };

  // Find currently selected stock object
  const selectedStock = useMemo(() => {
    if (!selectedStockSymbol || !instrumentsData?.instruments) return null;
    return (
      instrumentsData.instruments.find(
        (inst) => inst.symbol.toUpperCase() === selectedStockSymbol.toUpperCase()
      ) || null
    );
  }, [selectedStockSymbol, instrumentsData]);

  // Synchronized Top Bid, Top Ask, and Live Price
  const topBidPrice = useMemo(() => {
    if (depthData?.bids?.[0]?.price) return depthData.bids[0].price;
    return selectedStock?.bid || selectedStock?.price || 0;
  }, [depthData, selectedStock]);

  const topAskPrice = useMemo(() => {
    if (depthData?.asks?.[0]?.price) return depthData.asks[0].price;
    return selectedStock?.ask || selectedStock?.price || 0;
  }, [depthData, selectedStock]);

  const liveStockPrice = useMemo(() => {
    if (depthData?.asks?.[0]?.price) return depthData.asks[0].price;
    if (depthData?.bids?.[0]?.price) return depthData.bids[0].price;
    return selectedStock?.price || 0;
  }, [depthData, selectedStock]);

  // Set default limit price when stock is selected
  useEffect(() => {
    if (selectedStock) {
      const p = liveStockPrice || selectedStock.price;
      setLimitPrice(p.toFixed(2));
      setStopPrice((p * 0.95).toFixed(2));
      setStopLossPrice((p * 0.95).toFixed(2));
      setTakeProfitPrice((p * 1.1).toFixed(2));
    }
  }, [selectedStockSymbol]);

  // Filtered Watchlist Instruments
  const filteredInstruments = useMemo(() => {
    const list = instrumentsData?.instruments || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (inst) =>
        inst.symbol.toLowerCase().includes(q) ||
        inst.name.toLowerCase().includes(q) ||
        inst.sector.toLowerCase().includes(q)
    );
  }, [instrumentsData, searchQuery]);

  // Owned position for selected stock
  const currentStockPosition = useMemo(() => {
    if (!selectedStock || !portfolioData?.portfolio?.positions) return null;
    return (
      portfolioData.portfolio.positions.find(
        (p) => p.symbol.toUpperCase() === selectedStock.symbol.toUpperCase()
      ) || null
    );
  }, [selectedStock, portfolioData]);

  // Calculations for Trade Breakdown
  const estExecutionPrice = useMemo(() => {
    if (!selectedStock) return 0;
    if (orderType === "MARKET") {
      return tradeSide === "BUY" ? topAskPrice : topBidPrice;
    }
    const parsedLimit = parseFloat(limitPrice);
    return !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : liveStockPrice;
  }, [selectedStock, orderType, tradeSide, limitPrice, topAskPrice, topBidPrice, liveStockPrice]);

  const grossNotional = useMemo(() => {
    return Number((estExecutionPrice * (tradeQty || 0)).toFixed(2));
  }, [estExecutionPrice, tradeQty]);

  const commissionFee = useMemo(() => {
    return Number((grossNotional * commissionRate).toFixed(2));
  }, [grossNotional, commissionRate]);

  // BUY Breakdown metrics
  const totalBuyCost = useMemo(() => {
    return Number((grossNotional + commissionFee).toFixed(2));
  }, [grossNotional, commissionFee]);

  const availableCash = portfolioData?.portfolio?.available_cash ?? defaultStartingBalance;
  const remainingCashAfterBuy = useMemo(() => {
    return Number((availableCash - totalBuyCost).toFixed(2));
  }, [availableCash, totalBuyCost]);

  const isBuyMarginExceeded = useMemo(() => {
    return tradeSide === "BUY" && totalBuyCost > availableCash;
  }, [tradeSide, totalBuyCost, availableCash]);

  // SELL Breakdown metrics
  const ownedQuantity = currentStockPosition?.quantity || 0;
  const avgCostBasis = currentStockPosition?.avg_price || estExecutionPrice;
  const costBasisSold = useMemo(() => {
    return Number((avgCostBasis * (tradeQty || 0)).toFixed(2));
  }, [avgCostBasis, tradeQty]);

  const realizedCapitalGain = useMemo(() => {
    return Number((grossNotional - costBasisSold).toFixed(2));
  }, [grossNotional, costBasisSold]);

  const cgtFee = useMemo(() => {
    if (realizedCapitalGain <= 0) return 0;
    return Number((realizedCapitalGain * cgtRate).toFixed(2));
  }, [realizedCapitalGain, cgtRate]);

  const netSellProceeds = useMemo(() => {
    return Number((grossNotional - commissionFee - cgtFee).toFixed(2));
  }, [grossNotional, commissionFee, cgtFee]);

  const projectedCashAfterSell = useMemo(() => {
    return Number((availableCash + netSellProceeds).toFixed(2));
  }, [availableCash, netSellProceeds]);

  const isSellExceedsOwned = useMemo(() => {
    return tradeSide === "SELL" && tradeQty > ownedQuantity;
  }, [tradeSide, tradeQty, ownedQuantity]);

  // Portfolio Totals & Statistics
  const portfolioSummary = useMemo(() => {
    const positions = portfolioData?.portfolio?.positions || [];
    const totalInvestedCost = positions.reduce((acc, p) => acc + (p.cost_basis || (p.quantity * p.avg_price)), 0);
    const totalMarketValue = positions.reduce((acc, p) => acc + (p.market_value || (p.quantity * p.last_price)), 0);
    const totalUnrealizedPnl = positions.reduce((acc, p) => acc + (p.unrealized_pnl || 0), 0);
    const totalPnlPct = totalInvestedCost > 0 ? (totalUnrealizedPnl / totalInvestedCost) * 100 : 0;
    return {
      totalInvestedCost,
      totalMarketValue,
      totalUnrealizedPnl,
      totalPnlPct,
      count: positions.length,
    };
  }, [portfolioData]);

  // Execute Order Handler
  const handleExecuteTrade = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    if (!currentUser.brokerAccount) {
      try {
        const onboardRes = await fetch("/api/account/onboard", { method: "POST" });
        if (onboardRes.ok) {
          const obData = await onboardRes.json();
          if (obData.brokerAccount) {
            setCurrentUser((prev) => prev ? { ...prev, brokerAccount: obData.brokerAccount } : null);
          }
          mutateUser();
        } else {
          setShowAuthModal(true);
          return;
        }
      } catch (e) {
        setShowAuthModal(true);
        return;
      }
    }

    if (!selectedStock) return;
    if (tradeQty <= 0) {
      setTradeError("Please specify a quantity greater than 0.");
      return;
    }
    if (tradeSide === "BUY" && isBuyMarginExceeded) {
      setTradeError("Insufficient cash balance to place this buy order.");
      return;
    }
    if (tradeSide === "SELL" && isSellExceedsOwned) {
      setTradeError(`You cannot sell more than the ${ownedQuantity} shares you currently own.`);
      return;
    }

    setTradeSubmitting(true);
    setTradeError(null);
    setTradeSuccess(null);

    try {
      let pypsxOrderType: string = "MARKET";
      let pypsxOrderClass: string = "SIMPLE";

      if (orderType === "LIMIT") {
        pypsxOrderType = "LIMIT";
      } else if (orderType === "STOP_LOSS") {
        pypsxOrderType = "STOP_LOSS";
      } else if (orderType === "STOP_LIMIT") {
        pypsxOrderType = "STOP_LIMIT";
      } else if (orderType === "OCO") {
        pypsxOrderType = "LIMIT";
        pypsxOrderClass = "OCO";
      } else if (orderType === "BRACKET") {
        pypsxOrderType = "LIMIT";
        pypsxOrderClass = "BRACKET";
      }

      const payload: Record<string, any> = {
        symbol: selectedStock.symbol,
        side: tradeSide,
        quantity: tradeQty,
        order_type: pypsxOrderType,
        order_class: pypsxOrderClass,
        price: estExecutionPrice,
      };

      if (["LIMIT", "STOP_LIMIT", "OCO", "BRACKET"].includes(orderType) && limitPrice) {
        payload.price = parseFloat(limitPrice);
      }
      if (["STOP_LOSS", "STOP_LIMIT"].includes(orderType) && stopPrice) {
        payload.stop_price = parseFloat(stopPrice);
      }
      if (["OCO", "BRACKET"].includes(orderType)) {
        if (stopLossPrice) payload.stop_loss_price = parseFloat(stopLossPrice);
        if (takeProfitPrice) payload.take_profit_price = parseFloat(takeProfitPrice);
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setTradeError(data.message || data.error || "Order execution failed.");
        return;
      }

      const ord = data.order;
      setTradeSuccess(
        `Successfully submitted ${tradeSide} ${tradeQty} ${selectedStock.symbol} (${orderType})! Status: ${ord.status}`
      );
      mutatePortfolio();
      mutateOrders();
      mutateInstruments();
    } catch (err: any) {
      setTradeError(err.message || "Failed to submit order.");
    } finally {
      setTradeSubmitting(false);
    }
  };

  // Max quantities helper for depth visualizer
  const maxDepthQty = useMemo(() => {
    if (!depthData) return 1000;
    const bidMax = Math.max(...(depthData.bids || []).map((b) => b.qty), 100);
    const askMax = Math.max(...(depthData.asks || []).map((a) => a.qty), 100);
    return Math.max(bidMax, askMax, 500);
  }, [depthData]);

  return (
    <div className="min-h-screen bg-[#07070D] text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0A0A14]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              onClick={() => setSelectedStockSymbol(null)}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                  PSX KMI-30
                </span>
                <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold tracking-wider uppercase">
                  Paper Trading
                </span>
              </div>
            </div>
          </div>

          {/* Broker Live Config Indicators & User Status */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Percent className="w-3 h-3 text-indigo-400" /> Comm: <strong className="text-slate-200">{commissionPct}%</strong>
              </span>
              <span className="text-slate-700">|</span>
              <span className="flex items-center gap-1">
                <Coins className="w-3 h-3 text-emerald-400" /> Start: <strong className="text-slate-200">PKR {defaultStartingBalance.toLocaleString()}</strong>
              </span>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end text-right">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-200">{currentUser.fullName}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <span className="text-[11px] font-mono text-indigo-400">
                    {currentUser.brokerAccount?.brokerAccountNumber || "Sandbox Account"}
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-800 hidden sm:block" />
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">Available Cash</span>
                  <span className="text-xs font-bold font-mono text-emerald-400">
                    PKR {(portfolioData?.portfolio?.available_cash ?? defaultStartingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setShowAuthModal(true);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white transition"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setAuthMode("register");
                    setShowAuthModal(true);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-600/20 transition"
                >
                  Sign Up (PKR {defaultStartingBalance.toLocaleString()})
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Summary Bar */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/80 border border-slate-800/80 backdrop-blur-md shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-indigo-400" /> Total Equity
              </span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                PKR {(portfolioData?.portfolio?.equity ?? defaultStartingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-indigo-400" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/80 border border-slate-800/80 backdrop-blur-md shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-emerald-400" /> Portfolio Holdings
              </span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                PKR {(portfolioData?.portfolio?.positions_market_value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/80 border border-slate-800/80 backdrop-blur-md shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-violet-400" /> Total Unrealized P&L
              </span>
              <div className={`text-xl font-bold font-mono mt-1 ${(portfolioData?.portfolio?.total_unrealized_pnl ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {(portfolioData?.portfolio?.total_unrealized_pnl ?? 0) >= 0 ? "+" : ""}
                PKR {(portfolioData?.portfolio?.total_unrealized_pnl ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              {(portfolioData?.portfolio?.total_unrealized_pnl ?? 0) >= 0 ? (
                <ArrowUpRight className="w-5 h-5 text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-rose-400" />
              )}
            </div>
          </div>
        </section>

        {/* View Switcher: DETAIL VIEW vs WATCHLIST / PORTFOLIO / ORDERS */}
        {selectedStock ? (
          /* ========================================================================= */
          /*                       DETAILED STOCK & TRADING PAGE                       */
          /* ========================================================================= */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Back Button & Stock Title Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0D0D1A] border border-slate-800 shadow-xl">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedStockSymbol(null)}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition flex items-center gap-2 text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Universe</span>
                </button>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-black tracking-tight text-white">{selectedStock.symbol}</h1>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                      {selectedStock.sector}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> KMI-30 Shariah
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedStock.name}</p>
                </div>
              </div>

              {/* Price & Movement Display */}
              <div className="flex items-center gap-6 sm:text-right">
                <div>
                  <div className="text-2xl font-black font-mono text-white">
                    PKR {liveStockPrice.toFixed(2)}
                  </div>
                  <div className={`flex items-center sm:justify-end gap-1.5 text-xs font-bold ${selectedStock.changePct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {selectedStock.changePct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>{selectedStock.changePct >= 0 ? "+" : ""}{selectedStock.changePct.toFixed(2)}%</span>
                    <span className="text-slate-500 font-normal">Today</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Trading & Market Depth Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Market Depth (Level-2 Order Book) & Quick Stats (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Level-2 Order Book Card */}
                <div className="p-5 rounded-2xl bg-[#0D0D1A] border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Level-2 Market Depth</h2>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <span>Spread: <strong className="text-slate-200">PKR {depthData?.spread?.toFixed(2) || (Math.max(0, topAskPrice - topBidPrice)).toFixed(2)}</strong></span>
                    </div>
                  </div>

                  {/* Order Book Depth Table */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {/* BIDS Column */}
                    <div className="space-y-1.5 bg-emerald-950/10 p-3 rounded-xl border border-emerald-500/10">
                      <div className="flex justify-between font-mono text-[10px] text-slate-400 uppercase border-b border-slate-800/80 pb-1 mb-1">
                        <span>Orders / Qty</span>
                        <span>Bid Price</span>
                      </div>
                      {(depthData?.bids || []).map((bid, idx) => (
                        <div key={`bid-${idx}`} className="relative flex justify-between items-center py-1 px-1.5 rounded overflow-hidden">
                          {/* Depth Bar visual */}
                          <div
                            className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 rounded pointer-events-none transition-all duration-300"
                            style={{ width: `${Math.min((bid.qty / maxDepthQty) * 100, 100)}%` }}
                          />
                          <span className="font-mono text-slate-300 text-[11px] z-10">
                            {bid.qty.toLocaleString()} <span className="text-slate-500 text-[10px]">({bid.orders})</span>
                          </span>
                          <span className="font-mono font-bold text-emerald-400 text-[11px] z-10">
                            {bid.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* ASKS Column */}
                    <div className="space-y-1.5 bg-rose-950/10 p-3 rounded-xl border border-rose-500/10">
                      <div className="flex justify-between font-mono text-[10px] text-slate-400 uppercase border-b border-slate-800/80 pb-1 mb-1">
                        <span>Ask Price</span>
                        <span>Qty / Orders</span>
                      </div>
                      {(depthData?.asks || []).map((ask, idx) => (
                        <div key={`ask-${idx}`} className="relative flex justify-between items-center py-1 px-1.5 rounded overflow-hidden">
                          {/* Depth Bar visual */}
                          <div
                            className="absolute left-0 top-0 bottom-0 bg-rose-500/15 rounded pointer-events-none transition-all duration-300"
                            style={{ width: `${Math.min((ask.qty / maxDepthQty) * 100, 100)}%` }}
                          />
                          <span className="font-mono font-bold text-rose-400 text-[11px] z-10">
                            {ask.price.toFixed(2)}
                          </span>
                          <span className="font-mono text-slate-300 text-[11px] z-10">
                            {ask.qty.toLocaleString()} <span className="text-slate-500 text-[10px]">({ask.orders})</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stock Metrics Row - Exact Live Top Bid / Top Ask */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-center">
                    <div className="p-2 rounded-lg bg-slate-900/50">
                      <span className="text-[10px] text-slate-500 uppercase">Top Bid</span>
                      <div className="text-xs font-bold font-mono text-emerald-400">PKR {topBidPrice.toFixed(2)}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/50">
                      <span className="text-[10px] text-slate-500 uppercase">Top Ask</span>
                      <div className="text-xs font-bold font-mono text-rose-400">PKR {topAskPrice.toFixed(2)}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/50">
                      <span className="text-[10px] text-slate-500 uppercase">24h Vol</span>
                      <div className="text-xs font-bold font-mono text-slate-200">{selectedStock.volume.toLocaleString()}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/50">
                      <span className="text-[10px] text-slate-500 uppercase">Sector</span>
                      <div className="text-xs font-bold text-indigo-400 truncate">{selectedStock.sector}</div>
                    </div>
                  </div>
                </div>

                {/* User's Position in this Stock */}
                <div className="p-5 rounded-2xl bg-[#0D0D1A] border border-slate-800 shadow-xl space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" /> Your Position in {selectedStock.symbol}
                  </h3>
                  {currentStockPosition && currentStockPosition.quantity > 0 ? (
                    <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase">Shares Owned</span>
                        <div className="text-sm font-bold font-mono text-white">{currentStockPosition.quantity.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase">Avg Cost Basis</span>
                        <div className="text-sm font-bold font-mono text-slate-300">PKR {currentStockPosition.avg_price.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase">Unrealized P&L</span>
                        <div className={`text-sm font-bold font-mono ${currentStockPosition.unrealized_pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {currentStockPosition.unrealized_pnl >= 0 ? "+" : ""}PKR {currentStockPosition.unrealized_pnl.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                      You currently hold 0 shares of {selectedStock.symbol}.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Advanced Order Placement Terminal & Live Breakdown (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="p-6 rounded-2xl bg-[#0D0D1A] border border-slate-800 shadow-2xl space-y-5">
                  {/* BUY / SELL Action Tabs */}
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
                    <button
                      onClick={() => {
                        setTradeSide("BUY");
                        setTradeError(null);
                        setTradeSuccess(null);
                      }}
                      className={`py-2.5 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${
                        tradeSide === "BUY"
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" /> BUY {selectedStock.symbol}
                    </button>
                    <button
                      onClick={() => {
                        setTradeSide("SELL");
                        setTradeError(null);
                        setTradeSuccess(null);
                      }}
                      className={`py-2.5 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${
                        tradeSide === "SELL"
                          ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <ArrowDownRight className="w-4 h-4" /> SELL {selectedStock.symbol}
                    </button>
                  </div>

                  {/* Order Type Selector */}
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      Order Type
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      {(["MARKET", "LIMIT", "STOP_LOSS", "STOP_LIMIT", "OCO", "BRACKET"] as OrderType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => setOrderType(type)}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition ${
                            orderType === type
                              ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm"
                              : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                          }`}
                        >
                          {type.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Inputs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Shares Quantity */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-300">Quantity (Shares)</label>
                        {tradeSide === "SELL" && (
                          <span className="text-[11px] text-slate-400">
                            Owned: <strong className="text-indigo-400">{ownedQuantity}</strong>
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={tradeQty || ""}
                        onChange={(e) => setTradeQty(parseInt(e.target.value, 10) || 0)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white font-mono text-sm outline-none transition"
                        placeholder="e.g. 100"
                      />
                      {/* Quantity Quick Presets */}
                      <div className="flex gap-1.5 mt-2">
                        {tradeSide === "BUY" ? (
                          [10, 50, 100, 500].map((amt) => (
                            <button
                              key={`buy-preset-${amt}`}
                              type="button"
                              onClick={() => setTradeQty(amt)}
                              className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-white hover:border-slate-700 transition"
                            >
                              +{amt}
                            </button>
                          ))
                        ) : (
                          [0.25, 0.5, 0.75, 1.0].map((pct) => (
                            <button
                              key={`sell-preset-${pct}`}
                              type="button"
                              onClick={() => setTradeQty(Math.floor(ownedQuantity * pct))}
                              className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-white hover:border-slate-700 transition"
                            >
                              {pct === 1.0 ? "100% (Max)" : `${pct * 100}%`}
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Limit Price Input */}
                    {["LIMIT", "STOP_LIMIT", "OCO", "BRACKET"].includes(orderType) && (
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1.5">Limit Price (PKR)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={limitPrice}
                          onChange={(e) => setLimitPrice(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white font-mono text-sm outline-none transition"
                          placeholder="e.g. 330.00"
                        />
                      </div>
                    )}

                    {/* Stop Trigger Price */}
                    {["STOP_LOSS", "STOP_LIMIT"].includes(orderType) && (
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1.5">Stop Trigger Price (PKR)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={stopPrice}
                          onChange={(e) => setStopPrice(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white font-mono text-sm outline-none transition"
                          placeholder="e.g. 315.00"
                        />
                      </div>
                    )}

                    {/* Stop Loss Target (OCO / BRACKET) */}
                    {["OCO", "BRACKET"].includes(orderType) && (
                      <div>
                        <label className="text-xs font-semibold text-rose-300 block mb-1.5">Stop Loss Exit (PKR)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={stopLossPrice}
                          onChange={(e) => setStopLossPrice(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-white font-mono text-sm outline-none transition"
                          placeholder="e.g. 310.00"
                        />
                      </div>
                    )}

                    {/* Take Profit Target (OCO / BRACKET) */}
                    {["OCO", "BRACKET"].includes(orderType) && (
                      <div>
                        <label className="text-xs font-semibold text-emerald-300 block mb-1.5">Take Profit Target (PKR)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={takeProfitPrice}
                          onChange={(e) => setTakeProfitPrice(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white font-mono text-sm outline-none transition"
                          placeholder="e.g. 360.00"
                        />
                      </div>
                    )}
                  </div>

                  {/* ========================================================================= */}
                  {/*               LIVE COST / COMMISSION / CGT TAX BREAKDOWN                  */}
                  {/* ========================================================================= */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        {tradeSide === "BUY" ? "Buy Order Cost Breakdown" : "Sell Order Proceeds & Tax Breakdown"}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        Price: PKR {estExecutionPrice.toFixed(2)} / share
                      </span>
                    </div>

                    {tradeSide === "BUY" ? (
                      /* BUY BREAKDOWN */
                      <div className="space-y-1.5 font-mono">
                        <div className="flex justify-between text-slate-400">
                          <span>Gross Notional ({tradeQty} shares × PKR {estExecutionPrice.toFixed(2)})</span>
                          <span className="text-white">PKR {grossNotional.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span className="flex items-center gap-1">
                            Broker Commission ({commissionPct}%)
                            <Info className="w-3 h-3 text-slate-500" />
                          </span>
                          <span className="text-indigo-400">+PKR {commissionFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="h-px bg-slate-800 my-1" />
                        <div className="flex justify-between text-sm font-bold">
                          <span className="text-slate-200">Total Estimated Cost of Buying</span>
                          <span className="text-white">PKR {totalBuyCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                          <span>Available Cash</span>
                          <span className="text-emerald-400">PKR {availableCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Projected Balance After Trade</span>
                          <span className={remainingCashAfterBuy >= 0 ? "text-slate-200" : "text-rose-400 font-bold"}>
                            PKR {remainingCashAfterBuy.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {isBuyMarginExceeded && (
                          <div className="mt-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                            <span>Margin Guard: Order cost exceeds your available cash balance.</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* SELL BREAKDOWN */
                      <div className="space-y-1.5 font-mono">
                        <div className="flex justify-between text-slate-400">
                          <span>Gross Sale Proceeds ({tradeQty} shares × PKR {estExecutionPrice.toFixed(2)})</span>
                          <span className="text-white">PKR {grossNotional.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span className="flex items-center gap-1">
                            Broker Commission ({commissionPct}%)
                            <Info className="w-3 h-3 text-slate-500" />
                          </span>
                          <span className="text-rose-400">-PKR {commissionFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Cost Basis on Sold Shares (Avg: PKR {avgCostBasis.toFixed(2)})</span>
                          <span className="text-slate-300">PKR {costBasisSold.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Realized Capital Gain / Profit</span>
                          <span className={realizedCapitalGain >= 0 ? "text-emerald-400" : "text-rose-400"}>
                            {realizedCapitalGain >= 0 ? "+" : ""}PKR {realizedCapitalGain.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span className="flex items-center gap-1">
                            Capital Gains Tax (CGT @ 15% on profit)
                            <Info className="w-3 h-3 text-slate-500" />
                          </span>
                          <span className={cgtFee > 0 ? "text-rose-400 font-bold" : "text-slate-500"}>
                            -PKR {cgtFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="h-px bg-slate-800 my-1" />
                        <div className="flex justify-between text-sm font-bold">
                          <span className="text-slate-200">Net Estimated Proceeds Credited</span>
                          <span className="text-emerald-400">PKR {netSellProceeds.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                          <span>Projected Cash Balance</span>
                          <span className="text-slate-200">PKR {projectedCashAfterSell.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        {isSellExceedsOwned && (
                          <div className="mt-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                            <span>Insufficient Shares: You only own {ownedQuantity} shares of {selectedStock.symbol}.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Feedback Banners */}
                  {tradeError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{tradeError}</span>
                    </div>
                  )}
                  {tradeSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>{tradeSuccess}</span>
                    </div>
                  )}

                  {/* Submit Order Button */}
                  <button
                    onClick={handleExecuteTrade}
                    disabled={tradeSubmitting || isBuyMarginExceeded || isSellExceedsOwned}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-xl transition flex items-center justify-center gap-2 ${
                      tradeSide === "BUY"
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 disabled:opacity-40"
                        : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 disabled:opacity-40"
                    }`}
                  >
                    {tradeSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Submitting Order to pyPSX...
                      </>
                    ) : (
                      <>
                        {tradeSide === "BUY" ? `Submit BUY Order (PKR ${totalBuyCost.toLocaleString()})` : `Submit SELL Order (${tradeQty} shares)`}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /*            FRONT PAGE TABS: WATCHLIST | PORTFOLIO | ORDER LOG             */
          /* ========================================================================= */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Navigation Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex gap-2 p-1 rounded-xl bg-[#0D0D1A] border border-slate-800 w-fit">
                <button
                  onClick={() => setMainTab("market")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                    mainTab === "market" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> KMI-30 Watchlist
                </button>
                <button
                  onClick={() => setMainTab("portfolio")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                    mainTab === "portfolio" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <PieChart className="w-3.5 h-3.5" /> Portfolio ({portfolioSummary.count})
                </button>
                <button
                  onClick={() => setMainTab("history")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                    mainTab === "history" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> Order Log ({ordersData?.orders?.length || 0})
                </button>
              </div>

              {/* Search Bar */}
              {mainTab === "market" && (
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search stock symbol or name..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0D0D1A] border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 outline-none transition"
                  />
                </div>
              )}
            </div>

            {/* TAB CONTENT: WATCHLIST */}
            {mainTab === "market" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Showing {filteredInstruments.length} Shariah-Compliant KMI-30 Equities</span>
                  <span className="text-[11px] text-indigo-400">Click any stock to view Level-2 Market Depth & Trade</span>
                </div>

                {/* Minimalist Stock Watchlist Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredInstruments.map((stock) => {
                    const isPositive = stock.changePct >= 0;
                    return (
                      <div
                        key={stock.symbol}
                        onClick={() => setSelectedStockSymbol(stock.symbol)}
                        className="p-4 rounded-2xl bg-[#0D0D1A] border border-slate-800/80 hover:border-indigo-500/50 hover:bg-[#121224] transition-all cursor-pointer group shadow-lg flex items-center justify-between"
                      >
                        {/* Left: Stock Symbol & Company Name */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-base text-white group-hover:text-indigo-300 transition-colors">
                              {stock.symbol}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                              {stock.sector}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 truncate max-w-[180px] sm:max-w-[200px]">
                            {stock.name}
                          </p>
                        </div>

                        {/* Right: Last Price & Movement Badge */}
                        <div className="text-right space-y-1">
                          <div className="text-sm font-bold font-mono text-white">
                            PKR {stock.price.toFixed(2)}
                          </div>
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold font-mono ${
                              isPositive
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            <span>{isPositive ? "+" : ""}{stock.changePct.toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT: PORTFOLIO */}
            {mainTab === "portfolio" && (
              <div className="space-y-6">
                {/* Portfolio Summary Analytics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#0D0D1A] border border-slate-800 shadow-xl">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Total Market Value</span>
                    <div className="text-base font-bold font-mono text-white mt-0.5">
                      Rs. {portfolioSummary.totalMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Total Invested Cost</span>
                    <div className="text-base font-bold font-mono text-slate-300 mt-0.5">
                      Rs. {portfolioSummary.totalInvestedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Unrealized P/L (Rs.)</span>
                    <div className={`text-base font-bold font-mono mt-0.5 ${portfolioSummary.totalUnrealizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {portfolioSummary.totalUnrealizedPnl >= 0 ? "+" : ""}
                      Rs. {portfolioSummary.totalUnrealizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Unrealized Return (%)</span>
                    <div className={`text-base font-bold font-mono mt-0.5 ${portfolioSummary.totalPnlPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {portfolioSummary.totalPnlPct >= 0 ? "+" : ""}{portfolioSummary.totalPnlPct.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Portfolio Holdings Table */}
                <div className="p-6 rounded-2xl bg-[#0D0D1A] border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-indigo-400" /> Owned Stock Portfolio
                    </h2>
                    <span className="text-xs font-mono text-slate-400">
                      {portfolioSummary.count} {portfolioSummary.count === 1 ? "Asset" : "Assets"} in Holding
                    </span>
                  </div>

                  {(portfolioData?.portfolio?.positions || []).length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-mono">
                            <th className="pb-3 font-semibold">Asset</th>
                            <th className="pb-3 font-semibold text-right">Avg Cost</th>
                            <th className="pb-3 font-semibold text-right">Current Price</th>
                            <th className="pb-3 font-semibold text-right">Qty</th>
                            <th className="pb-3 font-semibold text-right">Market Value</th>
                            <th className="pb-3 font-semibold text-right">Unrealized P/L (Rs.)</th>
                            <th className="pb-3 font-semibold text-right">Unrealized P/L (%)</th>
                            <th className="pb-3 font-semibold text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                          {portfolioData?.portfolio?.positions.map((pos) => {
                            const assetSymbol = (pos.asset || pos.symbol || "").toUpperCase();
                            const isGain = (pos.unrealized_pnl ?? 0) >= 0;
                            return (
                              <tr key={assetSymbol} className="hover:bg-slate-900/50 transition">
                                {/* Asset */}
                                <td className="py-3.5 font-sans">
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-sm text-white">{assetSymbol}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                                      KMI-30
                                    </span>
                                  </div>
                                </td>

                                {/* Avg Cost */}
                                <td className="py-3.5 text-right text-slate-300">
                                  Rs. {pos.avg_price.toFixed(2)}
                                </td>

                                {/* Current Price */}
                                <td className="py-3.5 text-right font-bold text-white">
                                  Rs. {pos.last_price.toFixed(2)}
                                </td>

                                {/* Qty */}
                                <td className="py-3.5 text-right text-slate-200">
                                  {pos.quantity.toLocaleString()}
                                </td>

                                {/* Market Value */}
                                <td className="py-3.5 text-right font-bold text-white">
                                  Rs. {pos.market_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>

                                {/* Unrealized P/L (Rs.) */}
                                <td className={`py-3.5 text-right font-bold ${isGain ? "text-emerald-400" : "text-rose-400"}`}>
                                  {isGain ? "+" : ""}Rs. {pos.unrealized_pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>

                                {/* Unrealized P/L (%) */}
                                <td className="py-3.5 text-right">
                                  <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                                    isGain
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  }`}>
                                    {isGain ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    <span>{isGain ? "+" : ""}{pos.unrealized_pnl_pct.toFixed(2)}%</span>
                                  </span>
                                </td>

                                {/* Action */}
                                <td className="py-3.5 text-center font-sans">
                                  <button
                                    onClick={() => setSelectedStockSymbol(assetSymbol)}
                                    className="px-3 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600 hover:text-white transition text-xs font-semibold"
                                  >
                                    Trade {assetSymbol}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-14 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                        <Briefcase className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        You currently hold no open stock positions in your paper trading account.
                      </p>
                      <button
                        onClick={() => setMainTab("market")}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition"
                      >
                        Explore KMI-30 Watchlist
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: ORDER LOG */}
            {mainTab === "history" && (
              <div className="p-6 rounded-2xl bg-[#0D0D1A] border border-slate-800 shadow-xl space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" /> Executed & Pending Orders
                </h2>
                {(ordersData?.orders || []).length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-mono">
                          <th className="pb-3 font-semibold">Order ID</th>
                          <th className="pb-3 font-semibold">Time</th>
                          <th className="pb-3 font-semibold">Symbol</th>
                          <th className="pb-3 font-semibold">Side</th>
                          <th className="pb-3 font-semibold">Type</th>
                          <th className="pb-3 font-semibold">Qty</th>
                          <th className="pb-3 font-semibold">Fill / Limit</th>
                          <th className="pb-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {ordersData?.orders.map((ord) => (
                          <tr key={ord.order_id} className="hover:bg-slate-900/40 transition">
                            <td className="py-3 text-slate-400 font-mono">{ord.order_id.substring(0, 10)}...</td>
                            <td className="py-3 text-slate-400">{new Date(ord.created_at).toLocaleTimeString()}</td>
                            <td className="py-3 font-bold text-white">{ord.symbol}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ord.side === "BUY" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                                {ord.side}
                              </span>
                            </td>
                            <td className="py-3 text-slate-300">{ord.order_type}</td>
                            <td className="py-3">{ord.quantity}</td>
                            <td className="py-3 text-white">PKR {(ord.avg_fill_price || ord.price || 0).toFixed(2)}</td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400">
                                {ord.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No orders executed yet.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#0F0F1E] border border-slate-800 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h2 className="text-xl font-bold text-white">
                {authMode === "login" ? "Sign In to Your Account" : "Create Paper Trading Account"}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {authMode === "login"
                  ? "Enter your credentials to access your sandbox portfolio."
                  : `Sign up instantly and get PKR ${defaultStartingBalance.toLocaleString()} auto-funded paper balance.`}
              </p>
            </div>

            <form onSubmit={authMode === "login" ? handleLogin : handleRegister} className="space-y-4">
              {authMode === "register" && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="e.g. Sadiq Alvi"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none transition"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@example.pk"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none transition"
                />
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition"
              >
                {authMode === "login" ? "Sign In" : `Register & Start Trading (PKR ${defaultStartingBalance.toLocaleString()})`}
              </button>
            </form>

            <div className="text-center text-xs text-slate-400 border-t border-slate-800/80 pt-3">
              {authMode === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => {
                      setAuthMode("register");
                      setAuthError(null);
                    }}
                    className="text-indigo-400 hover:underline font-semibold"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already registered?{" "}
                  <button
                    onClick={() => {
                      setAuthMode("login");
                      setAuthError(null);
                    }}
                    className="text-indigo-400 hover:underline font-semibold"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
