import React from "react";

export default function RaceFeedCard({ visibleFeed, selectedIdx, onSelectRace }) {
  return (
    <div className="card feed-card">
      {visibleFeed.map((r) => (
        <article
          key={r.id || r.idx}
          className={`feed-item ${r.idx === selectedIdx ? "active" : ""}`}
          onClick={() => onSelectRace(r.idx)}
        >
          <div className="medal" style={{ background: r.bg }}>
            <div className={`medal-inner ${r.logo ? "" : "fallback"}`}>
              {r.logo ? <img src={r.logo} alt={r.name} /> : r.short}
            </div>
          </div>
          <div className="feed-body">
            <div className="feed-date">
              <span>{r.dateLabel}</span>
              <span className="feed-source-tag">{r.source}</span>
            </div>
            <div className="feed-metric">
              <span>{r.officialTime}</span>
              {r.isPB && <span className="feed-chip-tag">{r.pbLabel}</span>}
            </div>
            <div className="feed-desc">
              <strong>{r.name}</strong>
              {r.subEvent ? ` — ${r.subEvent}` : ""}. {r.participant}
              {r.city ? ` (${r.city})` : ""}.
            </div>
            <div className="feed-footer">
              <span className="feed-pill">{r.category}</span>
              <span className="feed-pill">Gun {r.gunTime}</span>
              <span className="feed-pill">{r.pace}</span>
              {r.division !== "—" && <span className="feed-pill">{r.division}</span>}
              <a
                className="feed-link"
                href={r.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                Official Result →
              </a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
