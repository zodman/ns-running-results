import React, { useState } from "react";
import { HelpCircle, Lock, MapPin, Share2 } from "lucide-react";
import { NS_REGIONS } from "../utils/passportCatalog";
import InfoModal from "./InfoModal.jsx";

export default function RegionBadges({ regionStats, activeRegion, onSelectRegion, onShareRegion }) {
  const [showInfo, setShowInfo] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const lockedCount = Math.max(0, regionStats.totalRegions - regionStats.unlockedCount);

  const visibleRegions = regionStats.regions.filter((reg) => {
    if (statusFilter === "unlocked") return reg.unlocked;
    if (statusFilter === "locked") return !reg.unlocked;
    return true;
  });

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
        <div className="trophy-head-actions">
          <div className="region-score-pill">
            <strong>{regionStats.unlockedCount}</strong> / {regionStats.totalRegions} Regions
          </div>

          {onShareRegion && regionStats.unlockedCount > 0 && (
            <button
              type="button"
              className="trophy-head-share-btn"
              onClick={() => onShareRegion({ id: "regions:all" })}
              title="Share your Captured Nova Scotia Regions"
            >
              <Share2 size={13} />
              <span>Share</span>
            </button>
          )}
        </div>
      </div>

      <div className="passport-progress-track" style={{ margin: "14px 0 16px" }}>
        <div
          className="passport-progress-fill"
          style={{ width: `${Math.max(4, regionStats.percent)}%` }}
        />
      </div>

      {/* Segmented Filter Toggle: All | Unlocked | Locked */}
      <div className="trophy-filter-bar">
        <div className="graph-mode-tabs trophy-filter-tabs">
          <button
            type="button"
            className={`graph-tab ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All ({regionStats.totalRegions})
          </button>
          <button
            type="button"
            className={`graph-tab ${statusFilter === "unlocked" ? "active" : ""}`}
            onClick={() => setStatusFilter("unlocked")}
          >
            📍 Unlocked ({regionStats.unlockedCount})
          </button>
          <button
            type="button"
            className={`graph-tab ${statusFilter === "locked" ? "active" : ""}`}
            onClick={() => setStatusFilter("locked")}
          >
            🔒 Locked ({lockedCount})
          </button>
        </div>
      </div>

      <div className="region-grid">
        {visibleRegions.map((reg) => {
          const isActive = activeRegion === reg.id;
          return (
            <div
              key={reg.id}
              role="button"
              tabIndex={0}
              className={`region-card ${reg.unlocked ? "unlocked" : "locked"} ${reg.mastered ? "mastered" : ""} ${isActive ? "active" : ""}`}
              onClick={() => onSelectRegion(isActive ? "all" : reg.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectRegion(isActive ? "all" : reg.id);
                }
              }}
              title={`Click to filter Medal Wall to ${reg.id}`}
            >
              <div className="region-card-visual">
                <span className="region-emoji" aria-hidden="true">{reg.icon}</span>
                {reg.mastered ? (
                  <span className="pm-tier-pill gold">★ Mastered</span>
                ) : !reg.unlocked ? (
                  <span className="region-lock" title="Locked">
                    <Lock size={12} />
                    <span>Locked</span>
                  </span>
                ) : null}
              </div>

              <div className="region-card-content">
                <div className="region-card-head-row">
                  <h4 className="region-name">{reg.id}</h4>
                </div>
                <p className="region-towns" title={reg.towns}>{reg.towns}</p>
                <div className="trophy-progress-row">
                  <span className="trophy-progress-label">Finishes</span>
                  <span className="trophy-progress-val">
                    {reg.raceCount} {reg.raceCount === 1 ? "finish" : "finishes"} • {reg.caughtMedals}/{reg.totalMedals} medals
                  </span>
                </div>
              </div>

              {reg.unlocked && onShareRegion && (
                <button
                  type="button"
                  className="pm-share-btn region-card-share-btn"
                  title={`Share ${reg.id} Region`}
                  aria-label={`Share ${reg.id} Region`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onShareRegion(reg);
                  }}
                >
                  <Share2 size={11} />
                  <span>Share</span>
                </button>
              )}
            </div>
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
