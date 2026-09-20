#!/usr/bin/env python3
"""Convert published Meeus series (Frink transcription of Astronomical
Algorithms, futureboy.us/frinksamp/sun.frink) into JS tables for ephemeris.js.

Sources (fetched 2026-09-20):
- IAU-1980 nutation series (Meeus Table 22.A): highAccuracyNutation
- Lunar longitude periodic terms (Meeus Table 47.A, all 60): moonSumL
Deterministic mechanical conversion — no hand retyping.
"""
import re, json, io, sys, os

DELTA_PSI = r"""
+ (-171996 + -174.2 T) sin[ + Omega] + (-13187 + -1.6 T) sin[ -2 D + 2 F + 2 Omega] + (-2274 + -0.2 T) sin[ + 2 F + 2 Omega] + (2062 + 0.2 T) sin[ + 2 Omega] + (1426 + -3.4 T) sin[ + M] + (712 + 0.1 T) sin[ + MP] + (-517 + 1.2 T) sin[ -2 D + M + 2 F + 2 Omega] + (-386 + -0.4 T) sin[ + 2 F + Omega] + (-301) sin[ + MP + 2 F + 2 Omega] + (217 + -0.5 T) sin[ -2 D -1 M + 2 F + 2 Omega] + (-158) sin[ -2 D + MP] + (129 + 0.1 T) sin[ -2 D + 2 F + Omega] + (123) sin[ -1 MP + 2 F + 2 Omega] + (63) sin[ + 2 D] + (63 + 0.1 T) sin[ + MP + Omega] + (-59) sin[ + 2 D -1 MP + 2 F + 2 Omega] + (-58 + -0.1 T) sin[ -1 MP + Omega] + (-51) sin[ + MP + 2 F + Omega] + (48) sin[ -2 D + 2 MP] + (46) sin[ -2 MP + 2 F + Omega] + (-38) sin[ + 2 D + 2 F + 2 Omega] + (-31) sin[ + 2 MP + 2 F + 2 Omega] + (29) sin[ + 2 MP] + (29) sin[ -2 D + MP + 2 F + 2 Omega] + (26) sin[ + 2 F] + (-22) sin[ -2 D + 2 F] + (21) sin[ -1 MP + 2 F + Omega] + (17 + -0.1 T) sin[ + 2 M] + (16) sin[ + 2 D -1 MP + Omega] + (-16 + 0.1 T) sin[ -2 D + 2 M + 2 F + 2 Omega] + (-15) sin[ + M + Omega] + (-13) sin[ -2 D + MP + Omega] + (-12) sin[ -1 M + Omega] + (11) sin[ + 2 MP -2 F] + (-10) sin[ + 2 D -1 MP + 2 F + Omega] + (-8) sin[ + 2 D + MP + 2 F + 2 Omega] + (7) sin[ + M + 2 F + 2 Omega] + (-7) sin[ -2 D + M + MP] + (-7) sin[ -1 M + 2 F + 2 Omega] + (-8) sin[ + 2 D + 2 F + Omega] + (6) sin[ + 2 D + MP] + (6) sin[ -2 D + 2 MP + 2 F + 2 Omega] + (6) sin[ -2 D + MP + 2 F + Omega] + (-6) sin[ + 2 D -2 MP + Omega] + (-6) sin[ + 2 D + Omega] + (5) sin[ -1 M + MP] + (-5) sin[ -2 D -1 M + 2 F + Omega] + (-5) sin[ -2 D + Omega] + (-5) sin[ + 2 MP + 2 F + Omega] + (4) sin[ -2 D + 2 MP + Omega] + (4) sin[ -2 D + M + 2 F + Omega] + (4) sin[ + MP -2 F] + (-4) sin[ -1 D + MP] + (-4) sin[ -2 D + M] + (-4) sin[ + D] + (3) sin[ + MP + 2 F] + (-3) sin[ -2 MP + 2 F + 2 Omega] + (-3) sin[ -1 D -1 M + MP] + (-3) sin[ + M + MP] + (-3) sin[ -1 M + MP + 2 F + 2 Omega] + (-3) sin[ + 2 D -1 M -1 MP + 2 F + 2 Omega] + (-3) sin[ + 3 MP + 2 F + 2 Omega] + (-3) sin[ + 2 D -1 M + 2 F + 2 Omega]
"""

