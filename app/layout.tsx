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
 * wrong palette.
 *
 * `data-theme-pref` holds the user's CHOICE (dark | light | system) and
 * `data-theme` the RESOLVED palette. First-time visitors get dark.
 */
const themeBootstrap = `(function(){var p,r;try{p=localStorage.getItem("mcsr:theme");}catch(e){}if(p!=="light"&&p!=="dark"&&p!=="system")p="dark";try{r=p==="system"?(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"):p;}catch(e){r="dark";}var d=document.documentElement;d.setAttribute("data-theme",r);d.setAttribute("data-theme-pref",p);})();`;

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
