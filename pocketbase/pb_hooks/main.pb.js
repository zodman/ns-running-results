/// <reference path="../pb_data/types.d.ts" />

// Auto-import Route541 local JSONs on first boot when race_results is empty (e.g. fresh Docker deploy)
onBootstrap((e) => {
  e.next();
  try {
    const existing = e.app.findRecordsByFilter("race_results", 'source = "Route541"', "", 1, 0);
    if (existing.length === 0) {
      const normalize = (s) =>
        String(s || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim();

      const colIdx = (dataFields, keys) => {
        for (let i = 0; i < dataFields.length; i++) {
          const low = String(dataFields[i] || "").toLowerCase();
          for (let k = 0; k < keys.length; k++) {
            if (low.indexOf(keys[k]) !== -1) return i;
          }
        }
        return -1;
      };

      const raceCol = e.app.findCollectionByNameOrId("race_results");
      let count = 0;

      const importList = (txApp, dataObj, dataFields, evName, evDate, evUrl) => {
        if (!dataObj) return;
        const idxName = colIdx(dataFields, ["flname", "name", "displayname"]);
        const idxCity = colIdx(dataFields, ["city"]);
        const idxDiv = colIdx(dataFields, ["agegroup.nameshort", "agegroup", "division"]);
        const idxGun = colIdx(dataFields, ["finish.gun", "gun"]);
        const idxChip = colIdx(dataFields, ["finish.chip", "chip", "time"]);
        const idxRank = colIdx(dataFields, ["autorank", "rank", "place"]);

        const entries = Array.isArray(dataObj)
          ? [["Results", dataObj]]
          : Object.keys(dataObj).map((k) => [k, dataObj[k]]);

        for (let g = 0; g < entries.length; g++) {
          const groupName = String(entries[g][0]).replace(/^#\d+_/, "");
          const rows = entries[g][1];
          if (!Array.isArray(rows)) continue;
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!Array.isArray(row) || row.length < 4) continue;
            const participant =
              idxName >= 0 && idxName < row.length
                ? String(row[idxName] || "").trim()
                : String(row[3] || "").trim();
            if (!participant || /^\d+$/.test(participant)) continue;

            const ukey = "r541|" + evDate + "|" + evName + "|" + groupName + "|" + participant;
            try {
              txApp.findFirstRecordByFilter("race_results", "unique_key = {:k}", { k: ukey });
              continue;
            } catch (_) {}

            try {
              const rec = new Record(raceCol);
              rec.set("unique_key", ukey);
              rec.set("source", "Route541");
              rec.set("participant", participant);
              rec.set("participant_norm", normalize(participant));
              rec.set("event_name", evName);
              rec.set("sub_event", groupName);
              rec.set("race_date", evDate);
              rec.set("city", idxCity >= 0 && idxCity < row.length ? String(row[idxCity] || "").trim() : "");
              const rankRaw = idxRank >= 0 && idxRank < row.length ? String(row[idxRank] || "") : "";
              rec.set("rank", rankRaw.replace(/[^\d]/g, "") || rankRaw);
              rec.set("gun_time", idxGun >= 0 && idxGun < row.length ? String(row[idxGun] || "").trim() : "");
              rec.set("chip_time", idxChip >= 0 && idxChip < row.length ? String(row[idxChip] || "").trim() : "");
              rec.set("division", idxDiv >= 0 && idxDiv < row.length ? String(row[idxDiv] || "").trim() : "");
              rec.set("result_url", evUrl);
              rec.set("logo_url", "");
              rec.set("event_slug", "");
              txApp.save(rec);
              count++;
            } catch (_) {}
          }
        }
      };

      e.app.runInTransaction((txApp) => {
        try {
          const files = $os.readDir("data/route541_all");
          for (let i = 0; i < files.length; i++) {
            const fname = files[i].name();
            if (!fname.endsWith(".json")) continue;
            const bundle = JSON.parse(toString($os.readFile("data/route541_all/" + fname)));
            const ev = bundle.event || {};
            const evUrl = "https://www.route541.com/Events/LeaderBoard?EVENT_ID=" + (ev.event_id || "");
            const lists = bundle.lists || {};
            const listKeys = Object.keys(lists);
            for (let j = 0; j < listKeys.length; j++) {
              if (lists[listKeys[j]] && lists[listKeys[j]].data) {
                importList(txApp, lists[listKeys[j]].data, lists[listKeys[j]].DataFields || [], String(ev.name || ""), String(ev.date || ""), evUrl);
              }
            }
          }
        } catch (_) {}
      });
      console.log("[bootstrap] Auto-imported Route541 records:", count);
    }
  } catch (err) {
    console.log("[bootstrap] Skip auto-import:", err);
  }
});

