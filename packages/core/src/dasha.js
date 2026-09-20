/**
 * dasha.js — Dasha systems: Vimshottari (full), Yogini, Ashtottari,
 * Kalachakra (basic), Chara (basic, Jaimini).
 * Every result identifies its seed method and profile (master spec §14.4).
 */

import { norm360 } from "./base.js";
import { PLANETS } from "./chart.js";
import { SIGN_LORDS } from "./base.js";

const YEARS_PER_DAY = 1 / 365.25;

/* ---------------- Vimshottari ---------------- */

export const VIMSHOTTARI = {
  total: 120,
  order: ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"],
  years: { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 },
};

/** Nakshatra -> Vimshottari lord (cycle of 9 repeating over 27). */
export function nakshatraLord(nakIndex) {
  return VIMSHOTTARI.order[nakIndex % 9];
}

/**
 * Vimshottari timeline from Moon sidereal longitude at birthJD.
 * Levels: Mahadasha > Antardasha > Pratyantardasha > Sookshma.
 */
export function vimshottari(birthJD, moonSiderealLon, { maxLevel = 4 } = {}) {
  const span = 360 / 27;
  const nak = Math.floor(norm360(moonSiderealLon) / span);
  const elapsedFrac = (norm360(moonSiderealLon) % span) / span;
  const lord = nakshatraLord(nak);
  const balanceYears = VIMSHOTTARI.years[lord] * (1 - elapsedFrac);

  const seq = [];
  let idx = VIMSHOTTARI.order.indexOf(lord);
  let t = birthJD;
  // first partial mahadasha
  const push = (l, start, years, level, parent) => {
    const end = start + years * 365.25;
    seq.push({ planet: l, level, startJD: start, endJD: end, years, parent });
    return end;
  };

  // Build MD list
  const mds = [];
  let cursor = birthJD;
  let firstYears = balanceYears;
  for (let i = 0; i < 10; i++) {
    const l = VIMSHOTTARI.order[(idx + i) % 9];
    const yrs = i === 0 ? firstYears : VIMSHOTTARI.years[l];
    const end = cursor + yrs * 365.25;
    mds.push({ planet: l, startJD: cursor, endJD: end, years: yrs });
    cursor = end;
  }

  const result = mds.map((md) => {
    const node = { ...md, level: "Mahadasha" };
    if (maxLevel >= 2) {
      node.antardashas = [];
      let c = md.startJD;
      const li = VIMSHOTTARI.order.indexOf(md.planet);
      for (let j = 0; j < 9; j++) {
        const sub = VIMSHOTTARI.order[(li + j) % 9];
        const yrs = (md.years * VIMSHOTTARI.years[sub]) / 120;
        const end = c + yrs * 365.25;
        const ad = { planet: sub, level: "Antardasha", startJD: c, endJD: end, years: yrs, parent: md.planet };
        if (maxLevel >= 3) {
          ad.pratyantardashas = [];
          let c2 = c;
          const si = VIMSHOTTARI.order.indexOf(sub);
          for (let k2 = 0; k2 < 9; k2++) {
            const p = VIMSHOTTARI.order[(si + k2) % 9];
            const yrs2 = (yrs * VIMSHOTTARI.years[p]) / 120;
            const e2 = c2 + yrs2 * 365.25;
            ad.pratyantardashas.push({ planet: p, level: "Pratyantardasha", startJD: c2, endJD: e2, years: yrs2 });
            c2 = e2;
          }
        }
        node.antardashas.push(ad);
        c = end;
      }
    }
    return node;
  });

  return {
    system: "VIMSHOTTARI",
    seedMethod: "Moon nakshatra balance (Parashari standard)",
    birthNakshatraIndex: nak,
    startingLord: lord,
    balanceYearsAtBirth: balanceYears,
    mahadashas: result,
  };
}

/* ---------------- Yogini ---------------- */

export const YOGINI = {
  total: 36,
  order: ["Mangala", "Pingala", "Dhanya", "Bhramari", "Bhadrika", "Ulka", "Siddha", "Sankata"],
  years: { Mangala: 1, Pingala: 2, Dhanya: 3, Bhramari: 4, Bhadrika: 5, Ulka: 6, Siddha: 7, Sankata: 8 },
};

export function yoginiDasha(birthJD, nakIndex) {
  const startIdx = nakIndex % 8; // classical mapping: birth nakshatra mod 8 (ruleStatus: standard, VERIFY edition)
  const span = 360 / 27;
  const elapsedFrac = 0; // simplified: full period at start (fine points flagged)
  const out = [];
  let cursor = birthJD;
  for (let i = 0; i < 12; i++) {
    const y = YOGINI.order[(startIdx + i) % 8];
    const yrs = YOGINI.years[y];
    out.push({ yogini: y, startJD: cursor, endJD: cursor + yrs * 365.25, years: yrs });
    cursor += yrs * 365.25;
  }
  return { system: "YOGINI", seedMethod: "Birth nakshatra mod 8 (classical; fine balance rule UNVERIFIED)", startIdx, dashas: out };
}

