import { useState } from "react";
import type { MatchRatingInput } from "../types";

interface Props {
  teamName: string;
  onSave: (match: MatchRatingInput) => Promise<void>;
  onCancel: () => void;
}

const DIMS = [
  { key: "attack",  label: "Attack",  hint: "Creativity, chances, clinical finishing" },
  { key: "defense", label: "Defense", hint: "Compactness, duels, aerial threat" },
  { key: "tactics", label: "Tactics", hint: "Shape, transitions, pressing intensity" },
  { key: "spirit",  label: "Spirit",  hint: "Fight, resilience, team cohesion" },
  { key: "overall", label: "Overall", hint: "Your holistic match rating" },
] as const;

const STAGES = [
  "Group Stage · MD1", "Group Stage · MD2", "Group Stage · MD3",
  "Round of 32", "Round of 16", "Quarter-final", "Semi-final",
  "Third-place play-off", "Final",
];

function defaultRatings() {
  return { attack: 7, defense: 7, tactics: 7, spirit: 7, overall: 7 };
}

export function MatchForm({ teamName, onSave, onCancel }: Props) {
  const [opponent, setOpponent] = useState("");
  const [score, setScore] = useState("");
  const [stage, setStage] = useState(STAGES[0]);
  const [ratings, setRatings] = useState<Record<string, number>>(defaultRatings());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setRating = (key: string, val: number) =>
    setRatings((r) => ({ ...r, [key]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!opponent.trim()) e.opponent = "Opponent is required";
    if (!score.trim()) e.score = "Score is required";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await onSave({
        opponent: opponent.trim(),
        score: score.trim(),
        stage,
        attack: ratings.attack,
        defense: ratings.defense,
        tactics: ratings.tactics,
        spirit: ratings.spirit,
        overall: ratings.overall,
        note: note.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="match-form">
      <div className="form-header">
        <h3>Rate a match — <span>{teamName}</span></h3>
      </div>

      <div className="form-grid-2">
        <div className="field">
          <label>Opponent</label>
          <input
            type="text"
            placeholder="e.g. Argentina"
            value={opponent}
            onChange={(e) => { setOpponent(e.target.value); setErrors((x) => ({ ...x, opponent: "" })); }}
            className={errors.opponent ? "input-error" : ""}
          />
          {errors.opponent && <span className="field-error">{errors.opponent}</span>}
        </div>

        <div className="field">
          <label>Score</label>
          <input
            type="text"
            placeholder="e.g. 2 – 1"
            value={score}
            onChange={(e) => { setScore(e.target.value); setErrors((x) => ({ ...x, score: "" })); }}
            className={errors.score ? "input-error" : ""}
          />
          {errors.score && <span className="field-error">{errors.score}</span>}
        </div>
      </div>

      <div className="field">
        <label>Stage</label>
        <select value={stage} onChange={(e) => setStage(e.target.value)}>
          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="ratings-block">
        {DIMS.map(({ key, label, hint }) => (
          <div className="rating-row" key={key}>
            <div className="rating-label-col">
              <span className="rating-label">{label}</span>
              <span className="rating-hint">{hint}</span>
            </div>
            <input
              type="range"
              min={1} max={10} step={1}
              value={ratings[key]}
              onChange={(e) => setRating(key, parseInt(e.target.value))}
              className="rating-slider"
            />
            <span className="rating-val">{ratings[key]}</span>
          </div>
        ))}
      </div>

      <div className="field">
        <label>Journal entry <span className="label-optional">— strengths, weaknesses, moments that stood out</span></label>
        <textarea
          rows={4}
          placeholder={`Write your honest assessment of ${teamName}'s performance...`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="form-actions">
        <button className="btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save match rating"}
        </button>
      </div>
    </div>
  );
}
