#!/usr/bin/env python3
"""Convert CDS VI/81 VSOP87D series files (Bretagnon & Francou 1988) into
packages/core/src/vsopTables.js for the DRIK engine.

Source: https://cdsarc.cds.unistra.fr/ftp/cats/VI/81/VSOP87D.{ear,mer,ven,mar,jup,sat}
(raw copies in /home/user/vsop87-src/; the distributed files carry the
"VERSION D4" truncation header exactly as published by CDS/BDL).

File layout (vsop87.txt, 1-based columns):
  header: iv col.18, body col.23-29, ic col.42, it col.60, nterms col.61-67
  term  : iv i1 c.02, ib i1 c.03, ic i1 c.04, it i1 c.05, n i5 c.06-10,
          a(12) 12i3 c.11-46, S f15.11 c.47-61, K f18.11 c.62-79,
          A f18.11 c.80-97, B f14.11 c.98-111, C f20.11 c.112-131
Series value: sum over terms of  T**it * A * cos(B + C*T),
with T = (JD(TT) - 2451545.0) / 365250  (thousands of Julian years).
Frame: mean dynamical ecliptic and equinox OF DATE (precession built in).

Truncation policy: we additionally drop terms with |A| < CUTOFF_RAD.
The full theory's own precision floor is 0.6e-8 (Mercury) .. 70e-8 rad
(Saturn), so 5e-8 rad (0.010") costs nothing measurable.
"""
import os, sys, json

SRC = "/home/user/vsop87-src"
OUT = os.path.join(os.path.dirname(__file__), "..", "packages", "core", "src", "vsopTables.js")
CUTOFF_RAD = 2e-8  # 0.004" — below the theory's own precision floor for every body
PLANETS = {"earth": "VSOP87D.ear", "mercury": "VSOP87D.mer", "venus": "VSOP87D.ven",
           "mars": "VSOP87D.mar", "jupiter": "VSOP87D.jup", "saturn": "VSOP87D.sat"}
COORD = {1: "L", 2: "B", 3: "R"}

def parse_file(path):
    """Return {(coord, it): [(A, B, C)]} preserving file order (amplitude-sorted)."""
    series = {}
    counts = {}
    with open(path) as f:
        for line in f:
            line = line.rstrip("\n")
            if not line.strip():
                continue
            if "VSOP87 VERSION" in line:
                # header record
                ic = int(line[41:42])
                it = int(line[59:60])
                nterms = int(line[60:67])
                counts[(COORD[ic], it)] = nterms
                series.setdefault((COORD[ic], it), [])
                continue
            # term record (fixed width)
            ic = int(line[3:4]); it = int(line[4:5])
            A = float(line[79:97]); B = float(line[97:111]); C = float(line[111:131])
            series.setdefault((COORD[ic], it), []).append((A, B, C))
    # verify declared term counts
    for key, n in counts.items():
        got = len(series.get(key, []))
        assert got == n, f"{path}: series {key} declared {n} terms, parsed {got}"
    return series

def main():
    out = {}
    total_kept = 0
    for name, fname in PLANETS.items():
        series = parse_file(os.path.join(SRC, fname))
        body = {}
        for (coord, it), terms in sorted(series.items(), key=lambda kv: ("LBR".index(kv[0][0]), kv[0][1])):
            kept = [t for t in terms if abs(t[0]) >= CUTOFF_RAD]
            dropped_amp = sum(abs(t[0]) for t in terms if abs(t[0]) < CUTOFF_RAD)
            body.setdefault(coord, {"terms": [], "poisson": {}})
            flat = [round(v, 14) for t in kept for v in t]  # A,B,C triplets
            if it == 0:
                body[coord]["terms"].extend(flat)
            else:
                body[coord]["poisson"][str(it)] = flat
            total_kept += len(kept)
            print(f"  {name:8s} {coord}{it}: kept {len(kept):4d}/{len(terms):4d} (dropped Σ|A| = {dropped_amp:.2e} rad)", file=sys.stderr)
        out[name] = body
    js = []
    js.append("/* GENERATED FILE — do not edit. scripts/genVsopTables.py regenerates it.")
    js.append(" * Source: CDS VI/81 (Bretagnon & Francou 1988) VSOP87D, as distributed")
    js.append(" * (files carry the published VERSION D4 truncation). Additional cutoff:")
    js.append(f" * |A| >= {CUTOFF_RAD:.0e} rad. Frame: mean ecliptic & equinox OF DATE.")
    js.append(" * T in thousands of Julian years from J2000 (TT): T = (JD-2451545)/365250.")
    js.append(" * Layout: {planet: {L|B|R: {terms: [A,B,C,...], poisson: {it: [A,B,C,...]}}}} */")
    js.append("export const VSOP87_META = " + json.dumps({
        "source": "CDS VI/81 VSOP87D (Bretagnon & Francou 1988), VERSION D4 as distributed",
        "cutoffRad": CUTOFF_RAD,
        "frame": "mean ecliptic and equinox of date",
        "tUnit": "thousand Julian years from J2000 (TT)",
        "termsKept": total_kept,
    }, indent=1) + ";")
    js.append("export const VSOP87 = " + json.dumps(out, separators=(",", ":")) + ";")
    with open(OUT, "w") as f:
        f.write("\n".join(js) + "\n")
    size = os.path.getsize(OUT)
    print(f"WROTE {OUT}: {total_kept} terms kept, {size/1024:.0f} KiB", file=sys.stderr)

if __name__ == "__main__":
    main()
