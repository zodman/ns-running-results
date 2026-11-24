import React from "react";
import { CATEGORY_ORDER } from "../utils/raceUtils";

export default function CategoryFilterBar({ races, categoryCounts, filterTab, onSelectTab }) {
  return (
    <div className="category-bar" role="tablist" aria-label="Filter races by distance">
      <button
        type="button"
        className={`cat-pill ${filterTab === "all" ? "active" : ""}`}
        onClick={() => onSelectTab("all")}
      >
        <span>All Distances</span>
        <span className="cat-pill-count">{categoryCounts.All}</span>
      </button>
      {CATEGORY_ORDER.filter((cat) => categoryCounts[cat] > 0).map((cat) => (
        <button
          key={cat}
          type="button"
          className={`cat-pill ${filterTab === cat ? "active" : ""}`}
          onClick={() => onSelectTab(cat)}
        >
          <span>{cat}</span>
          <span className="cat-pill-count">{categoryCounts[cat]}</span>
        </button>
      ))}
      {races.some((r) => r.isPB) && (
        <button
          type="button"
          className={`cat-pill ${filterTab === "fastest" ? "active" : ""}`}
          onClick={() => onSelectTab("fastest")}
        >
          <span>Personal Bests</span>
          <span className="cat-pill-count">{races.filter((r) => r.isPB).length}</span>
        </button>
      )}
    </div>
  );
}
