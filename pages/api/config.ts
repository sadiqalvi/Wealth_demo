import type { NextApiRequest, NextApiResponse } from "next";
import { getPypsxConfig } from "@/lib/pypsx";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const config = await getPypsxConfig();
    return res.status(200).json(config);
  } catch (error: any) {
    console.error("Config API error:", error);
    return res.status(500).json({ error: "Failed to fetch broker configuration" });
  }
}
