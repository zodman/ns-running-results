export const GRADIENTS = [
  "linear-gradient(135deg, #0370b9 0%, #fef000 100%)",
  "linear-gradient(135deg, #025a96 0%, #64a1c9 100%)",
  "linear-gradient(135deg, #033d65 0%, #0370b9 100%)",
  "linear-gradient(135deg, #fef000 0%, #0370b9 100%)",
  "linear-gradient(135deg, #64a1c9 0%, #025a96 100%)"
];

export const CATEGORY_ORDER = ["5K", "10K", "Half Marathon", "Marathon", "Other"];

export const CATEGORY_COLORS = {
  "5K": "#fef000",
  "10K": "#38bdf8",
  "Half Marathon": "#22c55e",
  Marathon: "#fb7185",
  Other: "#a78bfa"
};

export const CATEGORY_COLORS_LIGHT = {
  "5K": "#0370b9",
  "10K": "#0284c7",
  "Half Marathon": "#16a34a",
  Marathon: "#e11d48",
  Other: "#7c3aed"
};

export function decodeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

export function parseSeconds(str) {
  if (!str || str === "—") return null;
  const parts = String(str).trim().split(":").map(Number);
  if (parts.some(Number.isNaN)) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

export function parseTimestamp(raw) {
  if (!raw) return 0;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

export function detectKm(name, subEvent) {
  for (const raw of [subEvent, name]) {
    const txt = String(raw || "").toLowerCase();
    if (!txt) continue;
    if (/half[\s-]*marathon|21\.1\s*k|\b21k\b|\bhalf\b/i.test(txt)) return 21.1;
    if (/full[\s-]*marathon|42\.2\s*k|\b42k\b/i.test(txt)) return 42.2;
    const kmMatch = txt.match(/(\d+(?:\.\d+)?)\s*(?:k|km)\b/i);
    if (kmMatch) return parseFloat(kmMatch[1]);
    const miMatch = txt.match(/(\d+(?:\.\d+)?)\s*(?:mile|miler|mi)\b/i);
    if (miMatch) return +(parseFloat(miMatch[1]) * 1.60934).toFixed(2);
    if (/\bmarathon\b/i.test(txt) && raw === subEvent) return 42.2;
  }
  return null;
}

export function detectRaceLocation(name) {
  const n = String(name || "").toLowerCase();
  const rules = [
    [/blue nose|halifax|mcnab|mcintosh|pancreas|seaside scramble|callous crow|pick & shovel|salty 7|guesstimate|year-end|run with class|movember|spring run-off/, "Halifax, NS"],
    [/harbour hustle|dartmouth|natal day|bee hive|shubie/, "Dartmouth, NS"],
    [/michelin|tire trot|bridgewater/, "Bridgewater, NS"],
    [/lunenburg/, "Lunenburg, NS"],
    [/valley harvest|wolfville/, "Wolfville, NS"],
    [/berwick/, "Berwick, NS"],
    [/hantsport/, "Hantsport, NS"],
    [/fredericton/, "Fredericton, NB"],
    [/cinnamon bun|nuttby|truro|runway run/, "Truro, NS"],
    [/tatamagouche/, "Tatamagouche, NS"],
    [/middleton/, "Middleton, NS"],
    [/pugwash/, "Pugwash, NS"],
    [/louisbourg/, "Louisbourg, NS"],
    [/mabou|mhàbu/, "Mabou, NS"],
    [/escaouette|cheticamp|chéticamp/, "Chéticamp, NS"],
    [/kentville|spike family/, "Kentville, NS"],
    [/lobster crawl|barrington/, "Barrington, NS"],
    [/moncton/, "Moncton, NB"],
    [/saint john/, "Saint John, NB"],
    [/charlottetown|pei|wally rodd/, "Charlottetown, PE"],
    [/baie sainte marie/, "Clare, NS"],
    [/johnny miles|new glasgow|pictou/, "New Glasgow, NS"],
    [/cape breton|sydney/, "Sydney, NS"],
    [/yarmouth/, "Yarmouth, NS"],
    [/antigonish/, "Antigonish, NS"],
    [/sissaboo|weymouth/, "Weymouth, NS"],
    [/rum runners/, "Halifax–Lunenburg"],
    [/wayfarers/, "Port Williams, NS"],
    [/mahone bay/, "Mahone Bay, NS"],
    [/peggy/, "Peggy's Cove, NS"],
    [/amherst/, "Amherst, NS"],
    [/windsor/, "Windsor, NS"]
  ];
  for (const [re, loc] of rules) {
    if (re.test(n)) return loc;
  }
  return "Nova Scotia";
}

export function classifyCategory(name, subEvent, km) {
  const sub = String(subEvent || "").toLowerCase();
  const full = `${subEvent || ""} ${name || ""}`.toLowerCase();

  if (km === 5 || /\b5\s*(?:k|km)\b/i.test(sub)) return "5K";
  if (km === 10 || /\b10\s*(?:k|km)\b/i.test(sub)) return "10K";
  if (km === 21.1 || /half[\s-]*marathon|\bhalf\b|21\.1/i.test(sub)) return "Half Marathon";
  if (km === 42.2 || /full[\s-]*marathon|42\.2/i.test(sub)) return "Marathon";

  if (/half[\s-]*marathon|21\.1/i.test(full)) return "Half Marathon";
  if (/\b5\s*(?:k|km)\b/i.test(full) && !/\b10\s*(?:k|km)\b/i.test(full)) return "5K";
  if (/\b10\s*(?:k|km)\b/i.test(full) && !/\b25\s*(?:k|km)\b/i.test(full)) return "10K";
  if (/\bmarathon\b/i.test(sub) && !/half/i.test(sub)) return "Marathon";

  return "Other";
}

export function formatPace(seconds, km) {
  if (!seconds || !km) return "Road Race";
  const spk = Math.round(seconds / km);
  const m = Math.floor(spk / 60);
  const s = String(spk % 60).padStart(2, "0");
  return `${m}'${s}"/km`;
}

export function initials(text) {
  const words = String(text || "RR").replace(/[^a-zA-Z0-9\s]/g, "").trim().split(/\s+/);
  return ((words[0]?.[0] || "R") + (words[1]?.[0] || words[0]?.[1] || "")).toUpperCase();
}

export function formatDate(raw) {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw || "");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function shortDate(raw) {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw || "").slice(0, 10);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function normalizeResults(items) {
  const sortedByDate = [...items].sort((a, b) => parseTimestamp(b.iso) - parseTimestamp(a.iso));

  const list = sortedByDate.map((item, idx) => {
    const cleanName = decodeHtml(item.name || "");
    const cleanSub = decodeHtml(item.subEvent || "");
    const km = detectKm(cleanName, cleanSub);
    const category = classifyCategory(cleanName, cleanSub, km);
    const raceLocation = detectRaceLocation(cleanName);
    const officialTime = item.chipTime || item.gunTime || "—";
    const officialSec = parseSeconds(officialTime);
    const gunSec = parseSeconds(item.gunTime);
    return {
      ...item,
      name: cleanName,
      subEvent: cleanSub,
      raceLocation,
      shortLocation: raceLocation.split(",")[0],
      idx,
      timestamp: parseTimestamp(item.iso),
      dateLabel: formatDate(item.iso),
      shortDate: shortDate(item.iso),
      gunTime: item.gunTime || "—",
      chipTime: item.chipTime || "—",
      officialTime,
      officialSec,
      gunSec,
      km,
      category,
      is5k: category === "5K",
      pace: formatPace(officialSec, km),
      division: item.division || "—",
      bg: GRADIENTS[idx % GRADIENTS.length],
      short: initials(cleanName),
      isPB: false,
      pbLabel: ""
    };
  });

  for (const cat of ["5K", "10K", "Half Marathon", "Marathon"]) {
    const catRaces = list.filter((r) => r.category === cat && r.officialSec);
    if (catRaces.length) {
      const best = catRaces.reduce((a, b) => (a.officialSec < b.officialSec ? a : b));
      best.isPB = true;
      best.pbLabel = `${cat === "Half Marathon" ? "Half" : cat} PB`;
    }
  }
  return list;
}

export function computeHistoryStats(races) {
  const years = [
    ...new Set(
      races
        .map((r) => {
          const d = new Date(r.iso);
          return Number.isNaN(d.getTime()) ? null : d.getFullYear();
        })
        .filter(Boolean)
    )
  ].sort((a, b) => a - b);

  const totalSeconds = races.reduce((acc, r) => acc + (r.officialSec || 0), 0);
  const totalH = Math.floor(totalSeconds / 3600);
  const totalM = Math.floor((totalSeconds % 3600) / 60);
  const totalTimeLabel = totalH > 0 ? `${totalH}h ${totalM}m` : `${totalM}m`;

  const numericRanks = races.filter((r) => typeof r.rank === "number" && r.rank > 0);
  const bestRankRace = numericRanks.length
    ? numericRanks.reduce((a, b) => (a.rank < b.rank ? a : b))
    : null;

  const kmRaces = races.filter((r) => r.km && r.officialSec);
  const avgPaceLabel = kmRaces.length
    ? formatPace(
        kmRaces.reduce((acc, r) => acc + r.officialSec, 0),
        kmRaces.reduce((acc, r) => acc + r.km, 0)
      )
    : "—";

  const byCat = CATEGORY_ORDER.map((cat) => {
    const group = races.filter((r) => r.category === cat);
    if (!group.length) return null;
    const timed = group.filter((r) => r.officialSec);
    const best = timed.length
      ? timed.reduce((a, b) => (a.officialSec < b.officialSec ? a : b))
      : null;
    return { cat, count: group.length, bestTime: best?.officialTime || "—" };
  }).filter(Boolean);

  const locMap = {};
  for (const r of races) {
    const loc = r.shortLocation || "Nova Scotia";
    locMap[loc] = (locMap[loc] || 0) + 1;
  }
  const topLocations = Object.entries(locMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return {
    yearRange:
      years.length > 1
        ? `${years[0]} – ${years[years.length - 1]}`
        : years[0]
          ? String(years[0])
          : "—",
    seasonCount: years.length,
    totalTimeLabel,
    bestRankRace,
    avgPaceLabel,
    byCat,
    topLocations,
    uniqueLocations: Object.keys(locMap).length
  };
}
