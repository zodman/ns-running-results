import React, { useEffect, useMemo, useState } from "react";
import { Award, HelpCircle, Lock, MapPin, Share2, Sparkles } from "lucide-react";
import {
  PASSPORT_RANKS,
  evaluatePassport,
  evaluateRegions,
  evaluateTrophies
} from "../utils/passportCatalog";
import { renderPassportShareCard } from "../utils/shareCardCanvas";
import RegionBadges from "./RegionBadges.jsx";
import TrophyShelf from "./TrophyShelf.jsx";
import RaceMedal from "./RaceMedal.jsx";
import InfoModal from "./InfoModal.jsx";
import SharePassportModal from "./SharePassportModal.jsx";

const SHOW_REGIONS = true;
const SHOW_TROPHIES = true;

export default function RacePassport({ runnerName, races, onSelectRace }) {
  const [statusFilter, setStatusFilter] = useState("all"); // all | caught | locked
  const [regionFilter, setRegionFilter] = useState("all");
  const [seasonFilter, setSeasonFilter] = useState("all"); // all | "2026" | "2025" ...
  const [showMedalInfo, setShowMedalInfo] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const availableSeasons = useMemo(() => {
    const yrs = new Set();
    for (const r of races) {
      const d = new Date(r.iso);
      if (!Number.isNaN(d.getTime())) yrs.add(String(d.getFullYear()));
    }
    return [...yrs].sort((a, b) => Number(b) - Number(a));
  }, [races]);

  const seasonRaces = useMemo(() => {
    if (seasonFilter === "all") return races;
    return races.filter((r) => {
      const d = new Date(r.iso);
      return !Number.isNaN(d.getTime()) && String(d.getFullYear()) === seasonFilter;
    });
  }, [races, seasonFilter]);

  const passport = useMemo(() => evaluatePassport(seasonRaces), [seasonRaces]);
  const regionStats = useMemo(
    () => evaluateRegions(seasonRaces, passport),
    [seasonRaces, passport]
  );
  const trophyStats = useMemo(
    () => evaluateTrophies(seasonRaces, passport, regionStats),
    [seasonRaces, passport, regionStats]
  );

  // Pre-generate & cache this runner's 1200x630 personalized OG card in the background
  // so pasting /?name=...&tab=passport into Facebook immediately shows their own medal card
  useEffect(() => {
    if (!runnerName || seasonFilter !== "all" || !races.length) return;
    let cancelled = false;
    renderPassportShareCard({
      runnerName,
      seasonLabel: "All-Time",
      passport,
      regionStats,
      trophyStats,
      format: "og"
    })
      .then((res) => {
        if (cancelled || !res?.jpegBase64) return;
        const summary = `${passport.caughtCount}/${passport.totalCount} NS Race Medals (${passport.percent}%) • ${regionStats.unlockedCount}/7 Regions • ${trophyStats.unlockedCount}/${trophyStats.totalCount} Trophies • ${passport.rank.current.title}`;
        return fetch("/api/ns-share-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: runnerName,
            summary,
            imageBase64: res.jpegBase64
          })
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [runnerName, seasonFilter, races.length, passport, regionStats, trophyStats]);

  // SVG ring geometry (r = 56 => circumference ~ 351.86)
  const ringRadius = 56;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - passport.percent / 100);

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
            <div className="passport-eyebrow-row">
              <div className="passport-eyebrow">
                <Sparkles size={14} />
                <span>Nova Scotia Race Passport • Catch &apos;Em All</span>
              </div>
              <button
                type="button"
                className="info-help-btn on-hero"
                onClick={() => setShowMedalInfo(true)}
                title="How the Medal Wall works"
              >
                <HelpCircle size={14} />
                <span>Details</span>
              </button>
              <button
                type="button"
                className="share-hero-btn"
                onClick={() => setShowShareModal(true)}
                title="Share your Race Passport as an image or web embed"
              >
                <Share2 size={14} />
                <span>Share</span>
              </button>
            </div>
            <h2>{runnerName}&apos;s Medal Wall</h2>
            <div className="passport-rank-row">
              <div className="passport-tier-summary">
                <span className={`pts-pill gold ${passport.tiers.gold > 0 ? "active" : ""}`}>
                  🥇 {passport.tiers.gold} Gold
                </span>
                <span className={`pts-pill silver ${passport.tiers.silver > 0 ? "active" : ""}`}>
                  🥈 {passport.tiers.silver} Silver
                </span>
                <span className={`pts-pill bronze ${passport.tiers.bronze > 0 ? "active" : ""}`}>
                  🥉 {passport.tiers.bronze} Bronze
                </span>
              </div>
            </div>
            <p>
              Collect official finisher medals across {passport.totalCount} iconic Nova Scotia
              races. Run the same race 2× for <strong>Silver</strong> and 3+× for{" "}
              <strong>Gold Loyalist</strong>!
            </p>
          </div>

          <div className="passport-score-col">
            <div className="passport-ring-box" aria-label={`${passport.percent}% Collected`}>
              <svg className="passport-ring-svg" viewBox="0 0 132 132" width="132" height="132">
                <circle className="passport-ring-bg" cx="66" cy="66" r={ringRadius} />
                <circle
                  className="passport-ring-fg"
                  cx="66"
                  cy="66"
                  r={ringRadius}
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                />
              </svg>
              <div className="passport-ring-center">
                <div className="passport-score-big">
                  {passport.caughtCount}
                  <span>/{passport.totalCount}</span>
                </div>
                <div className="passport-score-pct">{passport.percent}%</div>
              </div>
            </div>
            <span className="passport-rank-badge">
              <span aria-hidden="true">{passport.rank.current.icon}</span>
              <span>{passport.rank.current.title}</span>
            </span>
          </div>
        </div>

        <div className="passport-progress-wrap">
          <div className="passport-progress-track">
            <div
              className="passport-progress-fill"
              style={{ width: `${Math.max(passport.percent > 0 ? 3 : 0, passport.percent)}%` }}
            />
            {[25, 50, 75].map((tick) => (
              <span
                key={tick}
                className={`passport-tick ${passport.percent >= tick ? "reached" : ""}`}
                style={{ left: `${tick}%` }}
                title={`${tick}% milestone`}
              />
            ))}
          </div>
          <div className="passport-progress-meta">
            <span className="passport-nudge">
              {passport.rank.next ? (
                <>
                  <strong>
                    {passport.rank.racesToNext}{" "}
                    {passport.rank.racesToNext === 1 ? "more race" : "more races"}
                  </strong>{" "}
                  to reach{" "}
                  <strong>
                    {passport.rank.next.icon} {passport.rank.next.title}
                  </strong>{" "}
                  ({passport.rank.nextTarget}/{passport.totalCount})
                </>
              ) : (
                <>👑 All {passport.totalCount} Nova Scotia Passport medals collected!</>
              )}
            </span>
            <span className="passport-milestones-labels">
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </span>
          </div>
        </div>

        {/* Season, Status & Region Filters */}
        <div className="passport-filters">
          <div className="passport-filter-selects">
            {availableSeasons.length > 0 && (
              <select
                className="year-select"
                value={seasonFilter}
                onChange={(e) => setSeasonFilter(e.target.value)}
                aria-label="Filter passport by season year"
              >
                <option value="all">All-Time Passport</option>
                {availableSeasons.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr} Season
                  </option>
                ))}
              </select>
            )}

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
      {SHOW_REGIONS && (
        <RegionBadges
          regionStats={regionStats}
          activeRegion={regionFilter}
          onSelectRegion={setRegionFilter}
        />
      )}

      {/* #4: Auto-Unlocked Achievement Trophies */}
      {SHOW_TROPHIES && <TrophyShelf trophyStats={trophyStats} />}

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
              <RaceMedal item={item} />
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
      {/* Share Passport Modal (PNG Image + Link & Web Embed) */}
      <SharePassportModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        runnerName={runnerName}
        seasonFilter={seasonFilter}
        passport={passport}
        regionStats={regionStats}
        trophyStats={trophyStats}
      />

      {/* #1 Medal Wall Details Modal */}
      <InfoModal
        open={showMedalInfo}
        title="NS Race Passport — Medal Wall Guide"
        icon={<Award size={18} />}
        onClose={() => setShowMedalInfo(false)}
      >
        <p className="im-lead">
          Your Medal Wall tracks official finishes across{" "}
          <strong>{passport.totalCount} iconic recurring Nova Scotia races</strong> from both{" "}
          <strong>Atlantic Chip</strong> and <strong>Route541</strong>.
        </p>

        <h4 className="im-subhead">Medal Tiers</h4>
        <ul className="im-list">
          <li>
            <strong>🔒 Locked:</strong> Not yet raced — shows the typical month the event is held so
            you can plan your next race.
          </li>
          <li>
            <strong>🥉 Bronze (1× Finish):</strong> Unlocked on your first official finish, showing
            your best time and year.
          </li>
          <li>
            <strong>🥈 Silver (2× Finishes):</strong> Run the same annual race twice to upgrade your
            medal to brushed silver.
          </li>
          <li>
            <strong>🥇 Gold Loyalist (3+× Finishes):</strong> Complete the same race 3 or more times
            for a shimmering gold medal.
          </li>
        </ul>

        <h4 className="im-subhead">Passport Ranks</h4>
        <div className="im-rank-grid">
          {PASSPORT_RANKS.map((r, i) => {
            const nextMin = PASSPORT_RANKS[i + 1]?.min;
            const range =
              r.min === 0
                ? "0 races"
                : nextMin
                  ? `${r.min}–${nextMin - 1} races`
                  : `${r.min}/${passport.totalCount}`;
            return (
              <div key={r.title} className="im-rank-item">
                <span>
                  {r.icon} <strong>{r.title}</strong>
                </span>
                <span className="im-muted">{range}</span>
              </div>
            );
          })}
        </div>

        <h4 className="im-subhead">Tips</h4>
        <ul className="im-list">
          <li>
            <strong>Click any caught medal</strong> to jump directly to your best official result on
            the main dashboard.
          </li>
          <li>
            Use <strong>All-Time Passport</strong> or pick a single <strong>Season Year</strong> to
            compare your yearly progress.
          </li>
        </ul>
      </InfoModal>
    </section>
  );
}
