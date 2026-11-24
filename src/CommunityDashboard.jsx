import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Award,
  BarChart3,
  Calendar,
  MapPin,
  Moon,
  Sun,
  Trophy,
  Users
} from "lucide-react";
import { getCommunityOverview } from "./lib/pocketbase";
import SiteFooter from "./SiteFooter.jsx";
import LoadingProgress from "./components/LoadingProgress.jsx";
import OpenSrcBanner from "./components/OpenSrcBanner.jsx";

export default function CommunityDashboard({ theme, onToggleTheme, onBack, onSelectRunner }) {
  const [year, setYear] = useState("all");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fastTab, setFastTab] = useState("5k");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getCommunityOverview(year)
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [year, retryCount]);

  const maxYearCount = Math.max(1, ...(data?.byYear || []).map((y) => y.count));
  const maxEventCount = Math.max(1, ...(data?.topEvents || []).map((e) => e.count));
  const maxCityCount = Math.max(1, ...(data?.topCities || []).map((c) => c.count));
  const fastestList =
    fastTab === "5k"
      ? data?.fastest5k || []
      : fastTab === "10k"
        ? data?.fastest10k || []
        : fastTab === "half"
          ? data?.fastestHalf || []
          : data?.fastestMarathon || [];

  return (
    <div className="container">
      <header className="topbar">
        <div className="brand">
          <div className="avatar">NS</div>
          <div className="brand-info">
            <h1>Nova Scotia Running Overview</h1>
            <p>All Participants • Full Route541 (2023–2026) Results &amp; Cached Atlantic Chip Lookups</p>
          </div>
        </div>
        <div className="controls">
          <button className="back-btn" type="button" onClick={onBack}>
            <ArrowLeft size={15} />
            <span>Home</span>
          </button>
          <select
            className="year-select"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            disabled={loading}
            aria-label="Filter community stats by year"
          >
            <option value="all">All Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
          <button className="theme-btn" type="button" onClick={onToggleTheme}>
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>
        </div>
      </header>

      {error && (
        <div className="status-banner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span>{error}</span>
          <button
            type="button"
            className="back-btn"
            style={{ padding: "4px 12px", fontSize: 13, cursor: "pointer" }}
            onClick={() => setRetryCount((c) => c + 1)}
          >
            Retry
          </button>
        </div>
      )}
      {loading && (
        <LoadingProgress
          key={year}
          title={`Loading ${year === "all" ? "all-time" : year} Nova Scotia community statistics`}
        />
      )}

      {!loading && data && (
        <>
          <div className="community-notice">
            <span>
              <strong>How this works:</strong> This dashboard combines full Route541 (2023–2026)
              events with public Atlantic Chip finishes cached automatically as runners look up
              their names. Want your name excluded? Open your runner profile and click{" "}
              <strong>Remove from Community</strong>.
            </span>
          </div>

          {/* Top 4 KPI Cards */}
          <section className="comm-kpi-grid">
            <div className="card comm-kpi-card accent">
              <div className="comm-kpi-icon">
                <Trophy size={20} />
              </div>
              <div className="comm-kpi-val">{data.totals.finishes.toLocaleString()}</div>
              <div className="comm-kpi-label">Total Finishes</div>
            </div>
            <div className="card comm-kpi-card">
              <div className="comm-kpi-icon">
                <Users size={20} />
              </div>
              <div className="comm-kpi-val">{data.totals.uniqueRunners.toLocaleString()}</div>
              <div className="comm-kpi-label">Unique Runners</div>
            </div>
            <div className="card comm-kpi-card">
              <div className="comm-kpi-icon">
                <Calendar size={20} />
              </div>
              <div className="comm-kpi-val">{data.totals.events.toLocaleString()}</div>
              <div className="comm-kpi-label">Timed Events</div>
            </div>
            <div className="card comm-kpi-card">
              <div className="comm-kpi-icon">
                <MapPin size={20} />
              </div>
              <div className="comm-kpi-val">{data.totals.cities.toLocaleString()}</div>
              <div className="comm-kpi-label">Hometowns Represented</div>
            </div>
          </section>

          {/* Main Bento Grid */}
          <main className="bento">
            {/* LEFT COLUMN */}
            <section className="col">
              {/* Most Active Runners */}
              <div className="card">
                <div className="card-title-row">
                  <div className="card-title">
                    <span className="card-title-icon">
                      <Users size={16} />
                    </span>
                    <span>Most Active Runners</span>
                  </div>
                  <span style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 600 }}>
                    Click any runner →
                  </span>
                </div>
                <p className="card-explain">
                  Runners with the highest number of recorded race finishes across Nova Scotia events.
                </p>
                <div className="rank-list" style={{ maxHeight: 460 }}>
                  {data.topRunners.map((r, i) => (
                    <div
                      key={r.name + i}
                      className="rank-item"
                      onClick={() => onSelectRunner(r.name)}
                      title={`View ${r.name}'s full race profile`}
                    >
                      <span className="rank-num">{String(i + 1).padStart(2, "0")}.</span>
                      <div className="rank-meta">
                        <div className="rank-name">{r.name}</div>
                        <div className="rank-sub">
                          {r.city || "Nova Scotia"}
                          {r.division ? ` • ${r.division}` : ""}
                        </div>
                      </div>
                      <div className="rank-score" style={{ color: "var(--rns-yellow)" }}>
                        {r.races} {r.races === 1 ? "race" : "races"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Finishes by Year */}
              <div className="card">
                <div className="card-title-row">
                  <div className="card-title">
                    <span className="card-title-icon">
                      <BarChart3 size={16} />
                    </span>
                    <span>Finishes by Year</span>
                  </div>
                </div>
                <p className="card-explain">
                  Official race finishes per year: full event totals from Route541 (2023–2026) plus cached Atlantic Chip runner lookups.
                </p>
                <div className="comm-bar-list">
                  {[...data.byYear]
                    .sort((a, b) => Number(b.year) - Number(a.year))
                    .map((item) => {
                      const ac = item.atlanticChip || 0;
                      const r541 = item.route541 || 0;
                      const acPct = (ac / maxYearCount) * 100;
                      const r541Pct = (r541 / maxYearCount) * 100;
                      return (
                        <div
                          key={item.year}
                          className="comm-year-row"
                          title={`${item.year}: ${ac.toLocaleString()} Atlantic Chip + ${r541.toLocaleString()} Route541`}
                        >
                          <div className="comm-bar-row">
                            <span className="comm-bar-label">{item.year}</span>
                            <div className="comm-bar-track">
                              {ac > 0 && (
                                <div
                                  className="comm-bar-seg-ac"
                                  style={{ width: `${Math.max(2, acPct)}%` }}
                                />
                              )}
                              {r541 > 0 && (
                                <div
                                  className="comm-bar-seg-r541"
                                  style={{ width: `${Math.max(2, r541Pct)}%` }}
                                />
                              )}
                            </div>
                            <span className="comm-bar-val">{item.count.toLocaleString()}</span>
                          </div>
                          <div className="comm-year-meta">
                            <span>
                              AC: {ac.toLocaleString()} • Route541: {r541.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div className="chart-legend" style={{ marginTop: 16 }}>
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: "#38bdf8" }} />
                    <span>Atlantic Chip</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: "#fef000" }} />
                    <span>Route541</span>
                  </div>
                </div>
              </div>

              {/* Top Hometowns */}
              <div className="card">
                <div className="card-title-row">
                  <div className="card-title">
                    <span className="card-title-icon">
                      <MapPin size={16} />
                    </span>
                    <span>Top Runner Hometowns</span>
                  </div>
                </div>
                <p className="card-explain">
                  Cities and towns with the highest number of participating runners.
                </p>
                <div className="comm-bar-list">
                  {data.topCities.map((c) => (
                    <div key={c.city} className="comm-bar-row">
                      <span className="comm-bar-label wide">{c.city}</span>
                      <div className="comm-bar-track">
                        <div
                          className="comm-bar-fill blue"
                          style={{ width: `${Math.max(6, (c.count / maxCityCount) * 100)}%` }}
                        />
                      </div>
                      <span className="comm-bar-val">{c.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* RIGHT COLUMN */}
            <section className="col">
              {/* Fastest 5K / 10K Leaderboard */}
              <div className="card">
                <div className="card-title-row">
                  <div className="card-title">
                    <span className="card-title-icon">
                      <Award size={16} />
                    </span>
                    <span>Fastest Times</span>
                  </div>
                  <div className="graph-mode-tabs">
                    {[
                      { id: "5k", label: "5K" },
                      { id: "10k", label: "10K" },
                      { id: "half", label: "Half" },
                      { id: "marathon", label: "Marathon" }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`graph-tab ${fastTab === t.id ? "active" : ""}`}
                        onClick={() => setFastTab(t.id)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="card-explain">
                  Fastest personal-best official finish times recorded per distance (one entry per runner).
                </p>
                <div className="rank-list" style={{ maxHeight: 420 }}>
                  {fastestList.length === 0 ? (
                    <div style={{ padding: "18px 8px", color: "var(--text-muted)", fontSize: 13 }}>
                      No finishers recorded for this distance in the selected year yet.
                    </div>
                  ) : (
                    fastestList.map((r, i) => (
                      <div
                        key={r.name + r.time + i}
                        className="rank-item"
                        onClick={() => onSelectRunner(r.name)}
                      >
                        <span className="rank-num">{String(i + 1).padStart(2, "0")}.</span>
                        <div className="rank-meta">
                          <div className="rank-name">{r.name}</div>
                          <div className="rank-sub">
                            {r.event} • {r.date}
                          </div>
                        </div>
                        <div className="rank-score" style={{ color: "var(--rns-yellow)" }}>
                          {r.time}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Largest Events */}
              <div className="card">
                <div className="card-title-row">
                  <div className="card-title">
                    <span className="card-title-icon">
                      <Trophy size={16} />
                    </span>
                    <span>Largest Events</span>
                  </div>
                  <span style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 600 }}>
                    By Finishers
                  </span>
                </div>
                <p className="card-explain">
                  Races with the highest number of timed finishers in our database (full event lists from Route541 2023–2026; Atlantic Chip races are looked up per runner on demand).
                </p>
                <div className="comm-bar-list">
                  {data.topEvents.map((ev) => (
                    <div key={ev.name + ev.date} className="comm-event-row">
                      <div className="comm-event-head">
                        <span className="comm-event-name">{ev.name}</span>
                        <span className="comm-bar-val">{ev.count}</span>
                      </div>
                      <div className="comm-event-sub">{ev.date}</div>
                      <div className="comm-bar-track">
                        <div
                          className="comm-bar-fill"
                          style={{ width: `${Math.max(8, (ev.count / maxEventCount) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Divisions */}
              <div className="card">
                <div className="card-title-row">
                  <div className="card-title">
                    <span className="card-title-icon">
                      <Users size={16} />
                    </span>
                    <span>Top Age Divisions</span>
                  </div>
                </div>
                <p className="card-explain">
                  Most common gender &amp; age-group race brackets (e.g. F30-39 = Women aged 30–39, M40-49 = Men aged 40–49).
                </p>
                <div className="summary-locs">
                  {[...data.topDivisions]
                    .sort((a, b) => {
                      const parseAge = (div) => {
                        const m = String(div).match(/^([MF])(\d+)/i);
                        return m ? [Number(m[2]), m[1].toUpperCase()] : [999, div];
                      };
                      const [ageA, genA] = parseAge(a.division);
                      const [ageB, genB] = parseAge(b.division);
                      if (ageA !== ageB) return ageA - ageB;
                      return genA.localeCompare(genB);
                    })
                    .map((d) => (
                      <span
                        key={d.division}
                        className="cat-pill"
                        style={{ cursor: "default", padding: "6px 13px" }}
                      >
                        <span>{d.division}</span>
                        <span className="cat-pill-count">{d.count}</span>
                      </span>
                    ))}
                </div>
              </div>
            </section>
          </main>
        </>
      )}
      <OpenSrcBanner className="community-banner" />
      <SiteFooter />
    </div>
  );
}
