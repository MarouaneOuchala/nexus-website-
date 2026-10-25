import type { Metadata } from "next";
import { Inter, Noto_Sans_Arabic, Plus_Jakarta_Sans } from "next/font/google";
import { SettingsProvider } from "@/components/SettingsProvider";
import "./globals.css";
import "./theme.css";
import "./redesign.css";
import "./immersive.css";

const dmSans = Inter({ subsets: ["latin"], variable: "--font-dm-sans" });
const spaceGrotesk = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-space-grotesk" });
const arabic = Noto_Sans_Arabic({ subsets: ["arabic"], variable: "--font-arabic", preload: false });

export const metadata: Metadata = {
  title: "NEXUS — Anglais pour cadres et dirigeants",
  description:
    "Coaching d’anglais individuel en ligne pour cadres au Maroc. Réunions, présentations et négociations. Packs transparents et réservation sur WhatsApp.",
};

// Runs before first paint so the saved theme and language apply without a flash.
const initScript = `(function(){try{var d=document.documentElement,s=localStorage,t=s.getItem("nexus-theme");if(t!=="dark"&&t!=="light"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}d.dataset.theme=t;d.style.colorScheme=t;var l=s.getItem("nexus-lang");if(l!=="en"&&l!=="fr"&&l!=="ar"){var n=(navigator.language||"fr").slice(0,2);l=n==="en"||n==="ar"?n:"fr"}d.lang=l;d.dir=l==="ar"?"rtl":"ltr"}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: initScript }} />
      </head>
      <body className={`${dmSans.variable} ${spaceGrotesk.variable} ${arabic.variable}`}>
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}
