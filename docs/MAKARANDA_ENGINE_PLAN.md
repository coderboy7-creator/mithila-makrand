# Makaranda engine — how to fix the mismatches, and what is required

Status 2026-09-20. Companion docs: `DATA_CONCERNS.md`, `SHEET_2022-07-29_VERIFICATION.md`.
Experiment harness: `scripts/verifySheet0722.mjs` (comparison) and `scripts/calibrateMakaranda.mjs` (fit).

## The two mismatch classes (recap)

| comparison | observed | cause | fix |
|---|---|---|---|
| Printed vs **Drik** | minutes (away from perigee) to ~3 h (perigee window) | printed sheet is traditional astronomy; Drik is modern by design | nothing to fix — this is the product's intentional two-mode behaviour; UI labels both |
| Printed vs **Makaranda engine (v1)** | hours; nakshatra often one ahead | our v1 is a simplified SS (modern-anchored means + single sine mandaphala); the university's tables follow a different, richer tradition | build the real Makaranda engine — see below |

## Experiment: can we calibrate v1 to the printed data from scratch?

Fitted physically-meaningful parameters (moon mean epoch offset, mean-rate scale, uccha offset, mandaphala amplitude scale, ayanamsa shift; then the sun equivalents) against 43 high-confidence printed ends (2016–2026):

- before: nak RMS 5.8°, tithi RMS 38°
- after:  nak RMS **3.6° (max 7.6°)**, tithi essentially unchanged; amplitude/rate parameters ran to grid bounds
- residual signature inside 29-07→12-08-2022: a ±7° swing across the perigee window — the shape of **missing lunar perturbations (evection/variation, ~1–2°)**, not of wrong constants.

**Conclusion:** the printed Moon is not reproducible by any single-manda Surya-Siddhanta parameterisation. No offset hack can close it (and hacks are forbidden by policy anyway). Therefore:

- **Exact replication from scratch alone = impossible.** The university's Panchang is defined by its own computational tradition/tables.
- **Exact replication with source documents = straightforward** (table-driven engine, below).
- **Best-effort from scratch** = a perturbation-augmented lunar theory; it would track the printed values like Drik does (minutes away from perigee, hours inside it) — i.e. it converges toward modern astronomy and must be labelled as a hybrid, not as the authoritative tradition.

## What is required (owner inputs) — in priority order

1. **Computation worksheets / Makaranda Sarani for any 1–2 years**: daily sun & moon *madhya* (mean) longitudes, *manda-kendra* and applied *mandaphala*, the ayanamsa used per date, deshantra-kala and palbha application order, sunrise definition (centre vs upper limb, refraction yes/no), and rounding rules to pala. → lets us rebuild their pipeline step by step and unit-test each stage.
2. **Official ayanamsa values 2016–2026** (closes the ±1° ambiguity between Lahiri-like and their value).
3. **The Makaranda text/edition the university follows** (which lunar equation terms it includes — the experiment shows their Moon carries perturbation-type corrections beyond classical single-manda SS).
4. **Confirmation of flagged photo cells** (01-08-2022 rashi clock; 12-08-2022 tithi द.प/घ.मि) and promotion of sheet rows into the golden suite.

## Build plan (versioned strategies, never silent)

- `makaranda-v1` (current): simplified SS, J2000-anchored — kept as audit baseline.
- `makaranda-v2-tables` (target, **PASS-capable**): table-driven replication of the worksheets from item 1; every pipeline stage (mean → manda → ayanamsa → sunrise → danda-pala) asserted against the worksheet column; golden gate becomes meaningful at ±60 s.
- `makaranda-v2-hybrid` — **BUILT 2026-09-20 (owner-requested interim engine)**: modern-anchored Meeus means + classical perturbation series (8 main lunar terms incl. evection/variation/annual; solar equation of centre), Makaranda-calibrated ayanamsa, fitted offsets only `{dM:+0.37°, dA:0, dS:0}`. Status **UNVERIFIED_HYBRID**; diagnostic-only in the validation suite (never a release gate). Two earlier constructions failed and are documented dead ends: (a) SS revolution-count means drift ~0.5°/yr against the printed set — irreducible; (b) single-sine SS moon floors at nak RMS ≈3.6°. Verified results: 15/15 nakshatra + 15/15 tithi identities on the 29-07…12-08-2022 sheet; end residuals minutes away from perigee, up to ≈4 h inside the perigee window (≈ Drik's band); hybrid sunrise ≈5 min earlier than printed; moon−sun separation within 0.39° of all 8 PyEphem anchors. Replaced by `makaranda-v2-tables` when the worksheets arrive.
- Drik unchanged (PyEphem-certified modern reference).

Nothing is mixed: each strategy is isolated behind the existing profile/strategy interface, results carry the producing profile, comparison view stays side-by-side.

## Answer to "can we build it from scratch?"

The **framework** is already built from scratch (SS pipeline, sunrise, danda-pala, strategies, gate). The **exact traditional behaviour** cannot be — it is proprietary to the university's tradition and must come from items 1–3. The calibration experiment above is the evidence: parameter fitting floors at hours, and the residual signature identifies the missing physics (lunar perturbations) rather than wrong constants.