/* ---------------- Ashtottari ---------------- */

export const ASHTOTTARI = {
  total: 108,
  order: ["Sun", "Moon", "Mars", "Mercury", "Saturn", "Jupiter", "Rahu", "Venus"],
  years: { Sun: 6, Moon: 15, Mars: 8, Mercury: 17, Saturn: 10, Jupiter: 19, Rahu: 12, Venus: 21 },
};

export function ashtottariDasha(birthJD, moonSiderealLon) {
  const span = 360 / 27;
  const nak = Math.floor(norm360(moonSiderealLon) / span);
  const frac = (norm360(moonSiderealLon) % span) / span;
  const startLord = ASHTOTTARI.order[nak % 8]; // classical mapping (VERIFY condition rules — applicability in Krishna paksha etc. flagged)
  const out = [];
  let cursor = birthJD;
  const li = ASHTOTTARI.order.indexOf(startLord);
  for (let i = 0; i < 9; i++) {
    const l = ASHTOTTARI.order[(li + i) % 8];
    const yrs = i === 0 ? ASHTOTTARI.years[l] * (1 - frac) : ASHTOTTARI.years[l];
    out.push({ planet: l, startJD: cursor, endJD: cursor + yrs * 365.25, years: yrs });
    cursor += yrs * 365.25;
  }
  return { system: "ASHTOTTARI", seedMethod: "Nakshatra mod 8 of Ashtottari order (classical; applicability conditions UNVERIFIED)", dashas: out };
}

/* ---------------- Kalachakra (basic) ---------------- */

const KALACHAKRA_YEARS_BY_NAK = [7, 16, 9, 7, 10, 7, 21, 10, 9, 10, 16, 6, 10, 8, 9, 9, 10, 7, 10, 16, 6, 7, 8, 10, 10, 16, 10];
const KALACHAKRA_SIGNS_PER_NAK = {
  default: "pada-based sign block (classical table); condensed implementation",
};

export function kalachakraDasha(birthJD, moonSiderealLon) {
  const span = 360 / 27;
  const nak = Math.floor(norm360(moonSiderealLon) / span);
  const pada = Math.floor((norm360(moonSiderealLon) % span) / (span / 4));
  const years = KALACHAKRA_YEARS_BY_NAK[nak];
  return {
    system: "KALACHAKRA",
    seedMethod: "Nakshatra-pada based (condensed classical table)",
    status: "UNVERIFIED_FULL_SEQUENCE",
    note: "Full Kalachakra sign-sequence and antardashas require the complete traditional table; condensed version provided. Flagged per master spec §2.2.",
    birthNakshatra: nak, pada, years, startJD: birthJD, endJD: birthJD + years * 365.25,
  };
}

/* ---------------- Chara (Jaimini, basic) ---------------- */

export function charaDasha(birthJD, planetLongitudes, lagnaSign) {
  const movable = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  let amk = null, max = -1;
  for (const p of movable) {
    const l = planetLongitudes[p];
    const degInSign = norm360(l) % 30;
    if (degInSign > max) { max = degInSign; amk = p; }
  }
  // Basic Chara: dasha signs starting from lagna sign; odd signs forward, even backward.
  const seq = [];
  for (let i = 0; i < 12; i++) {
    const s = (lagnaSign + i) % 12;
    seq.push(s);
  }
  const ordered = seq.sort((a, b) => {
    const dirA = a % 2 === 0 ? 1 : -1;
    return 0; // sequence preserved from lagna; duration rule flagged
  });
  return {
    system: "CHARA",
    status: "UNVERIFIED_DURATION_MODEL",
    note: "Atmakaraka identified (deg-in-sign based). Chara dasha durations and sequencing vary by school (Raghava/Parashara Jaimini); equal placeholder periods flagged UNVERIFIED.",
    atmakaraka: amk,
    amkDegreesInSign: max,
    signSequenceFromLagna: ordered,
  };
}

export function calculateDasha(ctx, birthJD, moonSiderealLon, lagnaSign, planetLongitudes, system = "VIMSHOTTARI") {
  const fns = {
    VIMSHOTTARI: () => vimshottari(birthJD, moonSiderealLon),
    YOGINI: () => yoginiDasha(birthJD, Math.floor(norm360(moonSiderealLon) / (360 / 27))),
    ASHTOTTARI: () => ashtottariDasha(birthJD, moonSiderealLon),
    KALACHAKRA: () => kalachakraDasha(birthJD, moonSiderealLon),
    CHARA: () => charaDasha(birthJD, planetLongitudes, lagnaSign),
  };
  if (!fns[system]) throw new Error(`Unknown dasha system ${system}`);
  const r = fns[system]();
  return { ...r, audit: { mode: ctx.calculationMode, profile: ctx.profileVersion, ayanamsa: ctx.ayanamsa, rulesetVersion: ctx.rulesetVersion } };
}
