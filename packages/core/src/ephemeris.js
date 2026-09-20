/**
 * ephemeris.js — two COMPLETELY ISOLATED astronomy backends (master spec §3).
 *
 *  1) MAKARANDA engine: Surya Siddhanta traditional astronomy.
 *     - Mean longitudes: SS revolutions (traditional periods) ANCHORED at
 *       J2000.0 (documented calibration; replaces the raw Kali-epoch drift
 *       which accumulates tens of degrees over centuries). Versioned as part
 *       of makaranda-v1; to be superseded by verified Makaranda Sarani
 *       tables when supplied.
 *     - True Sun/Moon: mandocca correction with SS epicycle constants.
 *     - Planets: heliocentric SS means (+ manda) reduced to geocentric with
 *       documented radius ratios (SS sighra constants themselves UNVERIFIED).
 *     - Anything not verified is flagged, never invented (spec §2.2).
 *
 *  2) DRIK engine: modern analytical astronomy (upgraded 2026-09-20).
 *     - Sun: Meeus ch.25 series + apparent corrections (nutation + aberration).
 *     - Moon: FULL Meeus ch.47 series (all 60 Table-47.A periodic terms,
 *       cross-verified against astropy's transcription, mismatches = 0)
 *       + additive terms + nutation. ~10" class (Meeus's own claim).
 *     - Nutation: complete IAU-1980 series (63 Δψ + 38 Δε terms).
 *     - ΔT: Espenak–Meeus polynomials; luminaries evaluated at TT.
 *     - Planets: JPL Keplerian elements 1800–2050 + light-time iteration
 *       (arcminute class; adequate for graha placements, not for Panchang).
 *     - Mean lunar node for Rahu/Ketu.
 *     - Certified against PyEphem 4.2.1 (see DRIK_CERT_ANCHORS in golden.js).
 *     - Swiss Ephemeris adapter slot reserved (spec §24).
 *
 * Neither engine may read runtime state from the other. Anchoring constants
 * below are calibration data, not a runtime pipeline mix (spec §3.3).
 */

import { norm360, sinD, cosD, asinD, atan2D } from "./base.js";
import { NUTATION_IAU1980_PSI, NUTATION_IAU1980_EPS, MOON_TERMS_L } from "./meeusTables.js";

export const KALI_EPOCH_JD = 588465.5; // traditional Kali-ahargana epoch (audit reference)
export const SS_YUGA_CIVIL_DAYS = 1577917828;
const J2000 = 2451545.0;

/** Surya Siddhanta revolutions per Mahayuga (4,320,000 years). */
export const SS_REVOLUTIONS = {
  sun: 4320000,
  moon: 57753336,
  mercurySighrocca: 17937000,
  venusSighrocca: 7022388,
  mars: 2296824,
  jupiter: 364224,
  saturn: 146564,
  rahu: 232226, // retrograde
};

/** Mean longitudes (tropical, degrees) at J2000.0 — documented anchors. */
export const SS_ANCHORS_J2000 = {
  sunMean: 280.46646,        // Meeus L0 (geocentric mean Sun)
  moonMean: 218.3164477,     // Meeus L′ (mean Moon)
  mercuryHelio: 252.2503235, // JPL mean elements
  venusHelio: 181.9790995,
  marsHelio: 355.446568,
  jupiterHelio: 34.39644,
  saturnHelio: 49.95424423,
  rahu: 125.0445479,         // mean ascending node
};

/**
 * SS correction parameters (Burgess' Surya Siddhanta where known).
 * Uncertain constants flagged UNVERIFIED; residuals are measured by the
 * golden suite rather than hidden.
 */
