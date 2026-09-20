# Java 21 + Maven Port Plan — Mithila Makaranda

Status: **APPROVED DIRECTION (2026-09-20)** · P0 scaffold in-repo at `jvm/`
Toolchain: OpenJDK 21 · Maven 3.9 · Spring Boot 3.3.x
Owner constraint: **monolith deployment, modular internals; engines stay separate.**

## 1. Goals & carried non-negotiables

- Production stack per master prompt: Spring Boot + (later) React Native clients.
- One deployable artifact (monolith), internally Maven-multi-module.
- Engines are **separate modules** and never import each other; they share only the SPI in `mm-core`. Mixing Makaranda and Drik inside one pipeline remains forbidden except the explicit comparison view.
- Deterministic code does astronomy; LLM interprets structured JSON only.
- Every result carries calculation method + profile version; profiles are versioned; unknown rules stay `UNVERIFIED` behind strategy interfaces.
- दण्ड–पल semantics (END times vs local sunrise, 1 दण्ड = 24 min, 1 पल = 24 s) and source-notation preservation (`01|35`, `03:4`, `Uttrakha`) carry over unchanged.
- The golden suite ±60 s gate and the Drik certification locks move to Java with identical thresholds. **The JVM port is not "done" until `mvn verify` passes the same gates the Node build passes today (106 hard tests).**

## 2. Module layout (single repo, `jvm/`)

```
jvm/                          parent pom (app.mithila:mithila-makaranda)
├── mm-core/                  domain + SPI + profiles + golden/parity loaders
│     math (Julian, Angle, DMS), spi (CalculationEngine, AyanamsaStrategy,
│     PanchangStrategy), profile (versioned ProfileRegistry), audit model
├── mm-engine-drik/           DRIK engine ONLY: VSOP87D planets, Meeus-47 Moon
│     (λ,β,Δ), true osculating node, nutation (IAU1980), ayanamsa incl.
│     LAHIRI_CITRA; certification anchors as test resources
├── mm-engine-makaranda/      MAKARANDA engine ONLY: Surya-Siddhanta lineage,
│     calibrated anchor, hybrid fit (UNVERIFIED_HYBRID), Mithila-VV panchang
│     strategies, danda-pala normalization
├── mm-api/                   THE monolith: Spring Boot app
│     REST /api/v1/* (same contract as Node), serves the existing SPA,
│     method/profile resolution, comparison view, CRM/booking later,
│     AI-interpretation adapter slot (deterministic engine + optional LLM)
└── (tests)                   mm-golden harness lives inside each module's
      src/test + shared parity vectors in mm-core/src/test/resources
```

Why this satisfies "monolith + module-wise + engines different":
- One `mm-api` jar/war is deployed; operators never compose engines.
- Maven module boundaries *compile-time enforce* engine separation (mm-engine-drik cannot see mm-engine-makaranda).
- New capabilities (CRM, booking, reports) become packages inside `mm-api` or new `mm-*` feature modules — without touching engines.

## 3. Single source of truth for series & golden data

The Python generators (`scripts/genMeeusTables.py`, `genVsopTables.py`, cert generators) remain authoritative. They gain a `--emit json` mode writing:
- `jvm/mm-engine-drik/src/main/resources/tables/meeus47.json`, `vsop87d.json`, `rahuCert.json`, `planetCert.json`, `drikCert.json`
- `jvm/mm-core/src/test/resources/parity/*.json` (engine outputs dumped from the **Node** engine)

Java loads these resources at startup; **no manual transcription of a single coefficient**. The Node core stays the reference implementation until parity proves otherwise.

## 4. Parity harness (the bridge)

`scripts/genParityVectors.mjs` (new) dumps, for ~60 epochs 2016–2030 + all golden dates:
ayanamsa values, Sun/Moon/planet apparent longitudes, true node, tithi/nakshatra/yoga end timestamps, danda-pala normalizations, kundali lagna + positions, milan guna totals.
Java tests (`mm-core/src/test/java/.../ParityTest.java`) load the JSON and assert:
- pure math: ≤ 1e-9 deg / 1e-6 s
- ephemeris vs Node drik: within the existing certification locks (Moon λ 7.3″ etc. — Java vs PyEphem certs are re-run independently too)
- panchang events: ±60 s golden gate; Makaranda gate remains diagnostic (NOT PASSED) exactly as today.

## 5. Phases

| # | Scope | Exit criteria |
|---|-------|---------------|
| P0 | Maven skeleton, parent + 4 modules, Spring Boot boots, `/api/v1/health`, `/api/v1/profiles`, `/api/v1/engines` parity, SPA served from `mm-api` | `mvn verify` green; SPA loads off the JVM server |
| P1 | mm-core math + profiles + audit + danda-pala normalization; unit tests vs Node vectors | parity vectors pass for core |
| P2 | mm-engine-drik full port (Moon λβΔ, Sun, 5 planets VSOP87D, true node, nutation, ayanamsa incl. LAHIRI_CITRA) | Java cert vs embedded anchors ≤ existing locks; vs PyEphem re-cert |
| P3 | mm-engine-makaranda port (SS moon/sun, hybrid, panchang strategies) | golden gate diagnostic parity with Node (same maxAbsΔ) |
| P4 | REST parity: panchang, kundali, vargas, dashas, yogas, milan, gochar, muhurta, varshaphal, prashna, reports, validation, audit, geo/search | contract tests: Node vs JVM byte-comparable JSON (ordered, same keys) |
| P5 | Persistence: PostgreSQL schema mirroring `db.json` (users, astrologers, clients, appointments, audit_logs, golden_*), Flyway migrations; JSON-file dev fallback | CRM/booking endpoints live |
| P6 | AI interpretation adapter (deterministic first, LLM slot), hardening, Docker image, cutover runbook | Node retired per-endpoint after 7-day side-by-side |

React/React-Native frontend swap (master prompt) comes **after** P4 — the SPA already speaks the stable REST contract, so frontend work is independent of the JVM port.

## 6. API & frontend continuity

- Identical routes & payloads (`/api/v1/...`), so the existing SPA and future mobile apps need zero changes.
- `mm-api` serves the SPA static bundle (resource dir configurable, default `../packages/server/web`), mirroring Node's `serveStatic`.
- Method/profile resolution rules (explicit per request, never inferred) implemented once in `mm-api` filter layer.

## 7. Build/CI discipline

- `mvn -q verify` = unit + parity + certification + golden gate. Red gate blocks merge (same rule as `npm test` today).
- No new dependency without a reason logged in this doc; Spring starters limited to `web`, `validation`, `test`.

## 8. Risks

- Series-resource size (~350 KB JSON) — trivial for JVM.
- Double vs double porting differences — bounded by parity tolerances above.
- Operator confusion during side-by-side — banners already state method+profile on every response; cutover runbook at P6.
