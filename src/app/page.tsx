import type { Metadata } from "next";
import AdminDashboard from "@/components/AdminDashboard";
import MarketingPage from "@/components/MarketingPage";
import { marketingMetadata } from "@/lib/seo";

const dashboardApp = process.env.NEXT_PUBLIC_NEXUS_ANDROID_APP === "1";

export const metadata: Metadata = dashboardApp
  ? { title: "NEXUS — Admin", robots: { index: false, follow: false } }
  : marketingMetadata("fr");

export default function Home() {
  return dashboardApp ? <AdminDashboard /> : <MarketingPage />;
}
