/**
 * base.js — math, angle, and Julian-date utilities.
 * Deterministic. No hidden mutable global state.
 */

export const norm360 = (x) => ((x % 360) + 360) % 360;
export const norm12 = (x) => ((x % 12) + 12) % 12;

const D2R = Math.PI / 180;
export const sinD = (x) => Math.sin(x * D2R);
export const cosD = (x) => Math.cos(x * D2R);
export const tanD = (x) => Math.tan(x * D2R);
export const asinD = (x) => Math.asin(Math.max(-1, Math.min(1, x))) / D2R;
export const acosD = (x) => Math.acos(Math.max(-1, Math.min(1, x))) / D2R;
export const atan2D = (y, x) => norm360(Math.atan2(y, x) / D2R);

export function dmsToDeg(d, m = 0, s = 0, sign = 1) {
  return sign * (Math.abs(d) + m / 60 + s / 3600);
}

export function degToDms(deg) {
  const sign = deg < 0 ? -1 : 1;
  const a = Math.abs(deg);
  const d = Math.floor(a);
  const mm = (a - d) * 60;
  const m = Math.floor(mm);
  const s = Math.round((mm - m) * 60 * 100) / 100;
  return { sign, d, m, s };
}

export function fmtDeg(deg, dp = 4) {
  return `${deg.toFixed(dp)}°`;
}

export function fmtDMS(deg, { signLabels } = {}) {
  const { sign, d, m, s } = degToDms(deg);
  const ss = s.toFixed(0).padStart(2, "0");
  return `${sign < 0 && signLabels ? signLabels[1] : ""}${d}°${String(m).padStart(2, "0")}′${ss}″${sign < 0 && !signLabels ? "-" : ""}`;
}

export function fmtDegInSign(deg) {
  const { d, m, s } = degToDms(norm360(deg));
  return `${d}°${String(m).padStart(2, "0")}′${String(Math.floor(s)).padStart(2, "0")}″`;
}

export const pad2 = (n) => String(n).padStart(2, "0");

export function fmtClock(hoursFloat) {
  // hoursFloat may exceed 24 (sunrise-relative traditional display)
  const h = Math.floor(hoursFloat);
  const mm = Math.floor((hoursFloat - h) * 60);
  const ss = Math.round(((hoursFloat - h) * 60 - mm) * 60);
  return `${pad2(h % 60)}:${pad2(mm)}:${pad2(ss === 60 ? 0 : ss)}`;
}

/* ---------------- Julian Day ---------------- */

/** Julian Day from Gregorian calendar date + decimal UT hours. */
export function jdFromDate(y, m, d, utHours = 0) {
  let Y = y, M = m;
  if (M <= 2) { Y -= 1; M += 12; }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (Y + 4716)) +
    Math.floor(30.6001 * (M + 1)) +
    d + B - 1524.5 + utHours / 24
  );
}

/** Inverse: JD -> { y, m, d, hours } with decimal UT hours. */
export function dateFromJD(jd) {
  const z = Math.floor(jd + 0.5);
  const f = jd + 0.5 - z;
  let A = z;
  if (z >= 2299161) {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    A = z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const day = B - D - Math.floor(30.6001 * E);
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;
  return { y: year, m: month, d: day, hours: f * 24 };
}

export function jdToISO(jd, tzOffsetHours = 5.5) {
  const x = jd + 0.5 + tzOffsetHours / 24; // local civil-day index + fraction
  let dayIndex = Math.floor(x);
  let secs = Math.round((x - dayIndex) * 86400);
  if (secs >= 86400) { secs -= 86400; dayIndex += 1; }
  const { y, m, d } = dateFromJD(dayIndex);
  const h = Math.floor(secs / 3600);
  const mi = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const off = tzOffsetHours >= 0 ? "+" : "-";
  const oh = pad2(Math.floor(Math.abs(tzOffsetHours)));
  const om = pad2(Math.round((Math.abs(tzOffsetHours) % 1) * 60));
  return `${y}-${pad2(m)}-${pad2(d)}T${pad2(h)}:${pad2(mi)}:${pad2(s)}${off}${oh}:${om}`;
}

export function parseLocalToJD(dateStr, timeStr, tzOffsetHours = 5.5) {
  const [y, m, d] = dateStr.split("-").map(Number);
  let hh = 0, mi = 0, ss = 0;
  if (timeStr) {
    const p = timeStr.split(":").map(Number);
    hh = p[0] || 0; mi = p[1] || 0; ss = p[2] || 0;
  }
  const utHours = hh + mi / 60 + ss / 3600 - tzOffsetHours;
  return jdFromDate(y, m, d, utHours);
}

/** Greenwich mean sidereal time in degrees (IAU-1982 style, adequate to arcseconds). */
export function gmst(jd) {
  const T = (jd - 2451545.0) / 36525;
  return norm360(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T);
}

/* ---------------- root finding ---------------- */

/**
 * Find t in [t0, t1] where (f(t) - target) crosses zero (monotone segment).
 * Bisection, ~1 second precision by default.
 */
export function bisect(f, t0, t1, target = 0, tol = 1 / 86400) {
  let a = t0, b = t1;
  let fa = f(a) - target, fb = f(b) - target;
  if (fa === 0) return a;
  if (fb === 0) return b;
  if (fa * fb > 0) return null;
  for (let i = 0; i < 60; i++) {
    const m = (a + b) / 2;
    const fm = f(m) - target;
    if (Math.abs(b - a) < tol || fm === 0) return m;
    if (fa * fm < 0) { b = m; fb = fm; } else { a = m; fa = fm; }
  }
  return (a + b) / 2;
}

/**
 * Find the next instant after jdStart at which a monotonically increasing,
 * wrapping angle function `angle(jd)` (deg, 0..360) reaches `target` (deg).
 * Scans in `stepDays` then refines with bisection on an unwrapped function.
 */
export function nextAngleCrossing(angle, jdStart, target, { stepDays = 0.25, horizonDays = 32 } = {}) {
  const t = norm360(target);
  const unwrap = (jd) => {
    let a = norm360(angle(jd)) - t;
    if (a < -180) a += 360;
    if (a > 180) a -= 360;
    return a;
  };
  let prev = jdStart;
  let pv = unwrap(prev);
  for (let jd = jdStart + stepDays; jd <= jdStart + horizonDays; jd += stepDays) {
    const v = unwrap(jd);
    if (pv <= 0 && v > 0) {
      return bisect(unwrap, prev, jd, 0);
    }
    prev = jd; pv = v;
  }
  return null;
}

export function deepFreeze(o) {
  if (o && typeof o === "object" && !Object.isFrozen(o)) {
    Object.values(o).forEach(deepFreeze);
    Object.freeze(o);
  }
  return o;
}

export const IST_OFFSET_H = 5.5;
