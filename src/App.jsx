import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  Clock,
  Footprints,
  Home,
  Moon,
  Search,
  Sun,
  Timer,
  Trophy,
  Users
} from "lucide-react";
import { searchRunner } from "./lib/pocketbase";
import CommunityDashboard from "./CommunityDashboard.jsx";
import SiteFooter from "./SiteFooter.jsx";

const GRADIENTS = [
  "linear-gradient(135deg, #0370b9 0%, #fef000 100%)",
  "linear-gradient(135deg, #025a96 0%, #64a1c9 100%)",
  "linear-gradient(135deg, #033d65 0%, #0370b9 100%)",
  "linear-gradient(135deg, #fef000 0%, #0370b9 100%)",
  "linear-gradient(135deg, #64a1c9 0%, #025a96 100%)"
];

function decodeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function parseSeconds(str) {
  if (!str || str === "—") return null;
  const parts = String(str).trim().split(":").map(Number);
  if (parts.some(Number.isNaN)) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function detectKm(name, subEvent) {
  for (const raw of [subEvent, name]) {
    const txt = String(raw || "").toLowerCase();
    if (!txt) continue;
    if (/half[\s-]*marathon|21\.1\s*k|\b21k\b|\bhalf\b/i.test(txt)) return 21.1;
    if (/full[\s-]*marathon|42\.2\s*k|\b42k\b/i.test(txt)) return 42.2;
    const kmMatch = txt.match(/(\d+(?:\.\d+)?)\s*(?:k|km)\b/i);
    if (kmMatch) return parseFloat(kmMatch[1]);
    const miMatch = txt.match(/(\d+(?:\.\d+)?)\s*(?:mile|miler|mi)\b/i);
    if (miMatch) return +(parseFloat(miMatch[1]) * 1.60934).toFixed(2);
    if (/\bmarathon\b/i.test(txt) && raw === subEvent) return 42.2;
  }
  return null;
}

function detectRaceLocation(name) {
  const n = String(name || "").toLowerCase();
  const rules = [
    [/blue nose|halifax|mcnab|mcintosh|pancreas|seaside scramble|callous crow|pick & shovel|salty 7|guesstimate|year-end|run with class|movember|spring run-off/, "Halifax, NS"],
    [/harbour hustle|dartmouth|natal day|bee hive|shubie/, "Dartmouth, NS"],
    [/michelin|tire trot|bridgewater/, "Bridgewater, NS"],
    [/lunenburg/, "Lunenburg, NS"],
    [/valley harvest|wolfville/, "Wolfville, NS"],
    [/berwick/, "Berwick, NS"],
    [/hantsport/, "Hantsport, NS"],
    [/fredericton/, "Fredericton, NB"],
    [/cinnamon bun|nuttby|truro|runway run/, "Truro, NS"],
    [/tatamagouche/, "Tatamagouche, NS"],
    [/middleton/, "Middleton, NS"],
    [/pugwash/, "Pugwash, NS"],
    [/louisbourg/, "Louisbourg, NS"],
    [/mabou|mhàbu/, "Mabou, NS"],
    [/escaouette|cheticamp|chéticamp/, "Chéticamp, NS"],
    [/kentville|spike family/, "Kentville, NS"],
    [/lobster crawl|barrington/, "Barrington, NS"],
    [/moncton/, "Moncton, NB"],
    [/saint john/, "Saint John, NB"],
    [/charlottetown|pei|wally rodd/, "Charlottetown, PE"],
    [/baie sainte marie/, "Clare, NS"],
    [/johnny miles|new glasgow|pictou/, "New Glasgow, NS"],
    [/cape breton|sydney/, "Sydney, NS"],
    [/yarmouth/, "Yarmouth, NS"],
    [/antigonish/, "Antigonish, NS"],
    [/sissaboo|weymouth/, "Weymouth, NS"],
    [/rum runners/, "Halifax–Lunenburg"],
    [/wayfarers/, "Port Williams, NS"],
    [/mahone bay/, "Mahone Bay, NS"],
    [/peggy/, "Peggy's Cove, NS"],
    [/amherst/, "Amherst, NS"],
    [/windsor/, "Windsor, NS"]
  ];
  for (const [re, loc] of rules) {
    if (re.test(n)) return loc;
  }
  return "Nova Scotia";
}

function classifyCategory(name, subEvent, km) {
  const sub = String(subEvent || "").toLowerCase();
  const full = `${subEvent || ""} ${name || ""}`.toLowerCase();

  if (km === 5 || /\b5\s*(?:k|km)\b/i.test(sub)) return "5K";
  if (km === 10 || /\b10\s*(?:k|km)\b/i.test(sub)) return "10K";
  if (km === 21.1 || /half[\s-]*marathon|\bhalf\b|21\.1/i.test(sub)) return "Half Marathon";
  if (km === 42.2 || /full[\s-]*marathon|42\.2/i.test(sub)) return "Marathon";

  if (/half[\s-]*marathon|21\.1/i.test(full)) return "Half Marathon";
  if (/\b5\s*(?:k|km)\b/i.test(full) && !/\b10\s*(?:k|km)\b/i.test(full)) return "5K";
  if (/\b10\s*(?:k|km)\b/i.test(full) && !/\b25\s*(?:k|km)\b/i.test(full)) return "10K";
  if (/\bmarathon\b/i.test(sub) && !/half/i.test(sub)) return "Marathon";

  return "Other";
}

const CATEGORY_ORDER = ["5K", "10K", "Half Marathon", "Marathon", "Other"];

const CATEGORY_COLORS = {
  "5K": "#fef000",
  "10K": "#38bdf8",
  "Half Marathon": "#22c55e",
  Marathon: "#fb7185",
  Other: "#a78bfa"
};

const CATEGORY_COLORS_LIGHT = {
  "5K": "#0370b9",
  "10K": "#0284c7",
  "Half Marathon": "#16a34a",
  Marathon: "#e11d48",
  Other: "#7c3aed"
};

function formatPace(seconds, km) {
  if (!seconds || !km) return "Road Race";
  const spk = Math.round(seconds / km);
  const m = Math.floor(spk / 60);
  const s = String(spk % 60).padStart(2, "0");
  return `${m}'${s}"/km`;
}

function initials(text) {
  const words = String(text || "RR").replace(/[^a-zA-Z0-9\s]/g, "").trim().split(/\s+/);
  return ((words[0]?.[0] || "R") + (words[1]?.[0] || words[0]?.[1] || "")).toUpperCase();
}

function formatDate(raw) {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw || "");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function shortDate(raw) {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw || "").slice(0, 10);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function parseTimestamp(raw) {
  if (!raw) return 0;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function normalizeResults(items) {
  const sortedByDate = [...items].sort(
    (a, b) => parseTimestamp(b.iso) - parseTimestamp(a.iso)
  );

  const list = sortedByDate.map((item, idx) => {
    const cleanName = decodeHtml(item.name || "");
    const cleanSub = decodeHtml(item.subEvent || "");
    const km = detectKm(cleanName, cleanSub);
    const category = classifyCategory(cleanName, cleanSub, km);
    const raceLocation = detectRaceLocation(cleanName);
    const officialTime = item.chipTime || item.gunTime || "—";
    const officialSec = parseSeconds(officialTime);
    const gunSec = parseSeconds(item.gunTime);
    return {
      ...item,
      name: cleanName,
      subEvent: cleanSub,
      raceLocation,
      shortLocation: raceLocation.split(",")[0],
      idx,
      timestamp: parseTimestamp(item.iso),
      dateLabel: formatDate(item.iso),
      shortDate: shortDate(item.iso),
      gunTime: item.gunTime || "—",
      chipTime: item.chipTime || "—",
      officialTime,
      officialSec,
      gunSec,
      km,
      category,
      is5k: category === "5K",
      pace: formatPace(officialSec, km),
      division: item.division || "—",
      bg: GRADIENTS[idx % GRADIENTS.length],
      short: initials(cleanName),
      isPB: false,
      pbLabel: ""
    };
  });

  // Mark Personal Best for each standard distance category (5K, 10K, Half Marathon, Marathon)
  for (const cat of ["5K", "10K", "Half Marathon", "Marathon"]) {
    const catRaces = list.filter((r) => r.category === cat && r.officialSec);
    if (catRaces.length) {
      const best = catRaces.reduce((a, b) => (a.officialSec < b.officialSec ? a : b));
      best.isPB = true;
      best.pbLabel = `${cat === "Half Marathon" ? "Half" : cat} PB`;
    }
  }
  return list;
}

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [view, setView] = useState("landing"); // landing | runner | community
  const [queryInput, setQueryInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [year, setYear] = useState("all");
  const [filterTab, setFilterTab] = useState("all");
  const [graphMode, setGraphMode] = useState("time"); // time | pace | rank
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

  // Only auto-search if a ?name=... query param is present in the URL
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

  const visibleFeed = filteredRaces;

  const sortedBySpeed = useMemo(
    () => [...filteredRaces].sort((a, b) => (a.officialSec || 999999) - (b.officialSec || 999999)),
    [filteredRaces]
  );

  const chartRaces = useMemo(() => [...filteredRaces].slice(0, 8).reverse(), [filteredRaces]);
  const allChrono = useMemo(() => [...filteredRaces].reverse(), [filteredRaces]);

  const topGraphPoints = useMemo(() => {
    const items = allChrono
      .map((r) => {
        let val = null;
        let label = "";
        if (graphMode === "time" && r.officialSec) {
          val = r.officialSec / 60;
          label = r.officialTime;
        } else if (graphMode === "pace" && r.officialSec && r.km) {
          val = r.officialSec / r.km / 60;
          label = r.pace.replace("/km", "");
        } else if (graphMode === "rank" && typeof r.rank === "number") {
          val = r.rank;
          label = `#${r.rank}`;
        }
        return val !== null ? { race: r, val, label } : null;
      })
      .filter(Boolean);

    if (!items.length) return { items: [], minV: 0, maxV: 1 };
    const vals = items.map((p) => p.val);
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);
    return { items, minV, maxV };
  }, [allChrono, graphMode]);
  const maxSec = useMemo(
    () => Math.max(1, ...chartRaces.map((r) => r.gunSec || r.officialSec || 1)),
    [chartRaces]
  );

  const totalKm = useMemo(() => races.reduce((acc, r) => acc + (r.km || 0), 0), [races]);

  const historyStats = useMemo(() => {
    const years = [...new Set(
      races
        .map((r) => {
          const d = new Date(r.iso);
          return Number.isNaN(d.getTime()) ? null : d.getFullYear();
        })
        .filter(Boolean)
    )].sort((a, b) => a - b);

    const totalSeconds = races.reduce((acc, r) => acc + (r.officialSec || 0), 0);
    const totalH = Math.floor(totalSeconds / 3600);
    const totalM = Math.floor((totalSeconds % 3600) / 60);
    const totalTimeLabel = totalH > 0 ? `${totalH}h ${totalM}m` : `${totalM}m`;

    const numericRanks = races.filter((r) => typeof r.rank === "number" && r.rank > 0);
    const bestRankRace = numericRanks.length
      ? numericRanks.reduce((a, b) => (a.rank < b.rank ? a : b))
      : null;

    const kmRaces = races.filter((r) => r.km && r.officialSec);
    const avgPaceLabel = kmRaces.length
      ? formatPace(
          kmRaces.reduce((acc, r) => acc + r.officialSec, 0),
          kmRaces.reduce((acc, r) => acc + r.km, 0)
        )
      : "—";

    const byCat = CATEGORY_ORDER.map((cat) => {
      const group = races.filter((r) => r.category === cat);
      if (!group.length) return null;
      const timed = group.filter((r) => r.officialSec);
      const best = timed.length
        ? timed.reduce((a, b) => (a.officialSec < b.officialSec ? a : b))
        : null;
      return { cat, count: group.length, bestTime: best?.officialTime || "—", bestPace: best?.pace || "" };
    }).filter(Boolean);

    const locMap = {};
    for (const r of races) {
      const loc = r.shortLocation || "Nova Scotia";
      locMap[loc] = (locMap[loc] || 0) + 1;
    }
    const topLocations = Object.entries(locMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return {
      yearRange: years.length > 1 ? `${years[0]} – ${years[years.length - 1]}` : years[0] ? String(years[0]) : "—",
      seasonCount: years.length,
      totalTimeLabel,
      bestRankRace,
      avgPaceLabel,
      byCat,
      topLocations,
      uniqueLocations: Object.keys(locMap).length
    };
  }, [races]);
  const primaryRunner = races[0]?.participant || activeQuery;
  const primaryCity = races.find((r) => r.city)?.city || "Nova Scotia";
  const primaryDiv = races.find((r) => r.division && r.division !== "—")?.division;

  if (view === "community") {
    return (
      <CommunityDashboard
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        onBack={resetToLanding}
        onSelectRunner={(runnerName) => runSearch(runnerName, "all")}
      />
    );
  }

  if (view === "landing") {
    return (
      <div className="container">
        <header className="topbar">
          <div className="brand">
            <div className="avatar">NS</div>
            <div className="brand-info">
              <h1>NS Running Results</h1>
              <p>Nova Scotia Road Race Lookup</p>
            </div>
          </div>
          <div className="controls">
            <button className="comm-cta-btn" type="button" onClick={openCommunity}>
              <Users size={15} />
              <span>All Participants Dashboard</span>
            </button>
            <button
              className="theme-btn"
              type="button"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
          </div>
        </header>

        <section className="landing-wrap">
          <div className="landing-card">
            <div className="landing-pill">
              <img src="/logos/atlantic_chip.png" alt="Atlantic Chip" />
              <span>Atlantic Chip + Route541 • Nova Scotia Results</span>
            </div>

            <h2 className="landing-title">
              What&apos;s your <span>runner name</span>?
            </h2>
            <p className="landing-sub">
              Enter your name below to instantly pull all your Nova Scotia race finishes, chip &amp;
              gun times, personal bests, and official event logos.
            </p>

            <form
              className="landing-form"
              onSubmit={(e) => {
                e.preventDefault();
                runSearch(queryInput, year);
              }}
            >
              <Search size={18} style={{ opacity: 0.65 }} />
              <input
                className="search-input"
                type="text"
                autoFocus
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Type your full name (e.g. Andres Vargas)..."
              />
              <select
                className="year-select"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="all">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
              <button className="search-submit" type="submit" disabled={!queryInput.trim() || loading}>
                <span>Find My Races</span>
                <ArrowRight size={15} />
              </button>
            </form>

            <div className="landing-chips">
              <span className="landing-chips-label">Try:</span>
              {["Andres Vargas", "Aisha Vargas", "Andres Arteaga"].map((example) => (
                <button
                  key={example}
                  type="button"
                  className="example-chip"
                  onClick={() => runSearch(example, year)}
                >
                  {example}
                </button>
              ))}
            </div>

            <div className="landing-logos" aria-label="Featured Nova Scotia races">
              <div className="landing-logo-bubble" title="Medavie Blue Nose Marathon">
                <img src="/logos/blue_nose.jpg" alt="Blue Nose Marathon" />
              </div>
              <div className="landing-logo-bubble" title="Harbour Hustle 2026">
                <img src="/logos/harbour_hustle.png" alt="Harbour Hustle" />
              </div>
              <div className="landing-logo-bubble" title="Michelin Tire Trot">
                <img src="/logos/michelin_tire_trot.jpg" alt="Michelin Tire Trot" />
              </div>
              <div className="landing-logo-bubble" title="Lunenburg 5km Road Race">
                <img src="/logos/lunenburg_5k.png" alt="Lunenburg 5km" />
              </div>
            </div>
          </div>
        </section>
        <SiteFooter />
      </div>
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
          <button
            className="theme-btn"
            type="button"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
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
          placeholder="Enter any runner's name (e.g. Andres Vargas, Aisha Vargas, John Smith)..."
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

      {/* Full-Width Top Progression Graph across ALL races — color-coded by distance */}
      {races.length > 0 && selected && topGraphPoints.items.length > 0 && (() => {
        const { items, minV, maxV } = topGraphPoints;
        const W = Math.max(920, items.length * 116);
        const H = 264;
        const padL = 62;
        const padR = 54;
        const padT = 32;
        const padB = 74;
        const innerW = W - padL - padR;
        const innerH = H - padT - padB;
        const span = maxV - minV || 1;
        const palette = theme === "dark" ? CATEGORY_COLORS : CATEGORY_COLORS_LIGHT;

        const coords = items.map((p, i) => {
          const x = items.length === 1 ? padL + innerW / 2 : padL + (i / (items.length - 1)) * innerW;
          const normY = (p.val - minV) / span;
          const y = padT + innerH - normY * (innerH * 0.8) - innerH * 0.1;
          const dObj = new Date(p.race.iso);
          const yrLabel = Number.isNaN(dObj.getTime()) ? "" : String(dObj.getFullYear());
          const color = palette[p.race.category] || palette.Other;
          return { ...p, x, y, yrLabel, color };
        });

        // Group points by distance category so each distance draws its own trend line
        const seriesList = CATEGORY_ORDER.map((cat) => {
          const pts = coords.filter((c) => c.race.category === cat);
          if (!pts.length) return null;
          const path = pts
            .map((c, idx) => `${idx === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
            .join(" ");
          const area =
            pts.length > 1 && filterTab !== "all"
              ? `${path} L ${pts[pts.length - 1].x.toFixed(1)} ${(padT + innerH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padT + innerH).toFixed(1)} Z`
              : "";
          return { cat, color: palette[cat], pts, path, area };
        }).filter(Boolean);

        const formatAxis = (v) => {
          if (graphMode === "rank") return `#${Math.round(v)}`;
          const totalSec = Math.round(v * 60);
          const h = Math.floor(totalSec / 3600);
          const m = Math.floor((totalSec % 3600) / 60);
          const s = String(totalSec % 60).padStart(2, "0");
          if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${s}`;
          return `${m}:${s}`;
        };

        const modeHeading =
          graphMode === "time"
            ? "Time by Distance"
            : graphMode === "pace"
              ? "Pace (min/km) by Distance"
              : "Overall Rank by Distance";

        return (
          <section className="card top-graph-card">
            <div className="top-graph-head">
              <div>
                <div className="card-title">
                  <span className="card-title-icon">
                    <BarChart3 size={16} />
                  </span>
                  <span>{modeHeading}</span>
                </div>
                <div className="top-graph-kpis">
                  <span className="top-graph-kpi">
                    {graphMode === "time"
                      ? selected.officialTime
                      : graphMode === "pace"
                        ? selected.pace
                        : typeof selected.rank === "number"
                          ? `#${selected.rank.toLocaleString()}`
                          : selected.rank}
                  </span>
                  <span className="top-graph-sub">
                    {selected.name} • {selected.raceLocation} ({selected.category} • {selected.dateLabel}) • {items.length} race
                    {items.length === 1 ? "" : "s"} plotted
                  </span>
                </div>
              </div>

              <div className="graph-mode-tabs" role="tablist" aria-label="Graph metric">
                {[
                  { id: "time", label: "Time" },
                  { id: "pace", label: "Pace" },
                  { id: "rank", label: "Rank" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`graph-tab ${graphMode === tab.id ? "active" : ""}`}
                    onClick={() => setGraphMode(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="top-graph-svg-wrap">
              <svg
                className="top-graph-svg"
                width={W}
                height={H}
                viewBox={`0 0 ${W} ${H}`}
                style={{ width: items.length <= 8 ? "100%" : `${W}px`, minWidth: `${Math.min(W, 640)}px` }}
                role="img"
                aria-label="Race performance by distance over time"
              >
                <defs>
                  <linearGradient id="rnsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0370b9" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#0370b9" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {[0, 0.5, 1].map((t, idx) => {
                  const y = padT + innerH - t * innerH;
                  const val = minV + t * span;
                  return (
                    <g key={idx}>
                      <line className="graph-grid-line" x1={padL} x2={W - padR} y1={y} y2={y} />
                      <text className="graph-axis-label" x={padL - 10} y={y + 4} textAnchor="end">
                        {formatAxis(val)}
                      </text>
                    </g>
                  );
                })}

                {seriesList.map((s) => (
                  <g key={s.cat}>
                    {s.area && <path d={s.area} fill="url(#rnsAreaGrad)" />}
                    {s.pts.length > 1 && (
                      <path
                        d={s.path}
                        fill="none"
                        stroke={s.color}
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.92"
                      />
                    )}
                  </g>
                ))}

                {coords.map((c) => {
                  const isSel = c.race.idx === selected.idx;
                  return (
                    <g
                      key={c.race.id || c.race.idx}
                      className="graph-point"
                      onClick={() => setSelectedIdx(c.race.idx)}
                    >
                      <title>{`${c.race.name} • ${c.race.raceLocation} (${c.race.category} • ${c.race.dateLabel}) — Time: ${c.race.officialTime} | Pace: ${c.race.pace} | Rank: ${c.race.rank}`}</title>
                      <line
                        x1={c.x}
                        x2={c.x}
                        y1={c.y + 8}
                        y2={padT + innerH}
                        stroke="var(--divider)"
                        strokeDasharray="2 3"
                        strokeWidth="1"
                      />
                      {isSel && (
                        <circle cx={c.x} cy={c.y} r={12} fill={c.color} opacity="0.25" />
                      )}
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={isSel ? 6.5 : 5}
                        fill={c.color}
                        stroke={theme === "dark" ? "#040b17" : "#ffffff"}
                        strokeWidth="2.2"
                      />
                      <text className="graph-point-label" x={c.x} y={c.y - 12} textAnchor="middle">
                        {c.label}
                      </text>
                      <text
                        className="graph-axis-label"
                        x={c.x}
                        y={padT + innerH + 18}
                        textAnchor="middle"
                      >
                        {c.race.shortDate}
                      </text>
                      {c.yrLabel && (
                        <text
                          className="graph-axis-label"
                          x={c.x}
                          y={padT + innerH + 32}
                          textAnchor="middle"
                          style={{ opacity: 0.7, fontSize: "10px" }}
                        >
                          {c.yrLabel}
                        </text>
                      )}
                      <text
                        className="graph-axis-label"
                        x={c.x}
                        y={padT + innerH + 47}
                        textAnchor="middle"
                        style={{ fill: theme === "dark" ? "#64a1c9" : "#0370b9", fontSize: "10px" }}
                      >
                        {c.race.shortLocation}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="graph-distance-legend" aria-label="Distance color legend">
              {seriesList.map((s) => (
                <button
                  key={s.cat}
                  type="button"
                  className={`graph-legend-pill ${filterTab === s.cat ? "active" : ""}`}
                  onClick={() => setFilterTab((cur) => (cur === s.cat ? "all" : s.cat))}
                  title={`Click to isolate ${s.cat} races`}
                >
                  <span className="graph-legend-swatch" style={{ background: s.color }} />
                  <span>
                    {s.cat} ({s.pts.length})
                  </span>
                </button>
              ))}
            </div>
          </section>
        );
      })()}

      {races.length > 0 && selected && (
        <main className="bento">
          {/* LEFT COLUMN */}
          <section className="col">
            {/* Hero Banner */}
            <div className="card hero-card">
              <h2>{primaryRunner} — Race Profile</h2>
              <p>
                {pbRace ? (
                  <>
                    Found <strong>{races.length}</strong> official finish
                    {races.length === 1 ? "" : "es"} — highlighted by a{" "}
                    <strong>{pbRace.officialTime}</strong> 5K PB at {pbRace.name}.
                  </>
                ) : (
                  <>
                    Found <strong>{races.length}</strong> official finish
                    {races.length === 1 ? "" : "es"} across Atlantic Chip &amp; Route541.
                  </>
                )}
              </p>
              <a className="hero-cta" href={selected.url} target="_blank" rel="noreferrer">
                <span>View Official Result</span>
                <span className="arrow-circle">
                  <ArrowRight size={16} />
                </span>
              </a>
            </div>

            {/* Quick Race Logos Strip */}
            <div className="race-pills-strip">
              {races.slice(0, 8).map((r) => (
                <button
                  key={r.id || r.idx}
                  type="button"
                  title={r.name}
                  className={`race-dot-btn ${r.idx === selected.idx ? "active" : ""}`}
                  onClick={() => setSelectedIdx(r.idx)}
                >
                  <span className="race-dot-ring">
                    <span
                      className={`race-dot-inner ${r.logo ? "" : "fallback"}`}
                      style={r.logo ? undefined : { background: r.bg }}
                    >
                      {r.logo ? <img src={r.logo} alt={r.name} /> : r.short}
                    </span>
                  </span>
                  <span>{r.shortDate}</span>
                </button>
              ))}
            </div>

            {/* Selected Race Stats */}
            <div className="card">
              <div className="stats-header">
                <span>{selected.name}</span>
                <span className="stats-badge">{selected.division}</span>
              </div>
              <div className="stat-row">
                <div className="stat-left">
                  <Clock size={18} />
                  <span>Chip / Official Time</span>
                </div>
                <div className="stat-val">{selected.officialTime}</div>
              </div>
              <div className="stat-row">
                <div className="stat-left">
                  <Footprints size={18} />
                  <span>Avg Pace / Type</span>
                </div>
                <div className="stat-val">{selected.pace}</div>
              </div>
              <div className="stat-row">
                <div className="stat-left">
                  <Timer size={18} />
                  <span>Gun Time</span>
                </div>
                <div className="stat-val">{selected.gunTime}</div>
              </div>
              <div className="stat-row">
                <div className="stat-left">
                  <Trophy size={18} />
                  <span>Overall Rank</span>
                </div>
                <div className="stat-val">
                  {typeof selected.rank === "number"
                    ? `#${selected.rank.toLocaleString()}`
                    : selected.rank}
                </div>
              </div>
            </div>

            {/* Race Ranking */}
            <div className="card">
              <div className="card-title-row">
                <div className="card-title">
                  <span className="card-title-icon">
                    <Award size={16} />
                  </span>
                  <span>Race Ranking</span>
                </div>
                <span style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 600 }}>
                  Fastest First
                </span>
              </div>
              <div className="rank-list">
                {sortedBySpeed.map((r, i) => (
                  <div
                    key={r.id || r.idx}
                    className={`rank-item ${r.idx === selected.idx ? "active" : ""}`}
                    onClick={() => setSelectedIdx(r.idx)}
                  >
                    <span className="rank-num">{String(i + 1).padStart(2, "0")}.</span>
                    <span
                      className={`rank-mini-badge ${r.logo ? "" : "fallback"}`}
                      style={r.logo ? undefined : { background: r.bg }}
                    >
                      {r.logo ? <img src={r.logo} alt={r.name} /> : r.short}
                    </span>
                    <div className="rank-meta">
                      <div className="rank-name">{r.name}</div>
                      <div className="rank-sub">
                        {r.subEvent || r.source} • {r.shortDate}
                      </div>
                    </div>
                    <div className="rank-score">{r.officialTime}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Indigo Summary Card — Detailed Race History */}
            <div className="card progress-card">
              <div className="progress-top">
                <Timer size={18} />
                <span>Race History Summary</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: "100%" }} />
              </div>
              <div className="progress-bottom">
                <div>
                  <div className="progress-label">Official Timed Finishes</div>
                  <div className="progress-sub">
                    {sources.atlanticChip} Atlantic Chip • {sources.route541} Route541
                  </div>
                </div>
                <div className="progress-big">{races.length}</div>
              </div>

              <div className="summary-grid">
                <div className="summary-tile">
                  <div className="summary-tile-label">Total Distance</div>
                  <div className="summary-tile-val">
                    {totalKm > 0 ? `${totalKm.toFixed(totalKm % 1 ? 1 : 0)} KM` : "—"}
                  </div>
                  <div className="summary-tile-sub">Avg {historyStats.avgPaceLabel}</div>
                </div>
                <div className="summary-tile">
                  <div className="summary-tile-label">Time Racing</div>
                  <div className="summary-tile-val">{historyStats.totalTimeLabel}</div>
                  <div className="summary-tile-sub">
                    {historyStats.yearRange} ({historyStats.seasonCount}{" "}
                    {historyStats.seasonCount === 1 ? "season" : "seasons"})
                  </div>
                </div>
                <div className="summary-tile">
                  <div className="summary-tile-label">Best Overall Rank</div>
                  <div className="summary-tile-val">
                    {historyStats.bestRankRace ? `#${historyStats.bestRankRace.rank}` : "—"}
                  </div>
                  <div className="summary-tile-sub">
                    {historyStats.bestRankRace ? historyStats.bestRankRace.name.slice(0, 22) : "—"}
                  </div>
                </div>
                <div className="summary-tile">
                  <div className="summary-tile-label">Locations Raced</div>
                  <div className="summary-tile-val">{historyStats.uniqueLocations}</div>
                  <div className="summary-tile-sub">Nova Scotia &amp; Maritimes</div>
                </div>
              </div>

              {historyStats.byCat.length > 0 && (
                <div className="summary-section">
                  <div className="summary-section-title">Personal Bests by Distance</div>
                  <div className="summary-pb-list">
                    {historyStats.byCat.map((c) => (
                      <div key={c.cat} className="summary-pb-row">
                        <span className="summary-pb-cat">
                          <span
                            className="graph-legend-swatch"
                            style={{ background: CATEGORY_COLORS[c.cat] || "#a78bfa" }}
                          />
                          <span>{c.cat}</span>
                        </span>
                        <span>
                          <span className="summary-pb-val">{c.bestTime}</span>
                          <span className="summary-pb-count">
                            ({c.count} {c.count === 1 ? "race" : "races"})
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {historyStats.topLocations.length > 0 && (
                <div className="summary-section">
                  <div className="summary-section-title">Top Race Locations</div>
                  <div className="summary-locs">
                    {historyStats.topLocations.map(([loc, cnt]) => (
                      <span key={loc} className="summary-loc-chip">
                        {loc} ({cnt})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT COLUMN */}
          <section className="col">
            {/* Race Feed */}
            <div className="card feed-card">
              {visibleFeed.map((r) => (
                <article
                  key={r.id || r.idx}
                  className={`feed-item ${r.idx === selected.idx ? "active" : ""}`}
                  onClick={() => setSelectedIdx(r.idx)}
                >
                  <div className="medal" style={{ background: r.bg }}>
                    <div className={`medal-inner ${r.logo ? "" : "fallback"}`}>
                      {r.logo ? <img src={r.logo} alt={r.name} /> : r.short}
                    </div>
                  </div>
                  <div className="feed-body">
                    <div className="feed-date">
                      <span>{r.dateLabel}</span>
                      <span className="feed-source-tag">{r.source}</span>
                    </div>
                    <div className="feed-metric">
                      <span>{r.officialTime}</span>
                      {r.isPB && <span className="feed-chip-tag">{r.pbLabel}</span>}
                    </div>
                    <div className="feed-desc">
                      <strong>{r.name}</strong>
                      {r.subEvent ? ` — ${r.subEvent}` : ""}. {r.participant}
                      {r.city ? ` (${r.city})` : ""}.
                    </div>
                    <div className="feed-footer">
                      <span className="feed-pill">{r.category}</span>
                      <span className="feed-pill">Gun {r.gunTime}</span>
                      <span className="feed-pill">{r.pace}</span>
                      {r.division !== "—" && <span className="feed-pill">{r.division}</span>}
                      <a
                        className="feed-link"
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Official Result →
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Big Highlight Card */}
            <div className="card big-metric-card">
              <div className="big-metric-head">
                <div className="runner-circle">
                  {selected.logo ? (
                    <img src={selected.logo} alt={selected.name} />
                  ) : (
                    <span>{selected.short}</span>
                  )}
                </div>
                <div>
                  <div className="big-metric-title">
                    {selected.isPB ? "5K Personal Best" : selected.name}
                  </div>
                  <div className="big-metric-sub-head">
                    {selected.subEvent || selected.source} • {selected.dateLabel}
                  </div>
                </div>
              </div>
              <div className="big-number">{selected.officialTime}</div>
              <div className="big-caption">
                {selected.participant} • {selected.pace} • Rank{" "}
                {typeof selected.rank === "number"
                  ? `#${selected.rank.toLocaleString()}`
                  : selected.rank}
              </div>
            </div>

            {/* Bar Chart */}
            <div className="card chart-card">
              <div className="card-title-row" style={{ marginBottom: 8 }}>
                <div className="card-title">
                  <span className="card-title-icon">
                    <BarChart3 size={16} />
                  </span>
                  <span>Race Time Comparison</span>
                </div>
                <span style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 600 }}>
                  Chip vs Gun
                </span>
              </div>
              <div className="chart-big">
                {totalKm > 0 ? `${totalKm.toFixed(totalKm % 1 ? 1 : 0)} KM` : `${races.length} Races`}
              </div>
              <div className="chart-delta">
                ↑ {races.length} Official Finishes{" "}
                <span>across {new Set(races.map((r) => r.name)).size} events</span>
              </div>

              <div className="chart-bars">
                {chartRaces.map((r) => {
                  const hChip = Math.max(16, Math.round(((r.officialSec || 0) / maxSec) * 105));
                  const hGun = Math.max(
                    16,
                    Math.round(((r.gunSec || r.officialSec || 0) / maxSec) * 105)
                  );
                  return (
                    <div
                      key={r.id || r.idx}
                      className="bar-group"
                      title={`${r.name}: Chip ${r.chipTime} / Gun ${r.gunTime}`}
                      onClick={() => setSelectedIdx(r.idx)}
                    >
                      <div className="bar-pair">
                        <div className="bar primary" style={{ height: `${hChip}px` }} />
                        <div className="bar secondary" style={{ height: `${hGun}px` }} />
                      </div>
                      <div className="bar-label">{r.shortDate}</div>
                    </div>
                  );
                })}
              </div>

              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: "var(--bar-primary)" }} />
                  <span>Chip Time</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: "var(--bar-secondary)" }} />
                  <span>Gun Time</span>
                </div>
              </div>
            </div>
          </section>
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
