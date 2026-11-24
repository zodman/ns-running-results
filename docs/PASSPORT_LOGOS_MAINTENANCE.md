# Nova Scotia Race Passport — Yearly Logo Refresh & Maintenance Guide

Many Nova Scotia road & trail races update their event logo every year—often baking the year directly into the artwork (e.g., `2026LouisbourgLogo.png`, `ChetiLogo2026.png`, `NuttbyLogo2026.png`, `Middleton2026EventLogo.png`, `BeeHiveLogo25.png`).

This document explains how logos are currently wired and how to prepare for / refresh them cleanly in **2027 and future seasons**.

---

## 1. How Logos Work Today

1. **Static Fallback Assets (`public/logos/`):**
   - All 32 passport races have a local logo saved in `public/logos/<race-id>.<ext>` and referenced in [`src/utils/passportCatalog.js`](../src/utils/passportCatalog.js).
   - Because they are bundled locally, locked and caught medals load instantaneously with zero third-party rate-limiting or broken links.
2. **Dynamic Override on Caught Races:**
   - In `evaluatePassport()` (`src/utils/passportCatalog.js`), if a runner's matched race result already carries a newer `logo` URL from PocketBase / RaceRoster, it automatically prefers that logo:
     ```js
     const dynamicLogo = matched.find((r) => r.logo)?.logo || item.logo;
     ```
   - This means Atlantic Chip races can pick up newer logos dynamically once cached in PocketBase `event_logos`, while locked medals always fall back to `public/logos/`.

---

## 2. Where Official Logos Come From

### A. Route541 (24 Passport Races)
- Each Route541 event has a summary page:
  ```
  https://route541.com/Events/Summary?EVENT_ID=<event_id>
  ```
- Official logos are hosted on Azure Blob Storage under:
  ```
  https://route541storage.blob.core.windows.net/live-event-images/...
  https://route541storage.blob.core.windows.net/logos/...
  https://route541storage.blob.core.windows.net/rns/...
  ```
- **Important filters when scraping:** Exclude `/images/logo.png` (Route541's own site logo) and any filename matching `/sponsor/i` (e.g., `RNS_2026Sponsors.jpg`).
- **HTML entities:** Some Route541 event titles contain HTML entities (e.g., `AO&#39;s Pick &amp; Shovel Showdown`), so regex matchers should not depend on literal `&` or `'`.

### B. Atlantic Chip / RaceRoster (8 Passport Races)
- Query the Atlantic Chip widget API (`timer.raceroster.com/widgets/api/5q9xpftgktqq5wnxd9qatwr?searchByParticipant=...`) to get the newest year's `eventSlug` from each result's `linkObj.url` (`/events/<slug>/`).
- Fetch the event metadata from:
  ```
  https://results.raceroster.com/v2/api/events/<slug>
  ```
- **Important filter:** Always prefer URLs matching `https://cdn.raceroster.com/event-logo/...` and **skip** generic provider logos (`cdn.raceroster.com/providers/...`), which older pre-2020 events sometimes return.

---

## 3. Recommended Upgrade Paths for Next Year (2027+)

### Option A — Annual Refresh Script *(Simplest)*
Create a reusable script (e.g., `scripts/refresh-passport-logos.mjs`) run once per season (or quarterly):
1. Sync latest Route541 events into `data/route541_all/`.
2. For each of the 32 entries in `NS_RACE_CATALOG`, fetch the newest year's logo from Route541 / RaceRoster.
3. Overwrite `public/logos/<id>.<ext>` only if the downloaded image is valid (`> 500 bytes`) and not a sponsor banner.
4. Update any changed file extensions in `src/utils/passportCatalog.js`, verify locally, commit, and push to `main` (FeatherCI redeploys automatically).

### Option B — Year-Versioned Collectible Medals *(Implemented ✅)*
Historical logos are organized by season year inside `public/logos/<year>/` instead of overwriting previous seasons:
```
public/logos/
  2026/
    blue-nose.jpg
    louisbourg.png
    nasty-nuttby.png
    ... (all 32 races)
  2027/
    louisbourg.png
    nasty-nuttby.png
    ...
```
- Each race in `NS_RACE_CATALOG` (`src/utils/passportCatalog.js`) stores a `logosByYear` map (e.g., `{ 2026: "/logos/2026/louisbourg.png", 2027: "/logos/2027/louisbourg.png" }`).
- **Locked medals** always display the **latest season's logo** (highest year key in `logosByYear`).
- **Caught medals** resolve the logo for the **exact year the runner completed the race** (preferring `logosByYear[year]`, then any dynamic RaceRoster `r.logo`, then falling back to the latest edition).
- To add next season's logos in 2027+, run:
  ```bash
  node scripts/refresh-passport-logos.mjs --year 2027
  ```
  Then merge the printed `2027` paths into `logosByYear` in `src/utils/passportCatalog.js`.

### Option C — PocketBase-Managed Logos *(Zero-Deploy Updates)*
Extend the existing PocketBase `event_logos` collection with a `passport_id` and `year` field:
- Store/cache the latest logo URL (or uploaded PocketBase file) per `(passport_id, year)`.
- Have `RacePassport.jsx` merge `event_logos` records over `NS_RACE_CATALOG` defaults at runtime.
- Updating next year's logos then requires **zero frontend code changes or Docker rebuilds**.

---

## 4. Annual Logo Refresh Checklist

- [ ] Pull newest Route541 events (`data/route541_all/` + `POST /api/sync-route541-local`).
- [ ] Run logo refresh for all 24 Route541 events (preferring newest `EVENT_ID` per race).
- [ ] Run logo refresh for all 8 Atlantic Chip events (preferring newest `event-logo/` URL on RaceRoster).
- [ ] Spot-check `public/logos/` to make sure no sponsor banners or generic provider icons slipped in.
- [ ] If using **Option B (Year-Versioned)**, archive previous year's logos under `public/logos/<year>/` before saving the new season.
- [ ] Run `npm run build` and visually check `http://localhost:5173/?name=andres+vargas` → **NS Race Passport** in both Dark & Light modes.
- [ ] Commit & push to `main` so FeatherCI builds and publishes to `https://ns-running-results.opensrc.mx`.
