import { useState, useMemo } from "react";
import type { Team, SortBy, FilterStatus } from "../types";
import { TeamCard } from "./TeamCard";
import { teamAvg } from "../utils";
import { Trophy, Search } from "lucide-react";

interface Props {
  teams: Record<string, Team>;
  selectedCode: string | null;
  onSelect: (code: string) => void;
}

const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

export function Sidebar({ teams, selectedCode, onSelect }: Props) {
  const [group, setGroup] = useState<string>("all");
  const [status, setStatus] = useState<FilterStatus>("all");
  const [sort, setSort] = useState<SortBy>("group");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = Object.values(teams);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q));
    }
    if (group !== "all") list = list.filter((t) => t.group === group);
    if (status === "active") list = list.filter((t) => !t.closed && t.status !== "eliminated");
    if (status === "eliminated") list = list.filter((t) => t.closed || t.status === "eliminated");

    if (sort === "rating") list.sort((a, b) => (teamAvg(b) ?? -1) - (teamAvg(a) ?? -1));
    else if (sort === "alpha") list.sort((a, b) => a.name.localeCompare(b.name));
    else list.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));

    return list;
  }, [teams, group, status, sort, search]);

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="sidebar-title">
          <Trophy className="sidebar-trophy" />
          <div>
            <h1>WC 2026</h1>
            <p>Rating Journal</p>
          </div>
        </div>
      </div>

      <div className="sidebar-filters">
        <div style={{ position: "relative", marginBottom: "12px" }}>
          <Search size={14} style={{ position: "absolute", left: "10px", top: "12px", color: "var(--text-sec)" }} />
          <input
            className="search-input"
            type="text"
            placeholder="Search teams…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-row">
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="all">All groups</option>
            {GROUPS.map((g) => <option key={g} value={g}>Group {g}</option>)}
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value as SortBy)}>
            <option value="group">By group</option>
            <option value="rating">Top rated</option>
            <option value="alpha">A – Z</option>
          </select>
        </div>

        <div className="status-tabs" style={{ marginTop: "12px" }}>
          {(["all","active","eliminated"] as FilterStatus[]).map((s) => (
            <button
              key={s}
              className={`status-tab ${status === s ? "active" : ""}`}
              onClick={() => setStatus(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="team-list">
        {filtered.length === 0 && (
          <p className="no-results" style={{ color: "var(--text-sec)", fontSize: "13px", padding: "12px" }}>
            No teams match your filters.
          </p>
        )}
        {filtered.map((team) => (
          <TeamCard
            key={team.code}
            team={team}
            isSelected={selectedCode === team.code}
            onClick={() => onSelect(team.code)}
          />
        ))}
      </div>
    </aside>
  );
}
