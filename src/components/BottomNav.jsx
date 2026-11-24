import React from "react";
import { Clock, Home, Trophy } from "lucide-react";

export default function BottomNav({ totalCount, categoryCounts, filterTab, onSelectTab }) {
  return (
    <nav className="bottom-nav" aria-label="Filter races">
      <button
        type="button"
        className={`nav-btn ${filterTab === "all" ? "active" : ""}`}
        onClick={() => onSelectTab("all")}
      >
        <Home size={19} />
        <span>All ({totalCount})</span>
      </button>
      {["5K", "10K", "Half Marathon", "Marathon"]
        .filter((cat) => categoryCounts[cat] > 0)
        .map((cat) => (
          <button
            key={cat}
            type="button"
            className={`nav-btn ${filterTab === cat ? "active" : ""}`}
            onClick={() => onSelectTab(cat)}
          >
            <Clock size={19} />
            <span>{cat === "Half Marathon" ? "Half" : cat}</span>
          </button>
        ))}
      <button
        type="button"
        className={`nav-btn ${filterTab === "fastest" ? "active" : ""}`}
        onClick={() => onSelectTab("fastest")}
      >
        <Trophy size={19} />
        <span>PBs</span>
      </button>
    </nav>
  );
}
