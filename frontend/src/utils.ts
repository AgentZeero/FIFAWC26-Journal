import type { Team } from "./types";

export function teamAvg(team: Team): number | null {
  if (!team.matches || team.matches.length === 0) return null;
  const sum = team.matches.reduce((a, m) => a + m.overall, 0);
  return Math.round((sum / team.matches.length) * 10) / 10;
}

export function dimAvg(team: Team, dim: keyof Pick<Team["matches"][0], "attack" | "defense" | "tactics" | "spirit" | "overall">): number {
  if (!team.matches || team.matches.length === 0) return 0;
  const sum = team.matches.reduce((a, m) => a + m[dim], 0);
  return Math.round((sum / team.matches.length) * 10) / 10;
}

export function formatDate(isoString: string) {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const flagMap: Record<string, string> = {
  USA: "us", MEX: "mx", CAN: "ca", URU: "uy", ARG: "ar", BRA: "br",
  CHI: "cl", PER: "pe", FRA: "fr", ENG: "gb-eng", BEL: "be", WAL: "gb-wls",
  GER: "de", ESP: "es", POR: "pt", TUR: "tr", NED: "nl", DEN: "dk",
  AUT: "at", SCO: "gb-sct", ITA: "it", CRO: "hr", SRB: "rs", ALB: "al",
  MAR: "ma", SEN: "sn", EGY: "eg", CMR: "cm", JPN: "jp", KOR: "kr",
  AUS: "au", IRN: "ir", SAU: "sa", QAT: "qa", IRQ: "iq", UAE: "ae",
  COL: "co", ECU: "ec", VEN: "ve", BOL: "bo", NGA: "ng", CIV: "ci",
  GHA: "gh", MLI: "ml", POL: "pl", CZE: "cz", SVK: "sk", HUN: "hu"
};

export function getFlagUrl(code: string) {
  const c = flagMap[code];
  return c ? `https://flagcdn.com/w160/${c}.png` : "";
}

export function ratingColor(val: number): string {
  if (val >= 8) return "#4ade80";
  if (val >= 6) return "#C9A84C";
  if (val >= 4) return "#f97316";
  return "#ef4444";
}

export function ratingLabel(val: number | null): string {
  if (val === null) return "Unrated";
  if (val >= 9) return "World class";
  if (val >= 8) return "Excellent";
  if (val >= 7) return "Very good";
  if (val >= 6) return "Good";
  if (val >= 5) return "Average";
  return "Poor";
}
