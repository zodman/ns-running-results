import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Award, LayoutGrid, Moon, Search, Sun, UserX, Users } from "lucide-react";
import { optOutRunner, searchRunner } from "./lib/pocketbase";
import CommunityDashboard from "./CommunityDashboard.jsx";
import SiteFooter from "./SiteFooter.jsx";
import LandingPage from "./components/LandingPage.jsx";
import TimelineGraph from "./components/TimelineGraph.jsx";
import RaceDetailsColumn from "./components/RaceDetailsColumn.jsx";
import RaceFeedColumn from "./components/RaceFeedColumn.jsx";
import CategoryFilterBar from "./components/CategoryFilterBar.jsx";
import BottomNav from "./components/BottomNav.jsx";
import RacePassport from "./components/RacePassport.jsx";
import { evaluatePassport, evaluateRegions, evaluateTrophies } from "./utils/passportCatalog";
import { renderPassportShareCard } from "./utils/shareCardCanvas";
import {
  CATEGORY_ORDER,
  computeHistoryStats,
  initials,
  normalizeResults
} from "./utils/raceUtils";

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [view, setView] = useState("landing"); // landing | runner | community
  const [queryInput, setQueryInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [year, setYear] = useState("all");
  const [filterTab, setFilterTab] = useState("all");
  const [graphMode, setGraphMode] = useState("time");
  const [runnerTab, setRunnerTab] = useState("dashboard"); // dashboard | passport
  const [saveToCommunity, setSaveToCommunity] = useState(true);
  const [optOutDone, setOptOutDone] = useState(false);
  const [races, setRaces] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [sources, setSources] = useState({ atlanticChip: 0, route541: 0 });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  async function runSearch(name, yr) {
    const clean = name.trim();
    if (!clean) return;
    setView("runner");
    setQueryInput(clean);
    setLoading(true);
    setActiveQuery(clean);
    setStatusMsg(`Searching Atlantic Chip & Route541 for "${clean}"...`);

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete("view");
    nextUrl.searchParams.set("name", clean);
    if (yr && yr !== "all") nextUrl.searchParams.set("year", yr);
    else nextUrl.searchParams.delete("year");
    window.history.replaceState({}, "", nextUrl.toString());

    try {
      setOptOutDone(false);
      const data = await searchRunner(clean, yr, { saveToCommunity });
      const norm = normalizeResults(data.results || []);
      setRaces(norm);
      setSources(data.sources || { atlanticChip: 0, route541: 0 });
      setFilterTab("all");
      if (norm.length) {
        const pb = norm.find((r) => r.isPB);
        setSelectedIdx(pb ? pb.idx : 0);
        setStatusMsg("");
      } else {
        setSelectedIdx(0);
        setStatusMsg(`No results found for "${clean}". Try another name or select "All Years".`);
      }
    } catch (err) {
      setRaces([]);
      setStatusMsg(`Unable to load race results right now: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function resetToLanding() {
    setView("landing");
    setQueryInput("");
    setActiveQuery("");
    setRaces([]);
    setStatusMsg("");
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete("name");
    nextUrl.searchParams.delete("year");
    nextUrl.searchParams.delete("view");
    window.history.replaceState({}, "", nextUrl.toString());
  }

  function openCommunity() {
    setView("community");
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete("name");
    nextUrl.searchParams.delete("year");
    nextUrl.searchParams.set("view", "community");
    window.history.replaceState({}, "", nextUrl.toString());
  }

  const [isEmbed, setIsEmbed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlName = params.get("name");
    const urlYear = params.get("year") || "all";
    const urlView = params.get("view");
    const urlTab = params.get("tab");
    const embedMode = params.get("embed") === "1";
    setIsEmbed(embedMode);
    if (urlTab === "passport") {
      setRunnerTab("passport");
    }
    if (urlView === "community") {
      setView("community");
    } else if (urlName) {
      setYear(urlYear);
      runSearch(urlName, urlYear);
    }
  }, []);

  const categoryCounts = useMemo(() => {
    const counts = { All: races.length };
    for (const cat of CATEGORY_ORDER) {
      counts[cat] = races.filter((r) => r.category === cat).length;
    }
    return counts;
  }, [races]);

  const filteredRaces = useMemo(() => {
    if (filterTab === "all") return races;
    if (filterTab === "fastest") return races.filter((r) => r.isPB);
    return races.filter((r) => r.category === filterTab);
  }, [races, filterTab]);

  const selected =
    filteredRaces.find((r) => r.idx === selectedIdx) ||
    filteredRaces[0] ||
    races[selectedIdx] ||
    races[0] ||
    null;

  const pbRace = useMemo(
    () => filteredRaces.find((r) => r.isPB) || races.find((r) => r.isPB) || null,
    [filteredRaces, races]
  );

  const sortedBySpeed = useMemo(
    () => [...filteredRaces].sort((a, b) => (a.officialSec || 999999) - (b.officialSec || 999999)),
    [filteredRaces]
  );

  const chartRaces = useMemo(() => [...filteredRaces].slice(0, 8).reverse(), [filteredRaces]);
  const maxSec = useMemo(
    () => Math.max(1, ...chartRaces.map((r) => r.gunSec || r.officialSec || 1)),
    [chartRaces]
  );

  const totalKm = useMemo(() => races.reduce((acc, r) => acc + (r.km || 0), 0), [races]);
  const historyStats = useMemo(() => computeHistoryStats(races), [races]);
  const passportSummary = useMemo(() => evaluatePassport(races), [races]);
  const regionSummary = useMemo(
    () => evaluateRegions(races, passportSummary),
    [races, passportSummary]
  );
  const trophySummary = useMemo(
    () => evaluateTrophies(races, passportSummary, regionSummary),
    [races, passportSummary, regionSummary]
  );

  const primaryRunner = races[0]?.participant || activeQuery;

  // Automatically generate & cache this runner's 1200x630 personalized OG share card
  // whenever any profile /?name=<name> loads (even before clicking the Passport tab!)
  useEffect(() => {
    if (view !== "runner" || !primaryRunner || !races.length || year !== "all") return;
    let cancelled = false;
    renderPassportShareCard({
      runnerName: primaryRunner,
      seasonLabel: "All-Time",
      passport: passportSummary,
      regionStats: regionSummary,
      trophyStats: trophySummary,
      format: "og"
    })
      .then((res) => {
        if (cancelled || !res?.jpegBase64) return;
        const summary = `${passportSummary.caughtCount}/${passportSummary.totalCount} NS Race Medals (${passportSummary.percent}%) • ${regionSummary.unlockedCount}/7 Regions • ${trophySummary.unlockedCount}/${trophySummary.totalCount} Trophies • ${passportSummary.rank.current.title}`;
        return fetch("/api/ns-share-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: primaryRunner,
            summary,
            imageBase64: res.jpegBase64
          })
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [view, primaryRunner, races.length, year, passportSummary, regionSummary, trophySummary]);
  const primaryCity = races.find((r) => r.city)?.city || "Nova Scotia";
  const primaryDiv = races.find((r) => r.division && r.division !== "—")?.division;
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  async function handleOptOut() {
    const targetName = primaryRunner || activeQuery;
    if (!targetName) return;
    const confirmed = window.confirm(
      `Remove "${targetName}" from the Community Dashboard and opt out of future community caching?`
    );
    if (!confirmed) return;
    try {
      await optOutRunner(targetName);
      setOptOutDone(true);
      setStatusMsg(
        `"${targetName}" has been removed from the Community Dashboard and opted out of future community caching.`
      );
    } catch (err) {
      setStatusMsg(`Could not complete opt-out: ${err.message}`);
    }
  }

  if (view === "community") {
    return (
      <CommunityDashboard
        theme={theme}
        onToggleTheme={toggleTheme}
        onBack={resetToLanding}
        onSelectRunner={(runnerName) => runSearch(runnerName, "all")}
      />
    );
  }

  if (view === "landing") {
    return (
      <LandingPage
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenCommunity={openCommunity}
        queryInput={queryInput}
        onQueryChange={setQueryInput}
        year={year}
        onYearChange={setYear}
        saveToCommunity={saveToCommunity}
        onToggleSaveToCommunity={setSaveToCommunity}
        loading={loading}
        onSearch={runSearch}
      />
    );
  }

  return (
    <div className="container">
      {!isEmbed && (
        <>
          {/* Top Bar */}
          <header className="topbar">
        <div className="brand">
          <div className="avatar">{initials(primaryRunner)}</div>
          <div className="brand-info">
            <h1>{primaryRunner}</h1>
            <p>
              {primaryCity}
              {primaryDiv ? ` • Division ${primaryDiv}` : ""} • {races.length} official finish
              {races.length === 1 ? "" : "es"}
            </p>
          </div>
        </div>

        <div className="controls">
          <button className="back-btn" type="button" onClick={resetToLanding}>
            <ArrowLeft size={15} />
            <span>Home</span>
          </button>
          <button className="comm-cta-btn" type="button" onClick={openCommunity}>
            <Users size={15} />
            <span>All Participants</span>
          </button>
          {races.length > 0 && (
            <button
              className="optout-btn"
              type="button"
              disabled={optOutDone}
              onClick={handleOptOut}
              title="Remove this name from the Community Dashboard"
            >
              <UserX size={15} />
              <span>{optOutDone ? "Removed from Community" : "Remove from Community"}</span>
            </button>
          )}
          <div className="ac-chip-badge" title="Official results from Atlantic Chip & Route541">
            <img src="/logos/atlantic_chip.png" alt="Atlantic Chip" />
            <span>Atlantic Chip + Route541</span>
          </div>
          <button className="theme-btn" type="button" onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>
        </div>
      </header>

      {/* Search Form */}
      <form
        className="search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(queryInput, year);
        }}
      >
        <Search size={18} style={{ opacity: 0.65 }} />
        <input
          className="search-input"
          type="text"
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder="Enter any runner's name (e.g. Andres Vargas, Dana Baroni)..."
        />
        <select
          className="year-select"
          value={year}
          onChange={(e) => {
            setYear(e.target.value);
            runSearch(queryInput, e.target.value);
          }}
        >
          <option value="all">All Years</option>
          <option value="2026">2026 Only</option>
          <option value="2025">2025 Only</option>
          <option value="2024">2024 Only</option>
        </select>
        <button className="search-submit" type="submit" disabled={loading}>
          <span>{loading ? "Searching..." : "Search"}</span>
          <ArrowRight size={15} />
        </button>
      </form>
        </>
      )}

      {statusMsg && <div className="status-banner">{statusMsg}</div>}

      {/* Runner View Switcher: Dashboard vs NS Race Passport */}
      {!isEmbed && races.length > 0 && (
        <div className="runner-mode-bar">
          <button
            type="button"
            className={`runner-mode-btn ${runnerTab === "dashboard" ? "active" : ""}`}
            onClick={() => setRunnerTab("dashboard")}
          >
            <LayoutGrid size={16} />
            <span>Race Dashboard</span>
          </button>
          <button
            type="button"
            className={`runner-mode-btn ${runnerTab === "passport" ? "active" : ""}`}
            onClick={() => setRunnerTab("passport")}
          >
            <Award size={16} />
            <span>NS Race Passport</span>
            <span className="runner-mode-badge">
              {passportSummary.caughtCount}/{passportSummary.totalCount}
            </span>
          </button>
        </div>
      )}

      {races.length > 0 && runnerTab === "passport" ? (
        <RacePassport
          runnerName={primaryRunner}
          races={races}
          onSelectRace={(idx) => {
            setSelectedIdx(idx);
            setRunnerTab("dashboard");
          }}
        />
      ) : (
        <>
          {/* Distance Category Classifier Bar */}
          {races.length > 0 && (
            <CategoryFilterBar
              races={races}
              categoryCounts={categoryCounts}
              filterTab={filterTab}
              onSelectTab={setFilterTab}
            />
          )}

          {/* Full-Width Top Progression Graph */}
          {races.length > 0 && selected && (
            <TimelineGraph
              races={filteredRaces}
              selected={selected}
              theme={theme}
              graphMode={graphMode}
              onGraphModeChange={setGraphMode}
              filterTab={filterTab}
              onToggleCategory={(cat) => setFilterTab((cur) => (cur === cat ? "all" : cat))}
              onSelectRace={setSelectedIdx}
            />
          )}

          {/* Two-Column Bento Dashboard */}
          {races.length > 0 && selected && (
            <main className="bento">
              <RaceDetailsColumn
                primaryRunner={primaryRunner}
                races={races}
                selected={selected}
                pbRace={pbRace}
                sortedBySpeed={sortedBySpeed}
                sources={sources}
                totalKm={totalKm}
                historyStats={historyStats}
                onSelectRace={setSelectedIdx}
              />
              <RaceFeedColumn
                races={races}
                visibleFeed={filteredRaces}
                selected={selected}
                chartRaces={chartRaces}
                maxSec={maxSec}
                totalKm={totalKm}
                onSelectRace={setSelectedIdx}
              />
            </main>
          )}
        </>
      )}

      {/* Floating Bottom Nav (Race Dashboard only) */}
      {runnerTab === "dashboard" && (
        <BottomNav
          totalCount={races.length}
          categoryCounts={categoryCounts}
          filterTab={filterTab}
          onSelectTab={setFilterTab}
        />
      )}
      <SiteFooter />
    </div>
  );
}
