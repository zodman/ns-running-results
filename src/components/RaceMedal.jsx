import React from "react";
import { CheckCircle2 } from "lucide-react";

/**
 * Renders a realistic hanging race finisher medal (lanyard ribbon + clasp + metallic bevelled coin)
 * with tier-specific finishes (bronze / silver / gold / locked).
 */
export default function RaceMedal({ item }) {
  const tierClass = item.caught ? `tier-${item.tier}` : "tier-locked";

  return (
    <div className={`race-medal ${tierClass}`}>
      {/* Lanyard Ribbon (SVG V-strap with Run NS accent stripe) */}
      <svg
        className="race-medal-ribbon"
        viewBox="0 0 88 38"
        width="88"
        height="38"
        aria-hidden="true"
      >
        {/* Left ribbon strap */}
        <polygon className="ribbon-main" points="14,0 34,0 44,34 32,34" />
        <polygon className="ribbon-stripe" points="22,0 26,0 38,34 35,34" />
        {/* Right ribbon strap */}
        <polygon className="ribbon-main-dark" points="74,0 54,0 44,34 56,34" />
        <polygon className="ribbon-stripe" points="66,0 62,0 50,34 53,34" />
        {/* Metallic clasp / bail */}
        <rect className="ribbon-clasp" x="34" y="30" width="20" height="7" rx="3" />
      </svg>

      {/* Bevelled Metallic Coin */}
      <div className="race-medal-coin">
        <div className="race-medal-inner-ring">
          <div
            className={`race-medal-face ${item.caught ? "" : "silhouette"} ${
              item.logo ? "has-logo" : "has-short"
            }`}
            style={
              item.caught && !item.logo
                ? {
                    background: `radial-gradient(circle at 32% 28%, ${item.color}, #040b17 88%)`
                  }
                : undefined
            }
          >
            {item.logo ? (
              <img src={item.logo} alt={item.name} />
            ) : (
              <span className="pm-short">{item.short}</span>
            )}
          </div>
        </div>

        {item.caught && (
          <span className="pm-check-badge" title="Collected">
            <CheckCircle2 size={16} />
          </span>
        )}
      </div>
    </div>
  );
}
