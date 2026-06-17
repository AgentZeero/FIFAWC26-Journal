import { useState } from "react";
import type { Team, MatchRatingInput, TeamStatus } from "../types";
import { StatsBar } from "./StatsBar";
import { NarrativePanel } from "./NarrativePanel";
import { MatchForm } from "./MatchForm";
import { MatchList } from "./MatchList";
import { Trophy, XCircle, PlayCircle, Plus } from "lucide-react";
import { getFlagUrl } from "../utils";

interface Props {
  team: Team;
  displayText: string;
  streaming: boolean;
  narrativeError: string | null;
  onGenerateNarrative: () => void;
  onAddMatch: (match: MatchRatingInput) => Promise<void>;
  onDeleteMatch: (matchId: string) => void;
  onUpdateStatus: (status: TeamStatus, closed: boolean) => Promise<void>;
}

export function TeamPanel({
  team,
  displayText,
  streaming,
  narrativeError,
  onGenerateNarrative,
  onAddMatch,
  onDeleteMatch,
  onUpdateStatus,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const handleAddMatch = async (match: MatchRatingInput) => {
    await onAddMatch(match);
    setShowForm(false);
  };

  const handleCloseCampaign = async () => {
    setStatusLoading(true);
    try {
      if (team.closed) {
        await onUpdateStatus("active", false);
      } else {
        await onUpdateStatus(team.status === "active" ? "eliminated" : team.status, true);
      }
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSetChampion = async () => {
    setStatusLoading(true);
    try {
      await onUpdateStatus("champion", true);
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="team-panel">
      <div className="team-panel-header">
        <div className="team-panel-identity">
          <div className="flag-avatar lg">
            <img src={getFlagUrl(team.code)} alt={team.name} />
          </div>
          <div>
            <h2 className="team-panel-name">{team.name}</h2>
            <p className="team-panel-sub">
              Group {team.group} • {team.confederation}
              {team.closed && team.status === "champion" && (
                <span className="status-badge champion">🏆 Champion</span>
              )}
              {(team.closed || team.status === "eliminated") && team.status !== "champion" && (
                <span className="status-badge eliminated">Campaign closed</span>
              )}
              {!team.closed && team.status !== "champion" && (
                <span className="status-badge active">Active Campaign</span>
              )}
            </p>
          </div>
        </div>

        <div className="team-panel-actions">
          {!team.closed && (
            <button
              className="btn-primary"
              onClick={() => setShowForm((v) => !v)}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={16} /> {showForm ? "Cancel" : "Add Match"}
            </button>
          )}
          {!team.closed && team.status !== "champion" && (
            <button
              className="btn-ghost"
              onClick={handleSetChampion}
              disabled={statusLoading}
              title="Mark as World Cup champion"
              style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent-gold)" }}
            >
              <Trophy size={16} /> Champion
            </button>
          )}
          <button
            className="btn-ghost"
            onClick={handleCloseCampaign}
            disabled={statusLoading}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            {team.closed ? <PlayCircle size={16} /> : <XCircle size={16} />}
            {statusLoading ? "…" : team.closed ? "Reopen" : "Close"}
          </button>
        </div>
      </div>

      <StatsBar team={team} />

      {showForm && (
        <MatchForm
          teamName={team.name}
          onSave={handleAddMatch}
          onCancel={() => setShowForm(false)}
        />
      )}

      <NarrativePanel
        team={team}
        displayText={displayText}
        streaming={streaming}
        narrativeError={narrativeError}
        onGenerate={onGenerateNarrative}
      />

      <MatchList
        team={team}
        onDelete={onDeleteMatch}
      />
    </div>
  );
}
