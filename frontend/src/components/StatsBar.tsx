import type { Team } from "../types";
import { teamAvg, dimAvg, ratingColor } from "../utils";

interface Props {
  team: Team;
}

const DIMS = [
  { key: "attack" as const,  label: "Attack" },
  { key: "defense" as const, label: "Defense" },
  { key: "tactics" as const, label: "Tactics" },
  { key: "spirit" as const,  label: "Spirit" },
];

function RadialRing({ value, label, color }: { value: number, label: string, color: string }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 10) * circumference;

  return (
    <div className="stats-dim">
      <div className="radial-wrapper" style={{ position: "relative", width: 60, height: 60 }}>
        <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx="30" cy="30" r={radius}
            fill="none" stroke="var(--bg-primary)" strokeWidth="6"
          />
          <circle
            cx="30" cy="30" r={radius}
            fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="radial-val" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "var(--text-pri)", fontFamily: "Inter, sans-serif" }}>
          {value.toFixed(1)}
        </div>
      </div>
      <span className="stats-dim-label" style={{ marginTop: 8 }}>{label}</span>
    </div>
  );
}

export function StatsBar({ team }: Props) {
  const avg = teamAvg(team);
  const matchCount = team.matches.length;

  return (
    <div className="stats-bar">
      <div className="stats-main">
        <div className="stats-avg">
          {avg !== null ? (
            <>
              <span className="stats-avg-num" style={{ color: ratingColor(avg) }}>{avg.toFixed(1)}</span>
              <span className="stats-avg-denom">/10</span>
            </>
          ) : (
            <span className="stats-avg-empty">No ratings yet</span>
          )}
        </div>
        <div className="stats-label">
          Campaign avg • {matchCount} match{matchCount !== 1 ? "es" : ""}
        </div>
      </div>

      {matchCount > 0 && (
        <div className="stats-dims" style={{ display: "flex", gap: "32px", alignItems: "center" }}>
          {DIMS.map(({ key, label }) => {
            const val = dimAvg(team, key);
            return <RadialRing key={key} value={val} label={label} color={ratingColor(val)} />;
          })}
        </div>
      )}
    </div>
  );
}
