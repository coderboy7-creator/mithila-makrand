# ARCHITECTURE — Mithila Makaranda

Authoritative as of 2026-09-20. Supersedes `docs/ARCHITECTURE.md` (removed).
Companions: `docs/JAVA_PORT_PLAN.md` (JVM phases), `docs/MAKARANDA_ENGINE_PLAN.md`,
`docs/DATA_CONCERNS.md`, `docs/SHEET_2022-07-29_VERIFICATION.md`.

## 0. One paragraph

Monolithic deployment, modular internals. Today the monolith is **Node 20**
(`packages/server`, zero dependencies) hosting a hash-routed SPA and the REST API;
the **JVM monolith** (`jvm/`, Java 21 + Spring Boot 3.3, P0 done) boots the same
contract and will take over phase-by-phase. All astronomy lives in a pure,
dependency-free core (`packages/core` now; `mm-engine-*` later). Two engines —
**Makaranda** and **Drik** — are isolated from each other by package (Node) and by
Maven module (JVM); only the composition root sees both.

## 1. System map

```
            ┌────────────────────────  SPA (web/app.js, styles.css)  ────────────────┐
            │  hash routes · Hindi default · method/profile chrome · charts · i18n  │
            └───────────────────────────────┬───────────────────────────────────────┘
                                            │  /api/v1/*  (identical contract on both servers)
        ┌───────────────────────────────────┼───────────────────────────────────────┐
        │  TODAY: packages/server/server.js │  NEXT: jvm/mm-api (Spring Boot)       │
        │  routes map, static hosting,      │  controllers, SPA hosting,            │
        │  JSON datastore (db.json)         │  PG at P5                             │
        └───────────────────────────────────┼───────────────────────────────────────┘
                                            │
        ┌───────────────────────────────────▼───────────────────────────────────────┐
        │  CALCULATION CORE — one request = one profile (CalculationContext)        │
        │  ┌────────────────────────┐   ┌────────────────────────┐                  │
        │  │ MAKARANDA engine       │   │ DRIK engine            │   ← never import │
        │  │ SS lineage, calibrated │   │ VSOP87D, Meeus-47 Moon │     each other   │
        │  │ anchor, hybrid fit,    │   │ λβΔ, IAU1980 nutation, │                  │
        │  │ Mithila-VV panchang,   │   │ true osculating node,  │                  │
        │  │ danda-pala strategies  │   │ ayanamsa (6 options)   │                  │
        │  └────────────────────────┘   └────────────────────────┘                  │
        │  shared: profiles (versioned) · SPI/strategy interfaces · golden loader   │
        └───────────────────────────────────────────────────────────────────────────┘
                                            ▲
        ┌───────────────────────────────────┴───────────────────────────────────────┐
        │  GENERATORS (single source of truth for series):                          │
        │  scripts/genMeeusTables.py (Frink/Meeus + astropy 47.A/B)                 │
        │  scripts/genVsopTables.py  (CDS VI/81 VSOP87D, fixed-width parse)         │
        │  scripts/genDrikCert.py / genPlanetCert.py / genRahuCert.py (PyEphem)     │
        │  → packages/core/src/*Tables.js / *Cert.js  (generated, do not edit)      │
        │  → (P1/P2) JSON resources for the JVM engines                             │
        └───────────────────────────────────────────────────────────────────────────┘
```

## 2. Node monolith (current production)

```
packages/
├── core/   @mithila/core — pure JS, zero deps
│   src: base · traditionalTime (दण्ड–पल END-time semantics) · profiles ·
│        ephemeris (both engines, isolated) · solar · panchang · chart (15 vargas) ·
│        dasha (5 systems) · rules · milan · gochar · muhurta · annual (varshaphal+prashna) ·
│        golden (verbatim rows + runner + gate) · interpret (LLM slot, no astronomy) · index
│   test/runTests.js — 106 hard tests
├── server/ server.js (routes map "METHOD /path" → handler(req,res,body,db))
│   web/  index.html · app.js · styles.css        data/ db.json · gazetteer.js
```

