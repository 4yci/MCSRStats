import Comparison from "@/components/compare/Comparison";
import { fetchProfile, fetchRoster, fetchSeasonNumber } from "@/lib/api";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: { a?: string; b?: string; season?: string };
}) {
  const [roster, currentSeason] = await Promise.all([
    fetchRoster(),
    fetchSeasonNumber(),
  ]);
  const { a, b } = searchParams;

  const asked = Number(searchParams.season);
  const season =
    Number.isFinite(asked) && asked > 0 && asked !== currentSeason
      ? asked
      : undefined;

  if (!a || !b) {
    return (
      <Comparison
        roster={roster}
        season={season ?? null}
        currentSeason={currentSeason}
      />
    );
  }

  const [ra, rb] = await Promise.all([
    fetchProfile(a, { season }),
    fetchProfile(b, { season }),
  ]);
  if (!ra.ok || !rb.ok) {
    const missing = [!ra.ok ? a : null, !rb.ok ? b : null].filter(Boolean).join(" and ");
    return (
      <Comparison
        roster={roster}
        error={`Couldn't find ${missing} — usernames are exact.`}
        season={season ?? null}
        currentSeason={currentSeason}
      />
    );
  }
  return (
    <Comparison
      roster={roster}
      a={ra.data}
      b={rb.data}
      season={season ?? null}
      currentSeason={currentSeason}
    />
  );
}
