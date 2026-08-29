import dynamic from "next/dynamic";
import Head from "next/head";

const ConsumerDemoApp = dynamic(
  () => import("@/components/consumer-demo-app").then((mod) => mod.ConsumerDemoApp),
  { ssr: false, loading: () => (
    <main className="flex min-h-screen items-center justify-center bg-rev-bg px-4">
      <div className="w-full max-w-[390px] rounded-[2rem] border border-rev-border bg-rev-surface p-8 shadow-shell">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-rev-purple border-t-transparent" />
          <p className="text-sm font-medium text-rev-muted">Loading...</p>
        </div>
      </div>
    </main>
  )}
);

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Liquidity-Wealth Demo</title>
        <meta name="description" content="Paper trading demo for PSX Sukuks & Stocks." />
      </Head>
      <ConsumerDemoApp />
    </>
  );
}
