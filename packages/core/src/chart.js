/**
 * chart.js — Kundali (Rashi), Bhava, and Varga charts.
 * Works under BOTH calculation profiles; the profile propagates into every
 * layer (master spec §14.1, §14.2).
 */

import { norm360, gmst, atan2D, cosD, sinD, tanD, degToDms, SIGN_LORDS } from "./base.js";
import { positionsFor, drikIsRetrograde, ssIsRetrograde } from "./ephemeris.js";
import { NAKSHATRA_NAMES } from "./panchang.js";
import { statusOf, avasthaOf } from "./planetStatus.js";
import { avakhadaOf } from "./avakhada.js";

export const PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

export const SIGN_SHORT = ["Mes", "Vri", "Gem", "Kan", "Leo", "Vir", "Lib", "Vrs", "Dha", "Mak", "Kum", "Mee"];

/** Vimshottari nakshatra lords (Ketu→Venus→Sun→Moon→Mars→Rahu→Jupiter→Saturn→Mercury). */
export const NAKSHATRA_LORDS = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];

/** Combustion orbs (Surya Siddhanta traditional, degrees from Sun). */
export const COMBUSTION_ORBS = { Moon: 12, Mars: 17, Mercury: 12, Jupiter: 11, Venus: 10, Saturn: 15 };

/** Graha drishti (aspects): every graha aspects 7th; extras per graha. */
export const SPECIAL_ASPECTS = { Mars: [4, 8], Jupiter: [5, 9], Saturn: [3, 10] };

export function houseOf(lon, lagnaLon, system = "EQUAL_FROM_LAGNA") {
  const d = norm360(lon - lagnaLon);
  return Math.floor(d / 30) + 1; // 1..12
}

export function signOf(lon) {
  return Math.floor(norm360(lon) / 30);
}

/** Ascendant sidereal longitude (same formula both engines; obliquity per profile). */
export function ascendantSidereal(ctx, jd) {
  const eps = ctx.profile.obliquity;
  const ramc = norm360(gmst(jd) + ctx.longitude);
  const ascTrop = atan2D(cosD(ramc), -(sinD(ramc) * cosD(eps) + tanD(ctx.latitude) * sinD(eps)));
  const { ayanamsa } = positionsFor(ctx, jd);
  return norm360(ascTrop - ayanamsa);
}

export function nakshatraOf(lon) {
  const x = norm360(lon);
  const idx = Math.floor(x / (360 / 27));
  const span = 360 / 27;
  const pada = Math.floor((x % span) / (span / 4)) + 1;
  return { index: idx, name: NAKSHATRA_NAMES[idx], pada };
}

/** Full planetary status table at jd. */
export function planetaryPositions(ctx, jd) {
  const { sidereal, ayanamsa, engine } = positionsFor(ctx, jd);
  const rows = PLANETS.map((name) => {
    const lon = sidereal[name];
    const s = signOf(lon);
    const nak = nakshatraOf(lon);
    const retro = ctx.calculationMode === "DRIK" ? drikIsRetrograde(name, jd) : ssIsRetrograde(name, jd);
    return {
      name,
      longitude: lon,
      dms: degToDms(norm360(lon)),
      sign: s,
      signLord: SIGN_LORDS[s],
      nakshatra: nak.name,
      nakshatraLord: NAKSHATRA_LORDS[nak.index % 9],
      pada: nak.pada,
      retrograde: retro,
      avastha: avasthaOf(lon),
      status: statusOf(name, s),
    };
  });
  // Combustion
  const sunLon = sidereal.Sun;
  for (const r of rows) {
    const orb = COMBUSTION_ORBS[r.name];
    if (orb) {
      let d = Math.abs(r.longitude - sunLon);
      if (d > 180) d = 360 - d;
      r.combust = d < orb;
      r.combustOrb = orb;
    } else r.combust = false;
  }
  return { positions: rows, ayanamsa, engine };
}

