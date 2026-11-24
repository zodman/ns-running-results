#!/usr/bin/env node
/**
 * Refresh Nova Scotia Race Passport logos for a target season year (Option B: Year-Versioned Medals).
 *
 * Usage:
 *   node scripts/refresh-passport-logos.mjs --year 2027
 *
 * Downloads the latest official logos for all 32 passport races from:
 *   - Route541 (https://route541.com/Events/Summary?EVENT_ID=<id>)
 *   - Atlantic Chip / RaceRoster (https://results.raceroster.com/v2/api/events/<slug>)
 * Saves them into public/logos/<year>/<race-id>.<ext> without overwriting previous seasons.
 */
import fs from "node:fs";
import path from "node:path";

const yearArgIdx = process.argv.indexOf("--year");
const TARGET_YEAR =
  yearArgIdx !== -1 && process.argv[yearArgIdx + 1]
    ? String(process.argv[yearArgIdx + 1])
    : String(new Date().getFullYear());

const CATALOG = [
  // Atlantic Chip (8)
  { id: "blue-nose", source: "ac", match: /blue nose/i },
  { id: "harbour-hustle", source: "ac", match: /harbour hustle|macpass miles/i },
  { id: "lunenburg-5k", source: "ac", match: /lunenburg.*5k|muffin run/i },
  { id: "michelin-tire-trot", source: "ac", match: /michelin.*tire trot/i },
  { id: "valley-harvest", source: "ac", match: /valley harvest/i },
  { id: "natal-day", source: "ac", match: /natal day/i },
  { id: "johnny-miles", source: "ac", match: /johnny miles/i },
  { id: "kicking-pancreas", source: "ac", match: /pancreas/i },
  // Route541 (24)
  { id: "berwick-gala", source: "r541", match: /berwick gala/i },
  { id: "louisbourg", source: "r541", match: /louisbourg/i },
  { id: "run-mabou", source: "r541", match: /mabou|mhàbu/i },
  { id: "escaouette", source: "r541", match: /escaouette/i },
  { id: "tatamagouche", source: "r541", match: /tatamagouche/i },
  { id: "pugwash-salt-dash", source: "r541", match: /pugwash/i },
  { id: "nasty-nuttby", source: "r541", match: /nuttby/i },
  { id: "cinnamon-bun", source: "r541", match: /cinnamon bun/i },
  { id: "back-road-bash", source: "r541", match: /back road bash/i },
  { id: "bee-hive-fives", source: "r541", match: /bee hive/i },
  { id: "mcnabs-half", source: "r541", match: /mcnab/i },
  { id: "mcintosh", source: "r541", match: /mcintosh/i },
  { id: "seaside-scramble", source: "r541", match: /seaside scramble/i },
  { id: "callous-crow", source: "r541", match: /callous crow/i },
  { id: "pick-shovel", source: "r541", match: /pick & shovel|pick and shovel|shovel/i },
  { id: "salty-7", source: "r541", match: /salty 7/i },
  { id: "movember-run", source: "r541", match: /movember/i },
  { id: "year-end-celebration", source: "r541", match: /year-end celebration/i },
  { id: "penguin-run", source: "r541", match: /penguin run/i },
  { id: "hantsport", source: "r541", match: /hantsport/i },
  { id: "middleton-heart", source: "r541", match: /middleton heart/i },
  { id: "spike-family", source: "r541", match: /spike family/i },
  { id: "lobster-crawl", source: "r541", match: /lobster crawl/i },
  { id: "sissaboo", source: "r541", match: /sissaboo/i }
];

const outDir = path.join(process.cwd(), "public", "logos", TARGET_YEAR);
fs.mkdirSync(outDir, { recursive: true });

async function downloadLogo(id, url) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  let ext = ".png";
  if (ct.includes("jpeg") || ct.includes("jpg") || /\.jpe?g(\?|$)/i.test(url)) ext = ".jpg";
  else if (ct.includes("webp") || /\.webp(\?|$)/i.test(url)) ext = ".webp";
  else if (ct.includes("svg") || /\.svg(\?|$)/i.test(url)) ext = ".svg";
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 500) throw new Error("Image too small");
  const filename = `${id}${ext}`;
  fs.writeFileSync(path.join(outDir, filename), buf);
  return `/logos/${TARGET_YEAR}/${filename}`;
}