export const SS_PARAMS = {
  sunUccha: 77.1667, sunC: 13.8333,   // 13°50′ manda
  moonUccha: 101.0, moonC: 31.5,      // 31°30′ manda
  marsUccha: 130.0, marsC: 73.5,      // 73°30′ manda
  jupiterUccha: 90.0, jupiterC: 32.5, // 32°30′ manda
  saturnUccha: 236.0, saturnC: 38.5,  // 38°30′ manda
  mercuryUccha: 220.0, venusUccha: 80.0,
  radiusRatios: { mercury: 0.3871, venus: 0.7233, mars: 1.5237, jupiter: 5.2026, saturn: 9.5549 },
  flaggedUnverified: [
    "Mean longitudes anchored at J2000 (calibration); Makaranda Sarani epoch corrections pending source tables",
    "Sun mandocca 77°10′ vs 77°17′ sources differ; 77°10′ used",
    "Planetary heliocentric reduction uses circular orbits + documented radius ratios (SS sighra constants UNVERIFIED)",
    "Rahu anchored at J2000 mean node with SS period",
    "Higher-order lunar corrections omitted",
  ],
};

/* ================================================================== */
/* Ayanamsa strategies                                                 */
/* ================================================================== */

const AYANAMSA_ANCHORS = {
  // { degrees at J2000.0, rate deg/year }. Linear model; ±0.01° over 1900–2100.
  LAHIRI: { at2000: 23.853297, rate: 50.29 / 3600, source: "Lahiri (Chitrapakshiya), standard" },
  RAMAN: { at2000: 22.46, rate: 50.29 / 3600, source: "Raman ayanamsa anchor (VERIFY against printed tables)" },
  KRISHNAMURTI: { at2000: 23.9472, rate: 50.29 / 3600, source: "KP ayanamsa anchor (VERIFY)" },
  YUKTESHWAR: { at2000: 20.92, rate: 50.29 / 3600, source: "Yukteshwar anchor (VERIFY)" },
  FAGAN_BRADLEY: { at2000: 24.736, rate: 50.29 / 3600, source: "Fagan/Bradley anchor (VERIFY)" },
};

export function ayanamsaDeg(strategy, jd, { makarandaAnchor2026 = 24.2, makarandaRate = 50.29 / 3600 } = {}) {
  const year = 2000 + (jd - J2000) / 365.25;
  if (strategy === "MAKARANDA_SS" || strategy === "MAKARANDA_V1_CALIBRATED") {
    return makarandaAnchor2026 + makarandaRate * (year - 2026.0);
  }
  const a = AYANAMSA_ANCHORS[strategy];
  if (!a) throw new Error(`Unknown ayanamsa strategy: ${strategy}`);
  return a.at2000 + a.rate * (year - 2000.0);
}

/* ================================================================== */
/* MAKARANDA / Surya Siddhanta engine                                  */
/* ================================================================== */

export function ssAhargana(jd) {
  return jd - KALI_EPOCH_JD; // retained for audit/debug views
}

function revsPerDay(revs) { return revs / SS_YUGA_CIVIL_DAYS; }

/** Anchored SS mean longitude (tropical), traditional period preserved. */
function ssMean(jd, anchor, revs) {
  return norm360(anchor + (jd - J2000) * revsPerDay(revs) * 360);
}

/** SS mean longitudes at jd (tropical frame; ayanamsa subtracted later). */
export function ssMeanLongitudes(jd) {
  const sunMean = ssMean(jd, SS_ANCHORS_J2000.sunMean, SS_REVOLUTIONS.sun);
  return {
    sunMean,
    moonMean: ssMean(jd, SS_ANCHORS_J2000.moonMean, SS_REVOLUTIONS.moon),
    mercuryHelio: ssMean(jd, SS_ANCHORS_J2000.mercuryHelio, SS_REVOLUTIONS.mercurySighrocca),
    venusHelio: ssMean(jd, SS_ANCHORS_J2000.venusHelio, SS_REVOLUTIONS.venusSighrocca),
    marsHelio: ssMean(jd, SS_ANCHORS_J2000.marsHelio, SS_REVOLUTIONS.mars),
    jupiterHelio: ssMean(jd, SS_ANCHORS_J2000.jupiterHelio, SS_REVOLUTIONS.jupiter),
    saturnHelio: ssMean(jd, SS_ANCHORS_J2000.saturnHelio, SS_REVOLUTIONS.saturn),
    earthHelio: norm360(sunMean + 180),
  };
}

