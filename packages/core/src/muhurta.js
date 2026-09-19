/**
 * muhurta.js — electional window scanning (master spec §14.8).
 * Inherits the selected Panchang calculation profile unless overridden.
 * Rulesets are compendium-derived classical summaries, versioned.
 */

import { jdFromDate, jdToISO } from "./base.js";
import { calculatePanchang, NAKSHATRA_NAMES } from "./panchang.js";

const NAK = NAKSHATRA_NAMES;

export const MUHURTA_RULESETS = {
  marriage: {
    label: "Marriage (Vivaha)",
    goodWeekdays: [1, 3, 4, 5], // Mon Wed Thu Fri
    goodTithis: [2, 3, 5, 7, 10, 11, 13], // paksha numbers
    avoidTithis: [4, 9, 14],
    goodNakshatras: ["Rohini", "Mrigashira", "Magha", "Uttara Phalguni", "Hasta", "Swati", "Anuradha", "Mula", "Uttara Ashadha", "Uttara Bhadrapada", "Revati"],
    notes: "Classical vivaha nakshatra list; Rahu Kaal avoided for the ceremony start.",
  },
  grihaPravesh: {
    label: "Griha Pravesh",
    goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13],
    avoidTithis: [4, 9, 14],
    goodNakshatras: ["Rohini", "Mrigashira", "Chitra", "Hasta", "Swati", "Anuradha", "Uttara Bhadrapada", "Revati"],
    notes: "Fixed/sthira emphasis; avoid Amavasya day entirely.",
  },
  business: {
    label: "Business opening",
    goodWeekdays: [1, 3, 4, 5],
    goodTithis: [1, 2, 3, 5, 7, 10, 11, 13],
    avoidTithis: [4, 9, 14],
    goodNakshatras: ["Ashwini", "Pushya", "Hasta", "Chitra", "Swati", "Shravana", "Dhanishta", "Revati"],
    notes: "Pushya is traditionally exempted from many doshas.",
  },
  travel: {
    label: "Travel (Yatra)",
    goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13],
    avoidTithis: [4, 9, 14],
    goodNakshatras: ["Ashwini", "Mrigashira", "Pushya", "Hasta", "Shravana", "Revati"],
    notes: "Avoid starting during Rahu Kaal.",
  },
  vehicle: {
    label: "Vehicle purchase",
    goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13],
    avoidTithis: [4, 9, 14],
    goodNakshatras: ["Ashwini", "Pushya", "Hasta", "Shravana", "Dhanishta", "Shatabhisha", "Revati"],
    notes: "",
  },
  property: {
    label: "Property dealing",
    goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 10, 11, 13],
    avoidTithis: [4, 9, 14],
    goodNakshatras: ["Rohini", "Pushya", "Hasta", "Chitra", "Swati", "Anuradha", "Revati"],
    notes: "",
  },
  naming: {
    label: "Naming ceremony (Namakarana)",
    goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 12, 13],
    avoidTithis: [4, 9, 14],
    goodNakshatras: ["Ashwini", "Mrigashira", "Punarvasu", "Pushya", "Hasta", "Chitra", "Swati", "Shravana", "Dhanishta", "Shatabhisha", "Revati"],
    notes: "Performed classically on 11th/12th day after birth.",
  },
};

/**
 * Scan [startDate, endDate] (inclusive) for muhurta windows.
 */
export function calculateMuhurta(ctx, { activity, startDate, endDate }) {
  const rs = MUHURTA_RULESETS[activity];
  if (!rs) throw new Error(`Unknown muhurta activity: ${activity}. Supported: ${Object.keys(MUHURTA_RULESETS).join(", ")}`);
  const [y1, m1, d1] = startDate.split("-").map(Number);
  const [y2, m2, d2] = endDate.split("-").map(Number);
  const jd1 = jdFromDate(y1, m1, d1, 12 - ctx.tzOffsetHours);
  const jd2 = jdFromDate(y2, m2, d2, 12 - ctx.tzOffsetHours);
  const days = [];
  for (let jd = jd1; jd <= jd2; jd += 1) {
    const dt = jdToISO(jd, ctx.tzOffsetHours).slice(0, 10);
    let p;
    try { p = calculatePanchang({ ...ctx, localDate: dt }); } catch { continue; }
    const weekday0Sunday = Math.floor(p.sunriseJD + ctx.tzOffsetHours / 24 + 1.5) % 7;
    const reasons = [];
    if (!rs.goodWeekdays.includes(weekday0Sunday)) reasons.push(`weekday (${p.vara}) not preferred`);
    const t = p.tithi.pakshaNumber;
    if (rs.avoidTithis.includes(t)) reasons.push(`tithi ${p.tithi.paksha} ${p.tithi.name} avoided`);
    else if (!rs.goodTithis.includes(t)) reasons.push(`tithi ${p.tithi.paksha} ${p.tithi.name} not in preferred list`);
    if (p.tithi.continuousNumber === 30) reasons.push("Amavasya day");
    if (!rs.goodNakshatras.includes(p.nakshatra.name)) reasons.push(`nakshatra ${p.nakshatra.name} not in preferred list`);
    days.push({
      date: dt,
      vara: p.vara,
      tithi: `${p.tithi.paksha} ${p.tithi.name}`,
      nakshatra: p.nakshatra.name,
      suitable: reasons.length === 0,
      reasons,
      sunrise: p.sunrise,
      rahuKaal: p.rahuKaal,
      abhijit: p.abhijit,
    });
  }
  return {
    activity,
    ruleset: rs,
    calculationMode: ctx.calculationMode,
    profileVersion: ctx.profileVersion,
    days,
    suitableDates: days.filter((d) => d.suitable).map((d) => d.date),
    audit: { mode: ctx.calculationMode, profile: ctx.profileVersion, ayanamsa: ctx.ayanamsa, rulesetVersion: ctx.rulesetVersion },
  };
}
