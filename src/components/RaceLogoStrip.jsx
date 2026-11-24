import React from "react";

export default function RaceLogoStrip({ races, selectedIdx, onSelectRace }) {
  return (
    <div className="race-pills-strip">
      {races.slice(0, 8).map((r) => (
        <button
          key={r.id || r.idx}
          type="button"
          title={r.name}
          className={`race-dot-btn ${r.idx === selectedIdx ? "active" : ""}`}
          onClick={() => onSelectRace(r.idx)}
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
  );
}
