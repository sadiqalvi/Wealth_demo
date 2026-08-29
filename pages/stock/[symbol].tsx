import React from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { ConsumerDemoApp } from "@/components/consumer-demo-app";

export default function StockDetailPage() {
  const router = useRouter();
  const { symbol } = router.query;

  const currentSymbol = typeof symbol === "string" ? symbol.toUpperCase() : undefined;

  return (
    <>
      <Head>
        <title>{currentSymbol ? `${currentSymbol} - PSX Paper Trading & Market Depth` : "PSX Stock Trading"}</title>
        <meta name="description" content="Live PSX KMI-30 Level 2 market depth, paper trading terminal, commission breakdown and tax analytics." />
      </Head>
      <ConsumerDemoApp initialSymbol={currentSymbol} />
    </>
  );
}
