import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth";
import { ensureBrokerAccountForUser } from "@/lib/broker-sync";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { brokerAccount: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    let brokerAccount = user.brokerAccount;
    if (!brokerAccount) {
      try {
        brokerAccount = await ensureBrokerAccountForUser(user);
      } catch (onboardErr) {
        console.error("Login auto-onboard error:", onboardErr);
      }
    }

    const token = signToken({ userId: user.id, email: user.email });
    setAuthCookie(res, token);

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        cnic: user.cnic,
        phone: user.phone,
        brokerAccount,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({ error: error.message || "Failed to log in." });
  }
}
