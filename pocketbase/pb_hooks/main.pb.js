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

    // Runner stats (skip relay leg rows like "Leg 1", "Leg 2", or non-person labels)
    const isRealPerson = name && /\s/.test(name) && !/^leg\s*\d+/i.test(name) && !/^team\s+/i.test(name);
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
