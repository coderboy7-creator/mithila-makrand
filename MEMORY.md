# MEMORY — cross-session working memory

Read this first when resuming. Workspace files are the source of truth; this file
compresses the facts that are expensive to re-derive. Updated 2026-09-20, `main` @ `8e0af2e`.

## 1. Key results (verbatim-worthy)

- **Drik certification vs PyEphem 4.2.1** (apparent geocentric, true ecliptic of date,
  60 epochs 2016–2030): Moon λ 7.3″ · Moon β 10.5″ · Sun λ 33.7″ · planet λ ≤ 1.09″ ·
  planet β ≤ 9.7″ · true Rahu ≤ 111.6″ (never flips rashi/nakshatra).
- **JS planet pipeline** `drikPlanetApparent`: jdTT = jdUT+ΔT/86400; τ=(jdTT−J2000)/365250;
  VSOP87D of-date; light-time ×4 (0.0057755183 d/au); aberration κ=173.1446327;
  nutateEcliptic qsign=+1. `drikTrueNode(jdUT)`: osculating plane via Moon at jd±0.02 d,
  Ω=atan2(n_x,−n_y).
- **LAHIRI_CITRA**: Spica (HIP 65474) ≡ 180° sidereal; mean ecliptic of date (smooth).
  J2000 = 23°50′28.9″ (−43.0″ vs published 23.853297°); 2022-08-04 = 24°09′24.0″;
  2026-09-20 = 24°12′51.5″; rate 50.25″/yr. Locks: Spica≡180°, J2000±0.02°,
  rate 50.1–50.4″/yr, dRA +47.6±0.3″/yr, dDec −18.7±0.3″/yr.
- **Hybrid** (baked): {dM:0.37,dA:0,dS:0}; vs PyEphem max 0.385° (lock 0.45°); UNVERIFIED_HYBRID.
- **Golden gate**: ±60 s; Makaranda tithi 15/15 @sunrise, ends Δ ±14 h ⇒ NOT PASSED by design.
  Drik tithi identity 8/8. Sheet 2022-07-29→08-12: Drik nak 15/15, tithi 13/15.
- **Tests**: Node 106/106 (`packages/core/test/runTests.js`) + SPA smoke 15/15
  (`scripts/smokeWeb.mjs`); JVM `mvn verify` green (10 core + 3 Spring tests @ P0).

## 2. Standing owner constraints

- दण्ड–पल = END times vs local sunrise; `60-00` = ahoratra terminal.
- Preserve anomalies verbatim (`Uttrakha`, `03:4`, `01|35` never "corrected").
- No engine mixing; LLM never calculates; no offset hacks; diagnose hour-level mismatch.
- Hindi default UI; method/profile always visible; commercial-grade both themes.
- Backend target Java 21 / Spring Boot 3.x; monolith deploy, engines in separate modules.
- Push to `coderboy7-creator/mithila-makrand` via one-shot tokenized PAT URL, sed-scrub
  output; PAT not revoked, re-pasted on request; bundle refreshed after push.
- Repo-local git identity must be re-set every session.

## 3. Dead ends (do not retry)

- Grid-fitting single-sine SS Moon (floor ~3.6° RMS); SS-revolutions hybrid (~0.5°/yr drift).
- `fitHybrid*.js` arrays untrustworthy (fabricated TIT angle).
- PyEphem as β reference / `ephem.norm` / `float(ephem.Date)`≠JD traps.
- Meeus precession from memory (now sign-locked + hard-tested).
- Nutation/aberration inside ayanamsa (±20″ wobble) — excluded by design.
- Node-crossing chord interpolation (±2.4′ wrong) — osculating plane correct.
- Third-party Lahiri blogs unreliable; only Lahiri@J2000 = 23°51′11″ anchor safe.
- VSOP files parse fixed-width ONLY; IMCCE direct path 404 → use CDS VI/81.
- `apt` stale index → `sudo apt-get update` first; pip packages don't persist.

## 4. Environment

- Node v20.20.2; python3 + astropy 8.0.1 (lacks orbital_elements → astropy v4.0 raw file
  `scripts/data/astropy_orbital_elements_v4.0.py` is authoritative); PyEphem 4.2.1
  (reinstall per session). OpenJDK 21.0.12 + Maven 3.9.9 (may need reinstall).
- Node server port 3000 via start_process; JVM 8080 (`MM_WEB_DIR`).
- Excluded from snapshots: node_modules, target/, .git/config etc. → git identity &
  installed pkgs vanish between sessions.

## 5. File map (quick index)

- `packages/core/src/`: ephemeris (SPICA_HIPPARCOS, LAHIRI_CITRA, drik* fns), profiles
  (drik-v1 default LAHIRI_CITRA), golden, + feature modules; generated: meeusTables,
  vsopTables, drikCert, planetCert, rahuCert.
- `packages/server/`: server.js (routes map), web/{index.html,app.js,styles.css},
  data/{db.json,gazetteer.js}.
- `scripts/`: gen*.py generators, smokeWeb.mjs, verifySheet0722.mjs, cert generators.
- `jvm/`: parent pom + mm-core/mm-engine-drik/mm-engine-makaranda/mm-api (P0).
- Docs: PRD/ARCHITECTURE/RULES/DESIGN/TASKS/MEMORY (root) + docs/{JAVA_PORT_PLAN,
  MAKARANDA_ENGINE_PLAN, DATA_CONCERNS, SHEET_2022-07-29_VERIFICATION}.md.
- Uploads: 8 panchang photos + owner sheet image-1.png.

## 6. Immediate next steps (as of last update)

P1 parity vectors → P2 Drik JVM port; owner items O1–O5 stay open; product backlog in TASKS.md §4.