DELTA_EPS = r"""
+ (92025 + 8.9 T) cos[ + Omega] + (5736 + -3.1 T) cos[ -2 D + 2 F + 2 Omega] + (977 + -0.5 T) cos[ + 2 F + 2 Omega] + (-895 + 0.5 T) cos[ + 2 Omega] + (54 + -0.1 T) cos[ + M] + (-7) cos[ + MP] + (224 + -0.6 T) cos[ -2 D + M + 2 F + 2 Omega] + (200) cos[ + 2 F + Omega] + (129 + -0.1 T) cos[ + MP + 2 F + 2 Omega] + (-95 + 0.3 T) cos[ -2 D -1 M + 2 F + 2 Omega] + (-70) cos[ -2 D + 2 F + Omega] + (-53) cos[ -1 MP + 2 F + 2 Omega] + (-33) cos[ + MP + Omega] + (26) cos[ + 2 D -1 MP + 2 F + 2 Omega] + (32) cos[ -1 MP + Omega] + (27) cos[ + MP + 2 F + Omega] + (-24) cos[ -2 MP + 2 F + Omega] + (16) cos[ + 2 D + 2 F + 2 Omega] + (13) cos[ + 2 MP + 2 F + 2 Omega] + (-12) cos[ -2 D + MP + 2 F + 2 Omega] + (-10) cos[ -1 MP + 2 F + Omega] + (-8) cos[ + 2 D -1 MP + Omega] + (7) cos[ -2 D + 2 M + 2 F + 2 Omega] + (9) cos[ + M + Omega] + (7) cos[ -2 D + MP + Omega] + (6) cos[ -1 M + Omega] + (5) cos[ + 2 D -1 MP + 2 F + Omega] + (3) cos[ + 2 D + MP + 2 F + 2 Omega] + (-3) cos[ + M + 2 F + 2 Omega] + (3) cos[ -1 M + 2 F + 2 Omega] + (3) cos[ + 2 D + 2 F + Omega] + (-3) cos[ -2 D + 2 MP + 2 F + 2 Omega] + (-3) cos[ -2 D + MP + 2 F + Omega] + (3) cos[ + 2 D -2 MP + Omega] + (3) cos[ + 2 D + Omega] + (3) cos[ -2 D -1 M + 2 F + Omega] + (3) cos[ -2 D + Omega] + (3) cos[ + 2 MP + 2 F + Omega]
"""

