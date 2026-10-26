import type { Metadata } from "next";
import AdminDashboard from "@/components/AdminDashboard";
import MarketingPage from "@/components/MarketingPage";

const dashboardApp = process.env.NEXT_PUBLIC_NEXUS_ANDROID_APP === "1";

export const metadata: Metadata = dashboardApp
  ? { title: "NEXUS — Admin", robots: { index: false, follow: false } }
  : {};

export default function Home() {
  return dashboardApp ? <AdminDashboard /> : <MarketingPage />;
}
