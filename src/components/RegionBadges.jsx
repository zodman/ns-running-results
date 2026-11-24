import React, { useState } from "react";
import { CheckCircle2, HelpCircle, Lock, MapPin } from "lucide-react";
import { NS_REGIONS } from "../utils/passportCatalog";
import InfoModal from "./InfoModal.jsx";

export default function RegionBadges({ regionStats, activeRegion, onSelectRegion }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <section className="card region-section">
      <div className="region-head">
        <div>
          <div className="card-title">
            <span className="card-title-icon">
              <MapPin size={16} />
            </span>
            <span>Capture Nova Scotia — 7 Regions</span>
            <button
              type="button"
              className="info-help-btn"
              onClick={() => setShowInfo(true)}
              title="How Regions & Mastery work"
            >
              <HelpCircle size={14} />
              <span>Details</span>
            </button>
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
                <span className="region-foot-dot" aria-hidden="true">•</span>
                <span>
                  {reg.caughtMedals}/{reg.totalMedals} medals
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <InfoModal
        open={showInfo}
        title="Capture Nova Scotia — Region Rules"
        icon={<MapPin size={18} />}
        onClose={() => setShowInfo(false)}
      >
        <p className="im-lead">
          Every Nova Scotia race is grouped into one of the province&apos;s{" "}
          <strong>7 running regions</strong>. Explore the province to unlock and master them all!
        </p>

        <h4 className="im-subhead">Region States</h4>
        <ul className="im-list">
          <li>
            <strong>🔒 Locked:</strong> 0 finishes recorded in this region so far.
          </li>
          <li>
            <strong>✅ Unlocked:</strong> Complete at least <strong>1 official race</strong> in that
            region (counts both Passport catalog races and any other timed race in those towns).
          </li>
          <li>
            <strong>🥇 Mastered:</strong> Hit the region&apos;s finish milestone below (total
            official finishes in that region across any year).
          </li>
        </ul>

        <h4 className="im-subhead">Mastery Thresholds by Region</h4>
        <div className="im-rank-grid">
          {NS_REGIONS.map((reg) => (
            <div key={reg.id} className="im-rank-item">
              <span>
                {reg.icon} <strong>{reg.id}</strong>
              </span>
              <span className="im-muted">
                Unlock: 1 • Mastered: {reg.masteryAt}+ finishes
              </span>
            </div>
          ))}
        </div>

        <p className="im-footnote">
          Tip: Click any region card to filter the Medal Wall below to that region&apos;s races.
          Click it again to clear the filter.
        </p>
      </InfoModal>
    </section>
  );
}
