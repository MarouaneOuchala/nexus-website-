import { notFound } from "next/navigation";
import MarketingPage from "@/components/MarketingPage";
import AdminDashboard from "@/components/AdminDashboard";
import { isLang, languages } from "@/lib/i18n";
import { marketingMetadata } from "@/lib/seo";

export const dynamicParams = false;
const dashboardApp = process.env.NEXT_PUBLIC_NEXUS_ANDROID_APP === "1";

export function generateStaticParams() {
  return languages.map(({ code }) => ({ lang: code }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return dashboardApp
    ? { title: "NEXUS — Admin", robots: { index: false, follow: false } }
    : marketingMetadata(lang);
}

export default async function LanguageHome({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return dashboardApp ? <AdminDashboard /> : <MarketingPage />;
}
