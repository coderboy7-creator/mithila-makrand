# Data Verification Concerns — living register

Owner = source provider of the Mithila Vishwavidyalaya Panchang. Statuses updated 2026-09-20 after the owner's answers and the new photo sheets.

## SOLVED / CONFIRMED

- **C1 Sunset 12-hour cycle — CONFIRMED by owner.** `05-10-2025` printed `05:51` = 17:51 IST; same for all rows (e.g. `10-01-2026` `05:14` = 17:14). Source strings stay verbatim; +12h is applied only at interpretation time. Cross-check: Jan-10 dinmana `26-10` (=10h28m) = 17:14 − 06:46 exactly.
- **C6 "पू." = Purva Ashadha (पूर्वाषाढ़ा) — CONFIRMED by owner** (11-07-2025 and on the Jan-2026 sheet row 18).
- **C5 Palbha "06" — SOLVED (cross-check).** Palbha = equinox noon shadow (angulas) of a 12-angula shanku. `12·tan(26°35′) = 5.9998 ≈ 6.00` ⇒ the printed Palbha is internally consistent with the printed Akshansha 26°35′ N. Profile `palbhaUsage.status = CROSSCHECK_VERIFIED`. Its role inside timing computations is still undocumented by the source → isolated, never applied silently.
- **C2 27-07-2022 — owner re-verified both printed values from the original Panchang.** Reframed: NOT a source error claim, but a **display-convention question**. Formula (`37-50` + sunrise 05:19) and the printed clock "08:39 Night" agree at 20:27 same day; the document's derived stamp 02:39 next-day is the odd one out. All three values retained verbatim in golden data; the suite reports the inconsistency, never corrects it.
- **C-sunset-flags / "Uttrakha" spelling / "03:4"** — preserved verbatim per standing policy (Uttara Ashadha identity accepted; spelling never silently normalized).

## OPEN

- **O1 25-06-2026 nakshatra "स्वाती" — RE-RAISED with precise numbers (owner asked us to raise it if it still stands; it does).** At 25-06-2026 sunrise the Drik moon (certified vs PyEphem to ≤0.15°) sits ≈ **Tula 21°** (Vishakha window), and at the printed nakshatra end 18:30 the moon−sun separation is 130.9° vs the 132° target — the tithi side is fine. But "Swati ends 18:30" would put the moon at Tula 13°20′ then, i.e. ~13°20′ (exactly one nakshatra) behind the certified position. No ephemeris or ayanamsa choice moves the moon 13°; this is a label/pairing issue on that sheet. Request: re-check which date row the "स्वाती 33-22" cell belongs to.
- **O2 Deshantar "01|35" — meaning unconfirmed.** Registered hypotheses in `makaranda-v1.longitudeResolution.strategies`:
  - H1 (selected, UNVERIFIED): 1 danda 35 pala of time east of Ujjain ⇒ ≈85.27°E.
  - H2 rejected-literal (1°35′ by itself), H3/H4 forbidden GPS substitutions.
  - **H5 (new, owner research):** value beside latitude = shadow in angula|vyangula (palbha-style packing), not a longitude.
  - **H6 (new, owner research):** value = pala/danda local time correction packed with latitude; same computational class as H1 but different provenance; could also explain the printed-sunrise lag (see O4).
  Deep-research note (from owner, Hindi): scribes pack latitude + palbha/correction together to save space; Darbhanga equinox shadow ≈ 3 angula 35 vyangula by that note — consistent with the packing idea, and independently our 12·tan(26°35′)=6.00 palbha check validates the latitude side.
- **O3 Makaranda Sarani tables + official ayanamsa 2016–2026 not supplied** → release gate honestly remains NOT PASSED. Our anchor (Lahiri≈24.2° at 2026) is calibrated, not sourced. Full fix-path and requirements in `docs/MAKARANDA_ENGINE_PLAN.md`: calibration experiment (`scripts/calibrateMakaranda.mjs`) proves v1's single-manda SS cannot reproduce the printed Moon (fit floors at RMS 3.6°, perigee-window signature = missing lunar perturbations); exact replication requires the university's worksheets/tables. Owner-requested interim engine `makaranda-v2-hybrid` BUILT 2026-09-20 (UNVERIFIED_HYBRID, diagnostic-only, never mixed into other pipelines) — tracks the printed sheet within the traditional residual band until the worksheets arrive.
- **O4 Printed sunrise runs ~3–25 min later than our siddhantic centre-sunrise at 85.27°E** (e.g. Jan-10 printed 06:46 vs computed 06:38). Candidate explanations: true panchang meridian ≈ 85.0–85.1°E, or a deshantara-kala correction (H6), or a different sunrise definition. Diagnosis only; no offsets applied.
- **O5 Yoga/Karana/moonrise regression fields** — new photo sheets now archived in `uploads/` (daily ranges 11-06→24-06-2025, 24-08→07-09-2025, 08-10→21-10-2025, 04-01→18-01-2026; monthlies 2026-01, 2027-01/02/03). Columns present: tithi d.p+clock, nakshatra+clock, yoga d.p+clock, karana, chandra-rashi, rahukala/yamghanti, dinmana, sunrise/sunset. Full row transcription deferred to owner-verified extraction; **one provisional extraction** (10-01-2026: yoga Atiganda 25-47, karana Bava, chandra-rashi Kanya, dinmana 26-10, sunset 05:14→17:14) is in `PHOTO_PROVISIONAL` and passes internal consistency; it does not enter hard assertions until confirmed.

## INDEPENDENT CERTIFICATION (new)

`EPHEM_ANCHORS` (golden.js): moon−sun separations at the eight printed tithi ends, computed with **PyEphem 4.2.1** outside this codebase. The Drik engine matches all eight to ≤0.15° (hard tests). The printed ends themselves sit within ~±1.5° of exact modern targets — precisely the residual band a Surya-Siddhanta-derived panchang must show, confirming the golden data is traditional-astronomy output, not modern ephemeris output. Implication: the Makaranda engine must be tuned to reproduce the *traditional* values; matching modern ephemeris is Drik's job.

**Sheet 29-07→12-08-2022 (uploads/image-1.png)** verified with `scripts/verifySheet0722.mjs` — see `docs/SHEET_2022-07-29_VERIFICATION.md`. Drik reproduces printed nakshatra ends within 2–10 min except in the 31-07…07-08 perigee window (1–3.4 h traditional residual); Makaranda engine still uncalibrated (gate NOT PASSED, O3).

## Policy reminders

- दण्ड–पल = END times relative to that day's sunrise; 60-00 = Ahoratra boundary.
- Never mix engines; method stored with every result; LLM interprets structured JSON only.
- No offset hacks: hour-scale residuals are diagnosed (O1–O4), never fudged.