const mandaphala = (mean, uccha, C) => asinD((C / 360) * sinD(mean - uccha));

/** Geocentric longitude of a body given heliocentric longitude & radius. */
function helioToGeo(helioLon, radius, earthHelioLon) {
  const px = radius * cosD(helioLon), py = radius * sinD(helioLon);
  const ex = cosD(earthHelioLon), ey = sinD(earthHelioLon);
  return atan2D(py - ey, px - ex);
}

export function ssTrueSidereal(jd, { makarandaAnchor2026 = 24.2 } = {}) {
  const m = ssMeanLongitudes(jd);
  const sun = norm360(m.sunMean + mandaphala(m.sunMean, SS_PARAMS.sunUccha, SS_PARAMS.sunC));
  const moon = norm360(m.moonMean + mandaphala(m.moonMean, SS_PARAMS.moonUccha, SS_PARAMS.moonC));

  const planet = (helioMean, uccha, C, radius) => {
    const corrected = norm360(helioMean + mandaphala(helioMean, uccha, C));
    return helioToGeo(corrected, radius, m.earthHelio);
  };

  const ayan = ayanamsaDeg("MAKARANDA_V1_CALIBRATED", jd, { makarandaAnchor2026 });
  const trop = {
    Sun: sun,
    Moon: moon,
    Mercury: planet(m.mercuryHelio, SS_PARAMS.mercuryUccha, SS_PARAMS.sunC, SS_PARAMS.radiusRatios.mercury),
    Venus: planet(m.venusHelio, SS_PARAMS.venusUccha, SS_PARAMS.sunC, SS_PARAMS.radiusRatios.venus),
    Mars: planet(m.marsHelio, SS_PARAMS.marsUccha, SS_PARAMS.marsC, SS_PARAMS.radiusRatios.mars),
    Jupiter: planet(m.jupiterHelio, SS_PARAMS.jupiterUccha, SS_PARAMS.jupiterC, SS_PARAMS.radiusRatios.jupiter),
    Saturn: planet(m.saturnHelio, SS_PARAMS.saturnUccha, SS_PARAMS.saturnC, SS_PARAMS.radiusRatios.saturn),
  };
  // Rahu: SS period (retrograde), J2000 anchor.
  trop.Rahu = norm360(SS_ANCHORS_J2000.rahu - (jd - J2000) * revsPerDay(SS_REVOLUTIONS.rahu) * 360);
  trop.Ketu = norm360(trop.Rahu + 180);

  const sidereal = {};
  for (const [k, v] of Object.entries(trop)) sidereal[k] = norm360(v - ayan);

  return {
    sidereal,
    tropical: trop,
    mean: m,
    ayanamsa: ayan,
    engine: "MAKARANDA (Surya Siddhanta traditional, built-in, J2000-anchored v1)",
    unverified: SS_PARAMS.flaggedUnverified,
  };
}

/** Sun equatorial coordinates for sunrise (SS frame). */
export function ssSunEquatorial(jd, obliquity = 24.0) {
  const { tropical } = ssTrueSidereal(jd);
  const lam = tropical.Sun;
  const ra = atan2D(cosD(obliquity) * sinD(lam), cosD(lam));
  const dec = asinD(sinD(obliquity) * sinD(lam));
  return { tropLong: lam, ra, dec };
}

/** Retrograde in Makaranda mode: geometric derivative (emerges from model). */
export function ssIsRetrograde(name, jd) {
  if (["Sun", "Moon", "Rahu", "Ketu"].includes(name)) return false;
  const h = 0.5;
  const a = ssTrueSidereal(jd - h).tropical[name];
  const b = ssTrueSidereal(jd + h).tropical[name];
  let d = b - a;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d < 0;
}

/* ================================================================== */
/* DRIK engine — modern analytical astronomy                           */
/* ================================================================== */

