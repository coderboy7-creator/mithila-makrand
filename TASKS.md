# TASKS — backlog & delivery ledger

Updated 2026-09-20 · `main` @ `8e0af2e` · gates green (Node 106/106 + smoke 15/15 · JVM verify green)

Legend: ✅ done & pushed · 🟡 in progress · ⬜ open · 🧑‍🌾 owner-side input required

## 1. Delivered (condensed)

| Commit | Milestone |
|---|---|
| `d8c8862` | blank-page fix + headless SPA smoke (15 routes) |
| `0606255` | Drik upgrade: Meeus-47 Moon, IAU1980, ΔT, apparent positions, PyEphem cert grid |
| `89abd6f` | Drik completion: full VSOP87D planets (≤1.09″), true osculating Rahu (≤112″), Moon β/Δ, cert anchors & locks |
| `4410d5a` | `LAHIRI_CITRA` (Chitra-definition) as drik-v1 default + 4 hard locks; UI chip reads profile strategy |
| `f5e835f` | Location search: offline gazetteer + `/api/v1/geo/search` + live dropdowns in all birth forms & Milan |
| `5ef932f` | Dark UI modernization: cosmic gradients, starfield, luminous charts, per-graha colours, hero |
| `99ad58f` | Light theme: parchment & royal gold parity |
| `8e0af2e` | JVM P0: Java 21 + Maven multi-module monolith (mm-core/drik/makaranda/api), plan doc, verified boot |

Plus (earlier): hybrid engine calibration, golden wiring, i18n Hindi default, danda-pala UI
semantics, consultation/CRM, reports, validation suite UI, method/profile chrome everywhere.

## 2. JVM port (plan: docs/JAVA_PORT_PLAN.md)

| # | Task | Status |
|---|---|---|
| P0 | Maven skeleton, Spring Boot boots, `/health` `/engines` `/profiles`, SPA hosting | ✅ |
| P1 | mm-core math + profiles + danda-pala normalization; parity vectors from Node (`scripts/genParityVectors.mjs` to write) | ⬜ |
| P2 | mm-engine-drik full port (Moon λβΔ, Sun, VSOP87D planets, true node, nutation, ayanamsa incl. LAHIRI_CITRA) + certs as resources | ⬜ |
| P3 | mm-engine-makaranda port (SS pipeline, calibrated anchor, hybrid, Mithila-VV strategies) | ⬜ |
| P4 | REST parity for ALL endpoints + Node-vs-JVM contract tests | ⬜ |
| P5 | PostgreSQL (Flyway) mirroring db.json; CRM/booking persistence; JSON dev fallback | ⬜ |
| P6 | AI interpretation adapter, Docker image, cutover runbook, retire Node per endpoint | ⬜ |

## 3. Owner-side inputs (block Makaranda gate, not Drik)

| # | Item | Status |
|---|---|---|
| O1 | Official IMDC / Rashtriya Panchang ayanamsa table 2016–2026 (to replace interim LAHIRI_CITRA offset note) | 🧑‍🌾 |
| O2 | Makaranda worksheets / Sarani (to close the ±14 h end-time diagnostics → flip golden gate to PASS) | 🧑‍🌾 |
| O3 | Makaranda text/edition reference | 🧑‍🌾 |
| O4 | Confirmations for flagged cells (`01\|35`, `03:4`, `Uttrakha`, sheets rows 16–18) | 🧑‍🌾 partial |
| O5 | Optional trusted modern Drik reference (Swiss Ephemeris licence or similar) | 🧑‍🌾 optional |

## 4. Product backlog (after P4)

- ⬜ Auth: user accounts, session/JWT, role split (user/astrologer/admin).
- ⬜ Payments & wallet for consultations.
- ⬜ Report PDF export (branded, bilingual) + share links.
- ⬜ Push/email reminders (muhurta, appointments).
- ⬜ React Native app (Android + iOS) over `/api/v1/*`.
- ⬜ Admin console: profile versioning UI, audit explorer, golden suite management.
- ⬜ Security pass: rate limiting, input validation hardening, CSP, secrets management.
- ⬜ Ops: Docker image, health/metrics endpoints, structured logging, CI (mvn + npm gates on push).
- ⬜ Perf: gzip/brotli, ETag for static, lazy-load heavy pages.
- ⬜ A11y audit + Hindi copy-edit pass; device/browser matrix QA.
- ⬜ Marketing/landing pages + app-store listings (post parity).

## 5. Housekeeping

- ⬜ Fold `scripts/fitHybrid*.js` dead-end arrays into an archive note (already documented; remove files when hybrid strategy is superseded).
- ⬜ Add `--emit json` mode to Python generators for JVM resources (P1 prerequisite).
- ⬜ CI workflow definition (GitHub Actions) running both gate suites.
- ✅ Bundle refresh after each push (standing rule).

## 6. Definition of done (every task)

1. Real check executed and named (npm test / smokeWeb / mvn verify / live curl).
2. Docs updated (this file + affected design/plan docs).
3. Committed, pushed (token scrubbed), bundle refreshed.
