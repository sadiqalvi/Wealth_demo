import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { pypsxFetch, PyPsxOrderResponse, PyPsxPortfolio, getPypsxConfig } from "@/lib/pypsx";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = getAuthUser(req);
  if (!auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await db.user.findUnique({
    where: { id: auth.userId },
    include: { brokerAccount: true },
  });

  if (!user || !user.brokerAccount) {
    return res.status(400).json({ error: "Broker account non-existent or onboard required." });
  }

  const subAccountId = user.brokerAccount.subAccountId;

  if (req.method === "GET") {
    try {
      const ordersRes = await pypsxFetch<{ orders?: any[] } | any[]>(
        `/v1/partner-api/orders?sub_account_id=${subAccountId}`
      ).catch(() => ({ orders: [] }));

      const orders = Array.isArray(ordersRes) ? ordersRes : ordersRes?.orders || [];
      return res.status(200).json({ orders });
    } catch (error: any) {
      console.error("GET orders error:", error);
      return res.status(500).json({ error: error.message || "Failed to fetch orders." });
    }
  }

  if (req.method === "POST") {
    try {
      const {
        symbol,
        side,
        quantity,
        order_type = "MARKET",
        order_class = "SIMPLE",
        price,
        stop_price,
        stop_loss_price,
        take_profit_price,
      } = req.body || {};

      if (!symbol || !side || !quantity) {
        return res.status(400).json({ error: "Missing required order fields: symbol, side, quantity." });
      }

      const cleanSymbol = String(symbol).toUpperCase();
      const qty = Number(quantity);

      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ error: "Quantity must be greater than 0." });
      }

      // Fetch user's current portfolio to check cash / positions
      const portfolio = await pypsxFetch<PyPsxPortfolio>(
        `/v1/partner-api/accounts/${subAccountId}/portfolio`
      ).catch(() => null);

      // Determine benchmark execution / trigger price for margin estimation
      let benchmarkPrice = Number(price);
      if (!benchmarkPrice || isNaN(benchmarkPrice)) {
        if (stop_price && !isNaN(Number(stop_price))) {
          benchmarkPrice = Number(stop_price);
        } else if (take_profit_price && !isNaN(Number(take_profit_price))) {
          benchmarkPrice = Number(take_profit_price);
        } else {
          const qRes = await pypsxFetch<any>(`/v1/partner-api/market/quote/${cleanSymbol}`).catch(() => null);
          benchmarkPrice = side === "BUY"
            ? (qRes?.ask || qRes?.last || qRes?.price || 150)
            : (qRes?.bid || qRes?.last || qRes?.price || 150);
        }
      }

      const grossNotional = Number((benchmarkPrice * qty).toFixed(2));
      const brokerConfig = await getPypsxConfig();
      const commissionRate = (brokerConfig?.commission_rate !== undefined ? brokerConfig.commission_rate : 0.55) / 100;
      const commissionFee = Number((grossNotional * commissionRate).toFixed(2));

      // Margin Guard for BUY orders (Gross + Commission)
      if (side === "BUY" && portfolio) {
        const totalEstimatedCost = Number((grossNotional + commissionFee).toFixed(2));
        if (totalEstimatedCost > portfolio.available_cash) {
          return res.status(422).json({
            error: "Insufficient Balance",
            message: `Order total cost PKR ${totalEstimatedCost.toLocaleString()} (including PKR ${commissionFee.toLocaleString()} commission) exceeds available buying power PKR ${portfolio.available_cash.toLocaleString()}.`,
          });
        }
      }

      // Position Guard for SELL orders
      let cgtFee = 0;
      let realizedGain = 0;
      if (side === "SELL" && portfolio) {
        const currentPos = (portfolio.positions || []).find((p) => p.symbol.toUpperCase() === cleanSymbol);
        const ownedQty = currentPos?.quantity || 0;

        if (qty > ownedQty) {
          return res.status(422).json({
            error: "Insufficient Shares",
            message: `Attempting to sell ${qty} shares, but only ${ownedQty} shares are owned in portfolio.`,
          });
        }

        const avgPrice = currentPos?.avg_price || benchmarkPrice;
        const costBasis = avgPrice * qty;
        realizedGain = Number((grossNotional - costBasis).toFixed(2));
        if (realizedGain > 0) {
          cgtFee = Number((realizedGain * 0.15).toFixed(2)); // 15% CGT on positive gain
        }
      }

      // Build strictly compliant pyPSX Partner API order payload
      const normalizedOrderType = String(order_type).toUpperCase();
      const normalizedOrderClass = String(order_class).toUpperCase();

      const orderPayload: Record<string, any> = {
        sub_account_id: subAccountId,
        symbol: cleanSymbol,
        side,
        quantity: qty,
        order_type: normalizedOrderType,
        order_class: normalizedOrderClass,
      };

      if (normalizedOrderType === "LIMIT") {
        if (price === undefined || price === null || isNaN(Number(price))) {
          return res.status(422).json({ error: "Missing Limit Price", message: "Limit price is required for LIMIT orders." });
        }
        orderPayload.price = Number(price);
      } else if (normalizedOrderType === "STOP_LOSS" || normalizedOrderType === "STOP") {
        const trigger = stop_price || price;
        if (!trigger || isNaN(Number(trigger))) {
          return res.status(422).json({ error: "Missing Stop Price", message: "Stop price is required for STOP LOSS orders." });
        }
        orderPayload.stop_price = Number(trigger);
      } else if (normalizedOrderType === "STOP_LIMIT") {
        if (!stop_price || isNaN(Number(stop_price)) || !price || isNaN(Number(price))) {
          return res.status(422).json({ error: "Missing Parameters", message: "Both stop_price and price are required for STOP LIMIT orders." });
        }
        orderPayload.stop_price = Number(stop_price);
        orderPayload.price = Number(price);
      } else if (normalizedOrderType === "TAKE_PROFIT") {
        const trigger = stop_price || take_profit_price || price;
        if (!trigger || isNaN(Number(trigger))) {
          return res.status(422).json({ error: "Missing Target Price", message: "Target price is required for TAKE PROFIT orders." });
        }
        orderPayload.stop_price = Number(trigger);
      }

      if (normalizedOrderClass === "BRACKET" || normalizedOrderClass === "OCO") {
        if (!stop_loss_price || isNaN(Number(stop_loss_price))) {
          return res.status(422).json({ error: "Missing Stop Loss Price", message: "stop_loss_price is required for BRACKET/OCO orders." });
        }
        if (!take_profit_price || isNaN(Number(take_profit_price))) {
          return res.status(422).json({ error: "Missing Take Profit Price", message: "take_profit_price is required for BRACKET/OCO orders." });
        }
        orderPayload.stop_loss_price = Number(stop_loss_price);
        orderPayload.take_profit_price = Number(take_profit_price);
        if (price !== undefined && price !== null && !isNaN(Number(price))) {
          orderPayload.price = Number(price);
        }
      }

      const orderResult = await pypsxFetch<PyPsxOrderResponse>(
        "/v1/partner-api/orders",
        {
          method: "POST",
          body: JSON.stringify(orderPayload),
        }
      );

      return res.status(201).json({
        order: {
          ...orderResult,
          calculated_commission: commissionFee,
          calculated_cgt: cgtFee,
          estimated_gross: grossNotional,
          estimated_realized_gain: realizedGain,
        },
      });
    } catch (error: any) {
      console.error("POST order error:", error);
      const status = error.status || (error.data?.code === 422 ? 422 : 500);
      return res.status(status).json({
        error: error.message || "Failed to execute order.",
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