/* ---- Delta T: Espenak & Meeus (2006) polynomials ---- */
export function deltaTSec(jdUT) {
  const y = 2000 + (jdUT - J2000) / 365.25;
  if (y >= 2005 && y < 2050) { const t = y - 2000; return 62.92 + 0.32217 * t + 0.005589 * t * t; }
  if (y >= 1986 && y < 2005) { const t = y - 2000; return 63.86 + 0.3345 * t - 0.060374 * t * t + 0.0017275 * t ** 3 + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5; }
  if (y >= 1961 && y < 1986) { const t = y - 1975; return 45.45 + 1.067 * t - (t * t) / 260 - (t ** 3) / 718; }
  if (y >= 2050) { const t = y - 2000; return 62.92 + 0.32217 * t + 0.005589 * t * t; } // extrapolated, flagged
  const t = y - 1975; return 45.45 + 1.067 * t; // pre-1961 coarse fallback (unused by Panchang features)
}

/* ---- Nutation: complete IAU-1980 (Meeus Table 22.A), full series ---- */
export function nutationFull(jdTT) {
  const T = (jdTT - J2000) / 36525;
  const D = norm360(297.85036 + 445267.111480 * T - 0.0019142 * T * T + T ** 3 / 189474);
  const M = norm360(357.52772 + 35999.050340 * T - 0.0001603 * T * T - T ** 3 / 300000);
  const Mp = norm360(134.96298 + 477198.867398 * T + 0.0086972 * T * T + T ** 3 / 56250);
  const F = norm360(93.27191 + 483202.017538 * T - 0.0036825 * T * T + T ** 3 / 327270);
  const Om = norm360(125.04452 - 1934.136261 * T + 0.0020708 * T * T + T ** 3 / 450000);
  let dPsi = 0, dEps = 0;
  for (const [d, m, mp, f, om, a, b] of NUTATION_IAU1980_PSI) dPsi += (a + b * T) * sinD(d * D + m * M + mp * Mp + f * F + om * Om);
  for (const [d, m, mp, f, om, a, b] of NUTATION_IAU1980_EPS) dEps += (a + b * T) * cosD(d * D + m * M + mp * Mp + f * F + om * Om);
  dPsi /= 36000000; dEps /= 36000000; // units of 0.0001 arcsec -> degrees
  const U = T / 100; // Meeus eq. 22.3 (10000-yr validity)
  const eps0 = 23 + 26 / 60 + 21.448 / 3600 +
    (-4680.93 * U - 1.55 * U ** 2 + 1999.25 * U ** 3 - 51.38 * U ** 4 - 249.67 * U ** 5 -
     39.05 * U ** 6 + 7.12 * U ** 7 + 27.87 * U ** 8 + 5.79 * U ** 9 + 2.45 * U ** 10) / 3600;
  return { dPsi, dEps, eps0, eps: eps0 + dEps };
}

/** Legacy single-term nutation in longitude (kept for arcminute-class planets). */
function nutationDeg(jd) {
  const T = (jd - J2000) / 36525;
  const omega = norm360(125.04452 - 1934.136261 * T);
  return (-17.2 / 3600) * sinD(omega);
}

/** Sun APPARENT geocentric longitude: Meeus ch.25 series evaluated at TT,
 *  + nutation in longitude (full IAU-1980) + aberration (Meeus 25.10). */
export function drikSunLongitude(jdUT) {
  const jdTT = jdUT + deltaTSec(jdUT) / 86400;
  const T = (jdTT - J2000) / 36525;
  const L0 = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M = norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * sinD(M) +
    (0.019993 - 0.000101 * T) * sinD(2 * M) +
    0.000289 * sinD(3 * M);
  const lonTrue = norm360(L0 + C);
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
  const R = 1.000001018 * (1 - e * e) / (1 + e * cosD(M + C));
  const { dPsi } = nutationFull(jdTT);
  return norm360(lonTrue + dPsi - 20.4898 / (3600 * R));
}

