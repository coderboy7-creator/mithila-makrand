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
 *       + additive terms + nutation, incl. latitude & distance (47.B/Σr).
 *       ~10" class (Meeus's own claim).
 *     - Nutation: complete IAU-1980 series (63 Δψ + 38 Δε terms).
 *     - ΔT: Espenak–Meeus polynomials; luminaries evaluated at TT.
 *     - Planets: FULL VSOP87D (Bretagnon & Francou 1988) from CDS VI/81,
 *       truncated at 2e-8 rad (below the theory's precision floor) +
 *       light-time iteration + annual aberration + full nutation.
 *       Sub-arcsecond vs PyEphem 4.2.1 (PLANET_CERT_ANCHORS).
 *     - Rahu/Ketu: TRUE osculating lunar node (plane of the Moon at t±ε);
 *       certified vs PyEphem node-crossing interpolation (RAHU_CERT_ANCHORS).
 *     - Certified against PyEphem 4.2.1 (see DRIK_CERT_ANCHORS in golden.js).
 *     - Swiss Ephemeris adapter slot reserved (spec §24).
 *
 * Neither engine may read runtime state from the other. Anchoring constants
 * below are calibration data, not a runtime pipeline mix (spec §3.3).
 */

import { norm360, sinD, cosD, asinD, atan2D } from "./base.js";
import { NUTATION_IAU1980_PSI, NUTATION_IAU1980_EPS, MOON_TERMS_L, MOON_TERMS_R, MOON_TERMS_B } from "./meeusTables.js";
import { VSOP87 } from "./vsopTables.js";

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

/** Legacy single-term nutation — no longer used by any pipeline (kept only
 *  until a full audit confirms zero references). */
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

/** Full Meeus ch.47 lunar series at TT: returns λ, β, Δ (Meeus 47.1–47.5).
 *  All Table-47.A/47.B periodic terms + additive terms, E-factors per 47.6.
 *  Accuracy class ~10" (Meeus's own claim). */
function drikMoonSeries(jdTT) {
  const T = (jdTT - J2000) / 36525;
  const Lp = norm360(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + T ** 3 / 538841 - T ** 4 / 65194000);
  const D = norm360(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + T ** 3 / 545868 - T ** 4 / 113065000);
  const M = norm360(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + T ** 3 / 24490000);
  const Mp = norm360(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + T ** 3 / 69699 - T ** 4 / 14712000);
  const F = norm360(93.2720950 + 483202.0175233 * T - 0.0036539 * T * T - T ** 3 / 3526000 + T ** 4 / 863310000);
  const A1 = norm360(119.75 + 131.849 * T);   // Venus action
  const A2 = norm360(53.09 + 479264.290 * T); // Jupiter action
  const A3 = norm360(313.45 + 481266.484 * T); // node passage
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;
  let sumL = 0, sumR = 0, sumB = 0;
  for (const [d, m, mp, f, _om, c, ep] of MOON_TERMS_L) {
    const eFac = ep === 1 ? E : ep === 2 ? E * E : 1;
    sumL += c * eFac * sinD(d * D + m * M + mp * Mp + f * F);
  }
  for (const [d, m, mp, f, _om, c, ep] of MOON_TERMS_R) {
    const eFac = ep === 1 ? E : ep === 2 ? E * E : 1;
    sumR += c * eFac * cosD(d * D + m * M + mp * Mp + f * F);
  }
  for (const [d, m, mp, f, _om, c, ep] of MOON_TERMS_B) {
    const eFac = ep === 1 ? E : ep === 2 ? E * E : 1;
    sumB += c * eFac * sinD(d * D + m * M + mp * Mp + f * F);
  }
  sumL += 3958 * sinD(A1) + 1962 * sinD(Lp - F) + 318 * sinD(A2);
  sumB += -2235 * sinD(Lp) + 382 * sinD(A3) + 175 * sinD(A1 - F) +
          175 * sinD(A1 + F) + 127 * sinD(Lp - Mp) - 115 * sinD(Lp + Mp);
  return { Lp, sumL, sumR, sumB, jdTT };
}

/** Moon APPARENT geocentric state: ecliptic longitude & latitude in the
 *  TRUE ecliptic of date (full nutation via nutateEcliptic), distance in km. */
export function drikMoonState(jdUT) {
  const jdTT = jdUT + deltaTSec(jdUT) / 86400;
  const { Lp, sumL, sumR, sumB } = drikMoonSeries(jdTT);
  const nut = nutationFull(jdTT);
  const { lam, bet } = nutateEcliptic(norm360(Lp + sumL / 1e6), sumB / 1e6, nut);
  return { lam, bet, distKm: 385000.56 + sumR / 1000 };
}

/** Moon APPARENT geocentric longitude (kept for hot-path callers). */
export function drikMoonLongitude(jdUT) {
  return drikMoonState(jdUT).lam;
}

/** Moon geocentric CARTESIAN vector (ecliptic of date, arbitrary scale=km). */
function moonCartesian(jdUT) {
  const { lam, bet, distKm } = drikMoonState(jdUT);
  const cb = cosD(bet);
  return [distKm * cb * cosD(lam), distKm * cb * sinD(lam), distKm * sinD(bet)];
}

/**
 * TRUE lunar node (Rahu): ascending node of the osculating lunar orbit.
 * The node of the plane through the Moon at t±ε converges to the osculating
 * node as ε→0; ε = 0.02 d makes the O(ε²) plane-curvature error < 0.0001°
 * while staying far above numerical noise (~7" moon position accuracy).
 * Frame: apparent ecliptic of date (consistent with the charted Moon).
 */
export function drikTrueNode(jdUT) {
  const eps = 0.02;
  const r1 = moonCartesian(jdUT - eps);
  const r2 = moonCartesian(jdUT + eps);
  const n = [ // r1 × r2 ∝ angular momentum (prograde ⇒ +z component)
    r1[1] * r2[2] - r1[2] * r2[1],
    r1[2] * r2[0] - r1[0] * r2[2],
    r1[0] * r2[1] - r1[1] * r2[0],
  ];
  // ascending node vector = ẑ × n ⇒ Ω = atan2(n.x, -n.y)
  return norm360(atan2D(n[0], -n[1]));
}

/* ---- Planets: VSOP87D (Bretagnon & Francou 1988), full series from     */
/* CDS VI/81 truncated at 2e-8 rad (= 0.004", below the theory's own      */
/* precision floor for every body). Frame: mean ecliptic & equinox OF     */
/* DATE (precession built into the series). T in thousands of Julian      */
/* years from J2000 (TT): T = (JD - 2451545) / 365250.                    */
const AU_PER_DAY_C = 173.1446327;   // speed of light, au/day (= 86400/499.00478)
const LIGHTTIME_DAYS_PER_AU = 0.0057755183;

function vsopSeriesSum(flat, t) {
  let s = 0;
  for (let i = 0; i < flat.length; i += 3) s += flat[i] * Math.cos(flat[i + 1] + flat[i + 2] * t);
  return s;
}

/** Heliocentric rectangular position (au), ecliptic of date. */
export function vsopHeliocentricXYZ(name, t) {
  const body = VSOP87[name];
  const val = {};
  for (const v of ["L", "B", "R"]) {
    let x = vsopSeriesSum(body[v].terms, t);
    if (body[v].poisson) for (const k in body[v].poisson) x += vsopSeriesSum(body[v].poisson[k], t) * t ** Number(k);
    val[v] = x;
  }
  const cb = Math.cos(val.B);
  return [val.R * cb * Math.cos(val.L), val.R * cb * Math.sin(val.L), val.R * Math.sin(val.B)];
}

/** Nutation of an ecliptic-of-date direction to the TRUE ecliptic of date.
 *  Exact small rotations, applied in the ecliptic frame: nutation in
 *  longitude = Rz(Δψ) about the ecliptic pole (true equinox), then the
 *  obliquity change = tilt of the ecliptic plane about the equinox line.
 *  Sign of the Δε tilt locked by PLANET_CERT_ANCHORS (β residuals < 1"). */
export const NUTATION_ECLIPTIC_QSIGN = 1; // chosen by certification sweep
function nutateEcliptic(lamDeg, betDeg, { dPsi, dEps }) {
  const l = (lamDeg * Math.PI) / 180, b = (betDeg * Math.PI) / 180;
  const p = (dPsi * Math.PI) / 180, q = NUTATION_ECLIPTIC_QSIGN * (dEps * Math.PI) / 180;
  const x0 = Math.cos(b) * Math.cos(l), y0 = Math.cos(b) * Math.sin(l), z0 = Math.sin(b);
  // Rz(p): mean equinox -> true equinox (about the ecliptic pole)
  const x1 = Math.cos(p) * x0 - Math.sin(p) * y0;
  const y1 = Math.sin(p) * x0 + Math.cos(p) * y0;
  // Rx(q): tilt of the true ecliptic plane about the equinox line
  const y2 = Math.cos(q) * y1 - Math.sin(q) * z0;
  const z2 = Math.sin(q) * y1 + Math.cos(q) * z0;
  return {
    lam: norm360((Math.atan2(y2, x1) * 180) / Math.PI),
    bet: (Math.asin(Math.max(-1, Math.min(1, z2))) * 180) / Math.PI,
  };
}

/** Planet APPARENT geocentric ecliptic (of date): VSOP87D + 4-pass
 *  light-time + annual aberration (Earth velocity by central difference)
 *  + full IAU-1980 nutation. Sub-arcsecond vs PyEphem (see PLANET_CERT). */
export function drikPlanetApparent(name, jdUT) {
  const jdTT = jdUT + deltaTSec(jdUT) / 86400;
  const t0 = (jdTT - J2000) / 365250;
  const rE = vsopHeliocentricXYZ("earth", t0);
  let rho = null, dist = 0, tau = 0;
  for (let i = 0; i < 4; i++) {
    const rP = vsopHeliocentricXYZ(name.toLowerCase(), t0 - tau / 365250);
    rho = [rP[0] - rE[0], rP[1] - rE[1], rP[2] - rE[2]];
    dist = Math.hypot(rho[0], rho[1], rho[2]);
    tau = dist * LIGHTTIME_DAYS_PER_AU;
  }
  // annual aberration from Earth's barycentric velocity (au/day)
  const h = 0.5;
  const e1 = vsopHeliocentricXYZ("earth", (jdTT - h - J2000) / 365250);
  const e2 = vsopHeliocentricXYZ("earth", (jdTT + h - J2000) / 365250);
  const vE = [(e2[0] - e1[0]) / (2 * h), (e2[1] - e1[1]) / (2 * h), (e2[2] - e1[2]) / (2 * h)];
  const s = rho.map((x) => x / dist);
  const vd = s[0] * vE[0] + s[1] * vE[1] + s[2] * vE[2];
  const sa = s.map((si, i) => si + (vE[i] - vd * si) / AU_PER_DAY_C);
  const lam0 = norm360((Math.atan2(sa[1], sa[0]) * 180) / Math.PI);
  const bet0 = (Math.asin(Math.max(-1, Math.min(1, sa[2]))) * 180) / Math.PI;
  const nut = nutationFull(jdTT);
  const { lam, bet } = nutateEcliptic(lam0, bet0, nut);
  return { lam, bet, distAU: dist };
}

/** Geocentric APPARENT ecliptic longitude of a planet (of date). */
export function drikPlanetLongitude(name, jd) {
  return drikPlanetApparent(name, jd).lam;
}

/** Mean lunar node (Meeus) — retained for diagnostics/comparison only. */
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
    Rahu: drikTrueNode(jd), // TRUE osculating node (certified vs PyEphem)
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
