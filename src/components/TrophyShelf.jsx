import React, { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, HelpCircle, Lock, Share2, Trophy } from "lucide-react";
import InfoModal from "./InfoModal.jsx";

export default function TrophyShelf({ trophyStats, onShareTrophy }) {
  const [showInfo, setShowInfo] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "unlocked" | "locked"
  const [collapsed, setCollapsed] = useState(false);

  const lockedCount = trophyStats.totalCount - trophyStats.unlockedCount;

  const visibleTrophies = useMemo(() => {
    if (statusFilter === "unlocked") return trophyStats.trophies.filter((t) => t.unlocked);
    if (statusFilter === "locked") return trophyStats.trophies.filter((t) => !t.unlocked);
    return trophyStats.trophies;
  }, [trophyStats.trophies, statusFilter]);

  return (
    <section className="card trophy-section" aria-label="Achievement Trophies">
      <div className="region-head trophy-main-head">
        <div className="trophy-head-left">
          <div className="card-title">
            <span className="card-title-icon">
              <Trophy size={16} />
            </span>
            <span>Achievement Trophies</span>
            <button
              type="button"
              className="info-help-btn"
              onClick={() => setShowInfo(true)}
              title="How Achievement Trophies work"
            >
              <HelpCircle size={14} />
              <span>Details</span>
            </button>
          </div>
          <p className="card-explain" style={{ marginTop: 4, marginBottom: 0 }}>
            Automatically unlocked from your Nova Scotia race history — milestones, distances &amp; streaks.
          </p>
        </div>

        <div className="trophy-head-actions">
          <div className="region-score-pill">
            <strong>{trophyStats.unlockedCount}</strong> / {trophyStats.totalCount} Unlocked
          </div>

          {onShareTrophy && trophyStats.unlockedCount > 0 && (
            <button
              type="button"
              className="trophy-head-share-btn"
              onClick={() => onShareTrophy({ id: "shelf" })}
              title="Share your Achievement Trophies"
            >
              <Share2 size={13} />
              <span>Share</span>
            </button>
          )}

          <button
            type="button"
            className="trophy-toggle-btn"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand trophies" : "Collapse trophies"}
            aria-label={collapsed ? "Expand Achievement Trophies" : "Collapse Achievement Trophies"}
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            <span>{collapsed ? "Show" : "Hide"}</span>
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Segmented Filter Toggle: All | Unlocked | Locked */}
          <div className="trophy-filter-bar">
            <div className="graph-mode-tabs trophy-filter-tabs">
              <button
                type="button"
                className={`graph-tab ${statusFilter === "all" ? "active" : ""}`}
                onClick={() => setStatusFilter("all")}
              >
                All ({trophyStats.totalCount})
              </button>
              <button
                type="button"
                className={`graph-tab ${statusFilter === "unlocked" ? "active" : ""}`}
                onClick={() => setStatusFilter("unlocked")}
              >
                🏆 Unlocked ({trophyStats.unlockedCount})
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

          <div className="trophy-grid">
            {visibleTrophies.map((t) => (
              <div key={t.id} className={`trophy-card ${t.unlocked ? "unlocked" : "locked"}`}>
                <div className="trophy-card-head">
                  <div className="trophy-title-wrap">
                    <span className="trophy-icon-disc" aria-hidden="true">{t.icon}</span>
                    <strong className="trophy-title">{t.title}</strong>
                  </div>
                  <div className="trophy-status-wrap">
                    {t.unlocked ? (
                      <span className="trophy-status unlocked">
                        <CheckCircle2 size={12} />
                        <span>Unlocked</span>
                      </span>
                    ) : (
                      <span className="trophy-status locked">
                        <Lock size={11} />
                        <span>Locked</span>
                      </span>
                    )}
                  </div>
                </div>

                <p className="trophy-desc">{t.desc}</p>

                <div className="trophy-progress-row">
                  <span className="trophy-progress-label">Progress:</span>
                  <span className="trophy-progress-val">{t.progress}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {collapsed && (
        <div className="trophy-collapsed-bar" onClick={() => setCollapsed(false)}>
          <span className="trophy-collapsed-preview">
            {trophyStats.trophies
              .filter((t) => t.unlocked)
              .slice(0, 6)
              .map((t) => (
                <span key={t.id} className="trophy-collapsed-icon" title={t.title}>
                  {t.icon}
                </span>
              ))}
          </span>
          <span className="trophy-collapsed-text">
            <strong>{trophyStats.unlockedCount}</strong> of {trophyStats.totalCount} trophies unlocked — click to expand
          </span>
        </div>
      )}

      <InfoModal
        open={showInfo}
        title="Achievement Trophies — How to Unlock"
        icon={<Trophy size={18} />}
        onClose={() => setShowInfo(false)}
      >
        <p className="im-lead">
          All <strong>{trophyStats.totalCount} Achievement Trophies</strong> are computed
          automatically from your official Nova Scotia race history — no manual tracking needed.
        </p>

        <h4 className="im-subhead">All Trophies</h4>
        <div className="im-rank-grid">
          {trophyStats.trophies.map((t) => (
            <div key={t.id} className="im-rank-item">
              <span>
                {t.icon} <strong>{t.title}</strong>
              </span>
              <span className="im-muted">{t.desc}</span>
            </div>
          ))}
        </div>
      </InfoModal>
    </section>
  );
}
