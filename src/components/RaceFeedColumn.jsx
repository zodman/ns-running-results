import React from "react";
import { BarChart3 } from "lucide-react";

export default function RaceFeedColumn({
  races,
  visibleFeed,
  selected,
  chartRaces,
  maxSec,
  totalKm,
  onSelectRace
}) {
  return (
    <section className="col">
      {/* Race Feed */}
      <div className="card feed-card">
        {visibleFeed.map((r) => (
          <article
            key={r.id || r.idx}
            className={`feed-item ${r.idx === selected.idx ? "active" : ""}`}
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

      {/* Big Highlight Card */}
      <div className="card big-metric-card">
        <div className="big-metric-head">
          <div className="runner-circle">
            {selected.logo ? (
              <img src={selected.logo} alt={selected.name} />
            ) : (
              <span>{selected.short}</span>
            )}
          </div>
          <div>
            <div className="big-metric-title">
              {selected.isPB ? selected.pbLabel || "Personal Best" : selected.name}
            </div>
            <div className="big-metric-sub-head">
              {selected.subEvent || selected.source} • {selected.dateLabel}
            </div>
          </div>
        </div>
        <div className="big-number">{selected.officialTime}</div>
        <div className="big-caption">
          {selected.participant} • {selected.pace} • Rank{" "}
          {typeof selected.rank === "number"
            ? `#${selected.rank.toLocaleString()}`
            : selected.rank}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="card chart-card">
        <div className="card-title-row" style={{ marginBottom: 8 }}>
          <div className="card-title">
            <span className="card-title-icon">
              <BarChart3 size={16} />
            </span>
            <span>Race Time Comparison</span>
          </div>
          <span style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 600 }}>
            Chip vs Gun
          </span>
        </div>
        <div className="chart-big">
          {totalKm > 0 ? `${totalKm.toFixed(totalKm % 1 ? 1 : 0)} KM` : `${races.length} Races`}
        </div>
        <div className="chart-delta">
          ↑ {races.length} Official Finishes{" "}
          <span>across {new Set(races.map((r) => r.name)).size} events</span>
        </div>

        <div className="chart-bars">
          {chartRaces.map((r) => {
            const hChip = Math.max(16, Math.round(((r.officialSec || 0) / maxSec) * 105));
            const hGun = Math.max(
              16,
              Math.round(((r.gunSec || r.officialSec || 0) / maxSec) * 105)
            );
            return (
              <div
                key={r.id || r.idx}
                className="bar-group"
                title={`${r.name}: Chip ${r.chipTime} / Gun ${r.gunTime}`}
                onClick={() => onSelectRace(r.idx)}
              >
                <div className="bar-pair">
                  <div className="bar primary" style={{ height: `${hChip}px` }} />
                  <div className="bar secondary" style={{ height: `${hGun}px` }} />
                </div>
                <div className="bar-label">{r.shortDate}</div>
              </div>
            );
          })}
        </div>

        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-dot" style={{ background: "var(--bar-primary)" }} />
            <span>Chip Time</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: "var(--bar-secondary)" }} />
            <span>Gun Time</span>
          </div>
        </div>
      </div>
    </section>
  );
}