export function drikSunRA(jd, obliquity = null) {
  const lam = drikSunLongitude(jd);
  const jdTT = jd + deltaTSec(jd) / 86400;
  const T = (jdTT - J2000) / 36525;
  const nut = nutationFull(jdTT);
  // apparent obliquity incl. the 0.00256° cos Ω correction (Meeus ch.25)
  const epsApp = (obliquity ?? nut.eps) + 0.00256 * cosD(norm360(125.04452 - 1934.136261 * T));
  const ra = atan2D(cosD(epsApp) * sinD(lam), cosD(lam));
  const dec = asinD(sinD(epsApp) * sinD(lam));
  return { lon: lam, ra, dec };
}

/** Moon APPARENT geocentric longitude: complete Meeus ch.47 series at TT.
 *  All 60 Table-47.A periodic terms (59 nonzero Σl + the additive terms),
 *  E-factors per eq. 47.6, nutation applied. Accuracy class ~10" (Meeus). */
export function drikMoonLongitude(jdUT) {
  const jdTT = jdUT + deltaTSec(jdUT) / 86400;
  const T = (jdTT - J2000) / 36525;
  const Lp = norm360(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + T ** 3 / 538841 - T ** 4 / 65194000);
  const D = norm360(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + T ** 3 / 545868 - T ** 4 / 113065000);
  const M = norm360(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + T ** 3 / 24490000);
  const Mp = norm360(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + T ** 3 / 69699 - T ** 4 / 14712000);
  const F = norm360(93.2720950 + 483202.0175233 * T - 0.0036539 * T * T - T ** 3 / 3526000 + T ** 4 / 863310000);
  const A1 = norm360(119.75 + 131.849 * T);   // Venus action
  const A2 = norm360(53.09 + 479264.290 * T); // Jupiter action
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;
  let sumL = 0;
  for (const [d, m, mp, f, _om, c, ep] of MOON_TERMS_L) {
    const eFac = ep === 1 ? E : ep === 2 ? E * E : 1;
    sumL += c * eFac * sinD(d * D + m * M + mp * Mp + f * F);
  }
  sumL += 3958 * sinD(A1) + 1962 * sinD(Lp - F) + 318 * sinD(A2);
  const { dPsi } = nutationFull(jdTT);
  return norm360(Lp + sumL / 1e6 + dPsi);
}

/* JPL approximate Keplerian elements (valid 1800–2050), degrees & AU. */
const KEPLER = {
  Mercury: { a: 0.38709927, e: 0.20563593, I: 7.00497902, L: 252.2503235, peri: 77.45779628, node: 48.33076593,
             d: { a: 0.00000037, e: 0.00001906, I: -0.00594749, L: 149472.67411175, peri: 0.16047689, node: -0.12534081 } },
  Venus:   { a: 0.72333566, e: 0.00677672, I: 3.39467605, L: 181.9790995, peri: 131.60246718, node: 76.67984255,
             d: { a: 0.0000039, e: -0.00004107, I: -0.0007889, L: 58517.81538729, peri: 0.00268329, node: -0.27769418 } },
  Earth:   { a: 1.00000261, e: 0.01671123, I: -0.00001531, L: 100.46457166, peri: 102.93768193, node: 0,
             d: { a: 0.00000562, e: -0.00004392, I: -0.01294668, L: 35999.37244981, peri: 0.32327364, node: 0 } },
  Mars:    { a: 1.52371034, e: 0.0933941, I: 1.84969142, L: -4.55343205, peri: -23.94362959, node: 49.55953891,
             d: { a: 0.00001847, e: 0.00007882, I: -0.00813131, L: 19140.30268499, peri: 0.44441088, node: -0.29257343 } },
  Jupiter: { a: 5.202887, e: 0.04838624, I: 1.30439695, L: 34.39644051, peri: 14.72847983, node: 100.47390909,
             d: { a: -0.00011607, e: -0.0001364, I: -0.00183714, L: 3034.74612775, peri: 0.21252668, node: 0.20469106 } },
  Saturn:  { a: 9.53667594, e: 0.05386179, I: 2.48599187, L: 49.95424423, peri: 92.59887831, node: 113.66242448,
             d: { a: -0.0012506, e: -0.00050991, I: 0.00193609, L: 1222.49362201, peri: -0.41897216, node: -0.28867794 } },
};

