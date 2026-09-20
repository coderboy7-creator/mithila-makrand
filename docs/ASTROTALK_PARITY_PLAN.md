# ASTROTALK REPORT PARITY PLAN — sequence S1–S9

Reference artifact: `uploads/Kundli-Report-ASDF.pdf` (55 pp, generated 2026-09-20).
Birth data (parity fixture): **1998-01-10 05:30 IST, Darbhanga (26.1522 N, 85.8971 E), male**.
Their ayanamsa unstated ≈ Lahiri; ours drik-v1 = LAHIRI_CITRA (Δ ≈ −44″, documented).

## 0. PDF inventory (what the user wants)

| # | Section (PDF) | Pages |
|---|---|---|
| 1 | Cover + branding | 1 |
| 2 | Basic: birth details + panchang (tithi/karana/yoga/nakshatra/lord/lagna/lagnesh/sunrise/sunset) + **Avakhada** (varna/vashya/yoni/gana/nadi/rashi/lord/charan/tattva/nam-akshar/paya/yunja) | 2 |
| 3 | D1 + D9 charts, gochar chart | 3–4 |
| 4 | **Graha position table**: rashi, rashi-lord, nakshatra, nakshatra-lord, deg D-M-S, vakri, bhava, **avastha**, **sthiti** (+ outer planets Varuna/Aruna/Pluto) | 5 |
| 5 | Vimshottari: mahadasha + full antardasha listing | 6–7 |
| 6 | **Shadbala** (6 components + rupa + required + ratio + rank + ishta) + **Bhavabala** (total/rupa/ratio/rank) | 8 |
| 7 | **KP**: ruling planets, KP planet table (cusp/sign/nak/sub-lord), KP cusps 1–12 (unequal) | 9–11 |
| 8 | **Ashtakavarga**: SAV + 8 per-graha bindu tables | 12–13 |
| 9 | Charts: gochar, bhava-chalit, surya, chandra, lagna + **16 vargas** D2…D60 with life-area titles | 14–33 |
| 10 | Dasha cards with **interpretation text** per mahadasha; **Yogini dasha** table | 34–40 |
| 11 | **Lagna report**: description, livelihood, per-planet vichar; vimshottari predictions; **yoga list** (Veshi, Budha-Aditya…) | 41–50 |
| 12 | **Rudraksha suggestions** (mukhi-wise: description/benefits/vidhi/cautions) | 50–53 |
| 13 | **Ratna suggestions**: life stone / lucky stone / fortune stone + metal/finger/mantra | 53 |
| 14 | **Dosha analysis**: Manglik, Kalsarp, Sade-Sati status | 54 |
| 15 | Closing CTA | 55 |

## 1. Already in our app (no work): D1 (+E/S styles), bhava-chalit, surya/chandra kundali,
gochar page, 15 vargas, vimshottari + 4 more dasha systems, yogini, milan (ashtakoota+mangal),
yoga/dosha engine, sade-sati, panchang, birth details.

## 2. Work sequence (one slice per commit; each slice = core + UI + tests + push)

- **S1 ✅ DONE** — Avakhada + extended graha table (nak-lord, pada, avastha, sthiti, vakri) +
  classical table fixes (gana/nadi/yoni/maitri per BPHS; verified vs PDF). 120/120 tests.
- **S2** — Shadbala + Bhavabala module; **verify against PDF numbers** (Sun 310.19 … totals,
  bhava bala 418/516/…). Components: sthana (uchcha+saptavargaja+ojhayugma+kendra+drekkana),
  kala, dig, cheshta, naisargika, drik; ishta/kashta phala; rupa/required/ratio/rank.
- **S3** — Full **shodasha vargas** (add D16, D20, D24, D27, D30, D40, D45, D60) + life-area
  titles (hora=wealth, drekkana=siblings, … shashtiamsha=summary) + varga grid UI.
- **S4** — **Ashtakavarga**: per-graha PAV + SAV bindu tables (standard kakshya rules) + UI.
- **S5** — **KP module**: unequal (Placidus/KP) cusps **verified vs PDF cusp degrees**
  (248.87/282.64/…), sub-lords (nakshatra → sub → sub-sub), ruling planets, KP planet table;
  separate KP tab (never mixed into Parashari pipeline).
- **S6** — Dasha depth: full antardasha listing UI (all mahadashas) + **deterministic
  interpretation templates** per mahadasha/antardasha (house-placement based; LLM slot later).
- **S7** — Yoga library expansion (Veshi, Budha-Aditya, etc.) + **Dosha analysis card**
  (Manglik / Kalsarp / Sade-Sati) with plain verdicts like PDF page 54.
- **S8** — Remedies: **ratna** (life/lucky/fortune stones with metal+finger+mantra) +
  **rudraksha** mukhi library mapped from weak/afflicted grahas (deterministic rules;
  content library versioned, labelled traditional).
- **S9** — **Report composer**: cover + all sections in one branded bilingual printable
  report (print-CSS → browser PDF now; server-side PDF in JVM P5+). Download button.

## 3. Verification strategy

- PDF doubles as a second golden fixture (`astrotalk-pdf-ASDF`): positions within ~1′ of
  printed values (ayanamsa class), sthiti/avakhada fields exact, shadbala/bhavabala within
  rounding, KP cusps within 0.01° after house-system identification, vimshottari dates ±1 d.
- **Known deliberate divergences (documented, never hidden):**
  - Rahu/Ketu: we print PyEphem-certified TRUE node; Astrotalk's ≈ mean node (Δ up to ~1°).
  - Avastha: classical degree scheme (0–6 bala … 24–30 mrita); Astrotalk's proprietary scheme
    not reverse-engineered; scheme name shown in UI.
  - Outer planets (Varuna/Aruna/Pluto): optional extras row, VSOP87D U/N/P, flagged
    `EXTRA_PLANETS` (not part of classical graha set).

## 4. Rule reminders

- Every slice: npm test + smokeWeb + commit + push + bundle (RULES.md §B).
- New tables sourced ≥2 references before shipping; else UNVERIFIED flag.
- Hindi labels first; method/profile chip on every new result block.
