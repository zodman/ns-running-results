import React from "react";
import { CheckCircle2, Lock, Trophy } from "lucide-react";

export default function TrophyShelf({ trophyStats }) {
  return (
    <section className="card trophy-section">
      <div className="region-head">
        <div>
          <div className="card-title">
            <span className="card-title-icon">
              <Trophy size={16} />
            </span>
            <span>Achievement Trophies</span>
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
              <div className="trophy-desc">{t.desc}</div>
              <div className="trophy-progress">{t.progress}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
