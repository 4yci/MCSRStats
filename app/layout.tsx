import { Analytics } from '@vercel/analytics/react';
import type { Metadata } from "next";
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
    "The all-in-one MCSR Ranked platform: live leaderboards, deep player analytics, and a complete zero-cycle coordinate reference.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const season = await fetchSeasonNumber();
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Sidebar season={season} />
        <InfoButton />
        <main className="grid-overlay min-h-screen px-4 pb-10 pt-20 lg:ml-64 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
        {/* Added Analytics right here */}
        <Analytics />
      </body>
    </html>
  );
}
