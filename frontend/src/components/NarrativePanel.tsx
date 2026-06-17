import { useState, ReactNode } from "react";
import type { Team } from "../types";
import { formatDate } from "../utils";
import { ChevronDown, ChevronUp, Sparkles, RefreshCw } from "lucide-react";

interface Props {
  team: Team;
  displayText: string;
  streaming: boolean;
  narrativeError: string | null;
  onGenerate: () => void;
}

// Helper to highlight numbers and scores
function formatNarrativeText(text: string): ReactNode[] {
  // Regex to match "X-Y", "X out of 10", and single digits/numbers
  const regex = /(\b\d+-\d+\b|\b\d+ out of 10\b)/g;
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (part.match(regex)) {
      return <span key={i} className="highlighted-text">{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function NarrativePanel({ team, displayText, streaming, narrativeError, onGenerate }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const hasMatches = team.matches.length > 0;
  const isFinal = team.closed;
  const hasNarrative = !!displayText;

  return (
    <div className="narrative-panel">
      <div className="narrative-header" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => setIsOpen(!isOpen)}>
          <button className="btn-icon" style={{ background: "transparent", padding: 4 }}>
            {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          <div>
            <h3 className="narrative-title" style={{ fontSize: "16px", color: "var(--text-pri)", textTransform: "none", fontWeight: 600 }}>
              {isFinal ? "Campaign Retrospective" : "Campaign Narrative"}
            </h3>
            {team.narrative_updated && !streaming && (
              <p className="narrative-meta" style={{ fontSize: "13px", color: "var(--text-sec)" }}>
                Last updated {formatDate(team.narrative_updated)}
                {team.narrative_type === "final" && " • Final"}
              </p>
            )}
          </div>
        </div>
        <button
          className="btn-summarise"
          onClick={(e) => { e.stopPropagation(); onGenerate(); setIsOpen(true); }}
          disabled={!hasMatches || streaming}
          title={!hasMatches ? "Rate at least one match first" : isFinal ? "Generate final retrospective" : "Generate narrative"}
        >
          {streaming ? (
            <><RefreshCw size={14} className="spin" /> Writing…</>
          ) : hasNarrative ? (
            <><RefreshCw size={14} /> Refresh</>
          ) : (
            <><Sparkles size={14} /> Generate</>
          )}
        </button>
      </div>

      {narrativeError && (
        <div className="narrative-error" style={{ color: "var(--accent-red)", padding: "16px", background: "#fef2f2", borderRadius: "12px", marginBottom: "20px" }}>
          {narrativeError}
        </div>
      )}

      {isOpen && (
        <div className="narrative-content-wrapper">
          {!hasMatches && !streaming && (
            <div className="narrative-empty" style={{ padding: "32px", textAlign: "center", color: "var(--text-ter)", background: "var(--bg-glass)", borderRadius: "16px" }}>
              <p>Rate at least one match to unlock the AI narrative for {team.name}.</p>
            </div>
          )}

          {hasMatches && !hasNarrative && !streaming && !narrativeError && (
            <div className="narrative-empty" style={{ padding: "32px", textAlign: "center", color: "var(--text-ter)", background: "var(--bg-glass)", borderRadius: "16px" }}>
              <p>
                {isFinal
                  ? "Campaign is closed. Generate the final retrospective to capture the full story."
                  : "Click 'Generate' to let Groq analyze the performances and write the campaign story so far."}
              </p>
            </div>
          )}

          {(hasNarrative || streaming) && (
            <div className={`narrative-body ${isFinal ? "is-final" : ""}`}>
              <div className="narrative-text">
                {formatNarrativeText(displayText)}
                {streaming && <span className="cursor-blink">|</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
