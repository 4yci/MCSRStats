import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import InfoButton from "@/components/InfoButton";
import { fetchSeasonNumber } from "@/lib/api";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: "MCSR Stats — Ranked Intelligence",
  description:
    "The all-in-one MCSR Ranked platform: live leaderboards, deep player analytics, and head-to-head comparisons.",
};

/**
 * Applies the saved theme before first paint so the page never flashes the
 * wrong palette. Falls back to the OS preference, then dark.
 */
const themeBootstrap = `(function(){try{var t=localStorage.getItem("mcsr:theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const season = await fetchSeasonNumber();
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-screen antialiased">
        <Sidebar season={season} />
        <InfoButton />
        <main className="grid-overlay min-h-screen px-4 pb-10 pt-20 lg:ml-64 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
        <Analytics />
      </body>
    </html>
  );
}
