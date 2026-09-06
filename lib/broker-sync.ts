import { db } from "@/lib/db";
import { pypsxFetch, PyPsxSubAccount } from "@/lib/pypsx";

export async function ensureBrokerAccountForUser(user: {
  id: string;
  email: string;
  fullName: string;
  cnic?: string | null;
}) {
  // Check if DB already has a broker account for this user
  const existing = await db.brokerAccount.findUnique({
    where: { userId: user.id },
  });

  if (existing) {
    return existing;
  }

  const randomCnicNum = Math.floor(1000000 + Math.random() * 9000000);
  const cnicToUse = user.cnic || `42101-${randomCnicNum}-1`;

  let subAccountId: string | null = null;
  let brokerAccountNumber: string | null = null;
  let status = "ACTIVE";

  // Try creating the sub-account
  try {
    const pypsxRes = await pypsxFetch<PyPsxSubAccount>("/v1/partner-api/accounts", {
      method: "POST",
      body: JSON.stringify({
        full_name: user.fullName,
        email: user.email,
        cnic: cnicToUse,
      }),
    });

    subAccountId = pypsxRes.sub_account_id || pypsxRes.account_id;
    brokerAccountNumber = pypsxRes.broker_account_number || `BRK-${subAccountId.substring(0, 8)}`;
    status = pypsxRes.status || "ACTIVE";
  } catch (createErr: any) {
    console.warn("Direct account creation in pyPSX returned error, attempting lookup:", createErr?.message || createErr);

    // If duplicate email in pyPSX, find the existing subaccount by email
    try {
      const listRes = await pypsxFetch<any>("/v1/partner-api/accounts?limit=100");
      const matched = (listRes?.accounts || []).find(
        (a: any) => String(a.email).toLowerCase() === user.email.toLowerCase()
      );

      if (matched) {
        subAccountId = matched.sub_account_id || matched.account_id;
        brokerAccountNumber = matched.broker_account_number || `BRK-${subAccountId!.substring(0, 8)}`;
        status = matched.status || "ACTIVE";
      } else {
        throw createErr;
      }
    } catch (lookupErr) {
      console.error("Failed lookup for existing sub-account:", lookupErr);
      throw createErr;
    }
  }

  if (!subAccountId) {
    throw new Error("Could not acquire pyPSX sub-account ID.");
  }

  // Create broker account row in Postgres
  const brokerAccount = await db.brokerAccount.create({
    data: {
      userId: user.id,
      subAccountId,
      brokerAccountNumber: brokerAccountNumber || `BRK-${subAccountId.substring(0, 8)}`,
      status,
      kycStatus: "APPROVED",
    },
  });

  return brokerAccount;
}
