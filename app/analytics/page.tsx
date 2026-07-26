import type { Metadata } from "next";
import PlayerAnalytics from "@/components/analytics/PlayerProfile";
import { fetchProfile, fetchRoster, fetchSeasonNumber } from "@/lib/api";

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
  searchParams: {
    player?: string;
    menu?: string;
    season?: string;
    private?: string;
    samples?: string;
  };
}) {
  const [roster, currentSeason] = await Promise.all([
    fetchRoster(),
    fetchSeasonNumber(),
  ]);
  const forceMenu = searchParams.menu === "1";

  const askedSeason = Number(searchParams.season);
  const season =
    Number.isFinite(askedSeason) && askedSeason > 0 && askedSeason !== currentSeason
      ? askedSeason
      : undefined;
  const includePrivate = searchParams.private === "1";
  const askedSamples = Number(searchParams.samples);
  const sampleSize = Number.isFinite(askedSamples) ? askedSamples : 100;

  if (!searchParams.player) {
    return (
      <PlayerAnalytics
        roster={roster}
        forceMenu={forceMenu}
        currentSeason={currentSeason}
      />
    );
  }

  const res = await fetchProfile(searchParams.player, {
    season,
    includePrivate,
    sampleSize,
  });
  if (!res.ok) {
    return (
      <PlayerAnalytics
        roster={roster}
        error={res.error}
        forceMenu
        currentSeason={currentSeason}
      />
    );
  }
  return (
    <PlayerAnalytics
      roster={roster}
      profile={res.data}
      currentSeason={currentSeason}
    />
  );
}
