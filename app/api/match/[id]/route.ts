import { NextResponse } from "next/server";
import { MatchDetailData } from "@/lib/api";

/**
 * Server-side proxy for match details so the browser never talks to
 * api.mcsrranked.com directly (shared revalidation cache, no CORS concerns).
 * `changes[].eloRate` is the PRE-match rating (verified: consecutive matches
 * chain as eloRate + change = next eloRate), so after = eloRate + change.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  if (!/^\d{1,12}$/.test(params.id)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }
  const res = await fetch(`https://api.mcsrranked.com/matches/${params.id}`, {
    next: { revalidate: 600 },
  });
  if (!res.ok) {
    return NextResponse.json({ error: `upstream ${res.status}` }, { status: 502 });
  }
  const json = await res.json();
  if (json.status !== "success") {
    return NextResponse.json({ error: "match not found" }, { status: 404 });
  }
  const m = json.data;
  const data: MatchDetailData = {
    id: m.id,
    date: m.date ?? null,
    forfeited: !!m.forfeited,
    seed: {
      overworld: m.seed?.overworld ?? null,
      bastion: m.seed?.nether ?? null,
    },
    result: {
      uuid: m.result?.uuid ?? null,
      time: m.result?.time ?? null,
    },
    players: (m.players ?? []).map((p: any) => {
      const ch = (m.changes ?? []).find((c: any) => c.uuid === p.uuid);
      const before = typeof ch?.eloRate === "number" ? ch.eloRate : null;
      const change = typeof ch?.change === "number" ? ch.change : null;
      return {
        uuid: p.uuid,
        nickname: p.nickname,
        eloBefore: before,
        eloAfter: before !== null && change !== null ? before + change : null,
        change,
      };
    }),
    timelines: (m.timelines ?? []).map((t: any) => ({
      uuid: t.uuid,
      time: t.time,
      type: t.type,
    })),
  };
  return NextResponse.json(data);
}
