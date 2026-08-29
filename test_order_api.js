const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function testOrder() {
  console.log("Testing POST /api/orders endpoint...");
  const ts = Date.now();
  
  // 1. Register a test user
  const regRes = await fetch("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `ordertest_${ts}@test.pk`,
      password: "password123",
      fullName: "Order Test User"
    })
  });
  
  const setCookie = regRes.headers.get("set-cookie");
  const regData = await regRes.json();
  console.log("Registered user:", regData.user?.email, "SubAccount:", regData.user?.brokerAccount?.subAccountId);

  if (!setCookie) {
    console.error("No cookie returned!");
    process.exit(1);
  }

  // Extract auth_token cookie
  const cookieMatch = setCookie.match(/auth_token=([^;]+)/);
  const cookieHeader = cookieMatch ? `auth_token=${cookieMatch[1]}` : setCookie;

  // 2. Submit Buy Order for OGDC
  const orderRes = await fetch("http://localhost:3000/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookieHeader
    },
    body: JSON.stringify({
      symbol: "OGDC",
      side: "BUY",
      quantity: 50,
      order_type: "MARKET"
    })
  });

  const orderData = await orderRes.json();
  console.log("Order HTTP Status:", orderRes.status);
  console.log("Order Response Data:", orderData);

  if (orderRes.status === 201) {
    console.log("\n[SUCCESS] Order placed cleanly with 0 errors!");
  } else {
    console.error("\n[FAILURE] Order failed:", orderData);
  }

  // Cleanup test user
  await db.brokerAccount.deleteMany({ where: { userId: regData.user.id } });
  await db.user.deleteMany({ where: { id: regData.user.id } });
  console.log("Cleaned up test user from DB.");
  await db.$disconnect();
}

testOrder().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
