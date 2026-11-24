/**
 * Resumable Node.js script to download ALL 80 Route541 events (2023–2026)
 * into data/route541_all/ and import them into PocketBase.
 *
 * Run: node scripts/sync-route541.mjs
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const R541_2026_DIR = path.join(DATA_DIR, "route541_2026");
const R541_ALL_DIR = path.join(DATA_DIR, "route541_all");
const DELAY_MS = 1800;

fs.mkdirSync(R541_ALL_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function isCompleteBundle(filePath) {
  if (!fs.existsSync(filePath)) return false;
  try {
    const b = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const vals = Object.values(b.lists || {});
    return vals.length > 0 && vals.every((v) => v && !v.error && v.data);
  } catch {
    return false;
  }
}

async function importToPocketBase() {
  try {
    const res = await fetch("http://127.0.0.1:8090/api/sync-route541-local", { method: "POST" });
    if (res.ok) {
      const json = await res.json();
      console.log("PocketBase import result:", json);
    }
  } catch (e) {
    console.log("PocketBase not reachable for auto-import:", e.message);
  }
}

async function main() {
  // Reuse any already-complete 2026 files so we don't re-fetch them
  if (fs.existsSync(R541_2026_DIR)) {
    for (const f of fs.readdirSync(R541_2026_DIR).filter((x) => x.endsWith(".json"))) {
      const src = path.join(R541_2026_DIR, f);
      const dst = path.join(R541_ALL_DIR, f);
      if (isCompleteBundle(src) && !isCompleteBundle(dst)) {
        fs.copyFileSync(src, dst);
      }
    }
  }

  const eventsPath = path.join(DATA_DIR, "route541_all_events.json");
  const events = JSON.parse(fs.readFileSync(eventsPath, "utf8"));

  let saved = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const outPath = path.join(R541_ALL_DIR, `event_${ev.event_id}_rr_${ev.rr_id}.json`);
    if (isCompleteBundle(outPath)) {
      skipped++;
      continue;
    }

    await sleep(DELAY_MS);
    let cfg;
    try {
      cfg = await fetchJson(
        `https://my.raceresult.com/${ev.rr_id}/results/config?lang=en&sanitize=false`
      );
    } catch (e) {
      if (e.status === 429) {
        console.log(
          `[${i + 1}/${events.length}] Rate-limited (HTTP 429) at ${ev.name}. Importing progress and stopping cleanly — re-run later to resume.`
        );
        await importToPocketBase();
        process.exit(1);
      }
      if (e.status === 404) {
        // Check if soft-block vs genuinely missing event
        console.log(`[${i + 1}/${events.length}] HTTP 404 on ${ev.name} (rr_id=${ev.rr_id})`);
        errors++;
        if (errors >= 3) {
          console.log("Multiple 404s detected (likely rate-limit soft-block). Importing progress and stopping cleanly.");
          await importToPocketBase();
          process.exit(1);
        }
        continue;
      }
      console.log(`[${i + 1}/${events.length}] Error on ${ev.name}: ${e.message}`);
      errors++;
      continue;
    }

    errors = 0; // reset consecutive error counter on success
    const srv = cfg.server || "my.raceresult.com";
    const key = cfg.key || "";
    const lists = cfg.TabConfig?.Lists || [];
    const nonLeader = lists.filter((l) => !l.Leader);
    const targetLists = (nonLeader.length ? nonLeader : lists.slice(0, 1)).slice(0, 2);

    const bundle = { event: ev, config: cfg, lists: {} };
    for (const lst of targetLists) {
      const contest = String(lst.Contest ?? "0");
      await sleep(DELAY_MS);
      const qs = new URLSearchParams({
        key,
        listname: lst.Name,
        page: "results",
        contest,
        r: "all",
        l: "0"
      });
      try {
        bundle.lists[`${lst.Name}__c${contest}`] = await fetchJson(
          `https://${srv}/${ev.rr_id}/results/list?${qs.toString()}`
        );
      } catch (le) {
        bundle.lists[`${lst.Name}__c${contest}`] = { error: le.message };
      }
    }

    fs.writeFileSync(outPath, JSON.stringify(bundle, null, 2), "utf8");
    saved++;
    console.log(`[${i + 1}/${events.length}] Saved ${path.basename(outPath)} (${ev.date} — ${ev.name})`);
  }

  console.log(`\nDone! Newly saved: ${saved}, already cached: ${skipped}, total: ${events.length}`);
  await importToPocketBase();
}

main();