/** Aspect table: which planet aspects which house/planet (Parashari full drishti). */
export function aspectsOf(rows, lagnaLon) {
  const out = [];
  for (const p of rows) {
    const fromSign = signOf(p.longitude);
    const targets = [7, ...(SPECIAL_ASPECTS[p.name] ?? [])];
    for (const k of targets) {
      const toSign = (fromSign + k - 1) % 12;
      const aspected = rows.filter((q) => q.name !== p.name && signOf(q.longitude) === toSign).map((q) => q.name);
      out.push({ planet: p.name, aspectHouseFromLagna: ((toSign - signOf(lagnaLon) + 12) % 12) + 1, toSign, aspectedPlanets: aspected });
    }
  }
  return out;
}

/**
 * Complete Kundali at a given instant.
 */
export function calculateKundali(ctx, jd) {
  const lagna = ascendantSidereal(ctx, jd);
  const { positions, ayanamsa, engine } = planetaryPositions(ctx, jd);
  const lagnaSign = signOf(lagna);
  const bhavas = positions.map((p) => ({ ...p, house: houseOf(p.longitude, lagna) }));
  const houseOccupants = Array.from({ length: 12 }, (_, i) => bhavas.filter((p) => p.house === i + 1).map((p) => p.name));
  const signOccupants = Array.from({ length: 12 }, (_, i) => bhavas.filter((p) => p.sign === i).map((p) => p.name));
  return {
    calculationMode: ctx.calculationMode,
    profileVersion: ctx.profileVersion,
    lagna: { longitude: lagna, sign: lagnaSign, signName: lagnaSign, nakshatra: nakshatraOf(lagna) },
    positions: bhavas,
    aspects: aspectsOf(positions, lagna),
    houseOccupants,
    signOccupants,
    chartStyleSupport: ["NORTH_INDIAN", "SOUTH_INDIAN", "EAST_INDIAN"],
    avakhada: avakhadaOf(positions.find((p) => p.name === "Moon").longitude),
    ayanamsa,
    engine,
    audit: { mode: ctx.calculationMode, profile: ctx.profileVersion, ayanamsa: ctx.ayanamsa, ephemerisSource: ctx.ephemerisSource, rulesetVersion: ctx.rulesetVersion },
  };
}

/* ================= Vargas (divisional charts) ================= */

/**
 * Varga sign (Parashari lord-based) for a planet longitude.
 * Rule status is reported per varga; uncertain fine points are flagged
 * UNVERIFIED instead of silently invented (master spec §2.2).
 */
const movFixDual = (s) => (["Mes", "Kan", "Tul", "Mak"].includes(SIGN_SHORT[s]) ? 0 : ["Vri", "Leo", "Vrs", "Kum"].includes(SIGN_SHORT[s]) ? 1 : 2);

export const VARGA_DEFS = {
  D2: { div: 2, ruleStatus: "VERIFIED_STANDARD", note: "Hora: odd sign 1st half Leo, 2nd Cancer; even reversed" },
  D3: { div: 3, ruleStatus: "VERIFIED_STANDARD", note: "Drekkana: 1/5/9 from sign" },
  D4: { div: 4, ruleStatus: "BPHS_STANDARD", note: "Chaturthamsha lords per BPHS movable/fixed/dual starts" },
  D7: { div: 7, ruleStatus: "BPHS_STANDARD", note: "Saptamamsha: odd forward / even backward" },
  D9: { div: 9, ruleStatus: "VERIFIED_STANDARD", note: "Navamsha: movable from self, fixed from 9th, dual from 5th" },
  D10: { div: 10, ruleStatus: "BPHS_STANDARD", note: "Dashamsha" },
  D12: { div: 12, ruleStatus: "BPHS_STANDARD", note: "Dwadashamsha" },
  D16: { div: 16, ruleStatus: "BPHS_STANDARD", note: "Shodashamsha" },
  D20: { div: 20, ruleStatus: "BPHS_STANDARD", note: "Vimshamsha" },
  D24: { div: 24, ruleStatus: "BPHS_STANDARD", note: "Chaturvimshamsha" },
  D27: { div: 27, ruleStatus: "BPHS_STANDARD", note: "Bhamsha (Nakshatramsha)" },
  D30: { div: 30, ruleStatus: "BPHS_STANDARD", note: "Trimshamsha (malefic ownership)" },
  D40: { div: 40, ruleStatus: "BPHS_STANDARD", note: "Khavedamsha" },
  D45: { div: 45, ruleStatus: "BPHS_STANDARD", note: "Akshavedamsha" },
  D60: { div: 60, ruleStatus: "BPHS_STANDARD", note: "Shashtyamsha" },
};

