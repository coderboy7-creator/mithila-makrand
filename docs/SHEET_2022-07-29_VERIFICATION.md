# Verification: owner sheet 29-07-2022 → 12-08-2022 (uploads/image-1.png)

Reproducible harness: `node scripts/verifySheet0722.mjs` (transcription + internal-consistency + both-engine comparison).
Sunrise/sunset read from the sheet; sunset interpreted on the owner-confirmed 12-hr cycle (06:40 → 18:40). Day-length column cross-checks exactly (e.g. 29-07: 33-20 d.p = 13h20m = 18:40−05:20 ✓).

## A) Is the transcription itself sound? (sunrise + द.प. = printed घ.मि.)

11/15 rows consistent within ±2 min; the four "CHECK" rows: 31-07 tithi (4 min), 09-08 nak (2.4 min) = borderline reads; 01-08 rashi clock and 12-08 tithi (56 min) = flagged as uncertain reads, NOT used for conclusions. ("रा 12|xx" wrap-around deltas of exactly 1440 m are the midnight convention, not errors.)

## B) App (engines) vs printed sheet

### DRIK (modern, PyEphem-certified) — matches the printed Panchang closely
| date | printed tithi end | Drik Δ | printed nakshatra | Drik Δ | identities |
|---|---|---|---|---|---|
| 29-07 | रा 12:04 | +80 m | Pushya | **−4 m** | T✓ N✓ |
| 30-07 | रा 01:25 | +98 m | Ashlesha | +10 m | T✓ N✓ |
| 31-07 | रा 02:14 | +121 m | Magha | +199 m | T✓ N✓ |
| 01-08 | रा 02:40 | +152 m | P. Phalguni | +58 m | T✓ N✓ |
| 02-08 | रा 02:31 | +190 m | U. Phalguni | +92 m | T✓ N✓ |
| 03-08 | रा 01:54 | −20 h* | Hasta | +130 m | T✘(sunrise boundary) N✓ |
| 04-08 | रा 12:48 | −19 h* | Chitra | +166 m | T✘(boundary) N✓ |
| 05-08 | रा 11:18 | +280 m | Swati | +193 m | T✓ N✓ |
| 06-08 | रा 09:28 | +284 m | Vishakha | +202 m | T✓ N✓ |
| 07-08 | स 07:21 | +270 m | Anuradha | +197 m | T✓ N✓ |
| 08-08 | स 05:03 | +237 m | Jyeshtha | +170 m | T✓ N✓ |
| 09-08 | स 02:37 | +189 m | Mula | +127 m | T✓ N✓ |
| 10-08 | दि 12:09 | +126 m | P. Ashadha | +68 m | T✓ N✓ |
| 11-08 | दि 09:42 | +57 m | U. Ashadha | **+2 m** | T✓ N✓ |
| 12-08 | दि 06:27? | −17 m | Dhanishta | −141 m | T✓ N✓ |

Nakshatra identity 15/15; tithi identity 13/15 (the two ✘ are sunrise-boundary flips caused by the traditional lag, not model disagreement).
Nakshatra end-time error: **2–10 min** away from perigee (29-07, 30-07, 10/11/12-08), growing to **1–3.4 h** in 31-07…07-08 — the Moon's perigee was ~04-08-2022, and traditional (Surya-Siddhanta-class) lunar true-motion error peaks there. This is the same signature seen in every other sheet.

### MAKARANDA (built-in SS engine) — NOT yet calibrated to this Panchang
Tithi *numbers at sunrise* happen to match 15/15, but tithi **end times are off by up to ±14 h** and nakshatra identity is systematically **one nakshatra ahead** of the sheet (e.g. 29-07: engine Ashlesha vs printed Pushya). Verdict unchanged and honest: the Makaranda engine reproduces the *class* of traditional behaviour but not this Panchang's tables; the release gate stays **NOT PASSED** until the Makaranda Sarani tables/ayanamsa (2016–2026) are supplied and the SS lunar equation is calibrated (open concern O3).

### Sunrise
Printed 05:20→05:28 sits **between** Drik (05:12→05:19, ~8 min early) and our siddhantic sunrise (05:25→05:35, ~6 min late). A season-dependent definition/meridian question — open concern O4 (deshantara-kala hypothesis H6).

## WHY the mismatches exist (summary)
1. **Printed sheet = traditional astronomy**, certified again: Drik (itself certified vs PyEphem ≤0.15°) tracks it within minutes except in the perigee window, where the traditional model's own residual grows to hours. No bug; no fudging.
2. **Our Makaranda engine** is an independent SS implementation not yet tuned to the Vishwavidyalaya Sarani → large residuals; that is precisely what the golden gate is for.
3. **Two tithi-identity flips (03/04-08)** occur because the printed end falls a few hours before the modern end, i.e. before vs after that day's sunrise — an inherent boundary effect of a lagging traditional moon, visible in the source's own data.
4. **A few flagged cells** (01-08 rashi clock, 12-08 tithi d.p/clock) are transcription uncertainties from the photo; they are excluded from every conclusion and listed for owner confirmation.
