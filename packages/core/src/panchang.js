/**
 * panchang.js — Panchang computation for one Panchang day.
 *
 * Panchang day boundary = LOCAL SUNRISE (master spec §5, §6).
 * Every दण्ड–पल value produced or consumed is an END TIME relative to that
 * sunrise. Both source strings (for audit) and normalized timestamps are
 * carried in results.
 */

import { norm360, dateFromJD, jdToISO, pad2 } from "./base.js";
import { positionsFor } from "./ephemeris.js";
import { sunriseSunset, dailyPeriods } from "./solar.js";
import { nextAngleCrossing, jdFromDate } from "./base.js";
import { TraditionalTime, formatDuration } from "./traditionalTime.js";

export const SIGN_NAMES = [
  "Aries (Mesha)", "Taurus (Vrishabha)", "Gemini (Mithuna)", "Cancer (Karka)",
  "Leo (Simha)", "Virgo (Kanya)", "Libra (Tula)", "Scorpio (Vrishchika)",
  "Sagittarius (Dhanu)", "Capricorn (Makara)", "Aquarius (Kumbha)", "Pisces (Meena)",
];

export const NAKSHATRA_NAMES = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
];

export const TITHI_NAMES = [
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi",
  "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
  "Trayodashi", "Chaturdashi", "Purnima", "Pratipada", "Dwitiya", "Tritiya",
  "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami", "Navami",
  "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Amavasya",
];

export const YOGA_NAMES = [
  "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda",
  "Sukarma", "Dhriti", "Shoola", "Ganda", "Vriddhi", "Dhruva",
  "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyan",
  "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla",
  "Brahma", "Indra", "Vaidhriti",
];

const KARANA_NAMES = ["Kimstughna", "Bava", "Balava", "Kaulava", "Taitila", "Garaja", "Vanija", "Vishti"];
const FIXED_KARANAS = ["Shakuni", "Chatushpada", "Naga"];

export const VARA = ["Ravi (Sunday)", "Soma (Monday)", "Mangala (Tuesday)", "Budha (Wednesday)", "Guru (Thursday)", "Shukra (Friday)", "Shani (Saturday)"];

export function moonSunDistance(ctx, jd) {
  const p = positionsFor(ctx, jd).sidereal;
  return norm360(p.Moon - p.Sun);
}

export function tithiAt(ctx, jd) {
  const dist = moonSunDistance(ctx, jd);
  const index = Math.floor(dist / 12); // 0..29
  return {
    index,
    continuousNumber: index + 1,            // 1..30 (Amanta continuous)
    paksha: index < 15 ? "Shukla" : "Krishna",
    pakshaNumber: (index % 15) + 1,         // 1..15 within paksha — as printed by the source Panchang (ASSUMPTION: confirm convention)
    name: TITHI_NAMES[index],
  };
}

export function nakshatraAt(ctx, jd) {
  const { sidereal } = positionsFor(ctx, jd);
  const idx = Math.floor(norm360(sidereal.Moon) / (360 / 27));
  return { index: idx, name: NAKSHATRA_NAMES[idx], pada: Math.floor((norm360(sidereal.Moon) % (360 / 27)) / (360 / 108)) + 1 };
}

export function yogaAt(ctx, jd) {
  const { sidereal } = positionsFor(ctx, jd);
  const sum = norm360(sidereal.Moon + sidereal.Sun);
  return { index: Math.floor(sum / (360 / 27)), name: YOGA_NAMES[Math.floor(sum / (360 / 27))] };
}

export function karanaAt(ctx, jd) {
  const idx = Math.floor(moonSunDistance(ctx, jd) / 6); // 0..59
  if (idx === 0) return { name: KARANA_NAMES[0], type: "FIXED_START" };
  if (idx >= 57) return { name: FIXED_KARANAS[idx - 57], type: "FIXED_END" };
  return { name: KARANA_NAMES[1 + ((idx - 1) % 7)], type: "CHARA" };
}

/** Convert an event JD to a traditional danda–pala string relative to sunrise. */
export function jdToDandaPala(eventJD, sunriseJD) {
  let secs = Math.round((eventJD - sunriseJD) * 86400);
  if (secs >= 86400 - 12) return new TraditionalTime({ danda: 60, pala: 0, raw: "60-00", special: "AHORATRAM" });
  let danda = Math.floor(secs / 1440);
  let pala = Math.round((secs - danda * 1440) / 24);
  if (pala >= 60) { pala = 0; danda += 1; }
  if (danda >= 60) return new TraditionalTime({ danda: 60, pala: 0, raw: "60-00", special: "AHORATRAM" });
  const raw = `${String(danda).padStart(2, "0")}-${String(pala).padStart(2, "0")}`;
  return new TraditionalTime({ danda, pala, raw });
}

/**
 * Full Panchang for the Panchang day whose civil date is ctx.localDate.
 */