MOON_SUM_L = r"""
+ (6288774) sin[ + MP] + (1274027) sin[ + 2 D - MP] + (658314) sin[ + 2 D] + (213618) sin[ + 2 MP] + (-185116 E) sin[ + M] + (-114332) sin[ + 2 F] + (58793) sin[ + 2 D -2 MP] + (57066 E) sin[ + 2 D - M - MP] + (53322) sin[ + 2 D + MP] + (45758 E) sin[ + 2 D - M] + (-40923 E) sin[ + M - MP] + (-34720) sin[ + D] + (-30383 E) sin[ + M + MP] + (15327) sin[ + 2 D -2 F] + (-12528) sin[ + MP + 2 F] + (10980) sin[ + MP -2 F] + (10675) sin[ + 4 D - MP] + (10034) sin[ + 3 MP] + (8548) sin[ + 4 D -2 MP] + (-7888 E) sin[ + 2 D + M - MP] + (-6766 E) sin[ + 2 D + M] + (-5163) sin[ + D - MP] + (4987 E) sin[ + D + M] + (4036 E) sin[ + 2 D - M + MP] + (3994) sin[ + 2 D + 2 MP] + (3861) sin[ + 4 D] + (3665) sin[ + 2 D -3 MP] + (-2689 E) sin[ + M -2 MP] + (-2602) sin[ + 2 D - MP + 2 F] + (2390 E) sin[ + 2 D - M -2 MP] + (-2348) sin[ + D + MP] + (2236 E^2) sin[ + 2 D -2 M] + (-2120 E) sin[ + M + 2 MP] + (-2069 E^2) sin[ + 2 M] + (2048 E^2) sin[ + 2 D -2 M - MP] + (-1773) sin[ + 2 D + MP -2 F] + (-1595) sin[ + 2 D + 2 F] + (1215 E) sin[ + 4 D - M - MP] + (-1110) sin[ + 2 MP + 2 F] + (-892) sin[ + 3 D - MP] + (-810 E) sin[ + 2 D + M + MP] + (759 E) sin[ + 4 D - M -2 MP] + (-713 E^2) sin[ + 2 M - MP] + (-700 E^2) sin[ + 2 D + 2 M - MP] + (691 E) sin[ + 2 D + M -2 MP] + (596 E) sin[ + 2 D - M -2 F] + (549) sin[ + 4 D + MP] + (537) sin[ + 4 MP] + (520 E) sin[ + 4 D - M] + (-487) sin[ + D -2 MP] + (-399 E) sin[ + 2 D + M -2 F] + (-381) sin[ + 2 MP -2 F] + (351 E) sin[ + D + M + MP] + (-340) sin[ + 3 D -2 MP] + (330) sin[ + 4 D -3 MP] + (327 E) sin[ + 2 D - M + 2 MP] + (-323 E^2) sin[ + 2 M + MP] + (299 E) sin[ + D + M - MP] + (294) sin[ + 2 D + 3 MP]
"""

TERM_NUT = re.compile(r"\(\s*(-?\d+(?:\.\d+)?)\s*(?:\+\s*(-?\d+(?:\.\d+)?)\s*T)?\s*\)\s*(sin|cos)\[([^\]]*)\]")
TERM_MOON = re.compile(r"\(\s*(-?\d+)\s*(E(?:\^2)?)?\s*\)\s*(sin|cos)\[([^\]]*)\]")
ARG = re.compile(r"([+-])\s*(?:(\d+)\s+)?(D|MP|M|F|Omega)")
VAR = {"D": "D", "M": "M", "MP": "Mp", "F": "F", "Omega": "Om"}

def parse_arg(s):
    coefs = {"D": 0, "M": 0, "Mp": 0, "F": 0, "Om": 0}
    for sign, num, var in ARG.findall(s):
        n = int(num) if num else 1
        if sign == "-": n = -n
        coefs[VAR[var]] += n
    return coefs

def nut_rows(text):
    rows = []
    for a, b, fn, arg in TERM_NUT.findall(text):
        c = parse_arg(arg)
        rows.append([c["D"], c["M"], c["Mp"], c["F"], c["Om"], float(a), float(b or 0), fn])
    return rows

def moon_rows(text):
    rows = []
    for a, epow, fn, arg in TERM_MOON.findall(text):
        c = parse_arg(arg)
        rows.append([c["D"], c["M"], c["Mp"], c["F"], c["Om"], int(a), {"": 0, "E": 1, "E^2": 2}[epow], fn])
    return rows

psi = nut_rows(DELTA_PSI)
eps = nut_rows(DELTA_EPS)
ml = moon_rows(MOON_SUM_L)
print("nutation psi terms:", len(psi), "eps terms:", len(eps), "moon L terms:", len(ml), file=sys.stderr)
# Meeus reference checks
assert len(psi) == 63, "nutation psi count"
assert psi[0] == [0, 0, 0, 0, 1, -171996.0, -174.2, "sin"]
assert psi[1] == [-2, 0, 0, 2, 2, -13187.0, -1.6, "sin"]
assert eps[0] == [0, 0, 0, 0, 1, 92025.0, 8.9, "cos"]
assert len(ml) == 59, "59 nonzero lunar longitude terms (60th row has l=0; lives in distance series)"
assert ml[0] == [0, 0, 1, 0, 0, 6288774, 0, "sin"]
assert ml[1] == [2, 0, -1, 0, 0, 1274027, 0, "sin"]
assert ml[-1] == [2, 0, 3, 0, 0, 294, 0, "sin"]
assert all(r[7] == "sin" for r in ml)

