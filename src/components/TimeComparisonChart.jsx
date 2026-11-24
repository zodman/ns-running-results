import React from "react";
import { BarChart3 } from "lucide-react";

export default function TimeComparisonChart({
  races,
  chartRaces,
  maxSec,
  totalKm,
  onSelectRace
}) {
  return (
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
          const hGun = Math.max(16, Math.round(((r.gunSec || r.officialSec || 0) / maxSec) * 105));
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
  );
}
