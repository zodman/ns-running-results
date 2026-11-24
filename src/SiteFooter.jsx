import React from "react";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-sources">
        <span>Data fetched from </span>
        <a href="https://www.atlanticchip.ca/" target="_blank" rel="noreferrer">
          Atlantic Chip
        </a>
        <span> (2004–2026) &amp; </span>
        <a href="https://www.route541.com/" target="_blank" rel="noreferrer">
          Route541
        </a>
        <span> (2023–2026)</span>
      </div>
      <div className="footer-credit">
        <span>👟 Coded at a 4:30/km pace by </span>
        <a href="https://www.strava.com/athletes/zodman" target="_blank" rel="noreferrer">
          Andres Vargas (Strava)
        </a>
        <span> • </span>
        <a
          href="https://github.com/zodman/ns-running-results"
          target="_blank"
          rel="noreferrer"
        >
          GitHub Repo
        </a>
      </div>
    </footer>
  );
}
