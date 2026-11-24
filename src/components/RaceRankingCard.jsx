import React from "react";
import { Award } from "lucide-react";
import SourceLogo from "./SourceLogo.jsx";

export default function RaceRankingCard({ sortedBySpeed, selectedIdx, onSelectRace }) {
  return (
    <div className="card">
      <div className="card-title-row">
        <div className="card-title">
          <span className="card-title-icon">
            <Award size={16} />
          </span>
          <span>Race Ranking</span>
        </div>
        <span style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 600 }}>
          Fastest First
        </span>
      </div>
      <div className="rank-list">
        {sortedBySpeed.map((r, i) => (
          <div
            key={r.id || r.idx}
            className={`rank-item ${r.idx === selectedIdx ? "active" : ""}`}
            onClick={() => onSelectRace(r.idx)}
          >
            <span className="rank-num">{String(i + 1).padStart(2, "0")}.</span>
            <span
              className={`rank-mini-badge ${r.logo ? "" : "fallback"}`}
              style={r.logo ? undefined : { background: r.bg }}
            >
              {r.logo ? <img src={r.logo} alt={r.name} /> : r.short}
            </span>
            <div className="rank-meta">
              <div className="rank-name">{r.name}</div>
              <div className="rank-sub rank-sub-row">
                <span>
                  {r.subEvent ? `${r.subEvent} • ` : ""}
                  {r.dateLabel}
                </span>
                <SourceLogo source={r.source} />
              </div>
            </div>
            <div className="rank-score">{r.officialTime}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
