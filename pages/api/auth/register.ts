import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";
import { ensureBrokerAccountForUser } from "@/lib/broker-sync";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password, fullName, cnic, phone } = req.body || {};

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: "Email, password, and full name are required." });
    }

    const existingUser = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: {
        email: email.trim().toLowerCase(),
        passwordHash,
        fullName: fullName.trim(),
        cnic: cnic ? cnic.trim() : null,
        phone: phone ? phone.trim() : null,
      },
    });

    // Auto onboard user to pyPSX paper trading sub-account immediately
    let brokerAccount: any = null;
    try {
      brokerAccount = await ensureBrokerAccountForUser(user);
    } catch (onboardErr) {
      console.error("Immediate onboard during registration error:", onboardErr);
    }

    const token = signToken({ userId: user.id, email: user.email });
    setAuthCookie(res, token);

    return res.status(201).json({
      user: {
        id: user.id,
        userNumber: user.userNumber,
        email: user.email,
        fullName: user.fullName,
        cnic: user.cnic,
        phone: user.phone,
        brokerAccount,
      },
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return res.status(500).json({ error: error.message || "Failed to register user." });
  }
}
