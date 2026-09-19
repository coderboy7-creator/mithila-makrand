/**
 * annual.js — Varshaphal (annual/solar return) and Prashna (horary).
 * Profile selection propagates (master spec §14.9, §14.10).
 */

import { norm360, jdToISO, bisect, jdFromDate } from "./base.js";
import { positionsFor } from "./ephemeris.js";
import { calculateKundali, SIGN_LORDS } from "./chart.js";

/**
 * Solar return: instant when the (sidereal) Sun returns to natal longitude.
 */
export function solarReturnJD(ctx, natalSunLon, approxJD) {
  const fn = (jd) => {
    const { sidereal } = positionsFor(ctx, jd);
    let d = norm360(sidereal.Sun - natalSunLon);
    if (d > 180) d -= 360;
    return d;
  };
  return bisect(fn, approxJD - 25, approxJD + 25, 0);
}

/** Muntha: progresses 1 sign per completed year from natal lagna. */
export function muntha(natalLagnaSign, completedYears) {
  return (natalLagnaSign + completedYears) % 12;
}

/**
 * Varshaphal: annual chart + Muntha + Mudda dasha seed.
 * `birthDateISO` = natal date (provides birthday month/day),
 * `year` = target solar-return year.
 */
export function calculateVarshaphal(ctx, { birthJD, birthDateISO, birthLon, birthLat, year, natalSunLon, natalLagnaSign }) {
  const [, bm, bdd] = birthDateISO.split("-").map(Number);
  const approxJD = jdFromDate(year, bm, bdd, 12 - ctx.tzOffsetHours);
  const retJD = solarReturnJD(ctx, natalSunLon, approxJD);
  const annual = calculateKundali(ctx, retJD);
  const years = Math.max(0, Math.floor((retJD - birthJD) / 365.25));
  const m = muntha(natalLagnaSign, years);
  const { sidereal } = positionsFor(ctx, retJD);
  const sunMoonDist = norm360(sidereal.Moon - sidereal.Sun);
  return {
    year,
    solarReturnTimestamp: jdToISO(retJD, ctx.tzOffsetHours),
    annualChart: annual,
    muntha: { sign: m, note: "Muntha progresses 1 sign per completed year from natal lagna (standard)." },
    muddaDashaSeed: { sunMoonDistance: sunMoonDist, note: "Mudda dasha seed; full annual timeline flagged for ruleset expansion." },
    tajikYogas: { status: "UNVERIFIED", note: "Tajika ithasala/yamaya/yoga rules pending full ruleset citation (master spec §2.2)." },
    audit: { mode: ctx.calculationMode, profile: ctx.profileVersion, ayanamsa: ctx.ayanamsa, rulesetVersion: ctx.rulesetVersion },
  };
}

/**
 * Prashna (horary): chart for the question moment + classical indicators.
 */
export function calculatePrashna(ctx, jd) {
  const k = calculateKundali(ctx, jd);
  const lagnaSign = k.lagna.sign;
  const lagnaLord = SIGN_LORDS[lagnaSign];
  const lordHouse = k.positions.find((p) => p.name === lagnaLord)?.house;
  return {
    timestamp: jdToISO(jd, ctx.tzOffsetHours),
    chart: k,
    indicators: {
      lagnaAndLord: { lagnaSign, lagnaLord, lagnaLordHouse: lordHouse, note: "Strong lagna and lagna lord favour success of the query (classical)." },
      eleventhHouse: { occupants: k.houseOccupants[10], note: "11th house strength supports fulfilment of desire." },
      tenthHouse: { occupants: k.houseOccupants[9], note: "10th house relates to action and outcome." },
      moonCondition: { nakshatra: k.positions.find((p) => p.name === "Moon").nakshatra, note: "Moon condition is the primary prashna significator (classical)." },
      advancedRules: { status: "UNVERIFIED", note: "Prashna Marga specialised rules (nimitta, ashtakavarga prashna) flagged pending ruleset." },
    },
    audit: { mode: ctx.calculationMode, profile: ctx.profileVersion, ayanamsa: ctx.ayanamsa, rulesetVersion: ctx.rulesetVersion },
  };
}
