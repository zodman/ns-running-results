import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  NS_RACE_CATALOG,
  NS_REGIONS,
  PASSPORT_RANKS,
  evaluatePassport,
  evaluateRegions,
  evaluateTrophies,
  getPassportRank
} from "../src/utils/passportCatalog.js";

const ROOT = process.cwd();

test("NS_RACE_CATALOG has 32 unique races and every logo file exists in public/", () => {
  assert.equal(NS_RACE_CATALOG.length, 32);
  const ids = new Set();
  for (const item of NS_RACE_CATALOG) {
    assert.ok(!ids.has(item.id), `Duplicate catalog id: ${item.id}`);
    ids.add(item.id);
    assert.ok(item.logosByYear && Object.keys(item.logosByYear).length > 0, `Missing logosByYear for ${item.id}`);
    for (const [yr, logoPath] of Object.entries(item.logosByYear)) {
      const diskPath = path.join(ROOT, "public", logoPath.replace(/^\//, ""));
      assert.ok(
        fs.existsSync(diskPath),
        `Missing logo file on disk for ${item.id} (${yr}): ${diskPath}`
      );
      const stat = fs.statSync(diskPath);
      assert.ok(stat.size > 500, `Logo file looks corrupt/empty for ${item.id}: ${diskPath}`);
    }
  }
});

test("getPassportRank returns accurate rank titles and next milestone counts", () => {
  assert.equal(getPassportRank(0, 32).current.title, "Rookie Runner");
  assert.equal(getPassportRank(0, 32).racesToNext, 1);

  const explorer = getPassportRank(4, 32);
  assert.equal(explorer.current.title, "Local Explorer");
  assert.equal(explorer.next.title, "NS Circuit Regular");
  assert.equal(explorer.racesToNext, 1);

  const grandMaster = getPassportRank(32, 32);
  assert.equal(grandMaster.current.title, "Grand Master of NS");
  assert.equal(grandMaster.next, null);
  assert.equal(grandMaster.racesToNext, 0);
  assert.ok(PASSPORT_RANKS.length >= 6);
});

test("evaluatePassport calculates Bronze/Silver/Gold tiers and year-versioned logos", () => {
  const sampleRaces = [
    {
      idx: 0,
      name: "Medavie Blue Nose Marathon",
      subEvent: "5K",
      category: "5K",
      iso: "2026-05-17T09:00:00-03:00",
      timestamp: Date.parse("2026-05-17T09:00:00-03:00"),
      officialSec: 1500,
      officialTime: "25:00",
      raceLocation: "Halifax, NS",
      shortLocation: "Halifax"
    },
    {
      idx: 1,
      name: "Harbour Hustle 2025",
      subEvent: "5K",
      category: "5K",
      iso: "2025-08-03T09:00:00-03:00",
      timestamp: Date.parse("2025-08-03T09:00:00-03:00"),
      officialSec: 1600,
      officialTime: "26:40",
      raceLocation: "Dartmouth, NS",
      shortLocation: "Dartmouth"
    },
    {
      idx: 2,
      name: "Harbour Hustle 2026",
      subEvent: "5K",
      category: "5K",
      iso: "2026-08-02T09:00:00-03:00",
      timestamp: Date.parse("2026-08-02T09:00:00-03:00"),
      officialSec: 1520,
      officialTime: "25:20",
      raceLocation: "Dartmouth, NS",
      shortLocation: "Dartmouth"
    }
  ];

  const passport = evaluatePassport(sampleRaces);
  assert.equal(passport.caughtCount, 2);
  assert.equal(passport.totalCount, 32);
  assert.equal(passport.tiers.bronze, 1);
  assert.equal(passport.tiers.silver, 1);
  assert.equal(passport.tiers.gold, 0);

  const hh = passport.entries.find((e) => e.id === "harbour-hustle");
  assert.equal(hh.tier, "silver");
  assert.equal(hh.bestTime, "25:20");
  assert.equal(hh.logo, "/logos/2026/harbour-hustle.png");
});

test("evaluateRegions unlocks on 1 finish and masters at threshold", () => {
  const races = [
    { name: "Louisbourg Race Through Time", iso: "2025-08-10", raceLocation: "Louisbourg, NS" },
    { name: "Rèis Mhàbu — Run Mabou", iso: "2025-10-12", raceLocation: "Mabou, NS" }
  ];
  const passport = evaluatePassport(races);
  const regStats = evaluateRegions(races, passport);
  assert.equal(regStats.totalRegions, NS_REGIONS.length);
  const cb = regStats.regions.find((r) => r.id === "Cape Breton");
  assert.equal(cb.unlocked, true);
  assert.equal(cb.mastered, true);
  assert.equal(regStats.unlockedCount, 1);
});

test("Course PR Crusher requires same distance and ignores Half -> 5K drops", () => {
  const mixedDistRaces = [
    {
      idx: 0,
      name: "Medavie Blue Nose Marathon",
      subEvent: "Half Marathon",
      category: "Half Marathon",
      iso: "2025-05-18",
      timestamp: Date.parse("2025-05-18"),
      officialSec: 7200,
      officialTime: "2:00:00",
      raceLocation: "Halifax, NS",
      shortLocation: "Halifax"
    },
    {
      idx: 1,
      name: "Medavie Blue Nose Marathon",
      subEvent: "5K",
      category: "5K",
      iso: "2026-05-17",
      timestamp: Date.parse("2026-05-17"),
      officialSec: 1500,
      officialTime: "25:00",
      raceLocation: "Halifax, NS",
      shortLocation: "Halifax"
    }
  ];
  const p1 = evaluatePassport(mixedDistRaces);
  const r1 = evaluateRegions(mixedDistRaces, p1);
  const t1 = evaluateTrophies(mixedDistRaces, p1, r1);
  const pr1 = t1.trophies.find((t) => t.id === "course-pr");
  assert.equal(pr1.unlocked, false, "Switching from Half Marathon to 5K must not trigger Course PR");

  const sameDistRaces = [
    { ...mixedDistRaces[0], subEvent: "5K", category: "5K", officialSec: 1620, officialTime: "27:00" },
    mixedDistRaces[1]
  ];
  const p2 = evaluatePassport(sameDistRaces);
  const r2 = evaluateRegions(sameDistRaces, p2);
  const t2 = evaluateTrophies(sameDistRaces, p2, r2);
  const pr2 = t2.trophies.find((t) => t.id === "course-pr");
  assert.equal(pr2.unlocked, true, "Faster 5K in a later year on same race must unlock Course PR");
});

test("First Marathon requires racing 42.2K distance and not just running a 5K at Medavie Blue Nose Marathon", () => {
  const blueNose5k = [
    {
      name: "Medavie Blue Nose Marathon",
      subEvent: "5K",
      category: "5K",
      km: 5,
      officialSec: 2312,
      officialTime: "38:32",
      iso: "2024-05-18T09:00:00-03:00",
      timestamp: Date.parse("2024-05-18T09:00:00-03:00"),
      raceLocation: "Halifax, NS",
      shortLocation: "Halifax"
    }
  ];

  const p1 = evaluatePassport(blueNose5k);
  const r1 = evaluateRegions(blueNose5k, p1);
  const t1 = evaluateTrophies(blueNose5k, p1, r1);
  const firstMarathon1 = t1.trophies.find((t) => t.id === "first-marathon");

  assert.equal(
    firstMarathon1.unlocked,
    false,
    "Running a 5K at Medavie Blue Nose Marathon must NOT unlock First Marathon"
  );
  assert.equal(firstMarathon1.progress, "Finish a 42.2K Marathon in NS");

  const blueNoseFull = [
    {
      name: "Medavie Blue Nose Marathon",
      subEvent: "Full Marathon",
      category: "Marathon",
      km: 42.2,
      officialSec: 13500,
      officialTime: "3:45:00",
      iso: "2024-05-19T08:00:00-03:00",
      timestamp: Date.parse("2024-05-19T08:00:00-03:00"),
      raceLocation: "Halifax, NS",
      shortLocation: "Halifax"
    }
  ];

  const p2 = evaluatePassport(blueNoseFull);
  const r2 = evaluateRegions(blueNoseFull, p2);
  const t2 = evaluateTrophies(blueNoseFull, p2, r2);
  const firstMarathon2 = t2.trophies.find((t) => t.id === "first-marathon");

  assert.equal(
    firstMarathon2.unlocked,
    true,
    "Running 42.2K Full Marathon at Medavie Blue Nose Marathon DOES unlock First Marathon"
  );
  assert.match(firstMarathon2.progress, /Completed at Medavie Blue Nose Marathon \(3:45:00\)/);
});