# --- Lunar latitude (Table 47.B) and distance (Table 47.A r-column) terms ---
# Source: astropy v4.0 coordinates/orbital_elements.py (checked-in copy), a
# transcription of Meeus Tables 47.A/47.B. Rows: (D, M, M', F, factor),
# distance rows carry (D, M, M', F, l-factor, r-factor). E^|M| correction.
ASTROPY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "astropy_orbital_elements_v4.0.py")
_src = open(ASTROPY).read()
_lr_block = re.search(r"_MOON_L_R = \((.*?)^\)", _src, re.S | re.M).group(1)
_b_block = re.search(r"_MOON_B = \((.*?)^\)", _src, re.S | re.M).group(1)
lr_rows = [(int(a), int(b), int(c), int(d), int(l), int(r)) for a, b, c, d, l, r in
           re.findall(r"\((-?\d+), (-?\d+), (-?\d+), (-?\d+), (-?\d+), (-?\d+)\)", _lr_block)]
b_rows = [(int(a), int(b), int(c), int(d), int(x)) for a, b, c, d, x in
          re.findall(r"\((-?\d+), (-?\d+), (-?\d+), (-?\d+), (-?\d+)\)", _b_block)]
assert len(lr_rows) == 60 and len(b_rows) == 60, "Meeus Table 47.A/B each have 60 rows"
assert lr_rows[0] == (0, 0, 1, 0, 6288774, -20905355) and lr_rows[1] == (2, 0, -1, 0, 1274027, -3699111)
assert b_rows[0] == (0, 0, 0, 1, 5128122) and b_rows[1] == (0, 0, 1, 1, 280602)
# cross-check the astropy L-column against the Frink-derived MOON_TERMS_L
for i, (D, M, Mp, F, lf, _rf) in enumerate(lr_rows):
    if i < len(ml):
        fr = ml[i]
        assert [D, M, Mp, F] == fr[:4] and lf == fr[5], f"mismatch row {i}: {D},{M},{Mp},{F},{lf} vs {fr}"
    else:
        assert lf == 0, "60th row has l=0 (lives in the distance series only)"
mr = [[D, M, Mp, F, 0, r, min(abs(M), 2), "cos"] for D, M, Mp, F, _l, r in lr_rows if r != 0]
mb = [[D, M, Mp, F, 0, x, min(abs(M), 2), "sin"] for D, M, Mp, F, x in b_rows if x != 0]
print(f"moon R terms: {len(mr)}, moon B terms: {len(mb)}", file=sys.stderr)

def js(rows, withB):
    out = []
    for r in rows:
        D, M, Mp, F, Om, a, b, fn = r
        if withB:
            out.append(f"[{D},{M},{Mp},{F},{Om},{a:g},{b:g}]")
        else:
            out.append(f"[{D},{M},{Mp},{F},{Om},{a},{b}]")
    return ",\n  ".join(out)

print("/* GENERATED by scripts/genMeeusTables.py — do not edit by hand. */")
print("export const NUTATION_IAU1980_PSI = [\n  " + js(psi, True) + "\n];")
print("export const NUTATION_IAU1980_EPS = [\n  " + js(eps, True) + "\n];")
print("/* [D, M, M', F, Omega, coeff(1e-6 deg), E-power] — Meeus Table 47.A */")
print("export const MOON_TERMS_L = [\n  " + js(ml, False) + "\n];")
print("/* [D, M, M', F, Omega, coeff(1e-6 deg), E-power] — Meeus Table 47.A Σr (cos), Δ in km = coeff/1000 */")
print("export const MOON_TERMS_R = [\n  " + js(mr, False) + "\n];")
print("/* [D, M, M', F, Omega, coeff(1e-6 deg), E-power] — Meeus Table 47.B Σb (sin) */")
print("export const MOON_TERMS_B = [\n  " + js(mb, False) + "\n];")
