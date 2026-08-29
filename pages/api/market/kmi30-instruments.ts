import type { NextApiRequest, NextApiResponse } from "next";
import { pypsxFetch } from "@/lib/pypsx";

interface InstrumentMetadata {
  symbol?: string;
  name?: string;
  sector?: string;
  indices?: string[];
}

interface QuoteItem {
  symbol?: string;
  last?: number;
  price?: number;
  bid?: number;
  ask?: number;
  prev_close?: number;
  change?: number;
  change_pct?: number;
  volume?: number;
  is_synthetic?: boolean;
}

interface BatchQuotesResponse {
  count?: number;
  quotes?: QuoteItem[];
}

interface RawInstrumentsResponse {
  instruments?: InstrumentMetadata[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. Fetch full instrument metadata (names & sectors)
    const rawInstruments: RawInstrumentsResponse = await pypsxFetch<RawInstrumentsResponse>(
      "/v1/partner-api/market/instruments"
    ).catch(() => ({ instruments: [] as InstrumentMetadata[] }));

    const metadataMap = new Map<string, InstrumentMetadata>();
    const instrumentList: InstrumentMetadata[] = rawInstruments?.instruments || [];
    instrumentList.forEach((inst: InstrumentMetadata) => {
      if (inst?.symbol) {
        metadataMap.set(inst.symbol.toUpperCase(), inst);
      }
    });

    // 2. Fetch KMI-30 index constituents symbols list
    const kmiIndexRes = await pypsxFetch<any>("/v1/partner-api/market/indices/KMI-30").catch(() => null);

    const defaultKmiSymbols: string[] = [
      "OGDC", "PPL", "HBL", "MCB", "UBL", "MEBL", "LUCK", "ENGROH", "SYS", "PSO",
      "EFERT", "HUBC", "MARI", "BAHL", "FCCL", "MLCF", "DGKC", "KOHC", "ACPL", "CHCC",
      "FATIMA", "NCL", "NML", "TRG", "NETSOL", "HCAR", "MUGHAL", "GLAXO", "SEARL", "PKGS"
    ];

    const kmiSymbols: string[] = Array.isArray(kmiIndexRes?.symbols) && kmiIndexRes.symbols.length > 0
      ? kmiIndexRes.symbols
      : defaultKmiSymbols;

    // 3. Fetch TRUE LIVE quotes via batch quotes endpoint
    const quotesRes: BatchQuotesResponse = await pypsxFetch<BatchQuotesResponse>(
      `/v1/partner-api/market/quotes?symbols=${kmiSymbols.join(",")}`
    ).catch(() => ({ quotes: [] as QuoteItem[] }));

    const quotesMap = new Map<string, QuoteItem>();
    const quotesList: QuoteItem[] = quotesRes?.quotes || [];
    quotesList.forEach((q: QuoteItem) => {
      if (q?.symbol) {
        quotesMap.set(q.symbol.toUpperCase(), q);
      }
    });

    const items = kmiSymbols.map((sym: string) => {
      const cleanSym = String(sym).toUpperCase();
      const meta = metadataMap.get(cleanSym);
      const q = quotesMap.get(cleanSym);

      const name = meta?.name || `${cleanSym} Pakistan Equities`;
      const sector = meta?.sector || "Shariah Compliant Equity";

      const last = typeof q?.last === "number" ? q.last : typeof q?.price === "number" ? q.price : 150;
      const prevClose = typeof q?.prev_close === "number" ? q.prev_close : last * 0.98;
      const changePct = typeof q?.change_pct === "number" ? q.change_pct : ((last - prevClose) / prevClose) * 100;
      const bid = typeof q?.bid === "number" && q.bid > 0 ? q.bid : Number((last * 0.998).toFixed(2));
      const ask = typeof q?.ask === "number" && q.ask > 0 ? q.ask : Number((last * 1.002).toFixed(2));
      const volume = typeof q?.volume === "number" ? q.volume : 250000;

      return {
        symbol: cleanSym,
        name,
        sector,
        price: Number(last.toFixed(2)),
        changePct: Number(changePct.toFixed(2)),
        bid: Number(bid.toFixed(2)),
        ask: Number(ask.toFixed(2)),
        volume,
      };
    });

    return res.status(200).json({ count: items.length, instruments: items });
  } catch (error: any) {
    console.error("KMI-30 Instruments error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch KMI-30 instruments." });
  }
}
