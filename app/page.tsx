import Leaderboard from "@/components/leaderboard/Leaderboard";
import { PageHeader } from "@/components/ui";
import { fetchBoards } from "@/lib/api";

export const revalidate = 120;

export default async function LeaderboardPage() {
  const boards = await fetchBoards();
  return (
    <>
      <PageHeader
        title="Global Leaderboards"
        subtitle="Live MCSR Ranked standings — season Elo, fastest completions, and the weekly race."
        right={
          <span className="chip border border-accent-blue/40 bg-accent-blue/10 text-accent-blue">
            {boards.season ? `Season ${boards.season}` : "MCSR Ranked"} · Live API
          </span>
        }
      />
      <Leaderboard boards={boards} />
    </>
  );
}
