import React from "react";
import { CheckCircle2, Lock, MapPin } from "lucide-react";

export default function RegionBadges({ regionStats, activeRegion, onSelectRegion }) {
  return (
    <section className="card region-section">
      <div className="region-head">
        <div>
          <div className="card-title">
            <span className="card-title-icon">
              <MapPin size={16} />
            </span>
            <span>Capture Nova Scotia — 7 Regions</span>
          </div>
          <p className="card-explain" style={{ marginTop: 4, marginBottom: 0 }}>
            Finish at least 1 race in each region to unlock it. Click any region to filter the Medal
            Wall below.
          </p>
        </div>
        <div className="region-score-pill">
          <strong>{regionStats.unlockedCount}</strong> / {regionStats.totalRegions} Regions
        </div>
      </div>

      <div className="passport-progress-track" style={{ margin: "14px 0 16px" }}>
        <div
          className="passport-progress-fill"
          style={{ width: `${Math.max(4, regionStats.percent)}%` }}
        />
      </div>

      <div className="region-grid">
        {regionStats.regions.map((reg) => {
          const isActive = activeRegion === reg.id;
          return (
            <button
              key={reg.id}
              type="button"
              className={`region-card ${reg.unlocked ? "unlocked" : "locked"} ${reg.mastered ? "mastered" : ""} ${isActive ? "active" : ""}`}
              onClick={() => onSelectRegion(isActive ? "all" : reg.id)}
              title={`Click to filter Medal Wall to ${reg.id}`}
            >
              <div className="region-card-top">
                <span className="region-emoji">{reg.icon}</span>
                {reg.mastered ? (
                  <span className="pm-tier-pill gold">Mastered</span>
                ) : reg.unlocked ? (
                  <span className="region-check">
                    <CheckCircle2 size={15} />
                  </span>
                ) : (
                  <span className="region-lock">
                    <Lock size={13} />
                  </span>
                )}
              </div>
              <div className="region-name">{reg.id}</div>
              <div className="region-towns">{reg.towns}</div>
              <div className="region-foot">
                <span>
                  {reg.raceCount} {reg.raceCount === 1 ? "finish" : "finishes"}
                </span>
                <span>
                  {reg.caughtMedals}/{reg.totalMedals} medals
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
