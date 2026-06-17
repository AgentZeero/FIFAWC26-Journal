import type { Team, MatchRating, MatchRatingInput, TeamStatus } from "../types";

const BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8002";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...init?.headers,
  };
  
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

// ── Auth ───────────────────────────────────────────────────────────────────

export const apiLogin = async (username: string, password: string) => {
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Login failed");
  }
  return res.json();
};

export const apiRegister = async (username: string, password: string) => {
  return req("/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
};

export const apiGetMe = async () => req("/me");

// ── Teams ──────────────────────────────────────────────────────────────────

export const apiGetTeams = (): Promise<Record<string, Team>> =>
  req("/teams");

export const apiGetTeam = (code: string): Promise<Team> =>
  req(`/teams/${code}`);

export const apiUpdateTeamStatus = (
  code: string,
  status: TeamStatus,
  closed: boolean
): Promise<Team> =>
  req(`/teams/${code}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, closed }),
  });

export const apiSeedTeams = (): Promise<{ seeded: number; total: number }> =>
  req("/seed", { method: "POST" });

// ── Matches ────────────────────────────────────────────────────────────────

export const apiAddMatch = (
  code: string,
  match: MatchRatingInput
): Promise<MatchRating> =>
  req(`/teams/${code}/matches`, {
    method: "POST",
    body: JSON.stringify(match),
  });

export const apiDeleteMatch = (
  code: string,
  matchId: string
): Promise<{ deleted: string }> =>
  req(`/teams/${code}/matches/${matchId}`, { method: "DELETE" });

// ── Narrative (SSE streaming) ──────────────────────────────────────────────

export function streamNarrative(
  code: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (e: Error) => void
): () => void {
  let cancelled = false;

  fetch(`${BASE}/teams/${code}/narrative`, { 
    method: "POST",
    headers: getAuthHeaders()
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? "Failed to generate narrative");
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done || cancelled) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6));
          if (payload.chunk) onChunk(payload.chunk);
          if (payload.done) onDone();
        }
      }
    })
    .catch((e) => {
      if (!cancelled) onError(e);
    });

  return () => { cancelled = true; };
}
