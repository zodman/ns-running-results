import React, { useEffect, useState } from "react";

const STAGES = [
  { at: 0, label: "Connecting to Nova Scotia results database..." },
  { at: 18, label: "Loading Route541 finishes (2023–2026)..." },
  { at: 40, label: "Merging cached Atlantic Chip results..." },
  { at: 62, label: "Ranking fastest 5K, 10K, Half & Marathon runners..." },
  { at: 80, label: "Crunching top events, cities & yearly trends..." }
];

/**
 * Estimated progress bar for a single long-running request.
 * Eases toward ~92% while loading, then snaps to 100% when `done` becomes true.
 */
export default function LoadingProgress({ done = false, title = "Loading community statistics" }) {
  const [pct, setPct] = useState(4);

  useEffect(() => {
    if (done) {
      setPct(100);
      return undefined;
    }
    const id = setInterval(() => {
      setPct((p) => (p >= 92 ? p : p + Math.max(0.4, (92 - p) * 0.06)));
    }, 200);
    return () => clearInterval(id);
  }, [done]);

  const rounded = Math.min(100, Math.round(pct));
  const stage = [...STAGES].reverse().find((s) => rounded >= s.at) || STAGES[0];

  return (
    <div className="card loading-progress" role="status" aria-live="polite">
      <div className="loading-progress-head">
        <span className="loading-progress-title">{title}</span>
        <span className="loading-progress-pct">{rounded}%</span>
      </div>
      <div
        className="loading-progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={rounded}
      >
        <div className="loading-progress-fill" style={{ width: `${rounded}%` }} />
      </div>
      <div className="loading-progress-stage">{stage.label}</div>
    </div>
  );
}
