import React from "react";
import RaceFeedCard from "./RaceFeedCard.jsx";
import HighlightMetricCard from "./HighlightMetricCard.jsx";
import TimeComparisonChart from "./TimeComparisonChart.jsx";

export default function RaceFeedColumn({
  races,
  visibleFeed,
  selected,
  chartRaces,
  maxSec,
  totalKm,
  onSelectRace
}) {
  return (
    <section className="col">
      <RaceFeedCard
        visibleFeed={visibleFeed}
        selectedIdx={selected.idx}
        onSelectRace={onSelectRace}
      />
      <HighlightMetricCard selected={selected} />
      <TimeComparisonChart
        races={races}
        chartRaces={chartRaces}
        maxSec={maxSec}
        totalKm={totalKm}
        onSelectRace={onSelectRace}
      />
    </section>
  );
}
