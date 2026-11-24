import React, { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import {
  CATEGORY_COLORS,
  CATEGORY_COLORS_LIGHT,
  CATEGORY_ORDER
} from "../utils/raceUtils";

export default function TimelineGraph({
  races,
  selected,
  theme,
  graphMode,
  onGraphModeChange,
  filterTab,
  onToggleCategory,
  onSelectRace
}) {
  const allChrono = useMemo(() => [...races].reverse(), [races]);

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
    return { items, minV: Math.min(...vals), maxV: Math.max(...vals) };
  }, [allChrono, graphMode]);

  if (!selected || !topGraphPoints.items.length) return null;

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
              {selected.name} • {selected.raceLocation} ({selected.category} • {selected.dateLabel})
              {" • "}
              {items.length} race{items.length === 1 ? "" : "s"} plotted
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
              onClick={() => onGraphModeChange(tab.id)}
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
          style={{
            width: items.length <= 8 ? "100%" : `${W}px`,
            minWidth: `${Math.min(W, 640)}px`
          }}
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
                onClick={() => onSelectRace(c.race.idx)}
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
                {isSel && <circle cx={c.x} cy={c.y} r={12} fill={c.color} opacity="0.25" />}
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
            onClick={() => onToggleCategory(s.cat)}
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
}
