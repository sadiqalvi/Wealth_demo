import dynamic from "next/dynamic";
import Head from "next/head";

const AdminDashboard = dynamic(
  () => import("@/components/admin-partner-view").then((mod) => mod.AdminPartnerView),
  { ssr: false, loading: () => (
    <main className="flex min-h-screen items-center justify-center bg-[#F2F4F7]">
      <p className="text-sm font-medium text-slate-500">Loading dashboard...</p>
    </main>
  )}
);

export default function AdminPage() {
  return (
    <>
      <Head>
        <title>NayaPay Admin Dashboard</title>
        <meta name="description" content="NayaPay Admin Dashboard — powered by pyPSX." />
      </Head>
      <AdminDashboard />
    </>
  );
}
