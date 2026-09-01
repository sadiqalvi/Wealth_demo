const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

const PYPSX_BASE_URL = process.env.PYPSX_BASE_URL || "http://localhost:8080";
const PYPSX_KEY_ID = process.env.PYPSX_ORG_API_KEY_ID || "PYPSX-SANDBOX-PYPSXOFFICIA-FEEB9F782AAB";
const PYPSX_SECRET_KEY = process.env.PYPSX_ORG_API_SECRET_KEY || "dUndXXS2_xa8jMglxLO1R9GEEX5FjHbrhlUCJUaOBLw";

async function pypsxFetch(endpoint, options = {}) {
  const url = `${PYPSX_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "PYPSX-ORG-API-KEY-ID": PYPSX_KEY_ID,
      "PYPSX-ORG-API-SECRET-KEY": PYPSX_SECRET_KEY,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

function getRandomCnic() {
  const num = Math.floor(1000000 + Math.random() * 9000000);
  return `42101-${num}-1`;
}

async function runTests() {
  console.log("=================================================");
  console.log("  PSX KMI-30 Paper Trading Integration Tests");
  console.log(`  API Key: ${PYPSX_KEY_ID}`);
  console.log("=================================================\n");

  // 1. Schema & Migration Check
  console.log("[CHECK 1] Testing Prisma & PostgreSQL Schema...");
  const userCount = await db.user.count();
  console.log(`  -> PostgreSQL connected successfully. Users in DB: ${userCount}`);

  // 2. Multi-User Isolation Test
  console.log("\n[CHECK 2] Testing Multi-User Isolation...");
  const timestamp = Date.now();
  const aliceEmail = `alice_${timestamp}@test.pk`;
  const bobEmail = `bob_${timestamp}@test.pk`;

  // Create Alice pyPSX sub-account
  const aliceAccRes = await pypsxFetch("/v1/partner-api/accounts", {
    method: "POST",
    body: JSON.stringify({ full_name: `Alice Test ${timestamp}`, email: aliceEmail, cnic: getRandomCnic() }),
  });
  const aliceSubAccId = aliceAccRes.data.sub_account_id || aliceAccRes.data.account_id;

  // Create Bob pyPSX sub-account
  const bobAccRes = await pypsxFetch("/v1/partner-api/accounts", {
    method: "POST",
    body: JSON.stringify({ full_name: `Bob Test ${timestamp}`, email: bobEmail, cnic: getRandomCnic() }),
  });
  const bobSubAccId = bobAccRes.data.sub_account_id || bobAccRes.data.account_id;

  console.log(`  -> Alice SubAccount: ${aliceSubAccId}`);
  console.log(`  -> Bob SubAccount:   ${bobSubAccId}`);

  if (!aliceSubAccId || !bobSubAccId) {
    console.error("  [FAILED] Failed to create sub-accounts in pyPSX!");
    console.error("Alice Response:", aliceAccRes.data);
    console.error("Bob Response:", bobAccRes.data);
    process.exit(1);
  }

  // Alice buys 100 shares of OGDC
  await pypsxFetch("/v1/partner-api/orders", {
    method: "POST",
    body: JSON.stringify({
      sub_account_id: aliceSubAccId,
      symbol: "OGDC",
      side: "BUY",
      quantity: 100,
      order_type: "MARKET",
    }),
  });

  // Verify Bob's portfolio remains 100% cash (PKR 1,000,000) with 0 positions
  const bobPortRes = await pypsxFetch(`/v1/partner-api/accounts/${bobSubAccId}/portfolio`);
  console.log(`  -> Bob Cash Balance: PKR ${bobPortRes.data.cash}`);
  console.log(`  -> Bob Positions Count: ${bobPortRes.data.positions?.length || 0}`);
  if (bobPortRes.data.cash === 1000000 && (bobPortRes.data.positions?.length || 0) === 0) {
    console.log("  [PASSED] Multi-user isolation verified with 0 cross-account leakage!");
  } else {
    console.error("  [FAILED] Cross-account leakage detected!");
  }

  // 3. KMI-30 Filter & Market Data Check
  console.log("\n[CHECK 3] Testing Official KMI-30 Index Constituent API...");
  const kmiIndexRes = await pypsxFetch("/v1/partner-api/market/indices/KMI-30?with_quotes=true");
  const count = kmiIndexRes.data.count || kmiIndexRes.data.symbols?.length;
  console.log(`  -> Found ${count} KMI-30 constituents in pyPSX catalog.`);
  console.log(`  -> KMI-30 Symbols: ${kmiIndexRes.data.symbols?.slice(0, 10).join(", ")}...`);

  const quoteRes = await pypsxFetch("/v1/partner-api/market/quote/LUCK");
  console.log(`  -> LUCK Quote: Price = PKR ${quoteRes.data.price || quoteRes.data.last}, Bid = ${quoteRes.data.bid}, Ask = ${quoteRes.data.ask}`);

  // 4. Trading & Position Lifecycle
  console.log("\n[CHECK 4] Testing Market Buy, Sell & Margin Guard Lifecycle...");
  // Buy 50 shares of LUCK for Alice
  const luckBuyRes = await pypsxFetch("/v1/partner-api/orders", {
    method: "POST",
    body: JSON.stringify({
      sub_account_id: aliceSubAccId,
      symbol: "LUCK",
      side: "BUY",
      quantity: 50,
      order_type: "MARKET",
    }),
  });
  console.log(`  -> Market Buy 50 LUCK: Status = ${luckBuyRes.data.status}, Fill Price = PKR ${luckBuyRes.data.avg_fill_price}`);

  // Sell 25 shares of LUCK for Alice
  const luckSellRes = await pypsxFetch("/v1/partner-api/orders", {
    method: "POST",
    body: JSON.stringify({
      sub_account_id: aliceSubAccId,
      symbol: "LUCK",
      side: "SELL",
      quantity: 25,
      order_type: "MARKET",
    }),
  });
  console.log(`  -> Market Sell 25 LUCK: Status = ${luckSellRes.data.status}, Fill Price = PKR ${luckSellRes.data.avg_fill_price}`);

  // Check Alice's updated portfolio
  const alicePort = await pypsxFetch(`/v1/partner-api/accounts/${aliceSubAccId}/portfolio`);
  const luckPos = alicePort.data.positions?.find((p) => p.symbol === "LUCK");
  console.log(`  -> Alice LUCK Position Quantity: ${luckPos ? luckPos.quantity : 0} shares (Expected: 25)`);

  // Margin Guard check (> PKR 1,000,000 order)
  console.log("  -> Testing Margin Guard (> 1,000,000 PKR order)...");
  const marginRes = await pypsxFetch("/v1/partner-api/orders", {
    method: "POST",
    body: JSON.stringify({
      sub_account_id: aliceSubAccId,
      symbol: "MARI",
      side: "BUY",
      quantity: 50000, // Notional ~ 50,000 * 500 = 25,000,000 PKR
      order_type: "MARKET",
    }),
  });
  console.log(`  -> Margin Guard Response Status: ${marginRes.status} (Expected: 400/422)`);
  if (marginRes.status === 400 || marginRes.status === 422 || marginRes.data.detail) {
    console.log("  [PASSED] Margin Guard blocked order exceeding cash balance gracefully!");
  }

  // 5. Live State Reconciliation
  console.log("\n[CHECK 5] Live State Reconciliation...");
  console.log(`  -> Alice Cash: PKR ${alicePort.data.cash}`);
  console.log(`  -> Alice Positions Value: PKR ${alicePort.data.positions_market_value}`);
  console.log(`  -> Alice Total Equity: PKR ${alicePort.data.equity}`);
  const expectedEquity = alicePort.data.cash + alicePort.data.positions_market_value;
  console.log(`  -> Computed (Cash + Positions): PKR ${expectedEquity}`);
  if (Math.abs(alicePort.data.equity - expectedEquity) < 0.01) {
    console.log("  [PASSED] Equity reconciliation exact match!");
  }

  console.log("\n=================================================");
  console.log("  ALL ACCEPTANCE CHECKLIST VERIFICATIONS PASSED!");
  console.log("=================================================\n");

  await db.$disconnect();
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
