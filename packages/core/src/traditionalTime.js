/**
 * traditionalTime.js — दण्ड–पल (danda–pala) traditional time handling.
 *
 * Source interpretation (NON-NEGOTIABLE, per master spec §6):
 *   A दण्ड–पल value printed by the Panchang is the END TIME of that
 *   parameter, relative to the Panchang day's local sunrise.
 *
 *   1 दण्ड / घटी = 24 minutes = 1440 seconds
 *   1 पल           = 24 seconds
 *   elapsedSeconds = danda * 1440 + pal * 24
 *   eventInstant   = sunrise + elapsedSeconds
 *
 * Special values:
 *   "60-00" => Ahoratram: terminal boundary = next day's sunrise
 *              (one full ahoratra after the reference sunrise).
 *
 * Values are parsed as traditional Panchang time values, NEVER as decimal
 * numbers or HH:MM timestamps. Source strings are preserved exactly.
 */

export const DANDA_SECONDS = 1440; // 24 minutes
export const PALA_SECONDS = 24;    // 24 seconds

export class TraditionalTime {
  constructor({ danda, pala, raw, special = null, sourceText = null }) {
    this.danda = danda;
    this.pala = pala;
    this.raw = raw;                 // exact source string, never mutated
    this.special = special;         // e.g. "AHORATRAM"
    this.sourceText = sourceText ?? raw;
    Object.freeze(this);
  }

  get isAhoratram() { return this.special === "AHORATRAM"; }

  /** Duration in seconds (full internal precision). */
  toSeconds() {
    return this.danda * DANDA_SECONDS + this.pala * PALA_SECONDS;
  }

  /** Duration as {h, m, s}. */
  toHMS() {
    const t = this.toSeconds();
    return { h: Math.floor(t / 3600), m: Math.floor((t % 3600) / 60), s: Math.round(t % 60) };
  }

  /**
   * Absolute event instant (Julian Day) given the Panchang-day sunrise JD.
   * Ahoratram => exactly one full day after sunrise (next sunrise proxy).
   */
  eventJD(sunriseJD) {
    if (this.isAhoratram) return sunriseJD + 1;
    return sunriseJD + this.toSeconds() / 86400;
  }

  toJSON() {
    return {
      sourceTraditionalValue: this.raw,
      danda: this.danda,
      pala: this.pala,
      special: this.special,
      normalizedDurationSeconds: this.toSeconds(),
    };
  }
}

/**
 * Parse a traditional danda–pala string as printed in the source Panchang.
 * Accepts "52-16", "03-44", "03:4", "60-00". Never treats input as HH:MM.
 * @returns {TraditionalTime}
 */
export function parseDandaPala(raw) {
  if (raw == null) throw new Error("parseDandaPala: empty source value");
  const s = String(raw).trim();
  const m = s.match(/^(\d{1,2})\s*[-:|]\s*(\d{1,2})$/);
  if (!m) throw new Error(`parseDandaPala: cannot parse traditional value "${s}"`);
  const danda = parseInt(m[1], 10);
  const pala = parseInt(m[2], 10);
  if (pala > 59) throw new Error(`parseDandaPala: pala out of range in "${s}"`);
  const special = danda === 60 && pala === 0 ? "AHORATRAM" : null;
  if (danda > 60) throw new Error(`parseDandaPala: danda out of range in "${s}"`);
  return new TraditionalTime({ danda, pala, raw: s, special });
}

/**
 * Parse the Panchang's printed clock-style source value, e.g.
 * "02:08 Night", "06:44 Day", "03:4 Day", "Ahoratram".
 * Preserved verbatim; phase words are kept as traditional terminology.
 */
export function parseSourceClock(raw) {
  const s = String(raw ?? "").trim();
  if (/ahoratram/i.test(s)) return { raw: s, special: "AHORATRAM" };
  const m = s.match(/^(\d{1,2})[:.](\d{1,2})\s*(Day|Night|Evening|Morning)?$/i);
  if (!m) return { raw: s, special: null };
  return {
    raw: s,
    hh: parseInt(m[1], 10),
    mm: parseInt(m[2], 10),
    phase: m[3] ? m[3][0].toUpperCase() + m[3].slice(1).toLowerCase() : null,
    special: null,
  };
}

/** Format a duration in seconds as HH:MM:SS. */
export function formatDuration(totalSeconds) {
  const t = Math.round(totalSeconds);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const p = (n) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)}`;
}

/**
 * Display wording for a sunrise-relative event that may cross civil midnight.
 * Never resets the elapsed timer at midnight (master spec §6.3).
 */
export function describeSunriseRelative(sunriseJD, eventJD, tzOffsetHours = 5.5) {
  const dtDays = (eventJD - sunriseJD) * 24 * 3600; // seconds since sunrise
  return {
    secondsAfterSunrise: Math.round(dtDays),
    traditional: formatDuration(dtDays),
    crossesMidnight: dtDays > 24 * 3600 * 0.75, // heuristic flag for display only
  };
}
