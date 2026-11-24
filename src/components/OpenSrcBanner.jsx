import React from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";

export default function OpenSrcBanner({ className = "" }) {
  return (
    <aside className={`opensrc-big-banner ${className}`} aria-label="app.opensrc.mx ecosystem">
      <div className="opensrc-banner-glow" aria-hidden="true" />
      <div className="opensrc-banner-inner">
        <div className="opensrc-banner-left">
          <div className="opensrc-brand-badge">
            <Sparkles size={13} />
            <span>OPEN-SOURCE ATHLETIC ECOSYSTEM</span>
          </div>

          <div className="opensrc-brand-row">
            <a
              href="https://app.opensrc.mx/"
              target="_blank"
              rel="noopener noreferrer"
              className="opensrc-logo-link"
              title="Visit app.opensrc.mx"
            >
              <img
                src="/logos/opensrc.png"
                alt="app.opensrc.mx logo"
                className="opensrc-banner-logo"
              />
            </a>

            <div className="opensrc-text-group">
              <h3 className="opensrc-banner-title">
                Proudly Built &amp; Powered by{" "}
                <a
                  href="https://app.opensrc.mx/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opensrc-highlight-link"
                >
                  app.opensrc.mx
                </a>
              </h3>
              <p className="opensrc-banner-desc">
                From official Nova Scotia race passports to live Atlantic Chip &amp; Route541 analytics —
                discover modern open-source software built for runners, race directors, and athletic communities.
              </p>
            </div>
          </div>
        </div>

        <div className="opensrc-banner-right">
          <a
            href="https://app.opensrc.mx/"
            target="_blank"
            rel="noopener noreferrer"
            className="opensrc-cta-btn"
          >
            <span>Visit app.opensrc.mx</span>
            <ArrowUpRight size={17} />
          </a>
        </div>
      </div>
    </aside>
  );
}
