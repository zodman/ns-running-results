import React from "react";

export default function SourceLogo({ source }) {
  const isRoute541 = String(source || "").toLowerCase().includes("route541");
  const label = isRoute541 ? "Route541" : "Atlantic Chip";

  return (
    <span className={`feed-source-tag ${isRoute541 ? "route541" : "atlantic"}`}>
      {label}
    </span>
  );
}
