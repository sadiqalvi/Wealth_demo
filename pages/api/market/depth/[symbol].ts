import type { NextApiRequest, NextApiResponse } from "next";
import { pypsxFetch, MarketDepthData, DepthEntry } from "@/lib/pypsx";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { symbol, levels } = req.query;
  if (!symbol || typeof symbol !== "string") {
    return res.status(400).json({ error: "Stock symbol is required." });
  }

  const cleanSymbol = symbol.trim().toUpperCase();
  const numLevels = Math.min(Math.max(parseInt(String(levels || "5"), 10) || 5, 1), 20);

  try {
    // 1. Attempt to fetch live Level-2 depth from pyPSX
    const depthRes = await pypsxFetch<MarketDepthData>(
      `/v1/partner-api/market/depth/${cleanSymbol}?levels=${numLevels}`
    ).catch(() => null);

    if (depthRes && Array.isArray(depthRes.bids) && Array.isArray(depthRes.asks)) {
      const topBid = depthRes.bids[0]?.price || 0;
      const topAsk = depthRes.asks[0]?.price || 0;
      const spread = topAsk > 0 && topBid > 0 ? Number((topAsk - topBid).toFixed(2)) : 0;
      const spreadPct = topBid > 0 ? Number(((spread / topBid) * 100).toFixed(2)) : 0;

      return res.status(200).json({
        ...depthRes,
        symbol: cleanSymbol,
        levels: numLevels,
        spread,
        spread_pct: spreadPct,
      });
    }

    // 2. Synthetic Level-2 depth fallback based on latest live quote
    const quoteRes = await pypsxFetch<any>(`/v1/partner-api/market/quote/${cleanSymbol}`).catch(() => null);
    const lastPrice = typeof quoteRes?.last === "number" ? quoteRes.last : typeof quoteRes?.price === "number" ? quoteRes.price : 150.0;
    const baseBid = typeof quoteRes?.bid === "number" && quoteRes.bid > 0 ? quoteRes.bid : Number((lastPrice * 0.998).toFixed(2));
    const baseAsk = typeof quoteRes?.ask === "number" && quoteRes.ask > 0 ? quoteRes.ask : Number((lastPrice * 1.002).toFixed(2));

    const bids: DepthEntry[] = [];
    const asks: DepthEntry[] = [];

    for (let i = 0; i < numLevels; i++) {
      const step = Number((lastPrice * 0.001 * (i + 1)).toFixed(2));
      const bidPrice = Number((baseBid - step).toFixed(2));
      const askPrice = Number((baseAsk + step).toFixed(2));

      bids.push({
        price: bidPrice > 0 ? bidPrice : 1.0,
        qty: Math.floor(100 + ((i + 1) * 350) + (Math.sin(i * 2 + lastPrice) * 100)),
        orders: Math.floor(1 + i * 2),
      });

      asks.push({
        price: askPrice,
        qty: Math.floor(120 + ((i + 1) * 320) + (Math.cos(i * 3 + lastPrice) * 90)),
        orders: Math.floor(1 + i * 2),
      });
    }

    const spread = Number((baseAsk - baseBid).toFixed(2));
    const spreadPct = baseBid > 0 ? Number(((spread / baseBid) * 100).toFixed(2)) : 0;

    return res.status(200).json({
      symbol: cleanSymbol,
      bids,
      asks,
      levels: numLevels,
      is_synthetic: true,
      spread,
      spread_pct: spreadPct,
    });
  } catch (error: any) {
    console.error(`Market Depth API error for ${cleanSymbol}:`, error);
    return res.status(500).json({ error: error.message || "Failed to fetch market depth." });
  }
}
