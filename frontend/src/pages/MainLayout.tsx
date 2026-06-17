import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TeamPanel } from "../components/TeamPanel";
import { Dashboard } from "./Dashboard";
import { useTeams, useNarrative } from "../hooks/useTeams";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import type { MatchRatingInput, TeamStatus } from "../types";
import { LogOut, User, Moon, Sun } from "lucide-react";

export function MainLayout() {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const { teams, loading, error, addMatch, deleteMatch, updateStatus, refetch } = useTeams();
  const { generate, streaming, displayText, narrativeError } = useNarrative(selectedCode, teams, refetch);
  const { username, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Loading your journal…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <p>Could not connect to the API: <strong>{error}</strong></p>
      </div>
    );
  }

  const selectedTeam = selectedCode ? teams[selectedCode] : null;

  return (
    <div className="app-layout">
      <Sidebar
        teams={teams}
        selectedCode={selectedCode}
        onSelect={setSelectedCode}
      />

      <main className="main-panel">
        <div className="top-nav">
          <div className="nav-user">
            <div className="user-avatar"><User size={16} /></div>
            <span>{username}</span>
          </div>
          <button className="btn-icon" onClick={toggleTheme} title="Toggle Theme">
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button className="btn-icon" onClick={logout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>

        <div className="panel-scroll">
          {selectedTeam ? (
            <TeamPanel
              team={selectedTeam}
              displayText={displayText}
              streaming={streaming}
              narrativeError={narrativeError}
              onGenerateNarrative={generate}
              onAddMatch={async (match) => { if (selectedCode) await addMatch(selectedCode, match); }}
              onDeleteMatch={async (matchId) => { if (selectedCode) await deleteMatch(selectedCode, matchId); }}
              onUpdateStatus={async (status, closed) => { if (selectedCode) await updateStatus(selectedCode, status, closed); }}
            />
          ) : (
            <Dashboard teams={teams} onSelectTeam={setSelectedCode} />
          )}
        </div>
      </main>
    </div>
  );
}
