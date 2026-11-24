import React from "react";
import { Clock, Footprints, Timer, Trophy } from "lucide-react";

export default function SelectedRaceStatsCard({ selected }) {
  return (
    <div className="card">
      <div className="stats-header">
        <span>{selected.name}</span>
        <span className="stats-badge">{selected.division}</span>
      </div>
      <div className="stat-row">
        <div className="stat-left">
          <Clock size={18} />
          <span>Chip / Official Time</span>
        </div>
        <div className="stat-val">{selected.officialTime}</div>
      </div>
      <div className="stat-row">
        <div className="stat-left">
          <Footprints size={18} />
          <span>Avg Pace / Type</span>
        </div>
        <div className="stat-val">{selected.pace}</div>
      </div>
      <div className="stat-row">
        <div className="stat-left">
          <Timer size={18} />
          <span>Gun Time</span>
        </div>
        <div className="stat-val">{selected.gunTime}</div>
      </div>
      <div className="stat-row">
        <div className="stat-left">
          <Trophy size={18} />
          <span>Overall Rank</span>
        </div>
        <div className="stat-val">
          {typeof selected.rank === "number"
            ? `#${selected.rank.toLocaleString()}`
            : selected.rank}
        </div>
      </div>
    </div>
  );
}
