/** 583184 → "9:43.184" ; withMs=false → "9:43" */
export function formatTime(ms: number, withMs = true): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const millis = Math.floor(ms % 1000);
  const sec = s.toString().padStart(2, "0");
  return withMs
    ? `${m}:${sec}.${millis.toString().padStart(3, "0")}`
    : `${m}:${sec}`;
}

/** Compact segment time: 92300 → "1:32" ; under a minute → "48.2s" */
export function formatSegment(ms: number): string {
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return formatTime(ms, false);
}

export function formatSigned(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

export function winRate(wins: number, losses: number): number {
  const total = wins + losses;
  return total === 0 ? 0 : (wins / total) * 100;
}
