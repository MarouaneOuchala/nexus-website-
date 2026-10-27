import type { MetadataRoute } from "next";
import { languages } from "@/lib/i18n";
import { languageUrls } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return languages.map(({ code }) => ({
    url: languageUrls[code],
    alternates: { languages: languageUrls },
  }));
}
