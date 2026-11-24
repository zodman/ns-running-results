import React from "react";
import { ArrowRight, Award, Clock, Footprints, Timer, Trophy } from "lucide-react";
import RaceHistorySummary from "./RaceHistorySummary.jsx";

export default function RaceDetailsColumn({
  primaryRunner,
  races,
  selected,
  pbRace,
  sortedBySpeed,
  sources,
  totalKm,
  historyStats,
  onSelectRace
}) {
  return (
    <section className="col">
      {/* Hero Banner */}
      <div className="card hero-card">
        <h2>{primaryRunner} — Race Profile</h2>
        <p>
          {pbRace ? (
            <>
              Found <strong>{races.length}</strong> official finish
              {races.length === 1 ? "" : "es"} — highlighted by a{" "}
              <strong>{pbRace.officialTime}</strong> {pbRace.pbLabel || "PB"} at {pbRace.name}.
            </>
          ) : (
            <>
              Found <strong>{races.length}</strong> official finish
              {races.length === 1 ? "" : "es"} across Atlantic Chip &amp; Route541.
            </>
          )}
        </p>
        <a className="hero-cta" href={selected.url} target="_blank" rel="noreferrer">
          <span>View Official Result</span>
          <span className="arrow-circle">
            <ArrowRight size={16} />
          </span>
        </a>
      </div>

      {/* Quick Race Logos Strip */}
      <div className="race-pills-strip">
        {races.slice(0, 8).map((r) => (
          <button
            key={r.id || r.idx}
            type="button"
            title={r.name}
            className={`race-dot-btn ${r.idx === selected.idx ? "active" : ""}`}
            onClick={() => onSelectRace(r.idx)}
          >
            <span className="race-dot-ring">
              <span
                className={`race-dot-inner ${r.logo ? "" : "fallback"}`}
                style={r.logo ? undefined : { background: r.bg }}
              >
                {r.logo ? <img src={r.logo} alt={r.name} /> : r.short}
              </span>
            </span>
            <span>{r.shortDate}</span>
          </button>
        ))}
      </div>

      {/* Selected Race Stats */}
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

      {/* Race Ranking */}
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
              className={`rank-item ${r.idx === selected.idx ? "active" : ""}`}
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
                <div className="rank-sub">
                  {r.subEvent || r.source} • {r.shortDate}
                </div>
              </div>
              <div className="rank-score">{r.officialTime}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Race History Summary */}
      <RaceHistorySummary
        races={races}
        sources={sources}
        totalKm={totalKm}
        historyStats={historyStats}
      />
    </section>
  );
}
