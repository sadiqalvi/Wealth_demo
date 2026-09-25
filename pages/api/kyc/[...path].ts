import type { NextApiRequest, NextApiResponse } from "next";

const KYC_BASE_URL = process.env.KYC_BASE_URL || "https://brokerapi.pypsx.com";
const KYC_ORG_API_KEY_ID = process.env.KYC_ORG_API_KEY_ID || "KYC_IONNYUQYPWYHWWSI";
const KYC_ORG_API_SECRET_KEY = process.env.KYC_ORG_API_SECRET_KEY || "USZIMT3MBVUPO7RTWXWRDNOG34JJ5PL2OHW3E5Y";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "25mb", // Documentation allows up to 25MB for document uploads
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path, ...queryParams } = req.query;
  const pathSegments = Array.isArray(path) ? path : [path || ""];
  const subPath = pathSegments.join("/");

  // Build target URL
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(queryParams)) {
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, v));
    } else if (value !== undefined) {
      searchParams.append(key, value);
    }
  }

  const queryString = searchParams.toString();
  const targetUrl = `${KYC_BASE_URL}/v1/kyc/${subPath}${queryString ? `?${queryString}` : ""}`;

  try {
    const headers: Record<string, string> = {
      "PYPSX-ORG-API-KEY-ID": KYC_ORG_API_KEY_ID,
      "PYPSX-ORG-API-SECRET-KEY": KYC_ORG_API_SECRET_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD" && req.body !== undefined) {
      fetchOptions.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    const upstreamRes = await fetch(targetUrl, fetchOptions);
    const contentType = upstreamRes.headers.get("content-type") || "";

    if (upstreamRes.status === 204) {
      return res.status(204).end();
    }

    if (contentType.includes("application/json")) {
      const data = await upstreamRes.json().catch(() => ({}));
      return res.status(upstreamRes.status).json(data);
    }

    const textData = await upstreamRes.text();
    return res.status(upstreamRes.status).send(textData);
  } catch (error: any) {
    console.error(`[KYC Proxy Error] ${req.method} ${targetUrl}:`, error.message);
    return res.status(500).json({
      error: "KYC Gateway Error",
      detail: error.message || "Failed to communicate with pyPSX KYC API",
      code: "PYPSX-1901",
    });
  }
}