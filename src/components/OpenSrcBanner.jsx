import React from "react";
import { ArrowUpRight, Headphones, Sparkles } from "lucide-react";

export default function OpenSrcBanner({ className = "" }) {
  return (
    <aside className={`opensrc-big-banner ${className}`} aria-label="app.opensrc.mx GlazeRun ecosystem">
      <div className="opensrc-banner-glow" aria-hidden="true" />
      <div className="opensrc-banner-inner">
        <div className="opensrc-banner-left">
          <div className="opensrc-brand-badge">
            <Sparkles size={13} />
            <span>OPEN-SOURCE ATHLETIC ECOSYSTEM • AI RUNNING COACH</span>
          </div>

          <div className="opensrc-brand-row">
            <a
              href="https://app.opensrc.mx/"
              target="_blank"
              rel="noopener noreferrer"
              className="opensrc-logo-link"
              title="Discover GlazeRun at app.opensrc.mx"
            >
              <img
                src="/logos/opensrc.png"
                alt="GlazeRun by app.opensrc.mx logo"
                className="opensrc-banner-logo"
              />
            </a>

            <div className="opensrc-text-group">
              <h3 className="opensrc-banner-title">
                Powered by{" "}
                <a
                  href="https://app.opensrc.mx/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opensrc-highlight-link"
                >
                  GlazeRun • app.opensrc.mx
                </a>
              </h3>
              <p className="opensrc-banner-desc">
                The Minimalist Zen Running Companion built for Nova Scotia. Run with 6 athletic AI voice coaches
                including David (Run Nova Scotia Grinder: <em>&ldquo;Built for the run. Made for Nova Scotia&rdquo;</em>) and Myles (Blue Nose: <em>&ldquo;Let&rsquo;s Giv&rsquo;er!&rdquo;</em>).
                Features 100% offline audio, native Spotify music ducking, and pocket-shielded GPS splits.
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
            <Headphones size={16} />
            <span>Try GlazeRun</span>
            <ArrowUpRight size={17} />
          </a>
        </div>
      </div>
    </aside>
  );
}
