import type { Team } from "../types";
import { teamAvg, ratingColor, getFlagUrl } from "../utils";

interface Props {
  team: Team;
  onClick: () => void;
  isSelected: boolean;
}

export function TeamCard({ team, onClick, isSelected }: Props) {
  const avg = teamAvg(team);
  const matchCount = team.matches?.length ?? 0;

  const statusLabel = team.closed
    ? team.status === "champion" ? "Champion 🏆" : "Closed"
    : team.status === "eliminated" ? "Eliminated"
    : matchCount === 0 ? "Not rated"
    : "Active";

  return (
    <div
      className={`team-card ${isSelected ? "selected" : ""} ${team.closed && team.status === "champion" ? "crowned" : ""}`}
      onClick={onClick}
    >
      <div className="flag-avatar">
        <img src={getFlagUrl(team.code)} alt={team.name} />
      </div>
      <div className="card-info">
        <div className="card-name">{team.name}</div>
        <div className="card-meta">
          Group {team.group} • {statusLabel}
        </div>
      </div>
      <div className="card-rating">
        {avg !== null ? (
          <>
            <div className="card-avg" style={{ color: ratingColor(avg) }}>{avg.toFixed(1)}</div>
            <div className="card-denom">/10</div>
          </>
        ) : (
          <div className="card-avg-empty">—</div>
        )}
      </div>
    </div>
  );
}