routerAdd("GET", "/api/ns-search", (e) => {
  const name = (e.request.url.query().get("name") || "").trim();
  const year = (e.request.url.query().get("year") || "all").trim();
  const forceRefresh = e.request.url.query().get("refresh") === "1";

  if (!name) {
    return e.json(200, { query: "", year, count: 0, results: [] });
  }

  const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24-hour Atlantic Chip proxy cache

  const normalize = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const KNOWN_LOGOS = {
    bc4yxdar5jrrs7cp: "/logos/harbour_hustle.png",
    fgbssgvgwaufvvcb: "/logos/michelin_tire_trot.jpg",
    ysymrwectm43zhk7: "/logos/lunenburg_5k.png",
    "3h6dmuf3xwvwbum9": "/logos/blue_nose.jpg"
  };

  const raceCol = e.app.findCollectionByNameOrId("race_results");
  const logoCol = e.app.findCollectionByNameOrId("event_logos");
  const cacheCol = e.app.findCollectionByNameOrId("search_cache");
  const queryNorm = normalize(name);

  function resolveLogo(slug) {
    if (!slug) return "";
    if (KNOWN_LOGOS[slug]) return KNOWN_LOGOS[slug];

    try {
      const existing = e.app.findFirstRecordByFilter("event_logos", "slug = {:slug}", { slug });
      return existing.getString("logo_url") || "";
    } catch (_) {}

    let logoUrl = "";
    try {
      const res = $http.send({
        url: "https://results.raceroster.com/v2/api/events/" + encodeURIComponent(slug),
        method: "GET",
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 8
      });
      if (res.statusCode === 200 && res.raw) {
        const matches = res.raw.match(/https?:\/\/[^\s"'<>]+\.(?:png|jpg|jpeg|webp|svg)[^\s"'<>]*/gi) || [];
        logoUrl =
          matches.find((u) => u.indexOf("event-logo") !== -1) ||
          matches.find((u) => u.toLowerCase().indexOf("logo") !== -1) ||
          "";
      }
    } catch (_) {}

    try {
      const rec = new Record(logoCol);
      rec.set("slug", slug);
      rec.set("logo_url", logoUrl);
      e.app.save(rec);
    } catch (_) {}

    return logoUrl;
  }

  function upsertRace(item) {
    try {
      const existing = e.app.findFirstRecordByFilter("race_results", "unique_key = {:k}", {
        k: item.unique_key
      });
      if (item.logo_url && !existing.getString("logo_url")) {
        existing.set("logo_url", item.logo_url);
        e.app.save(existing);
      }
      return;
    } catch (_) {}

    try {
      const rec = new Record(raceCol);
      rec.set("unique_key", item.unique_key);
      rec.set("source", item.source);
      rec.set("participant", item.participant);
      rec.set("participant_norm", normalize(item.participant));
      rec.set("event_name", item.event_name);
      rec.set("sub_event", item.sub_event);
      rec.set("race_date", item.race_date);
      rec.set("city", item.city);
      rec.set("rank", String(item.rank ?? ""));
      rec.set("gun_time", item.gun_time || "");
      rec.set("chip_time", item.chip_time || "");
      rec.set("division", item.division || "");
      rec.set("result_url", item.result_url || "");
      rec.set("logo_url", item.logo_url || "");
      rec.set("event_slug", item.event_slug || "");
      e.app.save(rec);
    } catch (_) {}
  }

  // 1. Check 24-hour Atlantic Chip proxy cache before hitting RaceRoster
  let cacheHit = false;
  let cachedAt = null;
  let existingCacheRec = null;
  const nowMs = Date.now();

  try {
    existingCacheRec = e.app.findFirstRecordByFilter("search_cache", "query_norm = {:q}", {
      q: queryNorm
    });
    const fetchedAt = existingCacheRec.getFloat("fetched_at");
    if (!forceRefresh && fetchedAt && nowMs - fetchedAt < CACHE_TTL_MS) {
      cacheHit = true;
      cachedAt = new Date(fetchedAt).toISOString();
    }
  } catch (_) {}

  // Live proxy to Atlantic Chip only on cache miss or ?refresh=1
  let acError = null;
  let acFetched = 0;
  if (!cacheHit) {
    try {
      let offset = 0;
      for (let page = 0; page < 4; page++) {
        const url =
          "https://timer.raceroster.com/widgets/api/5q9xpftgktqq5wnxd9qatwr?offset=" +
          offset +
          "&searchByParticipant=" +
          encodeURIComponent(name);

        const res = $http.send({
          url,
          method: "GET",
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 15
        });

        if (res.statusCode !== 200 || !res.json) break;
        const rows = res.json.rows || [];
        if (!rows.length) break;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (!Array.isArray(row) || row.length < 9) continue;

          const iso = String(row[0] || "");
          const participant = String(row[1] || "");
          const evObj = row[2] || {};
          const evName = typeof evObj === "object" ? String(evObj.name || "") : String(evObj);
          const subEvent = typeof evObj === "object" ? String(evObj.subEvent || "") : "";
          const city = String(row[3] || "");
          const rank = row[4] !== null && row[4] !== undefined ? String(row[4]) : "";
          const gunTime = row[5] ? String(row[5]) : "";
          const chipTime = row[6] ? String(row[6]) : "";
          const division = row[7] ? String(row[7]) : "";
          const linkObj = row[8] || {};
          const resUrl = typeof linkObj === "object" ? String(linkObj.url || "") : "";

          const slugMatch = resUrl.match(/\/events\/([^/]+)\//);
          const slug = slugMatch ? slugMatch[1] : "";
          const logoUrl = acFetched < 16 ? resolveLogo(slug) : KNOWN_LOGOS[slug] || "";

          upsertRace({
            unique_key: "ac|" + iso + "|" + participant + "|" + evName + "|" + subEvent,
            source: "Atlantic Chip",
            participant,
            event_name: evName,
            sub_event: subEvent,
            race_date: iso,
            city,
            rank,
            gun_time: gunTime,
            chip_time: chipTime,
            division,
            result_url: resUrl,
            logo_url: logoUrl,
            event_slug: slug
          });
          acFetched++;
        }

        const cursor = res.json.paginationCursor;
        if (cursor === null || cursor === undefined || cursor === offset) break;
        offset = cursor;
      }

      // Save/update TTL cache entry on successful Atlantic Chip fetch
      try {
        const rec = existingCacheRec || new Record(cacheCol);
        rec.set("query_norm", queryNorm);
        rec.set("fetched_at", nowMs);
        rec.set("ac_count", acFetched);
        e.app.save(rec);
        cachedAt = new Date(nowMs).toISOString();
      } catch (_) {}
    } catch (err) {
      acError = String(err);
    }
  }

  // 2. Query PocketBase race_results collection (includes both Atlantic Chip + Route541!)
  const tokens = normalize(name).split(/\s+/).filter(Boolean);
  const filterParts = tokens.map((_, idx) => `participant_norm ~ {:t${idx}}`);
  const params = {};
  tokens.forEach((t, idx) => {
    params["t" + idx] = t;
  });

  if (year && year !== "all") {
    filterParts.push("race_date ~ {:yr}");
    params.yr = year;
  }

  const records = e.app.findRecordsByFilter(
    "race_results",
    filterParts.join(" && "),
    "-race_date",
    200,
    0,
    params
  );

  const results = records.map((r) => ({
    id: r.id,
    source: r.getString("source"),
    iso: r.getString("race_date"),
    participant: r.getString("participant"),
    name: r.getString("event_name"),
    subEvent: r.getString("sub_event"),
    city: r.getString("city"),
    rank: /^\d+$/.test(r.getString("rank")) ? Number(r.getString("rank")) : r.getString("rank") || "—",
    gunTime: r.getString("gun_time") || null,
    chipTime: r.getString("chip_time") || null,
    division: r.getString("division"),
    url: r.getString("result_url") || "#",
    logo: r.getString("logo_url") || null
  }));

  return e.json(200, {
    query: name,
    year,
    count: results.length,
    cache: {
      hit: cacheHit,
      cachedAt,
      ttlHours: 24
    },
    sources: {
      atlanticChip: results.filter((r) => r.source === "Atlantic Chip").length,
      route541: results.filter((r) => r.source === "Route541").length,
      atlanticChipError: acError
    },
    results
  });
});

routerAdd("POST", "/api/sync-route541-local", (e) => {
  const normalize = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const raceCol = e.app.findCollectionByNameOrId("race_results");
  let imported = 0;

  function colIdx(dataFields, keys) {
    for (let i = 0; i < dataFields.length; i++) {
      const low = String(dataFields[i] || "").toLowerCase();
      for (let k = 0; k < keys.length; k++) {
        if (low.indexOf(keys[k]) !== -1) return i;
      }
    }
    return -1;
  }

  function importList(txApp, dataObj, dataFields, evName, evDate, evUrl) {
    if (!dataObj) return;
    const idxName = colIdx(dataFields, ["flname", "name", "displayname"]);
    const idxCity = colIdx(dataFields, ["city"]);
    const idxDiv = colIdx(dataFields, ["agegroup.nameshort", "agegroup", "division"]);
    const idxGun = colIdx(dataFields, ["finish.gun", "gun"]);
    const idxChip = colIdx(dataFields, ["finish.chip", "chip", "time"]);
    const idxRank = colIdx(dataFields, ["autorank", "rank", "place"]);

    const entries = Array.isArray(dataObj)
      ? [["Results", dataObj]]
      : Object.keys(dataObj).map((k) => [k, dataObj[k]]);

    for (let g = 0; g < entries.length; g++) {
      const groupName = String(entries[g][0]).replace(/^#\d+_/, "");
      const rows = entries[g][1];
      if (!Array.isArray(rows)) continue;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!Array.isArray(row) || row.length < 4) continue;

        const participant =
          idxName >= 0 && idxName < row.length ? String(row[idxName] || "").trim() : String(row[3] || "").trim();
        if (!participant || /^\d+$/.test(participant)) continue;

        const city = idxCity >= 0 && idxCity < row.length ? String(row[idxCity] || "").trim() : "";
        const division = idxDiv >= 0 && idxDiv < row.length ? String(row[idxDiv] || "").trim() : "";
        const gun = idxGun >= 0 && idxGun < row.length ? String(row[idxGun] || "").trim() : "";
        const chip = idxChip >= 0 && idxChip < row.length ? String(row[idxChip] || "").trim() : "";
        const rankRaw = idxRank >= 0 && idxRank < row.length ? String(row[idxRank] || "") : "";
        const rankDigits = rankRaw.replace(/[^\d]/g, "");
        const ukey = "r541|" + evDate + "|" + evName + "|" + groupName + "|" + participant;

        try {
          txApp.findFirstRecordByFilter("race_results", "unique_key = {:k}", { k: ukey });
          continue;
        } catch (_) {}

        try {
          const rec = new Record(raceCol);
          rec.set("unique_key", ukey);
          rec.set("source", "Route541");
          rec.set("participant", participant);
          rec.set("participant_norm", normalize(participant));
          rec.set("event_name", evName);
          rec.set("sub_event", groupName);
          rec.set("race_date", evDate);
          rec.set("city", city);
          rec.set("rank", rankDigits || rankRaw);
          rec.set("gun_time", gun);
          rec.set("chip_time", chip);
          rec.set("division", division);
          rec.set("result_url", evUrl);
          rec.set("logo_url", "");
          rec.set("event_slug", "");
          txApp.save(rec);
          imported++;
        } catch (_) {}
      }
    }
  }

  e.app.runInTransaction((txApp) => {
    // 1. Import all downloaded JSONs in data/route541_all/ and data/route541_2026/
    const dirs = ["data/route541_all", "data/route541_2026"];
    for (let d = 0; d < dirs.length; d++) {
      const dirPath = dirs[d];
      try {
        const files = $os.readDir(dirPath);
        for (let i = 0; i < files.length; i++) {
          const fname = files[i].name();
          if (!fname.endsWith(".json")) continue;
          const raw = toString($os.readFile(dirPath + "/" + fname));
          const bundle = JSON.parse(raw);
          const ev = bundle.event || {};
          const evName = String(ev.name || "Route541 Event");
          const evDate = String(ev.date || "");
          const evUrl = "https://www.route541.com/Events/LeaderBoard?EVENT_ID=" + (ev.event_id || "");
          const lists = bundle.lists || {};
          const listKeys = Object.keys(lists);
          for (let j = 0; j < listKeys.length; j++) {
            const lp = lists[listKeys[j]];
            if (lp && lp.data) {
              importList(txApp, lp.data, lp.DataFields || [], evName, evDate, evUrl);
            }
          }
        }
      } catch (_) {}
    }

    // 2. Also import data/route541_vargas_matches.json (includes event 118 Run NS Year-End Celebration)
    try {
      const raw = toString($os.readFile("data/route541_vargas_matches.json"));
      const fb = JSON.parse(raw);
      const matches = fb.matches || [];
      for (let i = 0; i < matches.length; i++) {
        const m = matches[i];
        importList(txApp, m.data, m.data_fields || [], m.name || "Route541 Event", m.date || "", m.url || "");
      }
    } catch (_) {}
  });

  return e.json(200, { imported });
});

routerAdd("GET", "/api/ns-overview", (e) => {
  const year = (e.request.url.query().get("year") || "all").trim();

  const filter = year && year !== "all" ? "race_date ~ {:yr}" : "";
  const params = year && year !== "all" ? { yr: year } : {};
  const records = e.app.findRecordsByFilter("race_results", filter, "", 15000, 0, params);

  // Build set of opted-out runners so they are excluded from community leaderboards
  const optedOut = {};
  try {
    const optRows = e.app.findRecordsByFilter("opt_outs", "", "", 5000, 0);
    for (let i = 0; i < optRows.length; i++) {
      optedOut[optRows[i].getString("participant_norm")] = true;
    }
  } catch (_) {}

  const parseSec = (s) => {
    if (!s) return null;
    const parts = String(s).trim().split(":").map(Number);
    if (parts.some((n) => isNaN(n))) return null;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return null;
  };

  const decodeHtml = (s) =>
    String(s || "")
      .replace(/&amp;/g, "&")
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&quot;/g, '"');

  const runnerMap = {};
  const eventMap = {};
  const cityMap = {};
  const divMap = {};
  const yearMap = {};
  const fastest5k = [];
  const fastest10k = [];
  const fastestHalf = [];
  const fastestMarathon = [];

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const name = r.getString("participant").trim();
    const norm = r.getString("participant_norm") || name.toLowerCase();
    const ev = decodeHtml(r.getString("event_name"));
    const sub = decodeHtml(r.getString("sub_event"));
    const dt = r.getString("race_date");
    const city = r.getString("city").trim();
    const div = r.getString("division").trim();
    const src = r.getString("source");
    const chip = r.getString("chip_time");
    const gun = r.getString("gun_time");
    const official = chip || gun;
    const sec = parseSec(official);

    // Year count (split by Atlantic Chip vs Route541)
    const ym = dt.match(/20\d\d/);
    if (ym) {
      const y = ym[0];
      if (!yearMap[y]) yearMap[y] = { year: y, count: 0, atlanticChip: 0, route541: 0 };
      yearMap[y].count++;
      if (src === "Atlantic Chip") yearMap[y].atlanticChip++;
      else if (src === "Route541") yearMap[y].route541++;
    }

    // Runner stats (skip relay leg rows and opted-out runners)
    const isRealPerson =
      name &&
      /\s/.test(name) &&
      !/^leg\s*\d+/i.test(name) &&
      !/^team\s+/i.test(name) &&
      !optedOut[norm];
    if (isRealPerson) {
      if (!runnerMap[norm]) {
        runnerMap[norm] = { name, city, division: div, count: 0, sources: {} };
      }
      runnerMap[norm].count++;
      if (!runnerMap[norm].city && city) runnerMap[norm].city = city;
      if (!runnerMap[norm].division && div) runnerMap[norm].division = div;
      runnerMap[norm].sources[src] = true;
    }

    // Event stats
    const evKey = ev + "|" + dt;
    if (!eventMap[evKey]) {
      eventMap[evKey] = { name: ev, date: dt, source: src, count: 0 };
    }
    eventMap[evKey].count++;

    // City stats
    if (city && city.length > 1) {
      const cClean = city.replace(/,\s*ns$/i, "").trim();
      cityMap[cClean] = (cityMap[cClean] || 0) + 1;
    }

    // Division stats — only real age-group codes (skip rank fractions like "1/1", "2/3")
    if (div && /^[MF]\d/i.test(div) && div.indexOf("/") === -1) {
      let cleanDiv = div.toUpperCase().replace(/\s+/g, "");
      const m4 = cleanDiv.match(/^([MF])(\d{2})(\d{2})$/);
      if (m4) cleanDiv = m4[1] + m4[2] + "-" + m4[3];
      divMap[cleanDiv] = (divMap[cleanDiv] || 0) + 1;
    }

    // Fastest 5K / 10K / Half Marathon / Full Marathon
    const subLow = sub.toLowerCase();
    const full = (sub + " " + ev).toLowerCase();
    if (sec && isRealPerson) {
      if (/half[\s-]*marathon|\bhalf\b|21\.1/i.test(subLow) || (/half[\s-]*marathon|21\.1/i.test(full) && !/\b5\s*(?:k|km)\b|\b10\s*(?:k|km)\b/i.test(subLow))) {
        if (sec >= 3600 && sec <= 14400) {
          fastestHalf.push({ name, time: official, sec, event: ev, date: dt, city, division: div });
        }
      } else if (/full[\s-]*marathon|42\.2/i.test(full) || (/\bmarathon\b/i.test(subLow) && !/half|\b5\s*(?:k|km)\b|\b10\s*(?:k|km)\b/i.test(subLow))) {
        if (sec >= 7200 && sec <= 27000) {
          fastestMarathon.push({ name, time: official, sec, event: ev, date: dt, city, division: div });
        }
      } else if (/\b5\s*(?:k|km)\b/i.test(subLow) || (/\b5\s*(?:k|km)\b/i.test(full) && !/\b10\s*(?:k|km)\b|\b25\s*(?:k|km)\b/i.test(full))) {
        if (sec >= 780 && sec <= 3600) {
          fastest5k.push({ name, time: official, sec, event: ev, date: dt, city, division: div });
        }
      } else if (/\b10\s*(?:k|km)\b/i.test(subLow) || (/\b10\s*(?:k|km)\b/i.test(full) && !/\b25\s*(?:k|km)\b/i.test(full))) {
        if (sec >= 1680 && sec <= 7200) {
          fastest10k.push({ name, time: official, sec, event: ev, date: dt, city, division: div });
        }
      }
    }
  }

  const topRunners = Object.keys(runnerMap)
    .map((k) => ({
      name: runnerMap[k].name,
      city: runnerMap[k].city,
      division: runnerMap[k].division,
      races: runnerMap[k].count
    }))
    .sort((a, b) => b.races - a.races)
    .slice(0, 15);

  const topEvents = Object.keys(eventMap)
    .map((k) => eventMap[k])
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const topCities = Object.keys(cityMap)
    .map((k) => ({ city: k, count: cityMap[k] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topDivisions = Object.keys(divMap)
    .map((k) => ({ division: k, count: divMap[k] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const byYear = Object.keys(yearMap)
    .sort((a, b) => Number(b) - Number(a))
    .map((y) => yearMap[y]);

  // Deduplicate fastest per runner (keep their fastest)
  const dedupFastest = (arr) => {
    arr.sort((a, b) => a.sec - b.sec);
    const seen = {};
    const out = [];
    for (let i = 0; i < arr.length && out.length < 10; i++) {
      const k = arr[i].name.toLowerCase();
      if (seen[k]) continue;
      seen[k] = true;
      out.push(arr[i]);
    }
    return out;
  };

  return e.json(200, {
    year,
    totals: {
      finishes: records.length,
      uniqueRunners: Object.keys(runnerMap).length,
      events: Object.keys(eventMap).length,
      cities: Object.keys(cityMap).length
    },
    byYear,
    topRunners,
    topEvents,
    topCities,
    topDivisions,
    fastest5k: dedupFastest(fastest5k),
    fastest10k: dedupFastest(fastest10k),
    fastestHalf: dedupFastest(fastestHalf),
    fastestMarathon: dedupFastest(fastestMarathon)
  });
});

// Shared 24h cache lookup for client-direct Atlantic Chip + local Route541 results
routerAdd("GET", "/api/ns-cache", (e) => {
  const name = (e.request.url.query().get("name") || "").trim();
  const year = (e.request.url.query().get("year") || "all").trim();
  if (!name) {
    return e.json(200, { cacheHit: false, count: 0, results: [] });
  }

  const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  const normalize = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const queryNorm = normalize(name);
  let cacheHit = false;
  let cachedAt = null;
  try {
    const c = e.app.findFirstRecordByFilter("search_cache", "query_norm = {:q}", { q: queryNorm });
    const fetchedAt = c.getFloat("fetched_at");
    if (fetchedAt && Date.now() - fetchedAt < CACHE_TTL_MS) {
      cacheHit = true;
      cachedAt = new Date(fetchedAt).toISOString();
    }
  } catch (_) {}

  const tokens = queryNorm.split(/\s+/).filter(Boolean);
  const filterParts = tokens.map((_, idx) => `participant_norm ~ {:t${idx}}`);
  const params = {};
  tokens.forEach((t, idx) => {
    params["t" + idx] = t;
  });
  if (year && year !== "all") {
    filterParts.push("race_date ~ {:yr}");
    params.yr = year;
  }

  const records = e.app.findRecordsByFilter(
    "race_results",
    filterParts.join(" && "),
    "-race_date",
    200,
    0,
    params
  );

  const results = records.map((r) => ({
    id: r.id,
    source: r.getString("source"),
    iso: r.getString("race_date"),
    participant: r.getString("participant"),
    name: r.getString("event_name"),
    subEvent: r.getString("sub_event"),
    city: r.getString("city"),
    rank: /^\d+$/.test(r.getString("rank")) ? Number(r.getString("rank")) : r.getString("rank") || "—",
    gunTime: r.getString("gun_time") || null,
    chipTime: r.getString("chip_time") || null,
    division: r.getString("division"),
    url: r.getString("result_url") || "#",
    logo: r.getString("logo_url") || null
  }));

  return e.json(200, {
    query: name,
    year,
    cacheHit,
    cachedAt,
    count: results.length,
    sources: {
      atlanticChip: results.filter((r) => r.source === "Atlantic Chip").length,
      route541: results.filter((r) => r.source === "Route541").length
    },
    results
  });
});

// Store client-fetched Atlantic Chip results into PocketBase so future searches skip the API
routerAdd("POST", "/api/ns-cache", (e) => {
  const body = e.requestInfo().body || {};
  const query = String(body.query || "").trim();
  const rows = Array.isArray(body.rows) ? body.rows.slice(0, 200) : [];

  if (!query) {
    return e.json(400, { error: "Missing query" });
  }

  const normalize = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const KNOWN_LOGOS = {
    bc4yxdar5jrrs7cp: "/logos/harbour_hustle.png",
    fgbssgvgwaufvvcb: "/logos/michelin_tire_trot.jpg",
    ysymrwectm43zhk7: "/logos/lunenburg_5k.png",
    "3h6dmuf3xwvwbum9": "/logos/blue_nose.jpg"
  };

  const raceCol = e.app.findCollectionByNameOrId("race_results");
  const cacheCol = e.app.findCollectionByNameOrId("search_cache");
  const queryNorm = normalize(query);
  let saved = 0;

  // Respect community opt-outs
  try {
    e.app.findFirstRecordByFilter("opt_outs", "participant_norm = {:q}", { q: queryNorm });
    return e.json(200, { saved: 0, skippedOptOut: true });
  } catch (_) {}

  e.app.runInTransaction((txApp) => {
    for (let i = 0; i < rows.length; i++) {
      const item = rows[i];
      if (!item || !item.participant || !item.name) continue;
      const iso = String(item.iso || "");
      const participant = String(item.participant || "").trim();
      const evName = String(item.name || "").trim();
      const subEvent = String(item.subEvent || "").trim();
      const resUrl = String(item.url || "");
      const slugMatch = resUrl.match(/\/events\/([^/]+)\//);
      const slug = slugMatch ? slugMatch[1] : "";
      const logoUrl = String(item.logo || KNOWN_LOGOS[slug] || "");
      const ukey = "ac|" + iso + "|" + participant + "|" + evName + "|" + subEvent;

      try {
        txApp.findFirstRecordByFilter("race_results", "unique_key = {:k}", { k: ukey });
        continue;
      } catch (_) {}

      try {
        const rec = new Record(raceCol);
        rec.set("unique_key", ukey);
        rec.set("source", "Atlantic Chip");
        rec.set("participant", participant);
        rec.set("participant_norm", normalize(participant));
        rec.set("event_name", evName);
        rec.set("sub_event", subEvent);
        rec.set("race_date", iso);
        rec.set("city", String(item.city || ""));
        rec.set("rank", item.rank !== null && item.rank !== undefined ? String(item.rank) : "");
        rec.set("gun_time", item.gunTime ? String(item.gunTime) : "");
        rec.set("chip_time", item.chipTime ? String(item.chipTime) : "");
        rec.set("division", String(item.division || ""));
        rec.set("result_url", resUrl);
        rec.set("logo_url", logoUrl);
        rec.set("event_slug", slug);
        txApp.save(rec);
        saved++;
      } catch (_) {}
    }

    // Record query timestamp in search_cache (24h TTL)
    let cacheRec = null;
    try {
      cacheRec = txApp.findFirstRecordByFilter("search_cache", "query_norm = {:q}", { q: queryNorm });
    } catch (_) {
      cacheRec = new Record(cacheCol);
    }
    cacheRec.set("query_norm", queryNorm);
    cacheRec.set("fetched_at", Date.now());
    cacheRec.set("ac_count", rows.length);
    txApp.save(cacheRec);
  });

  return e.json(200, { saved, cachedQuery: queryNorm });
});

// Self-service opt-out: remove runner from community leaderboards & cached Atlantic Chip entries
routerAdd("POST", "/api/ns-optout", (e) => {
  const body = e.requestInfo().body || {};
  const name = String(body.name || "").trim();
  if (!name) {
    return e.json(400, { error: "Missing name" });
  }

  const normalize = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const norm = normalize(name);
  const optCol = e.app.findCollectionByNameOrId("opt_outs");
  let removed = 0;

  e.app.runInTransaction((txApp) => {
    // 1. Add to opt_outs
    try {
      txApp.findFirstRecordByFilter("opt_outs", "participant_norm = {:n}", { n: norm });
    } catch (_) {
      const rec = new Record(optCol);
      rec.set("participant_norm", norm);
      rec.set("original_name", name);
      txApp.save(rec);
    }

    // 2. Remove cached Atlantic Chip records for this runner
    try {
      const acRows = txApp.findRecordsByFilter(
        "race_results",
        'source = "Atlantic Chip" && participant_norm = {:n}',
        "",
        500,
        0,
        { n: norm }
      );
      for (let i = 0; i < acRows.length; i++) {
        txApp.delete(acRows[i]);
        removed++;
      }
    } catch (_) {}

    // 3. Remove search_cache entry
    try {
      const c = txApp.findFirstRecordByFilter("search_cache", "query_norm = {:n}", { n: norm });
      txApp.delete(c);
    } catch (_) {}
  });

  return e.json(200, { optedOut: true, name, removed });
});


// ============================================================================
// PER-RUNNER DYNAMIC OPEN GRAPH SHARE CARDS (Facebook / WhatsApp / X / iMessage)
// ============================================================================

routerAdd("POST", "/api/ns-share-card", (e) => {
  const body = e.requestInfo().body || {};
  const name = String(body.name || "").trim();
  const summary = String(body.summary || "").trim().slice(0, 320);
  let imageB64 = String(body.imageBase64 || "").trim();

  if (!name || !imageB64) {
    return e.json(400, { error: "Missing name or imageBase64" });
  }
  // Strip optional data URL prefix
  const commaIdx = imageB64.indexOf(",");
  if (commaIdx !== -1) {
    imageB64 = imageB64.slice(commaIdx + 1);
  }
  // Guard against oversized payloads (~2MB base64 max)
  if (imageB64.length > 2600000) {
    return e.json(413, { error: "Image too large" });
  }

  const normalize = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const norm = normalize(name);
  const now = Date.now();

  let col;
  try {
    col = e.app.findCollectionByNameOrId("share_cards");
  } catch (_) {
    return e.json(500, { error: "share_cards collection not initialized" });
  }

  let rec;
  try {
    rec = e.app.findFirstRecordByFilter("share_cards", "runner_norm = {:n}", { n: norm });
  } catch (_) {
    rec = new Record(col);
  }

  rec.set("runner_norm", norm);
  rec.set("runner_name", name);
  rec.set("summary", summary);
  rec.set("image_b64", imageB64);
  rec.set("updated_ms", now);
  e.app.save(rec);

  const enc = encodeURIComponent(name);
  return e.json(200, {
    ok: true,
    updatedMs: now,
    sharePath: "/share?name=" + enc,
    imagePath: "/api/ns-og-image?name=" + enc + "&v=" + now
  });
});

routerAdd("GET", "/api/ns-og-image", (e) => {
  const name = String(e.request.url.query().get("name") || "").trim();
  const normalize = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const decodeBase64Bytes = (b64) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const clean = b64.replace(/[^A-Za-z0-9+/=]/g, "");
    const out = [];
    for (let i = 0; i < clean.length; i += 4) {
      const c1 = chars.indexOf(clean[i]);
      const c2 = chars.indexOf(clean[i + 1]);
      const c3 = clean[i + 2] === "=" ? -1 : chars.indexOf(clean[i + 2]);
      const c4 = clean[i + 3] === "=" ? -1 : chars.indexOf(clean[i + 3]);
      if (c1 < 0 || c2 < 0) break;
      out.push((c1 << 2) | (c2 >> 4));
      if (c3 >= 0) out.push(((c2 & 15) << 4) | (c3 >> 2));
      if (c4 >= 0) out.push(((c3 & 3) << 6) | c4);
    }
    return out;
  };

  if (name) {
    try {
      const rec = e.app.findFirstRecordByFilter("share_cards", "runner_norm = {:n}", {
        n: normalize(name)
      });
      const b64 = rec.getString("image_b64");
      if (b64) {
        const bytes = decodeBase64Bytes(b64);
        e.response.header().set("Cache-Control", "no-cache, no-store, must-revalidate");
        return e.blob(200, "image/jpeg", bytes);
      }
    } catch (_) {}
  }

  // Fallback to static OG banner if runner has not generated a personalized card yet
  return e.redirect(302, "/og-passport.jpg?t=" + Date.now());
});

routerAdd("GET", "/share", (e) => {
  const name = String(e.request.url.query().get("name") || "").trim();
  const escHtml = (s) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const normalize = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const proto = e.request.header.get("X-Forwarded-Proto") || "https";
  const host = e.request.header.get("X-Forwarded-Host") || e.request.host || "ns-running-results.opensrc.mx";
  const base = proto + "://" + host;

  const nowTs = Date.now();
  let displayName = name || "Nova Scotia Runner";
  let description =
    "Collect 32 iconic Nova Scotia finisher medals, capture all 7 running regions, and track official Atlantic Chip & Route541 results.";
  let imageUrl = base + "/og-passport.jpg?t=" + nowTs;
  let imageType = "image/jpeg";

  if (name) {
    try {
      const rec = e.app.findFirstRecordByFilter("share_cards", "runner_norm = {:n}", {
        n: normalize(name)
      });
      if (rec.getString("runner_name")) displayName = rec.getString("runner_name");
      if (rec.getString("summary")) description = rec.getString("summary");
      const v = rec.getInt("updated_ms") || nowTs;
      imageUrl =
        base + "/api/ns-og-image?name=" + encodeURIComponent(displayName) + "&v=" + v + "&t=" + nowTs;
    } catch (_) {}
  }

  const title = displayName + " — Nova Scotia Race Passport";
  const shareUrl = base + "/share?name=" + encodeURIComponent(displayName);
  const appUrl = "/?name=" + encodeURIComponent(displayName) + "&tab=passport";

  const html =
    '<!doctype html><html lang="en"><head><meta charset="UTF-8" />' +
    "<title>" + escHtml(title) + "</title>" +
    '<meta property="og:type" content="website" />' +
    '<meta property="og:site_name" content="NS Running Results" />' +
    '<meta property="og:url" content="' + escHtml(shareUrl) + '" />' +
    '<meta property="og:title" content="' + escHtml(title) + '" />' +
    '<meta property="og:description" content="' + escHtml(description) + '" />' +
    '<meta property="og:image" content="' + escHtml(imageUrl) + '" />' +
    '<meta property="og:image:secure_url" content="' + escHtml(imageUrl) + '" />' +
    '<meta property="og:image:type" content="' + imageType + '" />' +
    '<meta property="og:image:width" content="1200" />' +
    '<meta property="og:image:height" content="630" />' +
    '<meta name="twitter:card" content="summary_large_image" />' +
    '<meta name="twitter:title" content="' + escHtml(title) + '" />' +
    '<meta name="twitter:description" content="' + escHtml(description) + '" />' +
    '<meta name="twitter:image" content="' + escHtml(imageUrl) + '" />' +
    '<meta http-equiv="refresh" content="0;url=' + escHtml(appUrl) + '" />' +
    "</head><body style=\"background:#040b17;color:#f8fafc;font-family:sans-serif;display:grid;place-items:center;min-height:100vh;\">" +
    '<p>Opening <a style="color:#fef000" href="' + escHtml(appUrl) + '">' + escHtml(title) + "</a>...</p>" +
    "<script>window.location.replace(" + JSON.stringify(appUrl) + ");</script>" +
    "</body></html>";

  return e.html(200, html);
});


// Dynamic per-runner Open Graph meta injection on EXACT root "/{$}" ONLY
// (Using "/{$}" in Go's ServeMux prevents catching /assets/* or other static files!)
routerAdd("GET", "/{$}", (e) => {
  if (e.request.url.path !== "/") {
    return e.next();
  }
  const candidates = [
    "/app/pb_public/index.html",
    __hooks + "/../pb_public/index.html",
    __hooks + "/../../dist/index.html"
  ];
  let html = "";
  for (let i = 0; i < candidates.length; i++) {
    try {
      const raw = $os.readFile(candidates[i]);
      if (raw && raw.length > 0) {
        html = toString(raw);
        break;
      }
    } catch (_) {}
  }
  if (!html) {
    return e.next();
  }

  const name = String(e.request.url.query().get("name") || "").trim();
  if (!name) {
    return e.html(200, html);
  }

  const escAttr = (s) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const normalize = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const proto = e.request.header.get("X-Forwarded-Proto") || "https";
  const host =
    e.request.header.get("X-Forwarded-Host") ||
    e.request.host ||
    "ns-running-results.opensrc.mx";
  const base = proto + "://" + host;

  const nowTs = Date.now();
  let displayName = name;
  let description =
    "Track official Nova Scotia race results, collect 32 iconic finisher medals, capture all 7 NS regions, and unlock achievement trophies.";
  let imageUrl = base + "/og-passport.jpg?t=" + nowTs;

  try {
    const rec = e.app.findFirstRecordByFilter("share_cards", "runner_norm = {:n}", {
      n: normalize(name)
    });
    if (rec.getString("runner_name")) displayName = rec.getString("runner_name");
    if (rec.getString("summary")) description = rec.getString("summary");
    const v = rec.getInt("updated_ms") || nowTs;
    imageUrl =
      base + "/api/ns-og-image?name=" + encodeURIComponent(displayName) + "&v=" + v + "&t=" + nowTs;
  } catch (_) {}

  const title = displayName + " — Nova Scotia Race Passport";
  const tab = String(e.request.url.query().get("tab") || "").trim();
  const canonicalUrl =
    base +
    "/?name=" +
    encodeURIComponent(displayName) +
    (tab ? "&tab=" + encodeURIComponent(tab) : "");

  // Replace static OG & Twitter meta tags with this runner's personalized values
  const replaceMeta = (src, attrName, attrVal, newContent) => {
    const re = new RegExp(
      '(<meta\\s+' + attrName + '="' + attrVal + '"\\s+content=")[^"]*(")',
      "i"
    );
    return src.replace(re, "$1" + escAttr(newContent) + "$2");
  };

  html = html.replace(/<title>[^<]*<\/title>/i, "<title>" + escAttr(title) + "</title>");
  html = replaceMeta(html, "property", "og:url", canonicalUrl);
  html = replaceMeta(html, "property", "og:title", title);
  html = replaceMeta(html, "property", "og:description", description);
  html = replaceMeta(html, "property", "og:image", imageUrl);
  html = replaceMeta(html, "property", "og:image:secure_url", imageUrl);
  html = replaceMeta(html, "property", "og:image:alt", title + " share card");
  html = replaceMeta(html, "name", "twitter:title", title);
  html = replaceMeta(html, "name", "twitter:description", description);
  html = replaceMeta(html, "name", "twitter:image", imageUrl);

  return e.html(200, html);
});
