import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import RaceMedal from "../src/components/RaceMedal.jsx";
import InfoModal from "../src/components/InfoModal.jsx";
import RegionBadges from "../src/components/RegionBadges.jsx";
import TrophyShelf from "../src/components/TrophyShelf.jsx";
import RacePassport from "../src/components/RacePassport.jsx";
import TimelineGraph from "../src/components/TimelineGraph.jsx";
import {
  evaluatePassport,
  evaluateRegions,
  evaluateTrophies
} from "../src/utils/passportCatalog";

const SAMPLE_RACES = [
  {
    idx: 0,
    id: "r1",
    name: "Medavie Blue Nose Marathon",
    subEvent: "5K",
    category: "5K",
    iso: "2026-05-17T09:00:00-03:00",
    dateLabel: "May 17, 2026",
    shortDate: "May 17",
    timestamp: Date.parse("2026-05-17T09:00:00-03:00"),
    officialSec: 1500,
    officialTime: "25:00",
    pace: "5:00/km",
    km: 5,
    rank: 120,
    raceLocation: "Halifax, NS",
    shortLocation: "Halifax"
  },
  {
    idx: 1,
    id: "r2",
    name: "Harbour Hustle 2026",
    subEvent: "5K",
    category: "5K",
    iso: "2026-08-02T09:00:00-03:00",
    dateLabel: "Aug 2, 2026",
    shortDate: "Aug 2",
    timestamp: Date.parse("2026-08-02T09:00:00-03:00"),
    officialSec: 1460,
    officialTime: "24:20",
    pace: "4:52/km",
    km: 5,
    rank: 95,
    raceLocation: "Dartmouth, NS",
    shortLocation: "Dartmouth"
  },
  {
    idx: 2,
    id: "r3",
    name: "Lunenburg 5km & Muffin Run",
    subEvent: "5K",
    category: "5K",
    iso: "2025-06-07T09:00:00-03:00",
    dateLabel: "Jun 7, 2025",
    shortDate: "Jun 7",
    timestamp: Date.parse("2025-06-07T09:00:00-03:00"),
    officialSec: 1540,
    officialTime: "25:40",
    pace: "5:08/km",
    km: 5,
    rank: 42,
    raceLocation: "Lunenburg, NS",
    shortLocation: "Lunenburg"
  },
  {
    idx: 3,
    id: "r4",
    name: "Michelin Tire Trot",
    subEvent: "5K",
    category: "5K",
    iso: "2025-06-14T09:00:00-03:00",
    dateLabel: "Jun 14, 2025",
    shortDate: "Jun 14",
    timestamp: Date.parse("2025-06-14T09:00:00-03:00"),
    officialSec: 1510,
    officialTime: "25:10",
    pace: "5:02/km",
    km: 5,
    rank: 38,
    raceLocation: "Bridgewater, NS",
    shortLocation: "Bridgewater"
  }
];

describe("RaceMedal", () => {
  it("renders caught gold medal with logo and checkmark badge", () => {
    const { container } = render(
      <RaceMedal
        item={{
          name: "Harbour Hustle",
          short: "HH",
          logo: "/logos/2026/harbour-hustle.png",
          color: "#ff7a28",
          caught: true,
          tier: "gold"
        }}
      />
    );
    expect(container.querySelector(".race-medal.tier-gold")).toBeInTheDocument();
    expect(screen.getByAltText("Harbour Hustle")).toHaveAttribute(
      "src",
      "/logos/2026/harbour-hustle.png"
    );
    expect(container.querySelector(".pm-check-badge")).toBeInTheDocument();
  });

  it("renders locked silhouette without checkmark badge", () => {
    const { container } = render(
      <RaceMedal
        item={{
          name: "Valley Harvest Marathon",
          short: "VH",
          logo: "/logos/2026/valley-harvest.png",
          color: "#ea580c",
          caught: false,
          tier: "locked"
        }}
      />
    );
    expect(container.querySelector(".race-medal.tier-locked")).toBeInTheDocument();
    expect(container.querySelector(".pm-check-badge")).not.toBeInTheDocument();
  });
});

