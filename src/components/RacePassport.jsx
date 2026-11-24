import React, { useMemo, useState } from "react";
import { Award, CheckCircle2, Lock, MapPin, Sparkles } from "lucide-react";
import { evaluatePassport, evaluateRegions, evaluateTrophies } from "../utils/passportCatalog";
import RegionBadges from "./RegionBadges.jsx";
import TrophyShelf from "./TrophyShelf.jsx";

export default function RacePassport({ runnerName, races, onSelectRace }) {
  const [statusFilter, setStatusFilter] = useState("all"); // all | caught | locked
  const [regionFilter, setRegionFilter] = useState("all");

  const passport = useMemo(() => evaluatePassport(races), [races]);
  const regionStats = useMemo(() => evaluateRegions(races, passport), [races, passport]);
  const trophyStats = useMemo(
    () => evaluateTrophies(races, passport, regionStats),
    [races, passport, regionStats]
  );

  const visibleEntries = useMemo(() => {
    return passport.entries
      .filter((e) => {
        if (statusFilter === "caught" && !e.caught) return false;
        if (statusFilter === "locked" && e.caught) return false;
        if (regionFilter !== "all" && e.region !== regionFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.caught !== b.caught) return a.caught ? -1 : 1;
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });
  }, [passport.entries, statusFilter, regionFilter]);

  return (
    <section className="passport-wrap">
      {/* Passport Progress Hero */}
      <div className="card passport-hero">
        <div className="passport-hero-top">
          <div>
            <div className="passport-eyebrow">
              <Sparkles size={14} />
              <span>Nova Scotia Race Passport • Catch &apos;Em All</span>
            </div>
            <h2>{runnerName}&apos;s Medal Wall</h2>
            <p>
              Collect official finisher medals across {passport.totalCount} iconic Nova Scotia
              races. Run the same race 2× for <strong>Silver</strong> and 3+× for{" "}
              <strong>Gold Loyalist</strong>!
            </p>
          </div>
          <div className="passport-score-box">
            <div className="passport-score-big">
              {passport.caughtCount}
              <span> / {passport.totalCount}</span>
            </div>
            <div className="passport-score-pct">{passport.percent}% Collected</div>
          </div>
        </div>

        <div className="passport-progress-track">
          <div
            className="passport-progress-fill"
            style={{ width: `${Math.max(3, passport.percent)}%` }}
          />
        </div>

        {/* Status & Region Filters */}
        <div className="passport-filters">
          <div className="graph-mode-tabs">
            {[
              { id: "all", label: `All (${passport.totalCount})` },
              { id: "caught", label: `Caught (${passport.caughtCount})` },
              { id: "locked", label: `Locked (${passport.totalCount - passport.caughtCount})` }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                className={`graph-tab ${statusFilter === t.id ? "active" : ""}`}
                onClick={() => setStatusFilter(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <select
            className="year-select"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            aria-label="Filter medals by Nova Scotia region"
          >
            <option value="all">All NS Regions</option>
            {passport.regions.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* #2: Capture Nova Scotia — 7 Regions */}
      <RegionBadges
        regionStats={regionStats}
        activeRegion={regionFilter}
        onSelectRegion={setRegionFilter}
      />

      {/* #4: Auto-Unlocked Achievement Trophies */}
      <TrophyShelf trophyStats={trophyStats} />

      {/* #1: Medal Grid */}
      <div className="passport-grid">
        {visibleEntries.map((item) => (
          <article
            key={item.id}
            className={`passport-medal-card ${item.caught ? `caught tier-${item.tier}` : "locked"}`}
            onClick={() => {
              if (item.caught && item.bestRaceIdx !== null) {
                onSelectRace(item.bestRaceIdx);
              }
            }}
            title={
              item.caught
                ? `Click to view your best ${item.name} result (${item.bestTime})`
                : `${item.name} — Usually held in ${item.month}`
            }
          >
            <div className="pm-top-row">
              <span className="pm-region">{item.region}</span>
              {item.caught ? (
                <span className={`pm-tier-pill ${item.tier}`}>
                  <Award size={12} />
                  <span>
                    {item.tier === "gold"
                      ? `Gold ×${item.count}`
                      : item.tier === "silver"
                        ? `Silver ×${item.count}`
                        : "Caught"}
                  </span>
                </span>
              ) : (
                <span className="pm-lock-pill">
                  <Lock size={11} />
                  <span>{item.month}</span>
                </span>
              )}
            </div>

            <div className="pm-emblem-wrap">
              <div
                className={`pm-emblem ${item.caught ? "" : "silhouette"}`}
                style={
                  item.caught && !item.logo
                    ? { background: `linear-gradient(135deg, ${item.color}, #040b17)` }
                    : undefined
                }
              >
                {item.logo ? (
                  <img src={item.logo} alt={item.name} />
                ) : (
                  <span className="pm-short">{item.short}</span>
                )}
              </div>
              {item.caught && (
                <span className="pm-check-badge">
                  <CheckCircle2 size={16} />
                </span>
              )}
            </div>

            <h3 className="pm-name">{item.name}</h3>
            <div className="pm-loc">
              <MapPin size={12} />
              <span>{item.location}</span>
            </div>

            {item.caught ? (
              <div className="pm-stats">
                <div className="pm-best-time">{item.bestTime}</div>
                <div className="pm-years">{item.years.join(" • ")}</div>
              </div>
            ) : (
              <div className="pm-locked-hint">Not yet raced • {item.month}</div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
