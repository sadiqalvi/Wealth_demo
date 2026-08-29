const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  const users = await db.user.findMany({ include: { brokerAccount: true } });
  console.log("Current users in DB:", users.map(u => ({ id: u.id, email: u.email, name: u.fullName })));

  // Delete all users and cascade to broker accounts
  await db.brokerAccount.deleteMany({});
  const del = await db.user.deleteMany({});
  console.log("Deleted all users count:", del.count);
}

main().catch(console.error).finally(() => db.$disconnect());