export function calculatePanchang(ctx) {
  const [y, m, d] = ctx.localDate.split("-").map(Number);
  const noonJD = jdFromDate(y, m, d, 12 - ctx.tzOffsetHours);
  const ss = sunriseSunset(ctx, noonJD);
  const sunriseJD = ss.rise;
  const sunsetJD = ss.set;
  // Weekday of the LOCAL civil day containing the sunrise (not the UT day).
  const weekday0Sunday = Math.floor(sunriseJD + ctx.tzOffsetHours / 24 + 1.5) % 7;

  const t0 = sunriseJD;
  const tithi0 = tithiAt(ctx, t0);
  const nak0 = nakshatraAt(ctx, t0);
  const yog0 = yogaAt(ctx, t0);
  const kar0 = karanaAt(ctx, t0);

  // Boundary search: next multiple of 12° (tithi), 13°20′ (nakshatra), 13°20′ (yoga sum), 6° (karana)
  const distFn = (jd) => moonSunDistance(ctx, jd);
  const nakFn = (jd) => norm360(positionsFor(ctx, jd).sidereal.Moon);
  const yogFn = (jd) => { const p = positionsFor(ctx, jd).sidereal; return norm360(p.Moon + p.Sun); };

  const tithiEndTarget = (tithi0.index + 1) * 12;
  const tithiEndJD = nextAngleCrossing(distFn, t0, tithiEndTarget >= 360 ? 0 : tithiEndTarget, { stepDays: 0.1, horizonDays: 3 });
  const nakEndJD = nextAngleCrossing(nakFn, t0, (nak0.index + 1) * (360 / 27), { stepDays: 0.05, horizonDays: 3 });
  const yogEndJD = nextAngleCrossing(yogFn, t0, (yog0.index + 1) * (360 / 27), { stepDays: 0.05, horizonDays: 3 });
  const karEndJD = nextAngleCrossing(distFn, t0, (Math.floor(moonSunDistance(ctx, t0) / 6) + 1) * 6, { stepDays: 0.05, horizonDays: 2 });

  const tt = (jd) => jdToDandaPala(jd, sunriseJD);
  const periods = dailyPeriods(ctx, sunriseJD, sunsetJD, weekday0Sunday);

  const clock = (jd) => {
    const dt = dateFromJD(jd + ctx.tzOffsetHours / 24);
    const h = Math.floor(dt.hours);
    const mi = Math.floor((dt.hours - h) * 60);
    const s = Math.round(((dt.hours - h) * 60 - mi) * 60);
    return `${pad2(h)}:${pad2(mi)}:${pad2(s === 60 ? 0 : s)}`;
  };

  return {
    calculationMode: ctx.calculationMode,
    profileVersion: ctx.profileVersion,
    date: ctx.localDate,
    locationReference: {
      type: ctx.locationSource,
      name: ctx.locationName,
      latitude: ctx.latitude,
      longitude: ctx.longitude,
      longitudePrinted: ctx.traditionalLongitudeNotation,
      palbha: ctx.palbha,
    },
    vara: VARA[weekday0Sunday],
    sunrise: clock(sunriseJD),
    sunset: clock(sunsetJD),
    sunriseJD, sunsetJD,
    tithi: {
      ...tithi0,
      eventType: "END",
      sourceDandaPal: tt(tithiEndJD).raw,
      endTimestamp: jdToISO(tithiEndJD, ctx.tzOffsetHours),
      endJD: tithiEndJD,
      endsAfterSunset: tithiEndJD > sunsetJD,
    },
    nakshatra: {
      ...nak0,
      eventType: "END",
      sourceDandaPal: tt(nakEndJD).raw,
      endTimestamp: jdToISO(nakEndJD, ctx.tzOffsetHours),
      endJD: nakEndJD,
    },
    yoga: { ...yog0, eventType: "END", sourceDandaPal: tt(yogEndJD).raw, endTimestamp: jdToISO(yogEndJD, ctx.tzOffsetHours), endJD: yogEndJD },
    karana: { ...kar0, eventType: "END", sourceDandaPal: tt(karEndJD).raw, endTimestamp: jdToISO(karEndJD, ctx.tzOffsetHours), endJD: karEndJD },
    rahuKaal: { start: clock(periods.rahuKaal.start), end: clock(periods.rahuKaal.end) },
    gulika: { start: clock(periods.gulika.start), end: clock(periods.gulika.end) },
    yamaganda: { start: clock(periods.yamaganda.start), end: clock(periods.yamaganda.end) },
    abhijit: { start: clock(periods.abhijit.start), end: clock(periods.abhijit.end) },
    durmuhurtas: periods.durmuhurtas.map((x) => ({ start: clock(x.start), end: clock(x.end) })),
    dayLengthHours: +periods.dayLengthHours.toFixed(3),
    audit: {
      mode: ctx.calculationMode,
      profile: ctx.profileVersion,
      ephemerisSource: ctx.ephemerisSource,
      ayanamsa: ctx.ayanamsa,
      timezone: ctx.timezone,
      rulesetVersion: ctx.rulesetVersion,
    },
  };
}