async function main() {
  console.log(`Refreshing NS Race Passport logos for season ${TARGET_YEAR} -> ${outDir}`);
  const downloaded = {};

  // 1. Route541 (from local data/route541_all newest events first)
  const r541Dir = path.join(process.cwd(), "data", "route541_all");
  const r541Events = fs.existsSync(r541Dir)
    ? fs
        .readdirSync(r541Dir)
        .filter((f) => f.endsWith(".json"))
        .map((f) => {
          const d = JSON.parse(fs.readFileSync(path.join(r541Dir, f), "utf8"));
          return {
            id: Number(d.event?.event_id || 0),
            name: d.event?.name || "",
            date: d.event?.date || ""
          };
        })
        .filter((e) => e.id > 0)
        .sort((a, b) => b.id - a.id)
    : [];

  for (const item of CATALOG.filter((c) => c.source === "r541")) {
    const matches = r541Events.filter((e) => item.match.test(e.name));
    // Prefer events from TARGET_YEAR first, then newest available
    matches.sort((a, b) => {
      const aHit = a.date.includes(TARGET_YEAR) ? 1 : 0;
      const bHit = b.date.includes(TARGET_YEAR) ? 1 : 0;
      if (bHit !== aHit) return bHit - aHit;
      return b.id - a.id;
    });

    for (const ev of matches) {
      try {
        const hr = await fetch(`https://route541.com/Events/Summary?EVENT_ID=${ev.id}`, {
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        if (!hr.ok) continue;
        const html = await hr.text();
        const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)]
          .map((m) => m[1])
          .filter(
            (u) =>
              !u.includes("/images/logo.png") &&
              !/sponsor/i.test(u) &&
              /\.(png|jpg|jpeg|webp|svg)/i.test(u)
          );
        if (imgs.length > 0) {
          const url = imgs[0].startsWith("http") ? imgs[0] : `https://route541.com${imgs[0]}`;
          downloaded[item.id] = await downloadLogo(item.id, url);
          console.log(`  [R541] ${item.id} -> ${downloaded[item.id]}`);
          break;
        }
      } catch {}
    }
  }

  // 2. Atlantic Chip / RaceRoster
  const acCandidates = Object.fromEntries(
    CATALOG.filter((c) => c.source === "ac").map((c) => [c.id, new Set()])
  );
  for (const q of ["Smith", "MacDonald", "Campbell", "Fraser", "Taylor"]) {
    try {
      const r = await fetch(
        `https://timer.raceroster.com/widgets/api/5q9xpftgktqq5wnxd9qatwr?searchByParticipant=${encodeURIComponent(q)}`
      );
      if (!r.ok) continue;
      const data = await r.json();
      for (const row of data.rows || []) {
        if (!Array.isArray(row) || row.length < 9) continue;
        const iso = String(row[0] || "");
        const name = typeof row[2] === "object" ? row[2]?.name || "" : String(row[2] || "");
        const url = typeof row[8] === "object" ? row[8]?.url || "" : "";
        const m = url.match(/\/events\/([^/]+)\//);
        if (!m) continue;
        for (const item of CATALOG.filter((c) => c.source === "ac")) {
          if (item.match.test(name)) acCandidates[item.id].add(`${iso}|${m[1]}`);
        }
      }
    } catch {}
  }

  for (const [id, set] of Object.entries(acCandidates)) {
    const sorted = [...set].sort().reverse();
    for (const entry of sorted) {
      const slug = entry.split("|")[1];
      try {
        const er = await fetch(`https://results.raceroster.com/v2/api/events/${slug}`);
        if (!er.ok) continue;
        const str = await er.text();
        const m = str.match(/https?:\/\/cdn\.raceroster\.com\/event-logo\/[^"\\]+/);
        if (m) {
          downloaded[id] = await downloadLogo(id, m[0]);
          console.log(`  [AC]   ${id} -> ${downloaded[id]}`);
          break;
        }
      } catch {}
    }
  }

  console.log(`\nDone! Downloaded ${Object.keys(downloaded).length} / ${CATALOG.length} logos for ${TARGET_YEAR}.`);
  console.log(`Add these entries under logosByYear[${TARGET_YEAR}] in src/utils/passportCatalog.js:\n`);
  console.log(JSON.stringify(downloaded, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
