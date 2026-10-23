import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const dmSans = Inter({ subsets: ["latin"], variable: "--font-dm-sans" });
const spaceGrotesk = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: "NEXUS — Cours d’anglais en ligne au Maroc",
  description: "Cours d’anglais en direct pour vos études, votre carrière et vos projets. Découvrez les programmes NEXUS et demandez une consultation.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body className={`${dmSans.variable} ${spaceGrotesk.variable}`}>{children}</body>
    </html>
  );
}
