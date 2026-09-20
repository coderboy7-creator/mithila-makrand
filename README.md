# Mithila Makaranda — Vedic Astrology Platform

Production-grade **Web + Android + iOS** astrology platform whose core
differentiator is native **Makarandaanushar / Mithila Vishwavidyalaya Panchang**
methodology as the default calculation profile, with an independent modern
**Drik** engine alongside.

Built strictly against the master specification: deterministic astronomy
first, golden-reference validation, source-notation preservation, isolated
engines that are never mixed, method selectors everywhere, and an AI layer
that interprets — but never calculates.

## Calculation profiles

| Profile | Engine | Status |
|---|---|---|
| `makaranda-v1` (default) | Surya Siddhanta / Makaranda tradition | Release gate NOT PASSED by design — awaiting university worksheets |
| `drik-v1` | Modern analytical ephemeris — full Meeus ch.47 lunar series, complete IAU-1980 nutation, ΔT, PyEphem-certified grid | **VERIFIED**: moon ≤7.3″, sun ≤33.7″ over 60 epochs 2016–2030 |
| `makaranda-v2-hybrid` | Modern-anchored means + classical perturbation series, fitted offsets `{dM:+0.37, dA:0, dS:0}` | **UNVERIFIED_HYBRID** — experimental bridge only; never mixed into other pipelines; superseded by `makaranda-v2-tables` when the worksheets arrive |

The hybrid tracks the printed Panchang within the traditional residual band
(nakshatra identities 15/15 and tithi identities 15/15 on the 29-07…12-08-2022
sheet; residuals of minutes away from lunar perigee, up to ~4 h inside the
perigee window). See `docs/MAKARANDA_ENGINE_PLAN.md` for the calibration
evidence and the owner requirements that unlock the authoritative tradition.

---

## Quick start

```bash
npm test          # golden suite: 78 hard tests (incl. 8 PyEphem-certified ephemeris anchors) + release-gate report

## Language
UI defaults to **Hindi**; a persistent toggle (top-bar `EN` button, also in Settings) switches to English.
Deterministic interpretation templates are bilingual (hi/en) and follow the UI language.
Every दण्ड–पल value is displayed with an explicit unit tag (द.प. / d.p.) plus its derived IST clock equivalent.
npm start         # http://localhost:3000  (binds 0.0.0.0)
npm run validate  # alias for the golden report
```

No external dependencies are required to run the platform (pure Node + browser).

## Feature scope (all live)

| Feature | Endpoint | Notes |
|---|---|---|
| Panchang | `POST /api/v1/panchang/calculate` | sunrise day boundary; दण्ड–पल END-times; Rahu Kaal/Gulika/Yamaganda/Abhijit/Durmuhurta; `compare` flag for Makaranda-vs-Drik |
| Kundali | `POST /api/v1/kundali/calculate` | N/S/E charts, lagna, DMS, retro/combust/aspects |
| Vargas | `POST /api/v1/varga/calculate` | D2–D60 (15 charts), rule status per varga |
| Dashas | `POST /api/v1/dasha/calculate` | Vimshottari (MD/AD/PD), Yogini, Ashtottari, Kalachakra, Chara |
| Yoga/Dosha | `POST /api/v1/yoga/calculate` | Raj/Dhana/Gaja-Kesari/Neech-Bhanga/Vipreet/Pancha-Mahapurusha, Mangal, Kaal Sarp, Pitra — with evidence |
| Kundali Milan | `POST /api/v1/kundali/match` | 36-guna Ashtakoota + Mangal + cancellations |
| Transit | `POST /api/v1/transit/calculate` | Jupiter/Saturn/Rahu-Ketu, Sade Sati, Dhaiya, 3-yr series |
| Muhurta | `POST /api/v1/muhurta/calculate` | 7 activity rulesets over inherited Panchang profile |
| Varshaphal | `POST /api/v1/varshaphal/calculate` | solar return, Muntha, Mudda seed, Tajik slot |
| Prashna | `POST /api/v1/prashna/calculate` | horary chart + classical indicators |
| Reports | `POST /api/v1/reports/generate` | consolidated, print-ready, method banner included |
| AI interpretation | `POST /api/v1/ai/interpret` | templates + LLM adapter slot (JSON-only contract) |
| Consultation CRM | `GET/POST /api/v1/astrologers`, `/consultations/*` | booking, status lifecycle, fees, profile carried on bookings |
| Validation | `GET /api/v1/validation/run` | golden dataset, residuals, anomalies, release gate |

Every calculation request resolves an **explicit** `profileId`
(`makaranda-v1` default / `drik-v1`) — never inferred from a UI label.

## Calculation modes

- **MAKARANDA (default)** — Surya Siddhanta / Makaranda tradition engine.
  Traditional reference preserved verbatim: Akshansh 26°35′ N · Deshantar
  `01|35` · Palbha `06` · IST · sunrise day boundary. Longitude
  interpretation is versioned (`longitudeResolution` strategies, H1 selected,
  UNVERIFIED) — no silent Darbhanga/Sitamarhi substitution.
- **DRIK** — independent modern analytical ephemeris (Meeus solar/lunar,
  JPL Keplerian planets, mean node) with Lahiri/Raman/KP/Yukteshwar/Fagan
  ayanamsas. Swiss Ephemeris adapter slot reserved.

Engines are never combined in one pipeline; comparison is side-by-side only.

## Golden validation (master spec §7–§10)

- 8 supplied rows stored **verbatim** (anomalies included, e.g. the
  05-10-2025 `05:51` sunset flag and the 27-07-2022 `37-50` derivation
  inconsistency — see `docs/DATA_CONCERNS.md`).
- Parser/converter/boundary tests are hard gates (all pass).
- Makaranda release gate currently reports **NOT PASSED — diagnostics
  attached**, by design: residuals are measured, classified (±60 s / 10 min /
  60 min thresholds) and published; no arbitrary offsets are applied. The
  independent Drik engine reproduces **8/8 golden tithi identities** and
  **8/8 weekdays**, demonstrating the source data's astronomical soundness.

## Verification concerns raised

See **[docs/DATA_CONCERNS.md](docs/DATA_CONCERNS.md)** — 12 items requiring
source confirmation (sunset 12-hour notation, Deshantar units/meridian,
Palbha usage, nakshatra abbreviation identities, tithi-numbering convention,
missing Yoga/Karana/moonrise golden rows, Makaranda Sarani tables, …).

## Project layout

```
packages/core     @mithila/core — deterministic engines + golden suite (shared everywhere)
packages/server   REST API + professional web app + JSON datastore (PostgreSQL schema mirror)
packages/mobile   React Native (Expo) Android/iOS shell sharing the core
docs/             ARCHITECTURE.md, DATA_CONCERNS.md
```

See `docs/ARCHITECTURE.md` for the full module map, iron rules and the
UNVERIFIED-item register (every uncertain traditional rule is quarantined,
flagged and versioned rather than invented — master spec §2.2).
