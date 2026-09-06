import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        userNumber: true,
        email: true,
        fullName: true,
        cnic: true,
        phone: true,
        createdAt: true,
        brokerAccount: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json({ user });
  } catch (error: any) {
    console.error("Me error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch user." });
  }
}
