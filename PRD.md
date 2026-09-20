# PRD — Mithila Makaranda · Vedic Astrology Platform

Status: living document · last updated 2026-09-20 · repo `coderboy7-creator/mithila-makrand`

## 1. Vision

A production-grade, commercially polished Vedic astrology platform whose **default
calculation methodology is the Makaranda / Mithila Vishwavidyalaya Panchang
parampara**, offered side-by-side with an independent, modern **Drik** engine.
Traditional scholarship is preserved *verbatim and honestly* (including its
unverified parts); modern astronomy is *certified against independent references*.
The two never mix inside one pipeline.

Platforms: **Web (live)** → **Android + iOS (React Native, planned)** over one REST API.

## 2. Users & personas

| Persona | Needs |
|---|---|
| Hindi-first end user | पंचांग, कुंडली, मिलान, गोचर, मुहूर्त in clean Devanagari; zero jargon leaks; place search that "just works" |
| Astrologer professional | Vargas, dashas, yogas with evidence; client CRM; bookings; reports |
| Platform owner / researcher | Makaranda worksheets reproduced exactly as printed; flags on anything unverified; diagnostics, not fudges |

## 3. Core differentiators (non-negotiable product promises)

1. **Makaranda-first**: `makaranda-v1` is the default profile; Mithila-VV panchang semantics (sunrise day boundary, दण्ड–पल units) everywhere.
2. **Independent Drik**: `drik-v1` with full VSOP87D planets, Meeus-47 Moon (λ,β,Δ), IAU-1980 nutation, true osculating node, Chitra-definition ayanamsa (`LAHIRI_CITRA`) as default with 5 more options.
3. **Method transparency**: universal method/profile selector on every feature; method + profile version + ephemeris source stamped on every result and banner; Makaranda-vs-Drik comparison view (side-by-side only).
4. **Honesty flags**: unknown rules and unverified traditional parameters are labelled `UNVERIFIED`, kept behind strategy interfaces, never silently "fixed".
5. **Determinism**: all astronomy is deterministic code; LLMs only interpret structured JSON.

## 4. Feature inventory (status as of today)

| Area | Status | Notes |
|---|---|---|
| Panchang (tithi/nakshatra/yoga/karana, sunrise/sunset, Rahu Kaal etc.) | LIVE | दण्ड–पल = END times vs local sunrise; unit badge + tooltip + IST घड़ी समय |
| Kundali (rashi + bhava chalita + aspects + combustion + dagdha) | LIVE | North/East/South renderers, luminous gold, per-graha colours |
| Vargas (15) | LIVE | per-varga rule-status reporting |
| Dashas (Vimshottari, Yogini, Ashtottari, Kalachakra, Chara) | LIVE | seed method + profile on every result |
| Yoga/Dosha engine | LIVE | evidence objects + ruleset version |
| Kundali Milan | LIVE | Ashtakoota 36 guna + Mangal + classical cancellations |
| Gochar | LIVE | Guru/Shani/Rahu-Ketu, Sade Sati, Dhaiya vs natal Moon |
| Muhurta scanner | LIVE | inherits panchang profile unless explicitly overridden |
| Varshaphal | LIVE | solar return, Muntha, Mudda dasha seed, Tajik yoga slot |
| Prashna (horary) | LIVE | classical indicators |
| Reports | LIVE | inherits & displays chosen profile |
| Consultation marketplace + booking + CRM | LIVE (demo data) | astrologer cards, availability, fees |
| AI-assisted interpretation | LIVE (deterministic) + LLM adapter slot | LLM never calculates |
| Golden validation suite UI | LIVE | ±60 s gate, diagnostics view |
| Location search | LIVE | offline gazetteer (~190 places, Devanagari-aware), live suggestions, auto lat/lon |
| i18n | LIVE | Hindi default, English toggle |
| Themes | LIVE | dark cosmic (default) + light parchment |
| JVM backend (Java 21 / Spring Boot 3.3) | P0 DONE | boots, serves SPA + profiles/engines/health; engines isolated modules |
| Android / iOS apps | PLANNED | React Native over same REST contract |
| Auth / payments | PLANNED | not required for current phase |

## 5. Calculation profiles (product contract)

- `makaranda-v1` (default) — SS/Makaranda lineage, calibrated anchor, `UNVERIFIED`; Mithila-VV panchang; sunrise boundary.
- `drik-v1` — `CERTIFIED`; ayanamsa options `LAHIRI_CITRA` (default), `LAHIRI`, `RAMAN`, `KRISHNAMURTI`, `YUKTESHWAR`, `FAGAN_BRADLEY`.
- `makaranda-v2-hybrid` — `UNVERIFIED_HYBRID` (calibrated anchor + hybrid fit).
- Every stored/result payload carries `calculationMode` + `profileVersion`.
- Engines are **never combined** in one pipeline; comparison views are side-by-side only.

## 6. Data semantics (product-level)

- **दण्ड–पल values are END times** relative to that panchang day's local sunrise (1 दण्ड = 24 min, 1 पल = 24 s); `60-00` = ahoratra terminal boundary.
- Printed notation preserved verbatim (`01|35`, `03:4`, `Uttrakha`); computational interpretation is a separate, flagged, versioned layer.
- Golden sheets are regression *input*; ±60 s tolerance; hour-level mismatch ⇒ diagnose, never offset-hack.

## 7. Non-functional requirements

- Deterministic core, zero external ephemeris/geocoding calls (offline-safe, sandbox-safe).
- Quality gates as acceptance: Node `npm test` (106 hard tests), SPA smoke (15 routes), JVM `mvn verify` (parity + certs when ported).
- Hindi default UI with full English parity; buttons/labels aligned; no vague labels.
- Commercial-grade visuals in both themes (see DESIGN.md).
- Print-friendly reports.
- One deployable monolith; modular internals; engines in separate modules (see ARCHITECTURE.md).

## 8. Success metrics

- Drik certification locks hold on every release (Moon λ ≤ 7.3″, planets ≤ 1.09″, Rahu ≤ 112″ vs PyEphem).
- Golden gate diagnostics stable; Makaranda gate flips to PASS only with owner-supplied source data — never by tuning.
- Zero user-visible engine mixing; method always visible.
- JVM parity: byte-comparable REST payloads Node vs JVM before cutover.

## 9. Out of scope (current phase)

Payments, OAuth hardening, native app store releases, marketing site, SEO — all after P4 parity (see TASKS.md).
