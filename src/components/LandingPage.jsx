import React from "react";
import { ArrowRight, Moon, Search, Sun, Users } from "lucide-react";
import SiteFooter from "../SiteFooter.jsx";
import OpenSrcBanner from "./OpenSrcBanner.jsx";

export default function LandingPage({
  theme,
  onToggleTheme,
  onOpenCommunity,
  queryInput,
  onQueryChange,
  year,
  onYearChange,
  saveToCommunity,
  onToggleSaveToCommunity,
  loading,
  onSearch
}) {
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
          <button className="comm-cta-btn" type="button" onClick={onOpenCommunity}>
            <Users size={15} />
            <span>All Participants Dashboard</span>
          </button>
          <button className="theme-btn" type="button" onClick={onToggleTheme}>
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
              onSearch(queryInput, year);
            }}
          >
            <Search size={18} style={{ opacity: 0.65 }} />
            <input
              className="search-input"
              type="text"
              autoFocus
              value={queryInput}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Type your full name (e.g. Andres Vargas)..."
            />
            <select
              className="year-select"
              value={year}
              onChange={(e) => onYearChange(e.target.value)}
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

          <label className="community-optin">
            <input
              type="checkbox"
              checked={saveToCommunity}
              onChange={(e) => onToggleSaveToCommunity(e.target.checked)}
            />
            <span>
              <strong>Include my results in the Community Dashboard</strong> — when you look up a
              name, its public finishes are cached to grow Nova Scotia community stats. Uncheck to
              search privately (you can also remove your name anytime).
            </span>
          </label>

          <div className="landing-chips">
            <span className="landing-chips-label">Try:</span>
            {["Andres Vargas", "Dana Baroni", "Aisha Vargas"].map((example) => (
              <button
                key={example}
                type="button"
                className="example-chip"
                onClick={() => onSearch(example, year)}
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

        <OpenSrcBanner className="landing-banner" />
      </section>
      <SiteFooter />
    </div>
  );
}