function vargaSign(lon, varga) {
  const s = signOf(lon);
  const degInSign = norm360(lon) % 30;
  const n = VARGA_DEFS[varga].div;
  let k = Math.floor((degInSign / 30) * n); // part index 0..n-1
  const kind = movFixDual(s); // 0 movable, 1 fixed, 2 dual

  if (varga === "D2") {
    const odd = s % 2 === 0;
    const firstHalf = degInSign < 15;
    // odd sign: Leo then Cancer; even: Cancer then Leo
    return odd ? (firstHalf ? 4 : 3) : firstHalf ? 3 : 4;
  }
  if (varga === "D3") return (s + 4 * k) % 12;

  if (["D9", "D10", "D12", "D16", "D20", "D24", "D27", "D40", "D45", "D60"].includes(varga)) {
    const start = kind === 0 ? s : kind === 1 ? (s + 8) % 12 : (s + 4) % 12;
    if (varga === "D7") throw new Error("unreachable");
    return (start + k) % 12;
  }
  if (varga === "D4") {
    const start = kind === 0 ? s : kind === 1 ? (s + 8) % 12 : (s + 4) % 12;
    return (start + 3 * k) % 12;
  }
  if (varga === "D7") {
    const even = s % 2 === 1;
    const dir = even ? -1 : 1;
    return (s + dir * k + 12 * k) % 12;
  }
  if (varga === "D30") {
    // Trimshamsha: malefic ownership segments (standard table), ruleStatus flagged
    const odd = s % 2 === 0;
    const segs = odd
      ? [[5, "Saturn"], [10, "Venus"], [18, "Mercury"], [24, "Jupiter"], [30, "Mars"]]
      : [[5, "Mars"], [12, "Jupiter"], [20, "Saturn"], [25, "Mercury"], [30, "Venus"]];
    for (const [lim, lord] of segs) if (degInSign <= lim) return SIGN_LORDS.indexOf(lord);
    return s;
  }
  const start = kind === 0 ? s : kind === 1 ? (s + 8) % 12 : (s + 4) % 12;
  return (start + k) % 12;
}

export function calculateVarga(ctx, jd, varga) {
  if (!VARGA_DEFS[varga]) throw new Error(`Unsupported varga: ${varga}. Supported: ${Object.keys(VARGA_DEFS).join(", ")}`);
  const { positions, ayanamsa, engine } = planetaryPositions(ctx, jd);
  const lagna = ascendantSidereal(ctx, jd);
  const placed = positions.map((p) => ({ name: p.name, sign: vargaSign(p.longitude, varga) }));
  const lagnaV = vargaSign(lagna, varga);
  const occupants = Array.from({ length: 12 }, (_, i) => placed.filter((p) => p.sign === i).map((p) => p.name));
  occupants[lagnaV].push("Lagna");
  return {
    varga,
    division: VARGA_DEFS[varga].div,
    ruleStatus: VARGA_DEFS[varga].ruleStatus,
    ruleNote: VARGA_DEFS[varga].note,
    lagnaSign: lagnaV,
    placements: placed,
    signOccupants: occupants,
    vimshopakaBala: { status: "UNVERIFIED", note: "Vimshopaka bala weights per ruleset — weights table to be attached with source citation." },
    audit: { mode: ctx.calculationMode, profile: ctx.profileVersion, ayanamsa: ctx.ayanamsa, rulesetVersion: ctx.rulesetVersion },
  };
}
