import React from "react";

export default function HighlightMetricCard({ selected }) {
  return (
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
            {selected.isPB ? selected.pbLabel || "Personal Best" : selected.name}
          </div>
          <div className="big-metric-sub-head">
            {selected.subEvent || selected.source} • {selected.dateLabel}
          </div>
        </div>
      </div>
      <div className="big-number">{selected.officialTime}</div>
      <div className="big-caption">
        {selected.participant} • {selected.pace} • Rank{" "}
        {typeof selected.rank === "number" ? `#${selected.rank.toLocaleString()}` : selected.rank}
      </div>
    </div>
  );
}
