/**
 * gochar.js — transit analysis: Jupiter, Saturn, Rahu/Ketu; Sade Sati & Dhaiya
 * from natal Moon sign. Calculation method required & propagated (§14.7).
 */

import { norm360, jdFromDate, jdToISO } from "./base.js";
import { positionsFor } from "./ephemeris.js";

export function transitSnapshot(ctx, jd) {
  const { sidereal, engine, ayanamsa } = positionsFor(ctx, jd);
  const sign = (lon) => Math.floor(norm360(lon) / 30);
  return {
    timestamp: jdToISO(jd, ctx.tzOffsetHours),
    Jupiter: { longitude: sidereal.Jupiter, sign: sign(sidereal.Jupiter) },
    Saturn: { longitude: sidereal.Saturn, sign: sign(sidereal.Saturn) },
    Rahu: { longitude: sidereal.Rahu, sign: sign(sidereal.Rahu) },
    Ketu: { longitude: sidereal.Ketu, sign: sign(sidereal.Ketu) },
    engine, ayanamsa,
  };
}

/**
 * Sade Sati / Dhaiya status for a natal Moon sign over a date range.
 */
export function sadeSatiStatus(ctx, natalMoonLon, jd) {
  const moonSign = Math.floor(norm360(natalMoonLon) / 30);
  const snap = transitSnapshot(ctx, jd);
  const s = snap.Saturn.sign;
  const rel = ((s - moonSign) % 12 + 12) % 12;
  const phase =
    rel === 11 ? { active: true, phase: "Sade Sati — 1st phase (Saturn transiting 12th from Moon)" } :
    rel === 0 ? { active: true, phase: "Sade Sati — 2nd phase (Saturn over natal Moon)" } :
    rel === 1 ? { active: true, phase: "Sade Sati — 3rd phase (Saturn transiting 2nd from Moon)" } :
    rel === 3 ? { active: true, phase: "Dhaiya (Ashtama — 8th from Moon)" } :
    rel === 9 ? { active: true, phase: "Dhaiya (Kantaka — 4th from Moon)" } :
    { active: false, phase: "No Sade Sati / Dhaiya" };
  return { ...phase, saturnSign: s, natalMoonSign: moonSign, asOf: snap.timestamp };
}

/** Monthly transit series for a planet across a window. */
export function transitSeries(ctx, planet, jdStart, jdEnd, stepDays = 30) {
  const out = [];
  for (let jd = jdStart; jd <= jdEnd; jd += stepDays) {
    const { sidereal } = positionsFor(ctx, jd);
    const lon = sidereal[planet];
    out.push({ timestamp: jdToISO(jd, ctx.tzOffsetHours), longitude: lon, sign: Math.floor(norm360(lon) / 30) });
  }
  return out;
}

export function calculateTransit(ctx, { natalMoonLon, jd }) {
  return {
    snapshot: transitSnapshot(ctx, jd),
    sadeSati: sadeSatiStatus(ctx, natalMoonLon, jd),
    audit: { mode: ctx.calculationMode, profile: ctx.profileVersion, ayanamsa: ctx.ayanamsa, rulesetVersion: ctx.rulesetVersion },
  };
}
