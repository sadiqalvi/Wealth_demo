const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function fix() {
  const users = await db.user.findMany({ include: { brokerAccount: true } });
  for (const u of users) {
    if (!u.brokerAccount) {
      console.log("Fixing missing broker account for:", u.email);
      const ba = await db.brokerAccount.create({
        data: {
          userId: u.id,
          subAccountId: "acct_5cb2ab9668194f1bacff",
          brokerAccountNumber: "BRK-PYPSX_DEMO-54270DD83E",
          status: "ACTIVE",
          kycStatus: "APPROVED"
        }
      });
      console.log("Linked broker account:", ba);
    }
  }
  await db.$disconnect();
}

fix().catch(console.error);
