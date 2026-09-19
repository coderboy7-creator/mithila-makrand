/**
 * solar.js — sunrise/sunset and derived daily periods.
 *
 * Two isolated models:
 *  - SIDDHANTIC_CENTER: sun centre at horizon, no refraction (Makaranda).
 *  - MODERN_REFRACTION: h0 = -0.833° (Drik).
 *
 * Rahu Kaal / Gulika / Yamaganda / Abhijit / Durmuhurta are derived from the
 * sunrise–sunset span (15 muhurtas / 8 parts per day).
 */

import { sinD, cosD, tanD, acosD, norm360, gmst, atan2D, asinD } from "./base.js";
import { drikSunRA, ssSunEquatorial, hybridSunEquatorial } from "./ephemeris.js";

function sunEquatorial(ctx, jd) {
  if (ctx.profile?.engine === "HYBRID") return hybridSunEquatorial(jd, ctx.profile.obliquity);
  if (ctx.calculationMode === "MAKARANDA") return ssSunEquatorial(jd, ctx.profile.obliquity);
  return drikSunRA(jd, ctx.profile.obliquity);
}

/**
 * Sunrise/sunset as Julian Days. Iterates twice on declination.
 * Returns { sunriseJD, sunsetJD } in the local civil day containing jdNoon.
 */
export function sunriseSunset(ctx, jdNoon, { model = null } = {}) {
  const modelToUse = model ?? ctx.profile.sunriseModel;
  const phi = ctx.latitude;
  const lon = ctx.longitude;
  const h0 = modelToUse === "MODERN_REFRACTION" ? -0.833 : 0.0;

  const compute = (jdGuess) => {
    const { ra, dec } = sunEquatorial(ctx, jdGuess);
    // Local apparent solar noon: when local hour angle of sun = 0
    // LST = GMST + lon => noonJD solves GMST(jd) + lon ≈ ra
    let noon = jdGuess;
    for (let i = 0; i < 3; i++) {
      const g = norm360(gmst(noon) + lon);
      let diff = ra - g;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      noon += diff / 360.98564736629;
    }
    const cosH = (sinD(h0) - sinD(phi) * sinD(dec)) / (cosD(phi) * cosD(dec));
    if (cosH < -1) return { rise: noon, set: noon, polar: "MIDNIGHT_SUN" };
    if (cosH > 1) return { rise: null, set: null, polar: "POLAR_NIGHT" };
    const Hd = acosD(cosH) / 360; // degrees -> fraction of day
    return { rise: noon - Hd, set: noon + Hd, polar: null };
  };

  let r = compute(jdNoon);
  if (r.polar === "POLAR_NIGHT" || r.rise == null) return r;
  r = compute((r.rise + r.set) / 2);
  const fine = compute((r.rise + r.set) / 2);
  return fine;
}

/** Find the sunrise that starts the Panchang day containing civil date of jdNoon. */
export function sunriseOfCivilDay(ctx, jdNoon) {
  const { rise } = sunriseSunset(ctx, jdNoon);
  return rise;
}

/** Ascendant (Lagna) from sidereal time. Both engines; obliquity per profile. */
export function ascendant(ctx, jd) {
  const eps = ctx.profile.obliquity;
  const ramc = norm360(gmst(jd) + ctx.longitude); // tropical RAMC
  const ascTrop = atan2D(cosD(ramc), -(sinD(ramc) * cosD(eps) + tanD(ctx.latitude) * sinD(eps)));
  return { ramc, ascTropical: ascTrop };
}

/* ---------------- daily periods ---------------- */

const RAHU_KAAL_PART = { 0: 8, 1: 2, 2: 7, 3: 5, 4: 6, 5: 4, 6: 3 }; // 0=Sunday..6=Saturday
const YAMAGANDA_PART = { 0: 5, 1: 4, 2: 3, 3: 2, 4: 1, 5: 7, 6: 6 };
const GULIKA_PART = { 0: 6, 1: 5, 2: 4, 3: 3, 4: 2, 5: 1, 6: 7 };
/** Durmuhurta: weekday -> muhurta indices (1..15) of the day (compendium-derived; classical-v1). */
const DURMUHURTA = { 0: [4], 1: [5], 2: [3], 3: [2, 14], 4: [12], 5: [9], 6: [7, 1] };

export function dailyPeriods(ctx, sunriseJD, sunsetJD, weekday0Sunday) {
  const span = sunsetJD - sunriseJD;
  const part = (n) => ({ start: sunriseJD + ((n - 1) * span) / 8, end: sunriseJD + (n * span) / 8 });
  const muhurta = (n) => ({ start: sunriseJD + ((n - 1) * span) / 15, end: sunriseJD + (n * span) / 15 });
  const noonJD = (sunriseJD + sunsetJD) / 2;
  return {
    rahuKaal: part(RAHU_KAAL_PART[weekday0Sunday]),
    gulika: part(GULIKA_PART[weekday0Sunday]),
    yamaganda: part(YAMAGANDA_PART[weekday0Sunday]),
    abhijit: { start: noonJD - 24 / 1440, end: noonJD + 24 / 1440 },
    durmuhurtas: DURMUHURTA[weekday0Sunday].map(muhurta),
    dayLengthHours: span * 24,
  };
}
