import { useMemo } from "react";
import type { Team } from "../types";
import { teamAvg } from "../utils";
import { Activity, Trophy, Shield, Goal, Swords } from "lucide-react";

interface Props {
  teams: Record<string, Team>;
  onSelectTeam: (code: string) => void;
}

export function Dashboard({ teams, onSelectTeam }: Props) {
  const teamsList = Object.values(teams);
  
  const stats = useMemo(() => {
    let totalMatches = 0;
    let sumOverall = 0;
    let champion = null;
    let eliminatedCount = 0;
    
    for (const t of teamsList) {
      if (t.status === "champion") champion = t;
      if (t.status === "eliminated") eliminatedCount++;
      for (const m of t.matches) {
        totalMatches++;
        sumOverall += m.overall;
      }
    }
    
    const avgRating = totalMatches > 0 ? (sumOverall / totalMatches).toFixed(1) : "-";
    
    return { totalMatches, avgRating, champion, eliminatedCount, activeCount: 48 - eliminatedCount };
  }, [teamsList]);

  const leaderboard = useMemo(() => {
    return teamsList
      .filter(t => t.matches.length > 0)
      .map(t => ({ team: t, avg: teamAvg(t) || 0 }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5);
  }, [teamsList]);

  return (
    <div className="dashboard-panel">
      <div className="dash-header">
        <h1>Tournament Insights</h1>
        <p>Overview of your personal 2026 World Cup campaign tracker.</p>
      </div>

      <div className="dash-metrics">
        <div className="metric-card">
          <div className="metric-icon-wrap"><Activity className="metric-icon" /></div>
          <div className="metric-data">
            <span className="metric-val">{stats.totalMatches}</span>
            <span className="metric-label">Matches Rated</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon-wrap"><Trophy className="metric-icon" /></div>
          <div className="metric-data">
            <span className="metric-val">{stats.avgRating}</span>
            <span className="metric-label">Avg Rating Given</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon-wrap"><Shield className="metric-icon" /></div>
          <div className="metric-data">
            <span className="metric-val">{stats.activeCount} / {stats.eliminatedCount}</span>
            <span className="metric-label">Active / Out</span>
          </div>
        </div>
      </div>

      <div className="dash-content">
        <div className="dash-card">
          <div className="dash-card-header">
            <h3><Swords size={18} /> Top Performing Nations</h3>
          </div>
          {leaderboard.length > 0 ? (
            <div className="leaderboard-list">
              {leaderboard.map((item, idx) => (
                <div key={item.team.code} className="leaderboard-item" onClick={() => onSelectTeam(item.team.code)}>
                  <div className="lb-rank">#{idx + 1}</div>
                  <div className="lb-team">
                    <span className="lb-flag">{item.team.flag}</span>
                    <span className="lb-name">{item.team.name}</span>
                  </div>
                  <div className="lb-score">{item.avg.toFixed(1)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dash-empty">
              <p>Rate some matches to see the leaderboard.</p>
            </div>
          )}
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <h3><Goal size={18} /> Getting Started</h3>
          </div>
          <div className="dash-guide">
            <div className="guide-step">
              <div className="guide-num">1</div>
              <p>Pick a nation from the sidebar.</p>
            </div>
            <div className="guide-step">
              <div className="guide-num">2</div>
              <p>Add ratings for Attack, Defense, Tactics, and Spirit.</p>
            </div>
            <div className="guide-step">
              <div className="guide-num">3</div>
              <p>Generate Groq AI narratives based on your ratings.</p>
            </div>
            <div className="guide-step">
              <div className="guide-num">4</div>
              <p>Close their campaign when they are eliminated.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
