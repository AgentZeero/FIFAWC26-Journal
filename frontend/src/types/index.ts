export type TeamStatus = "active" | "eliminated" | "champion";
export type NarrativeType = "live" | "final" | null;

export interface MatchRating {
  id: string;
  opponent: string;
  score: string;
  stage: string;
  attack: number;
  defense: number;
  tactics: number;
  spirit: number;
  overall: number;
  note: string;
  created_at: string;
}

export interface Team {
  code: string;
  name: string;
  flag: string;
  group: string;
  confederation: string;
  matches: MatchRating[];
  status: TeamStatus;
  closed: boolean;
  narrative: string | null;
  narrative_type: NarrativeType;
  narrative_updated: string | null;
}

export interface MatchRatingInput {
  opponent: string;
  score: string;
  stage: string;
  attack: number;
  defense: number;
  tactics: number;
  spirit: number;
  overall: number;
  note: string;
}

export type SortBy = "group" | "rating" | "alpha";
export type FilterStatus = "all" | "active" | "eliminated";
