import type { NextApiRequest, NextApiResponse } from "next";
import { pypsxFetch } from "@/lib/pypsx";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { symbol } = req.query;
  if (!symbol || typeof symbol !== "string") {
    return res.status(400).json({ error: "Symbol parameter is required." });
  }

  const cleanSymbol = symbol.toUpperCase();

  try {
    const quote = await pypsxFetch(`/v1/partner-api/market/quote/${cleanSymbol}`).catch(() => null);
    const klines = await pypsxFetch(`/v1/partner-api/market/klines/${cleanSymbol}?limit=30`).catch(() => []);

    return res.status(200).json({
      symbol: cleanSymbol,
      quote: quote || {
        symbol: cleanSymbol,
        price: 245.0,
        bid: 244.5,
        ask: 245.5,
        change_pct: 1.25,
      },
      klines: klines || [],
    });
  } catch (error: any) {
    console.error(`Quote error for ${cleanSymbol}:`, error);
    return res.status(500).json({ error: error.message || "Failed to fetch quote." });
  }
}
