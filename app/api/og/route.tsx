import { ImageResponse } from "next/og";
import { fetchProfile } from "@/lib/api";
import {
  deservedTier,
  rankTotalMs,
  TIER_COLORS,
  tierForElo,
} from "@/lib/meta";
import { formatTime } from "@/lib/format";

export const runtime = "nodejs";
export const revalidate = 300;

const BG = "#0c0c0f";
const PANEL = "#101014";
const MUTED = "#8a8a99";

function StatBlock({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: PANEL,
        border: "1px solid #26262f",
        borderRadius: 16,
        padding: "16px 22px",
      }}
    >
      <span style={{ color: MUTED, fontSize: 20, letterSpacing: 2, textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{ color, fontSize: 54, fontWeight: 800, lineHeight: 1.1 }}>{value}</span>
    </div>
  );
}

export async function GET(req: Request) {
  const name = new URL(req.url).searchParams.get("player");

  let title = "MCSR Stats";
  let subtitle = "Ranked Intelligence";
  let uuid: string | null = null;
  let elo = "—";
  let tierName = "";
  let tierColor = "#00e5ff";
  let paceName = "";
  let paceColor = "#00e5ff";
  let rankLabel = "";
  let pb = "";

  if (name) {
    const res = await fetchProfile(name);
    if (res.ok) {
      const p = res.data;
      uuid = p.uuid;
      title = p.name;
      subtitle = "MCSR Stats · Ranked Profile";
      elo = p.elo !== null ? String(p.elo) : "—";
      const tier = tierForElo(p.elo);
      tierName = tier;
      tierColor = TIER_COLORS[tier];
      rankLabel = p.eloRank !== null ? `#${p.eloRank} global` : "";
      pb = p.season.pbMs !== null ? formatTime(p.season.pbMs) : "";
      if (p.splits) {
        const total = p.splits.reduce((s, d) => s + d.avgMs, 0);
        const pace = deservedTier(total);
        paceName = pace;
        paceColor = TIER_COLORS[pace];
      }
    } else {
      title = name;
      subtitle = "Runner not found · MCSR Stats";
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: BG,
          backgroundImage: "linear-gradient(135deg, #0e1416 0%, #0c0c0f 55%, #0b0f14 100%)",
          padding: 56,
          position: "relative",
        }}
      >
        {/* top accent bar */}
        <div style={{ display: "flex", position: "absolute", top: 0, left: 0, right: 0, height: 8, background: tierColor }} />

        {/* skin body */}
        <div style={{ display: "flex", width: 300, alignItems: "center", justifyContent: "center" }}>
          {uuid ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://mc-heads.net/body/${uuid}/230`}
              width={230}
              height={460}
              alt=""
              style={{ objectFit: "contain" }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                width: 200,
                height: 200,
                borderRadius: 28,
                background: "#151520",
                alignItems: "center",
                justifyContent: "center",
                color: tierColor,
                fontSize: 120,
                fontWeight: 800,
              }}
            >
              ◆
            </div>
          )}
        </div>

        {/* right column */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingLeft: 40, justifyContent: "center" }}>
          <span style={{ color: "#00e5ff", fontSize: 26, letterSpacing: 8, textTransform: "uppercase", fontWeight: 700 }}>
            MCSR · STATS
          </span>
          <span style={{ color: "#ffffff", fontSize: 86, fontWeight: 800, lineHeight: 1.05, marginTop: 6 }}>
            {title}
          </span>
          <span style={{ color: MUTED, fontSize: 28, marginTop: 4, marginBottom: 24 }}>
            {tierName ? `${tierName}${rankLabel ? ` · ${rankLabel}` : ""}` : subtitle}
          </span>

          <div style={{ display: "flex", gap: 18 }}>
            <StatBlock label="Elo" value={elo} color="#ffffff" />
            {paceName ? <StatBlock label="Pace Rank" value={paceName} color={paceColor} /> : null}
            {pb ? <StatBlock label="Personal Best" value={pb} color="#00e676" /> : null}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
