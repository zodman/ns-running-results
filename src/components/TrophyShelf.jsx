import React, { useState } from "react";
import { CheckCircle2, HelpCircle, Lock, Trophy } from "lucide-react";
import InfoModal from "./InfoModal.jsx";

export default function TrophyShelf({ trophyStats }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <section className="card trophy-section">
      <div className="region-head">
        <div>
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
            Automatically unlocked from your Nova Scotia race history — milestones, streaks, and
            distance challenges.
          </p>
        </div>
        <div className="region-score-pill">
          <strong>{trophyStats.unlockedCount}</strong> / {trophyStats.totalCount} Unlocked
        </div>
      </div>

      <div className="trophy-grid">
        {trophyStats.trophies.map((t) => (
          <div key={t.id} className={`trophy-card ${t.unlocked ? "unlocked" : "locked"}`}>
            <div className="trophy-icon-wrap">
              <span className="trophy-icon">{t.icon}</span>
            </div>
            <div className="trophy-body">
              <div className="trophy-title-row">
                <span className="trophy-title">{t.title}</span>
                {t.unlocked ? (
                  <span className="trophy-status unlocked">
                    <CheckCircle2 size={13} />
                    <span>Unlocked</span>
                  </span>
                ) : (
                  <span className="trophy-status locked">
                    <Lock size={12} />
                    <span>Locked</span>
                  </span>
                )}
              </div>
              <p className="trophy-desc">{t.desc}</p>
              <div className="trophy-progress">{t.progress}</div>
            </div>
          </div>
        ))}
      </div>

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
