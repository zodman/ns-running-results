import React from "react";
import HeroProfileCard from "./HeroProfileCard.jsx";
import RaceLogoStrip from "./RaceLogoStrip.jsx";
import SelectedRaceStatsCard from "./SelectedRaceStatsCard.jsx";
import RaceRankingCard from "./RaceRankingCard.jsx";
import RaceHistorySummary from "./RaceHistorySummary.jsx";

export default function RaceDetailsColumn({
  primaryRunner,
  races,
  selected,
  pbRace,
  sortedBySpeed,
  sources,
  totalKm,
  historyStats,
  onSelectRace
}) {
  return (
    <section className="col">
      <HeroProfileCard
        primaryRunner={primaryRunner}
        racesCount={races.length}
        pbRace={pbRace}
        selectedUrl={selected.url}
      />
      <RaceLogoStrip races={races} selectedIdx={selected.idx} onSelectRace={onSelectRace} />
      <SelectedRaceStatsCard selected={selected} />
      <RaceRankingCard
        sortedBySpeed={sortedBySpeed}
        selectedIdx={selected.idx}
        onSelectRace={onSelectRace}
      />
      <RaceHistorySummary
        races={races}
        sources={sources}
        totalKm={totalKm}
        historyStats={historyStats}
      />
    </section>
  );
}
