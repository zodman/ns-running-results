import React from "react";

export default function SourceLogo({ source }) {
  const isRoute541 = String(source || "").toLowerCase().includes("route541");
  const src = isRoute541 ? "/logos/route541.png" : "/logos/atlantic_chip.png";
  const label = isRoute541 ? "Route541" : "Atlantic Chip";

  return (
    <span className="source-logo-pill" title={`Timed by ${label}`}>
      <img src={src} alt={label} />
    </span>
  );
}
