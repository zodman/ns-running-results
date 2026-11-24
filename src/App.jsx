import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Home,
  Moon,
  Search,
  Sun,
  Trophy,
  Users
} from "lucide-react";
import { searchRunner } from "./lib/pocketbase";
import CommunityDashboard from "./CommunityDashboard.jsx";
import SiteFooter from "./SiteFooter.jsx";
import LandingPage from "./components/LandingPage.jsx";
import TimelineGraph from "./components/TimelineGraph.jsx";
import RaceDetailsColumn from "./components/RaceDetailsColumn.jsx";
import RaceFeedColumn from "./components/RaceFeedColumn.jsx";
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
      const data = await searchRunner(clean, yr);
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlName = params.get("name");
    const urlYear = params.get("year") || "all";
    const urlView = params.get("view");
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

  const primaryRunner = races[0]?.participant || activeQuery;
  const primaryCity = races.find((r) => r.city)?.city || "Nova Scotia";
  const primaryDiv = races.find((r) => r.division && r.division !== "—")?.division;
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

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
        loading={loading}
        onSearch={runSearch}
      />
    );
  }

  return (
    <div className="container">
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

      {statusMsg && <div className="status-banner">{statusMsg}</div>}

      {/* Distance Category Classifier Bar */}
      {races.length > 0 && (
        <div className="category-bar" role="tablist" aria-label="Filter races by distance">
          <button
            type="button"
            className={`cat-pill ${filterTab === "all" ? "active" : ""}`}
            onClick={() => setFilterTab("all")}
          >
            <span>All Distances</span>
            <span className="cat-pill-count">{categoryCounts.All}</span>
          </button>
          {CATEGORY_ORDER.filter((cat) => categoryCounts[cat] > 0).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`cat-pill ${filterTab === cat ? "active" : ""}`}
              onClick={() => setFilterTab(cat)}
            >
              <span>{cat}</span>
              <span className="cat-pill-count">{categoryCounts[cat]}</span>
            </button>
          ))}
          {races.some((r) => r.isPB) && (
            <button
              type="button"
              className={`cat-pill ${filterTab === "fastest" ? "active" : ""}`}
              onClick={() => setFilterTab("fastest")}
            >
              <span>Personal Bests</span>
              <span className="cat-pill-count">{races.filter((r) => r.isPB).length}</span>
            </button>
          )}
        </div>
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

      {/* Floating Bottom Nav */}
      <nav className="bottom-nav" aria-label="Filter races">
        <button
          type="button"
          className={`nav-btn ${filterTab === "all" ? "active" : ""}`}
          onClick={() => setFilterTab("all")}
        >
          <Home size={19} />
          <span>All ({races.length})</span>
        </button>
        {["5K", "10K", "Half Marathon", "Marathon"]
          .filter((cat) => categoryCounts[cat] > 0)
          .map((cat) => (
            <button
              key={cat}
              type="button"
              className={`nav-btn ${filterTab === cat ? "active" : ""}`}
              onClick={() => setFilterTab(cat)}
            >
              <Clock size={19} />
              <span>{cat === "Half Marathon" ? "Half" : cat}</span>
            </button>
          ))}
        <button
          type="button"
          className={`nav-btn ${filterTab === "fastest" ? "active" : ""}`}
          onClick={() => setFilterTab("fastest")}
        >
          <Trophy size={19} />
          <span>PBs</span>
        </button>
      </nav>
      <SiteFooter />
    </div>
  );
}
