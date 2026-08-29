import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { ensureBrokerAccountForUser } from "@/lib/broker-sync";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
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

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.brokerAccount) {
      return res.status(200).json({ brokerAccount: user.brokerAccount });
    }

    const brokerAccount = await ensureBrokerAccountForUser(user);
    return res.status(201).json({ brokerAccount });
  } catch (error: any) {
    console.error("Onboard error:", error);
    return res.status(500).json({ error: error.message || "Failed to onboard broker account." });
  }
}
