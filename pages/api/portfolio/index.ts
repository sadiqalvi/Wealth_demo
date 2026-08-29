import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { pypsxFetch, PyPsxPortfolio, getPypsxConfig } from "@/lib/pypsx";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await db.user.findUnique({
      where: { id: auth.userId },
      include: { brokerAccount: true },
    });

    const brokerConfig = await getPypsxConfig();
    const defaultCash = brokerConfig?.default_portfolio_value || 500000;

    if (!user || !user.brokerAccount) {
      return res.status(200).json({
        portfolio: {
          account_id: "",
          cash: defaultCash,
          reserved_cash: 0,
          available_cash: defaultCash,
          positions_market_value: 0,
          equity: defaultCash,
          total_unrealized_pnl: 0,
          positions: [],
          currency: brokerConfig?.currency || "PKR",
        },
      });
    }

    const subAccountId = user.brokerAccount.subAccountId;
    const portfolioRes = await pypsxFetch<any>(
      `/v1/partner-api/accounts/${subAccountId}/portfolio`
    );

    // Normalize positions array
    let rawPositions = portfolioRes?.positions || [];
    let normalizedPositions: any[] = [];

    if (Array.isArray(rawPositions)) {
      normalizedPositions = rawPositions.map((p) => {
        const qty = Number(p.quantity ?? p.qty ?? 0);
        const avgPrice = Number(p.avg_price ?? p.average_price ?? p.cost_per_share ?? 0);
        const lastPrice = Number(p.last_price ?? p.current_price ?? p.price ?? avgPrice);
        const marketVal = Number((p.market_value ?? (qty * lastPrice)).toFixed(2));
        const costBasis = Number((p.cost_basis ?? (qty * avgPrice)).toFixed(2));
        const pnl = Number((p.unrealized_pnl ?? (marketVal - costBasis)).toFixed(2));
        const pnlPct = costBasis > 0 ? Number(((pnl / costBasis) * 100).toFixed(2)) : 0;

        return {
          symbol: String(p.symbol || p.asset || "").toUpperCase(),
          asset: String(p.symbol || p.asset || "").toUpperCase(),
          quantity: qty,
          avg_price: avgPrice,
          last_price: lastPrice,
          market_value: marketVal,
          cost_basis: costBasis,
          unrealized_pnl: pnl,
          unrealized_pnl_pct: pnlPct,
        };
      });
    } else if (typeof rawPositions === "object" && rawPositions !== null) {
      // In case positions is a map of symbol -> { qty, avg_price } or symbol -> qty
      normalizedPositions = Object.entries(rawPositions).map(([sym, val]: [string, any]) => {
        const qty = typeof val === "number" ? val : Number(val?.quantity ?? val?.qty ?? 0);
        const avgPrice = typeof val === "number" ? 0 : Number(val?.avg_price ?? val?.average_price ?? 0);
        const lastPrice = typeof val === "number" ? 0 : Number(val?.last_price ?? avgPrice);
        const marketVal = Number((qty * lastPrice).toFixed(2));
        const costBasis = Number((qty * avgPrice).toFixed(2));
        const pnl = Number((marketVal - costBasis).toFixed(2));
        const pnlPct = costBasis > 0 ? Number(((pnl / costBasis) * 100).toFixed(2)) : 0;

        return {
          symbol: sym.toUpperCase(),
          asset: sym.toUpperCase(),
          quantity: qty,
          avg_price: avgPrice,
          last_price: lastPrice,
          market_value: marketVal,
          cost_basis: costBasis,
          unrealized_pnl: pnl,
          unrealized_pnl_pct: pnlPct,
        };
      });
    }

    const portfolio: PyPsxPortfolio = {
      account_id: portfolioRes?.account_id || subAccountId,
      cash: Number(portfolioRes?.cash ?? defaultCash),
      reserved_cash: Number(portfolioRes?.reserved_cash ?? 0),
      available_cash: Number(portfolioRes?.available_cash ?? portfolioRes?.cash ?? defaultCash),
      positions_market_value: Number(portfolioRes?.positions_market_value ?? 0),
      equity: Number(portfolioRes?.equity ?? defaultCash),
      total_unrealized_pnl: Number(portfolioRes?.total_unrealized_pnl ?? 0),
      positions: normalizedPositions,
      currency: portfolioRes?.currency || brokerConfig?.currency || "PKR",
    };

    return res.status(200).json({ portfolio });
  } catch (error: any) {
    console.error("GET portfolio error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch portfolio." });
  }
}
