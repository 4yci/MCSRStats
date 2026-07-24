import Comparison from "@/components/compare/Comparison";
import { fetchProfile, fetchRoster } from "@/lib/api";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: { a?: string; b?: string };
}) {
  const roster = await fetchRoster();
  const { a, b } = searchParams;

  if (!a || !b) {
    return <Comparison roster={roster} />;
  }

  const [ra, rb] = await Promise.all([fetchProfile(a), fetchProfile(b)]);
  if (!ra.ok || !rb.ok) {
    const missing = [!ra.ok ? a : null, !rb.ok ? b : null].filter(Boolean).join(" and ");
    return (
      <Comparison
        roster={roster}
        error={`Couldn't find ${missing} — nicknames are exact.`}
      />
    );
  }
  return <Comparison roster={roster} a={ra.data} b={rb.data} />;
}
