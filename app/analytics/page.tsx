import type { Metadata } from "next";
import PlayerAnalytics from "@/components/analytics/PlayerProfile";
import { fetchProfile, fetchRoster } from "@/lib/api";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { player?: string };
}): Promise<Metadata> {
  const player = searchParams.player;
  if (!player) {
    return { title: "Player Analytics — MCSR Stats" };
  }
  const title = `${player} — MCSR Stats`;
  const description = `Live MCSR Ranked profile for ${player}: Elo, Pace Rank, split analytics, and match history.`;
  const ogImage = `/api/og?player=${encodeURIComponent(player)}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { player?: string; menu?: string };
}) {
  const roster = await fetchRoster();
  const forceMenu = searchParams.menu === "1";
  if (!searchParams.player) {
    return <PlayerAnalytics roster={roster} forceMenu={forceMenu} />;
  }
  const res = await fetchProfile(searchParams.player);
  if (!res.ok) {
    return <PlayerAnalytics roster={roster} error={res.error} forceMenu />;
  }
  return <PlayerAnalytics roster={roster} profile={res.data} />;
}
