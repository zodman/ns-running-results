import React from "react";
import { Timer } from "lucide-react";
import { CATEGORY_COLORS } from "../utils/raceUtils";

export default function RaceHistorySummary({ races, sources, totalKm, historyStats }) {
  return (
    <div className="card progress-card">
      <div className="progress-top">
        <Timer size={18} />
        <span>Race History Summary</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: "100%" }} />
      </div>
      <div className="progress-bottom">
        <div>
          <div className="progress-label">Official Timed Finishes</div>
          <div className="progress-sub">
            {sources.atlanticChip} Atlantic Chip • {sources.route541} Route541
          </div>
        </div>
        <div className="progress-big">{races.length}</div>
      </div>

      <div className="summary-grid">
        <div className="summary-tile">
          <div className="summary-tile-label">Total Distance</div>
          <div className="summary-tile-val">
            {totalKm > 0 ? `${totalKm.toFixed(totalKm % 1 ? 1 : 0)} KM` : "—"}
          </div>
          <div className="summary-tile-sub">Avg {historyStats.avgPaceLabel}</div>
        </div>
        <div className="summary-tile">
          <div className="summary-tile-label">Time Racing</div>
          <div className="summary-tile-val">{historyStats.totalTimeLabel}</div>
          <div className="summary-tile-sub">
            {historyStats.yearRange} ({historyStats.seasonCount}{" "}
            {historyStats.seasonCount === 1 ? "season" : "seasons"})
          </div>
        </div>
        <div className="summary-tile">
          <div className="summary-tile-label">Best Overall Rank</div>
          <div className="summary-tile-val">
            {historyStats.bestRankRace ? `#${historyStats.bestRankRace.rank}` : "—"}
          </div>
          <div className="summary-tile-sub">
            {historyStats.bestRankRace ? historyStats.bestRankRace.name.slice(0, 22) : "—"}
          </div>
        </div>
        <div className="summary-tile">
          <div className="summary-tile-label">Locations Raced</div>
          <div className="summary-tile-val">{historyStats.uniqueLocations}</div>
          <div className="summary-tile-sub">Nova Scotia &amp; Maritimes</div>
        </div>
      </div>

      {historyStats.byCat.length > 0 && (
        <div className="summary-section">
          <div className="summary-section-title">Personal Bests by Distance</div>
          <div className="summary-pb-list">
            {historyStats.byCat.map((c) => (
              <div key={c.cat} className="summary-pb-row">
                <span className="summary-pb-cat">
                  <span
                    className="graph-legend-swatch"
                    style={{ background: CATEGORY_COLORS[c.cat] || "#a78bfa" }}
                  />
                  <span>{c.cat}</span>
                </span>
                <span>
                  <span className="summary-pb-val">{c.bestTime}</span>
                  <span className="summary-pb-count">
                    ({c.count} {c.count === 1 ? "race" : "races"})
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {historyStats.topLocations.length > 0 && (
        <div className="summary-section">
          <div className="summary-section-title">Top Race Locations</div>
          <div className="summary-locs">
            {historyStats.topLocations.map(([loc, cnt]) => (
              <span key={loc} className="summary-loc-chip">
                {loc} ({cnt})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
