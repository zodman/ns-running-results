# Nova Scotia Race Passport — Feature Plan (#1, #2, #4)

Gamifying Nova Scotia road & trail running results (Atlantic Chip + Route541) into a collectible, shareable runner passport.

---

## 1. 🏅 NS Race Passport ("Catch 'Em All" Medal Wall)
**Status:** Implemented on branch `feat/ns-race-passport`

### Concept
A visual medal wall featuring **32 iconic Nova Scotia races** across both Atlantic Chip and Route541. Every runner gets a personal completion score (`X / 32 Caught`) and progress bar.

### Medal States & Tiers
- **Locked (Uncaught):** Grayscale silhouette with lock pill showing the typical race month (e.g., `September`) so runners can plan which race to "catch" next.
- **Bronze (1× Finish):** Full-color logo/emblem, best official time, year completed, and checkmark badge.
- **Silver (2× Finishes):** Silver border & `Silver ×2` loyalty pill.
- **Gold Loyalist (3+ Finishes):** Glowing kinetic yellow (`#fef000`) border & `Gold ×3+` pill.

### Interactions
- Filter by **All / Caught / Locked**
- Filter by **Nova Scotia Region**
- Click any caught medal to jump directly to that race on the main dashboard.

---

## 2. 🗺️ "Capture Nova Scotia" — 7 Region Badges
**Status:** Planned next on `feat/ns-race-passport`

### Concept
Group every Nova Scotia race into the province's **7 iconic running regions** and track provincial exploration (`X / 7 Regions Unlocked`). Finishing even **1 race** in a region unlocks its badge; finishing **3+ races** upgrades the region to **Mastered**.

### The 7 Nova Scotia Regions
| Region | Iconic Races Included | Unlock Threshold |
|---|---|---|
| **Halifax Metro** | Medavie Blue Nose Marathon, Harbour Hustle, Dartmouth Natal Day, McNabs Half, AO's McIntosh, Seaside Scramble, Bee Hive Fives, Salty 7, Movember Run, Penguin Run | 1 race (Mastered: 5+) |
| **South Shore** | Lunenburg 5km & Muffin Run, Michelin Tire Trot (Bridgewater), Lobster Crawl 5K (Barrington) | 1 race (Mastered: 3+) |
| **Annapolis Valley** | Valley Harvest Marathon (Wolfville), Berwick Gala Days 5 Mile, Hantsport Canada Day, Middleton Heart Run, Spike Family Fun Runs (Kentville) | 1 race (Mastered: 3+) |
| **Cape Breton** | Louisbourg Race Through Time, Rèis Mhàbu (Run Mabou), La Course de l'Escaouette (Chéticamp), Cape Breton Fiddlers | 1 race (Mastered: 2+) |
| **Northumberland Shore** | Tatamagouche Beer Run, Pugwash Harbourfest 5K Salt Dash, Johnny Miles (New Glasgow) | 1 race (Mastered: 2+) |
| **Fundy / Truro** | Nasty Nuttby Killer 5K, Cinnamon Bun Run, Back Road Bash 5K | 1 race (Mastered: 2+) |
| **Acadian Shores / Yarmouth** | Sissaboo Sizzler (Weymouth), Gran Fondo Baie Sainte Marie (Clare), Yarmouth Races | 1 race (Mastered: 2+) |

### UI Ideas
- **7-card Region Strip** above the Medal Wall showing unlocked regions in Run NS blue/yellow and locked regions dimmed.
- Clicking a region card filters the Medal Wall below to show which races in that region you've caught vs. still need to run.
- Optional **Province Explorer** progress bar (`2 / 7 Regions Captured`).

---

## 4. 🎯 Auto-Unlocked Achievement Trophies
**Status:** Planned next on `feat/ns-race-passport`

### Concept
Fun, automatically computed trophies derived directly from a runner's official race history — zero manual input required.

### Proposed Trophy Catalog
| Trophy | Icon | How to Unlock |
|---|---|---|
| **Distance Grand Slam** | 🏆 | Complete a `5K`, `10K`, `Half Marathon`, and `Marathon` |
| **5K Club** | ⚡ | Complete 3 or more `5K` races |
| **Bridge Runner** | 🌉 | Finish **Harbour Hustle** across the Macdonald Bridge |
| **Island Hopper** | 🏝️ | Finish **McNabs Half Marathon** or any **Cape Breton** race |
| **Back-to-Back Warrior** | 🔥 | Finish two official races within 14 days of each other |
| **All-Seasons Runner** | ❄️🌸☀️🍂 | Finish at least 1 race in Winter (Jan–Mar), Spring (Apr–Jun), Summer (Jul–Sep), and Fall (Oct–Dec) |
| **Course PR Crusher** | 📈 | Beat your own previous year's time on the exact same race |
| **Nova Scotia Road Tripper** | 🚗 | Race in 5+ different Nova Scotia towns/cities |
| **Multi-Year Loyalist** | 🥇 | Finish the exact same annual race 3+ years |
| **Half-Province Explorer** | 🗺️ | Unlock 4+ of the 7 Nova Scotia regions |
| **Province Conqueror** | 👑 | Unlock all 7 Nova Scotia regions |

---

## Next Steps
1. Review & annotate this plan (e.g., via `crit.md`).
2. Add **#2 (7 Region Cards + Province Explorer bar)** to `src/components/RacePassport.jsx`.
3. Add **#4 (Achievement Trophies shelf)** with unlocked vs. locked hints (e.g., *"1 more race in Winter to unlock All-Seasons Runner"*).
4. Merge `feat/ns-race-passport` → `main` to deploy to **https://ns-running-results.opensrc.mx**.
