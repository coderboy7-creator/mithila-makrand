# Architecture — Mithila Makaranda Platform

Monolithic, internally modular, strongly separated by domain (master spec §1).

```
packages/
├── core/                    @mithila/core — deterministic calculation core (pure JS, zero deps)
│   ├── src/
│   │   ├── base.js              angles, Julian dates, root finding
│   │   ├── traditionalTime.js   दण्ड–पल parsing/conversion (END-time semantics)
│   │   ├── profiles.js          versioned CalculationProfiles + CalculationContext (immutable)
│   │   ├── ephemeris.js         Makaranda (SS traditional) + Drik (analytical) — isolated
│   │   ├── solar.js             sunrise/sunset, ascendant, Rahu Kaal/Gulika/Yamaganda/Abhijit
│   │   ├── panchang.js          Panchang day (sunrise boundary), tithi/nakshatra/yoga/karana ends
│   │   ├── chart.js             Kundali, bhava, aspects, combustion, 15 Vargas
│   │   ├── dasha.js             Vimshottari/Yogini/Ashtottari/Kalachakra/Chara
│   │   ├── rules.js             Yoga/Dosha rule engine with evidence objects
│   │   ├── milan.js             Ashtakoota 36-guna + Mangal + cancellations
│   │   ├── gochar.js            transits, Sade Sati, Dhaiya
│   │   ├── muhurta.js           activity rulesets + window scanner
│   │   ├── annual.js            Varshaphal (solar return/Muntha) + Prashna
│   │   ├── golden.js            golden dataset (verbatim) + validation runner + gate
│   │   ├── interpret.js         interpretation templates + LLM adapter slot (no astronomy!)
│   │   └── index.js             orchestration — ONE request = ONE profile
│   └── test/runTests.js         golden suite (§10 structure) — 78 hard tests (incl. PyEphem anchors)
├── server/                  REST API (spec §18) + static professional web app + JSON datastore
│   ├── server.js
│   ├── web/ (index.html, app.js, styles.css)
│   └── data/db.json         mirror of production PostgreSQL schema
└── mobile/                  React Native (Expo) app sharing @mithila/core (Android + iOS)
```

## Iron rules implemented

1. **LLM never calculates astronomy.** Interpretation receives structured JSON
   only (`interpret.js`); provider adapter slot documented.
2. **Engines never mix.** `positionsFor(ctx)` dispatches by `ctx.calculationMode`;
   comparison endpoints return side-by-side results only.
3. **Source notation first.** Every golden row stores raw strings; normalized
   values are separate fields; anomalies are flagged, never corrected.
4. **दण्ड–पल = END TIME** relative to Panchang-day sunrise (non-negotiable §6).
5. **Reproducibility.** Every result carries `{ mode, profile, ayanamsa,
   ephemerisSource, rulesetVersion, location }` audit metadata.
6. **No offset hacks.** Residuals vs golden drive diagnosis; release gate
   reports NOT PASSED with diagnostics until golden passes at ±60 s.

## Calculation profile propagation

`createContext({ profileId, date, time, location, ayanamsaOverride })` →
frozen `CalculationContext` → all feature functions (Panchang, Kundali,
Vargas, Dashas, Yogas, Milan, Gochar, Muhurta, Varshaphal, Prashna) take the
context and stamp results with it. The UI shows the banner:

```
Calculation Method: Makaranda / Mithila
Profile: makaranda-v1
Ayanamsa: Makaranda (calibrated, UNVERIFIED)
```

## Known UNVERIFIED items (quarantined, versioned, documented)

| Item | Location | Status |
|---|---|---|
| Deshantar `01|35` interpretation | profiles.js `longitudeResolution` | UNVERIFIED_HYPOTHESIS H1 |
| Palbha usage | profiles.js `palbhaUsage` | UNVERIFIED |
| Makaranda ayanamsa anchor | profiles.js / ephemeris.js | UNVERIFIED (calibrated to golden nakshatras) |
| SS sun uccha minutes, lunar higher corrections, SS sighra constants | ephemeris.js `SS_PARAMS.flaggedUnverified` | UNVERIFIED |
| Vimshopaka bala weights | chart.js | UNVERIFIED |
| Kalachakra full sequence, Chara durations | dasha.js | UNVERIFIED |
| Tajik yogas, Prashna Marga rules | annual.js | UNVERIFIED |
| Yoni hostility pairs, Bhakoot exceptions | milan.js | classical-v1, VERIFY edition |
| Ayanamsa anchors Raman/KP/Yukteshwar/Fagan | ephemeris.js | VERIFY against printed tables |
| Swiss Ephemeris binding | ephemeris.js adapter slot | RESERVED |
