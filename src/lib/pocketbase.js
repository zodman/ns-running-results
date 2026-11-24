import PocketBase from "pocketbase";

// Uses Vite proxy (/api -> http://127.0.0.1:8090) in dev, or same-origin in production
export const pb = new PocketBase(window.location.origin);

const ATLANTIC_CHIP_WIDGET = "5q9xpftgktqq5wnxd9qatwr";
const AC_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h client-side localStorage cache

const KNOWN_LOGOS = {
  bc4yxdar5jrrs7cp: "/logos/harbour_hustle.png",
  fgbssgvgwaufvvcb: "/logos/michelin_tire_trot.jpg",
  ysymrwectm43zhk7: "/logos/lunenburg_5k.png",
  "3h6dmuf3xwvwbum9": "/logos/blue_nose.jpg"
};

let cachedLogoMap = null;

function normalize(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function getLogoMap() {
  if (cachedLogoMap) return cachedLogoMap;
  const map = { ...KNOWN_LOGOS };
  try {
    const records = await pb.collection("event_logos").getFullList({ batch: 500 });
    for (const r of records) {
      if (r.slug && r.logo_url && !map[r.slug]) {
        map[r.slug] = r.logo_url;
      }
    }
  } catch (_) {
    // Fallback to local known logos if PocketBase isn't reachable
  }
  cachedLogoMap = map;
  return map;
}

/**
 * Queries Atlantic Chip (RaceRoster) DIRECTLY from the browser (no backend proxy!)
 * because timer.raceroster.com sends Access-Control-Allow-Origin: *.
 * Caches responses per query in localStorage for 24 hours.
 */
async function fetchAtlanticChipDirect(name, year = "all") {
  const norm = normalize(name);
  const cacheKey = `ac_direct_v1:${norm}`;
  let rowsAll = null;

  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.ts && Date.now() - parsed.ts < AC_CACHE_TTL_MS && Array.isArray(parsed.rows)) {
        rowsAll = parsed.rows;
      }
    }
  } catch (_) {}

  if (!rowsAll) {
    rowsAll = [];
    let offset = 0;
    for (let page = 0; page < 4; page++) {
      const qs = new URLSearchParams({ offset: String(offset), searchByParticipant: name });
      const res = await fetch(
        `https://timer.raceroster.com/widgets/api/${ATLANTIC_CHIP_WIDGET}?${qs.toString()}`
      );
      if (!res.ok) break;
      const data = await res.json();
      const rows = data.rows || [];
      if (!rows.length) break;
      rowsAll.push(...rows);

      const cursor = data.paginationCursor;
      if (cursor === null || cursor === undefined || cursor === offset) break;
      offset = cursor;
    }

    try {
      localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), rows: rowsAll }));
    } catch (_) {}
  }

  const logoMap = await getLogoMap();
  const seen = new Set();
  const results = [];

  for (let i = 0; i < rowsAll.length; i++) {
    const row = rowsAll[i];
    if (!Array.isArray(row) || row.length < 9) continue;
    const [iso, participant, evObj, city, rank, gunTime, chipTime, division, linkObj] = row;
    if (year && year !== "all" && !String(iso || "").startsWith(year)) continue;

    const evName = typeof evObj === "object" && evObj ? evObj.name || "" : String(evObj || "");
    const subEvent = typeof evObj === "object" && evObj ? evObj.subEvent || "" : "";
    const resUrl = typeof linkObj === "object" && linkObj ? linkObj.url || "#" : "#";

    const dedup = `${iso}|${participant}|${evName}|${subEvent}`;
    if (seen.has(dedup)) continue;
    seen.add(dedup);

    const slugMatch = resUrl.match(/\/events\/([^/]+)\//);
    const slug = slugMatch ? slugMatch[1] : "";

    results.push({
      id: `ac-${i}-${slug}`,
      source: "Atlantic Chip",
      iso: String(iso || ""),
      participant: String(participant || ""),
      name: String(evName),
      subEvent: String(subEvent),
      city: String(city || ""),
      rank: rank !== null && rank !== undefined ? rank : "—",
      gunTime: gunTime || null,
      chipTime: chipTime || null,
      division: String(division || ""),
      url: resUrl,
      logo: logoMap[slug] || null
    });
  }

  return results;
}

/**
 * Queries Route541 cached results directly from PocketBase race_results collection.
 */
async function fetchRoute541FromPocketBase(name, year = "all") {
  const tokens = normalize(name).split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];

  const filters = ['source = "Route541"'];
  for (const t of tokens) {
    const safe = t.replace(/"/g, '\\"');
    filters.push(`participant_norm ~ "${safe}"`);
  }
  if (year && year !== "all") {
    const safeYr = year.replace(/"/g, '\\"');
    filters.push(`race_date ~ "${safeYr}"`);
  }

  try {
    const list = await pb.collection("race_results").getList(1, 200, {
      filter: filters.join(" && "),
      sort: "-race_date"
    });
    return list.items.map((r) => ({
      id: r.id,
      source: "Route541",
      iso: r.race_date || "",
      participant: r.participant || "",
      name: r.event_name || "",
      subEvent: r.sub_event || "",
      city: r.city || "",
      rank: /^\d+$/.test(String(r.rank || "")) ? Number(r.rank) : r.rank || "—",
      gunTime: r.gun_time || null,
      chipTime: r.chip_time || null,
      division: r.division || "",
      url: r.result_url || "#",
      logo: r.logo_url || null
    }));
  } catch (_) {
    return [];
  }
}

export async function searchRunner(name, year = "all", { saveToCommunity = true } = {}) {
  // 1. Check shared PocketBase 24h database cache first (saves Atlantic Chip API calls for all users!)
  let cachedData = null;
  try {
    const qs = new URLSearchParams({ name, year });
    const res = await fetch(`/api/ns-cache?${qs.toString()}`);
    if (res.ok) {
      cachedData = await res.json();
      if (cachedData.cacheHit) {
        return cachedData;
      }
    }
  } catch (_) {}

  // 2. Cache miss: fetch Atlantic Chip directly from the browser (no proxy!)
  const acAllYears = await fetchAtlanticChipDirect(name, "all").catch(() => []);

  // 3. Persist fetched Atlantic Chip results into PocketBase if user opted in
  if (saveToCommunity && acAllYears.length > 0) {
    fetch("/api/ns-cache", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: name, rows: acAllYears })
    }).catch(() => {});
  }

  // Filter Atlantic Chip results for requested year and merge with Route541 results from DB
  const acFiltered =
    year && year !== "all"
      ? acAllYears.filter((r) => String(r.iso || "").startsWith(year))
      : acAllYears;

  const r541Results = cachedData
    ? (cachedData.results || []).filter((r) => r.source === "Route541")
    : await fetchRoute541FromPocketBase(name, year);

  const combined = [...acFiltered, ...r541Results];
  return {
    query: name,
    year,
    count: combined.length,
    sources: {
      atlanticChip: acFiltered.length,
      route541: r541Results.length
    },
    results: combined
  };
}

export async function optOutRunner(name) {
  const res = await fetch("/api/ns-optout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  if (!res.ok) {
    throw new Error(`Opt-out failed (HTTP ${res.status})`);
  }
  return res.json();
}

export async function getCommunityOverview(year = "all") {
  const qs = new URLSearchParams({ year });
  const res = await fetch(`/api/ns-overview?${qs.toString()}`);
  if (!res.ok) {
    throw new Error(`Overview failed (HTTP ${res.status})`);
  }
  return res.json();
}
