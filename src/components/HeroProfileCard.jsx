import React from "react";
import { ArrowRight } from "lucide-react";

export default function HeroProfileCard({ primaryRunner, racesCount, pbRace, selectedUrl }) {
  return (
    <div className="card hero-card">
      <h2>{primaryRunner} — Race Profile</h2>
      <p>
        {pbRace ? (
          <>
            Found <strong>{racesCount}</strong> official finish
            {racesCount === 1 ? "" : "es"} — highlighted by a{" "}
            <strong>{pbRace.officialTime}</strong> {pbRace.pbLabel || "PB"} at {pbRace.name}.
          </>
        ) : (
          <>
            Found <strong>{racesCount}</strong> official finish
            {racesCount === 1 ? "" : "es"} across Atlantic Chip &amp; Route541.
          </>
        )}
      </p>
      <a className="hero-cta" href={selectedUrl} target="_blank" rel="noreferrer">
        <span>View Official Result</span>
        <span className="arrow-circle">
          <ArrowRight size={16} />
        </span>
      </a>
    </div>
  );
}
