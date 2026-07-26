import Leaderboard from "@/components/leaderboard/Leaderboard";
import { PageHeader } from "@/components/ui";
import { fetchBoards, fetchSeasonNumber } from "@/lib/api";

export const revalidate = 120;

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { season?: string; times?: string; week?: string };
}) {
  const currentSeason = await fetchSeasonNumber();

  // Season Elo — a season (default: current).
  const askedElo = Number(searchParams.season);
  const eloSeason =
    Number.isFinite(askedElo) && askedElo > 0 && askedElo !== currentSeason
      ? askedElo
      : undefined;

  // Best Times — a season, or all-time.
  const rawTimes = searchParams.times;
  const askedTimes = Number(rawTimes);
  const timesSeason: number | "all" | undefined =
    rawTimes === "all"
      ? "all"
      : Number.isFinite(askedTimes) && askedTimes > 0
        ? askedTimes
        : undefined;

  // Weekly Race — a specific week id (default: the live week).
  const askedWeek = Number(searchParams.week);
  const weekId =
    Number.isFinite(askedWeek) && askedWeek > 0 ? askedWeek : undefined;

  const boards = await fetchBoards({ eloSeason, timesSeason, weekId });

  return (
    <>
      <PageHeader
        title="Global Leaderboards"
        subtitle="Live MCSR Ranked standings — season Elo, fastest completions, and the weekly race."
        right={
          <span className="chip border border-accent-blue/40 bg-accent-blue/10 text-accent-blue">
            {currentSeason ? `Season ${currentSeason}` : "MCSR Ranked"}
          </span>
        }
      />
      <Leaderboard boards={boards} currentSeason={currentSeason} />
    </>
  );
}
