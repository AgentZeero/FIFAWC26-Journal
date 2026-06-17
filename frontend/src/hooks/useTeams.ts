import { useState, useEffect, useCallback } from "react";
import type { Team, MatchRatingInput, TeamStatus } from "../types";
import {
  apiGetTeams,
  apiSeedTeams,
  apiAddMatch,
  apiDeleteMatch,
  apiUpdateTeamStatus,
  streamNarrative,
} from "../api/client";

export function useTeams() {
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    try {
      const data = await apiGetTeams();
      if (Object.keys(data).length === 0) {
        await apiSeedTeams();
        const seeded = await apiGetTeams();
        setTeams(seeded);
      } else {
        setTeams(data);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const addMatch = useCallback(async (code: string, match: MatchRatingInput) => {
    const newMatch = await apiAddMatch(code, match);
    setTeams((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        matches: [...prev[code].matches, newMatch],
      },
    }));
    return newMatch;
  }, []);

  const deleteMatch = useCallback(async (code: string, matchId: string) => {
    await apiDeleteMatch(code, matchId);
    setTeams((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        matches: prev[code].matches.filter((m) => m.id !== matchId),
      },
    }));
  }, []);

  const updateStatus = useCallback(
    async (code: string, status: TeamStatus, closed: boolean) => {
      const updated = await apiUpdateTeamStatus(code, status, closed);
      setTeams((prev) => ({ ...prev, [code]: updated }));
      return updated;
    },
    []
  );

  return { teams, loading, error, addMatch, deleteMatch, updateStatus, refetch: fetchTeams };
}

// ── Narrative hook (per team) ──────────────────────────────────────────────

export function useNarrative(code: string | null, teams: Record<string, Team>, refetch: () => void) {
  const [streaming, setStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [narrativeError, setNarrativeError] = useState<string | null>(null);

  const generate = useCallback(() => {
    if (!code) return;
    setStreaming(true);
    setStreamedText("");
    setNarrativeError(null);

    const cancel = streamNarrative(
      code,
      (chunk) => setStreamedText((t) => t + chunk),
      () => {
        setStreaming(false);
        refetch();        // pull persisted narrative back from server
      },
      (e) => {
        setNarrativeError(e.message);
        setStreaming(false);
      }
    );
    return cancel;
  }, [code, refetch]);

  // Reset streamed text when team changes
  useEffect(() => { setStreamedText(""); setNarrativeError(null); }, [code]);

  const team = code ? teams[code] : null;
  // While streaming, show the live streamed text; after done, show persisted
  const displayText = streaming ? streamedText : (team?.narrative ?? streamedText);

  return { generate, streaming, displayText, narrativeError };
}