describe("InfoModal", () => {
  it("opens, renders content, and closes on Escape key or close button", () => {
    const onClose = vi.fn();
    render(
      <InfoModal open={true} title="Test Rules" onClose={onClose}>
        <p>Modal details here</p>
      </InfoModal>
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Modal details here")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText("Close details"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe("RegionBadges & TrophyShelf", () => {
  const passport = evaluatePassport(SAMPLE_RACES);
  const regionStats = evaluateRegions(SAMPLE_RACES, passport);
  const trophyStats = evaluateTrophies(SAMPLE_RACES, passport, regionStats);

  it("renders all 7 regions, filters on click, and opens Region Rules modal", () => {
    const onSelectRegion = vi.fn();
    render(
      <RegionBadges
        regionStats={regionStats}
        activeRegion="all"
        onSelectRegion={onSelectRegion}
      />
    );
    expect(screen.getByText("Halifax Metro")).toBeInTheDocument();
    expect(screen.getByText("Cape Breton")).toBeInTheDocument();

    fireEvent.click(screen.getByText("South Shore"));
    expect(onSelectRegion).toHaveBeenCalledWith("South Shore");

    fireEvent.click(screen.getByTitle("How Regions & Mastery work"));
    expect(screen.getByText("Capture Nova Scotia — Region Rules")).toBeInTheDocument();
  });

  it("renders unlocked & locked trophies and opens Trophies Details modal", () => {
    render(<TrophyShelf trophyStats={trophyStats} />);
    expect(screen.getByText("5K Club")).toBeInTheDocument();
    expect(screen.getByText("Back-to-Back Warrior")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("How Achievement Trophies work"));
    expect(screen.getByText("Achievement Trophies — How to Unlock")).toBeInTheDocument();
  });
});

describe("RacePassport", () => {
  it("displays score, rank, filters Caught/Locked, and opens Share & Details modals", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) }))
    );
    const onSelectRace = vi.fn();
    render(
      <RacePassport
        runnerName="Andres Vargas"
        races={SAMPLE_RACES}
        onSelectRace={onSelectRace}
      />
    );

    expect(screen.getByText("Andres Vargas's Medal Wall")).toBeInTheDocument();
    expect(screen.getByText("Local Explorer")).toBeInTheDocument();
    expect(screen.getByText("13%")).toBeInTheDocument();

    // Filter to Caught (4) only
    fireEvent.click(screen.getByRole("button", { name: "Caught (4)" }));
    expect(screen.getByText("Medavie Blue Nose Marathon")).toBeInTheDocument();
    expect(screen.queryByText("Valley Harvest Marathon")).not.toBeInTheDocument();

    // Clicking a caught medal calls onSelectRace
    fireEvent.click(screen.getByText("Harbour Hustle"));
    expect(onSelectRace).toHaveBeenCalledWith(1);

    // Open Medal Wall Details modal
    fireEvent.click(screen.getByTitle("How the Medal Wall works"));
    expect(screen.getByText("NS Race Passport — Medal Wall Guide")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Close details"));

    // Open Share modal and verify Facebook share preview & direct link copy, ensuring web embed & badge are removed
    expect(screen.getByTitle("Share your Race Passport image or link")).toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Share your Race Passport image or link"));
    expect(screen.getByText("Share Your NS Race Passport")).toBeInTheDocument();
    const shareSelect = screen.getByLabelText("Select medal or wall to share");
    expect(shareSelect).toBeInTheDocument();
    expect(shareSelect.value).toBe("all");
    expect(screen.getByRole("button", { name: /Facebook \(1\.91:1/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Share on Facebook" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download for Strava \/ Instagram/i })).toBeInTheDocument();
    expect(screen.getByText("NS-RUNNING-RESULTS.OPENSRC.MX")).toBeInTheDocument();
    expect(screen.queryByText(/Web Embed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Markdown Badge/i)).not.toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByLabelText("Close details"));

    // Click individual medal card share button to share single medal
    const medalShareButtons = screen.getAllByTitle(/Share .* medal/i);
    expect(medalShareButtons.length).toBeGreaterThan(0);
    fireEvent.click(medalShareButtons[0]);
    expect(screen.getByText(/Share .* Finisher Medal/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Select medal or wall to share").value).not.toBe("all");
  });
});

describe("TimelineGraph", () => {
  it("renders chart, switches Time/Pace/Rank tabs, and displays mobile swipe hint", () => {
    const onModeChange = vi.fn();
    render(
      <TimelineGraph
        races={SAMPLE_RACES}
        selected={SAMPLE_RACES[0]}
        theme="dark"
        graphMode="time"
        onGraphModeChange={onModeChange}
        filterTab="all"
        onToggleCategory={() => {}}
        onSelectRace={() => {}}
      />
    );

    expect(screen.getByText("Time by Distance")).toBeInTheDocument();
    expect(screen.getByText(/Swipe chart to explore all 4 races/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pace" }));
    expect(onModeChange).toHaveBeenCalledWith("pace");
  });
});