function heliocentric(name, jd) {
  const T = (jd - J2000) / 36525;
  const el = KEPLER[name];
  const a = el.a + el.d.a * T;
  const e = el.e + el.d.e * T;
  const I = el.I + el.d.I * T;
  const L = el.L + el.d.L * T;
  const peri = el.peri + el.d.peri * T;
  const node = el.node + el.d.node * T;
  const M = norm360(L - peri);
  const w = peri - node;
  let E = M + (180 / Math.PI) * e * sinD(M);
  for (let i = 0; i < 10; i++) {
    const dE = (E - (180 / Math.PI) * e * sinD(E) - M) / (1 - e * cosD(E));
    E -= dE;
    if (Math.abs(dE) < 1e-9) break;
  }
  const xp = a * (cosD(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * sinD(E);
  const cw = cosD(w), sw = sinD(w), cn = cosD(node), sn = sinD(node), ci = cosD(I), si = sinD(I);
  return {
    x: (cw * cn - sw * sn * ci) * xp + (-sw * cn - cw * sn * ci) * yp,
    y: (cw * sn + sw * cn * ci) * xp + (-sw * sn + cw * cn * ci) * yp,
    z: sw * si * xp + cw * si * yp,
  };
}

/** Geocentric ecliptic longitude of a planet, 2-pass light-time. */
export function drikPlanetLongitude(name, jd) {
  let tau = 0;
  let geo = null;
  for (let i = 0; i < 3; i++) {
    const p = heliocentric(name, jd - tau);
    const e = heliocentric("Earth", jd);
    geo = { x: p.x - e.x, y: p.y - e.y, z: p.z - e.z };
    tau = Math.sqrt(geo.x ** 2 + geo.y ** 2 + geo.z ** 2) * 0.0057755183;
  }
  return norm360(atan2D(geo.y, geo.x) + nutationDeg(jd));
}

/** Mean lunar node (Meeus) => Rahu. */
export function drikMeanNode(jd) {
  const T = (jd - J2000) / 36525;
  return norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467410 - (T ** 4) / 85473000);
}

export function drikTrueSidereal(jd, ayanamsaStrategy = "LAHIRI") {
  const ayan = ayanamsaDeg(ayanamsaStrategy, jd);
  const trop = {
    Sun: drikSunLongitude(jd),
    Moon: drikMoonLongitude(jd),
    Mercury: drikPlanetLongitude("Mercury", jd),
    Venus: drikPlanetLongitude("Venus", jd),
    Mars: drikPlanetLongitude("Mars", jd),
    Jupiter: drikPlanetLongitude("Jupiter", jd),
    Saturn: drikPlanetLongitude("Saturn", jd),
    Rahu: drikMeanNode(jd),
  };
  trop.Ketu = norm360(trop.Rahu + 180);
  const sidereal = {};
  for (const [k, v] of Object.entries(trop)) sidereal[k] = norm360(v - ayan);
  return { sidereal, tropical: trop, ayanamsa: ayan, engine: "DRIK (built-in analytical ephemeris)" };
}

export function drikIsRetrograde(name, jd) {
  if (["Sun", "Moon", "Rahu", "Ketu"].includes(name)) return false;
  const h = 0.5;
  const a = drikPlanetLongitude(name, jd - h);
  const b = drikPlanetLongitude(name, jd + h);
  let d = b - a;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d < 0;
}

/**
 * Dispatch for one context. Engines are never mixed inside a pipeline.
 */

/* ------------------------------------------------------------------ */
/* MAKARANDA v2 HYBRID (experimental, UNVERIFIED_HYBRID)                */
/* SS-family framework: modern-anchored means + classical perturbation  */
/* series (equation of centre, evection, variation, annual eq.),        */
/* Makaranda-calibrated ayanamsa + siddhantic sunrise. Fitted offsets   */
/* only (HYBRID_PARAMS). Tracks the printed Panchang within the         */
/* traditional residual band; NOT the authoritative tradition — that    */
/* remains makaranda-v1 → (future) table-driven v2.                     */
/* ------------------------------------------------------------------ */
export const HYBRID_PARAMS = { dM: 0.37, dA: 0, dS: 0 };
export const HYBRID_FIT_META = {
  status: "UNVERIFIED_HYBRID",
  fittedAgainst: "43 high-confidence printed ends (golden rows + sheet 29-07..12-08-2022)",
  note: "Offsets only; perturbation amplitudes are classical constants, never fitted to force match. Fit (scripts/fitHybridOffsets.mjs) determines only the combinations (dM-dA) = +0.37 and (dM-dS) = +0.37; the canonical gauge dA=dS=0 was chosen because it best matches the printed sunrise (hybrid 05:15-05:23 vs printed 05:20-05:28, ~5 min early; the fitted-gauge alternative was 12 min early). Residual band: nak RMS ~130 min, tithi RMS ~160 min, max ~4.1 h near lunar perigee (08-2022, 11-2022) — same order as Drik's band against the sheet.",
};
export function hybridMoonLongitude(jd) {
  // Modern-anchored mean elements (Meeus) + classical perturbation series.
  // The SS traditional revolution counts are deliberately NOT used: they drift
  // ~0.5°/yr against the printed Panchang targets (see docs/MAKARANDA_ENGINE_PLAN.md).
  const T = (jd - J2000) / 36525;
  const Lp = norm360(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + HYBRID_PARAMS.dM);
  const Ls = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T + HYBRID_PARAMS.dS);
  const D = norm360(Lp - Ls);
  const Mm = norm360(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T);
  const Ms = norm360(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T);
  const F = norm360(93.272095 + 483202.0175233 * T - 0.0036539 * T * T);
  const lon =
    6.288775 * sinD(Mm) + 1.274027 * sinD(2 * D - Mm) + 0.658314 * sinD(2 * D) +
    0.213618 * sinD(2 * Mm) - 0.185116 * sinD(Ms) - 0.114332 * sinD(2 * F) +
    0.058793 * sinD(2 * D - 2 * Mm) + 0.057066 * sinD(2 * D - Ms - Mm);
  return norm360(Lp + lon);
}
export function hybridSunLongitude(jd) {
  const T = (jd - J2000) / 36525;
  const Ls = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T + HYBRID_PARAMS.dS);
  const Ms = norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  return norm360(Ls + 1.914602 * sinD(Ms) + 0.019993 * sinD(2 * Ms) + 0.000289 * sinD(3 * Ms));
}
export function hybridTrueSidereal(jd) {
  const ayan = ayanamsaDeg("MAKARANDA_V1_CALIBRATED", jd) + HYBRID_PARAMS.dA;
  const sid = { Moon: norm360(hybridMoonLongitude(jd) - ayan), Sun: norm360(hybridSunLongitude(jd) - ayan) };
  const d = drikTrueSidereal(jd, "LAHIRI");
  for (const k of ["Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"]) sid[k] = d.sidereal[k];
  return { sidereal: sid, ayanamsa: ayan, engine: "MAKARANDA v2 HYBRID (SS framework + classical perturbations, UNVERIFIED_HYBRID)" };
}
export function hybridSunEquatorial(jd, obliquity = 24.0) {
  const lam = hybridSunLongitude(jd);
  const ra = atan2D(cosD(obliquity) * sinD(lam), cosD(lam));
  const dec = asinD(sinD(obliquity) * sinD(lam));
  return { ra, dec };
}

export function positionsFor(ctx, jd) {
  if (ctx.profile?.engine === "HYBRID") return hybridTrueSidereal(jd);
  if (ctx.calculationMode === "MAKARANDA") return ssTrueSidereal(jd);
  return drikTrueSidereal(jd, ctx.ayanamsa);
}