- REST under `/api/v1/*`; every calculation request carries an explicit `profileId`
  (never inferred); responses include `calculationMode`, `profileVersion`, audit banner.
- `db.json` mirrors the production PostgreSQL schema (users, astrologers, clients,
  appointments, audit_logs, golden_reference_cases/events, calculation_profiles).
- Static hosting is `Cache-Control: no-store`; SPA is hash-routed so no server fallback needed.

## 3. JVM monolith (P0 done, P1–P6 planned)

```
jvm/  (app.mithila:mithila-makaranda, Java 21, Spring Boot BOM 3.3.4)
├── mm-core             math (Julian/Angle), spi (CalculationEngine, EngineDescriptor),
│                       profile (ProfileRegistry), parity/golden loaders
├── mm-engine-drik      DRIK only — compiles WITHOUT mm-engine-makaranda on classpath
├── mm-engine-makaranda MAKARANDA only
└── mm-api              THE deployable: controllers (/api/v1/health|engines|profiles…),
                        SPA hosting (MM_WEB_DIR), EngineConfig = only joint reference
```

- Maven boundaries enforce engine separation at compile time.
- Parity bridge: Node core dumps parity vectors (JSON); JVM tests assert
  ≤1e-9 deg (pure math), certification locks (ephemeris), ±60 s (panchang).
- Cutover: side-by-side per endpoint; Node retired only after contract equality.

## 4. Iron rules implemented in code

1. **LLM never calculates** — `interpret.js` / future adapter receives structured JSON only.
2. **Engines never mix** — dispatch by `ctx.calculationMode`; comparison = side-by-side only.
3. **Source notation first** — raw strings stored verbatim; normalized values separate; anomalies flagged.
4. **Profiles versioned & stamped** — every result persists method + version.
5. **UNVERIFIED behind strategies** — unknown rules/parameters are interfaces + flags, not hacks.
6. **No offset hacks** — mismatches are diagnosed (see DATA_CONCERNS.md).

## 5. Certification & gates (numbers as of today)

- **Drik vs PyEphem** (60 anchors 2016–2030, apparent, true ecliptic of date):
  Moon λ 7.3″ · Moon β 10.5″ · Sun λ 33.7″ · planet λ ≤ 1.09″ · planet β ≤ 9.7″ ·
  true Rahu ≤ 111.6″ (never flips rashi/nakshatra).
- **LAHIRI_CITRA** (Chitra-definition, drik-v1 default): Spica ≡ 180° sidereal exactly;
  J2000 = 23°50′28.9″; rate 50.25″/yr; smooth (mean ecliptic of date; no nutation/aberration
  in ayanamsa). Official IMDC table remains owner-side; interim offset vs linear Lahiri ≈ −43…−44″.
- **Golden gate**: ±60 s; Makaranda tithi 15/15 @sunrise but end-time Δ up to ±14 h ⇒
  gate **NOT PASSED by design** (diagnostics active) until owner worksheets arrive.
- Sheets 2022-07-29→08-12: Drik nakshatra 15/15, tithi 13/15.

## 6. Deployment & operations

- Node server: `node packages/server/server.js` (port 3000, binds 0.0.0.0).
- JVM server: `java -jar jvm/mm-api/target/mm-api-0.1.0-SNAPSHOT.jar` (port 8080, `MM_WEB_DIR`).
- Preview/proxy constraints honored: 0.0.0.0 bind, relative URLs only in browser code.
- Repo: GitHub `coderboy7-creator/mithila-makrand`, branch `main`; offline bundle
  `mithila-makrand.bundle` refreshed after every push.

## 7. Future clients

React Native (Expo) app consumes the same `/api/v1/*` contract; no engine code on-device
beyond what `@mithila/core`-equivalent JS port provides (optional offline mode deferred).
