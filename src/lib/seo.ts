import type { Metadata } from "next";
import { dictionaries, type Lang } from "@/lib/i18n";

export const siteUrl = "https://nexusacademy.ma";
export const languageUrls = {
  fr: `${siteUrl}/fr/`,
  en: `${siteUrl}/en/`,
  ar: `${siteUrl}/ar/`,
  "x-default": `${siteUrl}/fr/`,
};

export function marketingMetadata(lang: Lang): Metadata {
  const { title, description } = dictionaries[lang].meta;
  return {
    title, description,
    alternates: { canonical: languageUrls[lang], languages: languageUrls },
    openGraph: {
      type: "website", siteName: "NEXUS", title, description,
      url: languageUrls[lang], locale: { fr: "fr_MA", en: "en_MA", ar: "ar_MA" }[lang],
    },
    twitter: { card: "summary", title, description },
  };
}
