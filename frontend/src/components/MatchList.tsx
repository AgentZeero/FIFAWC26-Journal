import type { MatchRating, Team } from "../types";
import { ratingColor, formatDate } from "../utils";
import { Trash2 } from "lucide-react";

interface Props {
  team: Team;
  onDelete: (matchId: string) => void;
}

function MatchEntry({ match, onDelete }: { match: MatchRating; onDelete: () => void }) {
  return (
    <div className="match-entry">
      <div className="match-entry-head">
        <div className="match-entry-left">
          <span className="match-stage">{match.stage}</span>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
            <span className="match-vs">vs {match.opponent}</span>
            <span className="match-score">{match.score}</span>
          </div>
        </div>
        <div className="match-entry-right">
          <div className="overall-badge" style={{ backgroundColor: ratingColor(match.overall) }}>
            <span className="overall-label">OVERALL</span>
            <span className="overall-val">{match.overall}</span>
          </div>
          <button className="btn-delete" onClick={onDelete} title="Delete this match rating">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="match-grid">
        <div className="match-grid-metrics">
          <div className="dim-row">
            <span className="dim-label">Attack</span>
            <span className="dim-val" style={{ color: ratingColor(match.attack) }}>{match.attack}</span>
          </div>
          <div className="dim-row">
            <span className="dim-label">Defense</span>
            <span className="dim-val" style={{ color: ratingColor(match.defense) }}>{match.defense}</span>
          </div>
          <div className="dim-row">
            <span className="dim-label">Tactics</span>
            <span className="dim-val" style={{ color: ratingColor(match.tactics) }}>{match.tactics}</span>
          </div>
          <div className="dim-row">
            <span className="dim-label">Spirit</span>
            <span className="dim-val" style={{ color: ratingColor(match.spirit) }}>{match.spirit}</span>
          </div>
        </div>

        <div className="match-grid-note">
          {match.note ? (
            <div className="match-note-scrollable">
              "{match.note}"
            </div>
          ) : (
            <div className="match-note-scrollable empty">
              No comment provided.
            </div>
          )}
        </div>
      </div>
      
      <div className="match-entry-footer">
        <span className="match-date">{formatDate(match.created_at)}</span>
      </div>
    </div>
  );
}

export function MatchList({ team, onDelete }: Props) {
  if (team.matches.length === 0) return null;

  return (
    <div className="match-list">
      <h3 className="section-label">Match Ratings</h3>
      <div className="match-entries">
        {[...team.matches].reverse().map((m) => (
          <MatchEntry
            key={m.id}
            match={m}
            onDelete={() => onDelete(m.id)}
          />
        ))}
      </div>
    </div>
  );
}
