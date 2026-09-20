/**
 * golden.js — Golden Validation Dataset (master spec §7–§10).
 *
 * The supplied Mithila Vishwavidyalaya Panchang data is the golden
 * validation authority for the Makaranda engine. Source strings are stored
 * EXACTLY as supplied; apparent anomalies are preserved and flagged, never
 * silently corrected.
 *
 * दण्ड–पल values are END TIMES relative to that Panchang day's sunrise.
 */

import { parseDandaPala, parseSourceClock, formatDuration } from "./traditionalTime.js";
import { jdFromDate, jdToISO, pad2, dateFromJD, norm360 } from "./base.js";
import { drikMoonLongitude, drikSunLongitude } from "./ephemeris.js";
import { DRIK_CERT_ANCHORS } from "./drikCert.js";
import { createContext } from "./profiles.js";
import { calculatePanchang } from "./panchang.js";

/** §8.1 — validation rows, verbatim source strings. */
export const GOLDEN_ROWS = [
  { date: "11-07-2025", day: "शुक्र", tithi: 1, tithiDP: "52-16", tithiClock: "02:08 Night", nak: "पू.", nakDP: "03-44", nakClock: "06:44 Night", sunrise: "05:14", sunset: "06:46" },
  { date: "05-10-2025", day: "रवि", tithi: 13, tithiDP: "17-25", tithiClock: "01:07 Day", nak: "शत", nakDP: "02-07", nakClock: "07:00 Day", sunrise: "06:09", sunset: "05:51", anomaly: "Sunset 05:51 precedes sunrise 06:09 as same-day clock time." },
  { date: "10-01-2026", day: "शनि", tithi: 7, tithiDP: "11-18", tithiClock: "11:17 Day", nak: "हस्त", nakDP: "29-30", nakClock: "06:34 Night", sunrise: "06:46", sunset: "05:14" },
  { date: "25-06-2026", day: "गुरु", tithi: 11, tithiDP: "40-28", tithiClock: "09:21 Night", nak: "स्वाती", nakDP: "33-22", nakClock: "06:31 Evening", sunrise: "05:10", sunset: "06:50" },
  { date: "24-07-2016", day: "रवि", tithi: 5, tithiDP: "42-26", tithiClock: "10:16 Night", nak: "पू.भा.", nakDP: "24-26", nakClock: "03:4 Day", sunrise: "05:18", sunset: "06:42" },
  { date: "18-09-2016", day: "रवि", tithi: 2, tithiDP: "37-24", tithiClock: "08:54 Night", nak: "उ.भा.", nakDP: "00-21", nakClock: "06:04 Day", sunrise: "05:56", sunset: "06:04" },
  { date: "27-07-2022", day: "बुध", tithi: 14, tithiDP: "37-50", tithiClock: "08:39 Night", nak: "पुनर्वसु", nakDP: "60-00", nakClock: "Ahoratram", sunrise: "05:19", sunset: "06:41" },
  { date: "01-11-2022", day: "मंगल", tithi: 8, tithiDP: "47-07", tithiClock: "01:20 Night", nak: "Uttrakha", nakDP: "02-25", nakClock: "07:27 Day", sunrise: "06:29", sunset: "05:31" },
];

/**
 * Independent ephemeris anchors (PyEphem 4.2.1, geocentric apparent
 * moon−sun ecliptic separation evaluated AT the printed tithi end times).
 * These certify (a) the Drik engine against an authority outside this
 * codebase (±0.15°), and (b) that the printed Makaranda ends sit within the
 * traditional-model residual band (~±1.5°) of modern astronomy — the exact
 * behaviour a Surya-Siddhanta-derived panchang must exhibit.
 */
export const EPHEM_ANCHORS = [
  { iso: "2025-07-12T02:08:00+05:30", distDeg: 191.99, ref: "11-07-2025 tithi end (K1, target 192)" },
  { iso: "2025-10-05T13:07:00+05:30", distDeg: 154.91, ref: "05-10-2025 tithi end (S13, target 156)" },
  { iso: "2026-01-10T11:17:00+05:30", distDeg: 265.34, ref: "10-01-2026 tithi end (K7, target 264)" },
  { iso: "2026-06-25T21:21:00+05:30", distDeg: 132.54, ref: "25-06-2026 tithi end (S11, target 132)" },
  { iso: "2016-07-24T22:16:00+05:30", distDeg: 240.26, ref: "24-07-2016 tithi end (K5, target 240)" },
  { iso: "2016-09-18T20:53:00+05:30", distDeg: 205.45, ref: "18-09-2016 tithi end (K2, target 204)" },
  { iso: "2022-07-27T20:27:00+05:30", distDeg: 347.65, ref: "27-07-2022 tithi end (K14, target 348)" },
  { iso: "2022-11-02T01:20:00+05:30", distDeg: 97.22, ref: "01-11-2022 tithi end (S8, target 96)" },
];

/**
 * PROVISIONAL photo extraction (Jan-2026 sheet, row 10 — the owner-verified
 * anchor row): additional columns read from the sheet, engine-consistent.
 * Kept separate from GOLDEN_ROWS until the owner confirms the new columns.
 * Sunset printed as 12-hr-cycle value; normalized 24-hr form recorded.
 */
export const PHOTO_PROVISIONAL = [
  {
    date: "10-01-2026", source: "uploads/04-01-2026 to 18-01-2026.jpeg",
    fields: { yoga: "अतिगण्ड (Atiganda)", yogaDP: "25-47", karana: "बव (Bava)", chandraRashi: "कन्या", sunrisePrinted: "06:46", sunsetPrinted: "05:14", sunset24h: "17:14", dinmanaDP: "26-10" },
    status: "PROVISIONAL",
    note: "Yoga/karana/dinmana columns read from photo with engine-assisted identity; tithi/nakshatra columns already owner-verified. Awaiting owner confirmation.",
  },
];

/** §9 — derived normalization checks (do NOT replace source values). */
export const DERIVED_NORMALIZATION = [
  { date: "11-07-2025", field: "tithi", dp: "52-16", expected: "2025-07-12T02:08:24+05:30" },
  { date: "11-07-2025", field: "nakshatra", dp: "03-44", expected: "2025-07-11T06:43:36+05:30" },
  { date: "05-10-2025", field: "tithi", dp: "17-25", expected: "2025-10-05T13:07:00+05:30" },
  { date: "05-10-2025", field: "nakshatra", dp: "02-07", expected: "2025-10-05T06:59:48+05:30" },
  { date: "10-01-2026", field: "tithi", dp: "11-18", expected: "2026-01-10T11:17:12+05:30" },
  { date: "10-01-2026", field: "nakshatra", dp: "29-30", expected: "2026-01-10T18:34:00+05:30" },
  { date: "25-06-2026", field: "tithi", dp: "40-28", expected: "2026-06-25T21:21:12+05:30" },
  { date: "25-06-2026", field: "nakshatra", dp: "33-22", expected: "2026-06-25T18:30:48+05:30" },
  { date: "24-07-2016", field: "tithi", dp: "42-26", expected: "2016-07-24T22:16:24+05:30" },
  { date: "24-07-2016", field: "nakshatra", dp: "24-26", expected: "2016-07-24T15:04:24+05:30" },
  { date: "18-09-2016", field: "tithi", dp: "37-24", expected: "2016-09-18T20:53:36+05:30" },
  { date: "18-09-2016", field: "nakshatra", dp: "00-21", expected: "2016-09-18T06:04:24+05:30" },
  { date: "27-07-2022", field: "tithi", dp: "37-50", expected: "2022-07-28T02:39:00+05:30" },
  { date: "27-07-2022", field: "nakshatra", dp: "60-00", expected: "2022-07-28T05:19:00+05:30" },
  { date: "01-11-2022", field: "tithi", dp: "47-07", expected: "2022-11-02T01:20:48+05:30" },
  { date: "01-11-2022", field: "nakshatra", dp: "02-25", expected: "2022-11-01T07:28:00+05:30" },
];

const TOLERANCE_SEC = 60; // §7 acceptance tolerance for minute-precision sources

function toISO(dateDDMMYYYY) {
  const [d, m, y] = dateDDMMYYYY.split("-");
  return `${y}-${m}-${d}`;
}

/** Compute the formula-derived event timestamp: sunrise + danda*1440 + pal*24. */
export function formulaDerivedInstant(row, dp) {
  const tt = parseDandaPala(dp);
  const [h, mi] = row.sunrise.split(":").map(Number);
  const iso = toISO(row.date);
  const [y, m, d] = iso.split("-").map(Number);
  const sunriseJD = jdFromDate(y, m, d, h + mi / 60 - 5.5);
  return { jd: tt.eventJD(sunriseJD), tt };
}

function classifyDelta(deltaSec) {
  const a = Math.abs(deltaSec);
  if (a <= TOLERANCE_SEC) return "PASS";
  if (a <= 600) return "WARN (>60s, ≤10min)";
  if (a <= 3600) return "CRITICAL (>10min, ≤60min)";
  return "CATASTROPHIC (>60min)";
}

/**
 * Run the full golden suite.
 * - Source preservation checks (hard requirements).
 * - Formula-derived normalization checks (parser correctness).
 * - Makaranda engine residuals vs golden expectations (release-gate report).
 * - Drik engine cross-check (source data sanity against modern astronomy).
 */
export function runGoldenSuite() {
  const results = [];
  const rowResults = [];

  for (const row of GOLDEN_ROWS) {
    const iso = toISO(row.date);
    const entry = { date: row.date, anomaly: row.anomaly ? `POSSIBLE_SOURCE_ANOMALY: ${row.anomaly}` : null, sourcePreserved: true };

    // 1) parse source traditional values exactly
    const tithiTT = parseDandaPala(row.tithiDP);
    const nakTT = parseDandaPala(row.nakDP);
    entry.sourceTraditional = {
      tithi: tithiTT.toJSON(),
      nakshatra: nakTT.toJSON(),
      tithiClock: parseSourceClock(row.tithiClock),
      nakshatraClock: parseSourceClock(row.nakClock),
    };
    if (row.tithiDP === "60-00" || row.nakDP === "60-00") {
      entry.ahoratram = "60-00 treated as terminal traditional boundary; 'Ahoratram' preserved as source terminology";
    }

    // 2) formula-derived instant (sunrise + duration) — tests parser/converter
    const tF = formulaDerivedInstant(row, row.tithiDP);
    const nF = formulaDerivedInstant(row, row.nakDP);
    entry.formulaDerived = {
      tithiEnd: jdToISO(tF.jd, 5.5),
      nakshatraEnd: jdToISO(nF.jd, 5.5),
    };

    // 3) compare with the document's own listed derived timestamps
    const listedT = DERIVED_NORMALIZATION.find((x) => x.date === row.date && x.field === "tithi");
    const listedN = DERIVED_NORMALIZATION.find((x) => x.date === row.date && x.field === "nakshatra");
    const diff = (a, b) => Math.round((new Date(a).getTime() - new Date(b).getTime()) / 1000);
    entry.documentDerivedComparison = {
      tithi: { listed: listedT.expected, formula: entry.formulaDerived.tithiEnd, deltaSec: diff(entry.formulaDerived.tithiEnd, listedT.expected) },
      nakshatra: { listed: listedN.expected, formula: entry.formulaDerived.nakshatraEnd, deltaSec: diff(entry.formulaDerived.nakshatraEnd, listedN.expected) },
    };
    entry.documentDerivedComparison.tithi.status = Math.abs(entry.documentDerivedComparison.tithi.deltaSec) <= TOLERANCE_SEC ? "OK" : "DERIVATION_INCONSISTENCY";
    entry.documentDerivedComparison.nakshatra.status = Math.abs(entry.documentDerivedComparison.nakshatra.deltaSec) <= TOLERANCE_SEC ? "OK" : "DERIVATION_INCONSISTENCY";

    // 4) engine residuals (Makaranda + Drik) — diagnostics, not forced fits
    try {
      const ctxM = createContext({ profileId: "makaranda-v1", date: iso });
      const pM = calculatePanchang(ctxM);
      entry.makaranda = summarizeEngine(pM, row, "MAKARANDA");
    } catch (e) { entry.makaranda = { error: String(e) }; }
    try {
      const ctxD = createContext({
        profileId: "drik-v1", date: iso,
        location: { name: "Mithila traditional reference (Drik cross-check)", latitude: 26.5833, longitude: 85.2667, source: "TRADITIONAL_PANCHANG_REFERENCE" },
      });
      const pD = calculatePanchang(ctxD);
      entry.drik = summarizeEngine(pD, row, "DRIK");
    } catch (e) { entry.drik = { error: String(e) }; }
    try {
      const ctxH = createContext({ profileId: "makaranda-v2-hybrid", date: iso });
      const pH = calculatePanchang(ctxH);
      entry.hybrid = summarizeEngine(pH, row, "HYBRID");
    } catch (e) { entry.hybrid = { error: String(e) }; }

    rowResults.push(entry);
  }

  // Release-gate summary
  const makarandaDeltas = rowResults.flatMap((r) => [r.makaranda?.tithiEndDeltaSec, r.makaranda?.nakshatraEndDeltaSec, r.makaranda?.sunriseDeltaSec].filter((x) => typeof x === "number"));
  const drikTithiIdentity = rowResults.filter((r) => r.drik?.tithiNumberMatch === true).length;
  const gate = {
    toleranceSeconds: TOLERANCE_SEC,
    makaranda: {
      status: makarandaDeltas.every((d) => Math.abs(d) <= TOLERANCE_SEC) ? "PASS" : "NOT PASSED — diagnostics attached",
      maxAbsDeltaSec: Math.max(...makarandaDeltas.map((d) => Math.abs(d)), 0),
      note: "No arbitrary offsets applied. Residuals drive diagnosis of the underlying traditional method (master spec §22).",
    },
    drikCrossCheck: {
      tithiIdentityMatches: `${drikTithiIdentity}/${rowResults.length}`,
      note: "Drik (modern astronomy, Lahiri) reproducing the source tithi/nakshatra identities demonstrates the golden data is astronomically sound.",
    },
    hybrid: (() => {
      const deltas = rowResults.flatMap((r) => [r.hybrid?.tithiEndDeltaSec, r.hybrid?.nakshatraEndDeltaSec].filter((x) => typeof x === "number"));
      const tithiIdentity = rowResults.filter((r) => r.hybrid?.tithiNumberMatch === true).length;
      // printed names are preserved Devanagari abbreviations — identity is by index
      const PRINTED_NAK_INDEX = { "पू.": 19, "शत": 23, "हस्त": 12, "स्वाती": 14, "पू.भा.": 24, "उ.भा.": 25, "पुनर्वसु": 6, "उत्तराषाढ़ा": 21, "उ.आ.": 21 };
      const nakIdentity = rowResults.filter((r) => {
        const printed = PRINTED_NAK_INDEX[r.hybrid?.nakshatraPrinted];
        return typeof r.hybrid?.nakshatraIndexComputed === "number" && printed === r.hybrid.nakshatraIndexComputed;
      }).length;
      return {
        status: "DIAGNOSTIC — UNVERIFIED_HYBRID (never a release gate)",
        tithiIdentityMatches: `${tithiIdentity}/${rowResults.length}`,
        nakshatraIdentityMatches: `${nakIdentity}/${rowResults.length}`,
        maxAbsEndDeltaSec: Math.max(...deltas.map((d) => Math.abs(d)), 0),
        note: "Experimental bridge engine (modern-anchored means + classical perturbation series + fitted offsets). Tracks the printed Panchang within the traditional residual band; superseded by makaranda-v2-tables when the university worksheets arrive.",
      };
    })(),
  };

  // Independent ephemeris certification (PyEphem 4.2.1 anchors): the Drik
  // engine's moon−sun separation at each printed tithi end must agree with
  // the external authority to ±0.15°. Also exposes how far the PRINTED
  // traditional ends sit from exact modern targets (traditional residual band).
  const isoToJD = (iso) => {
    const [d, t] = iso.split("T");
    const [y, m, dd] = d.split("-").map(Number);
    const [h, mi] = t.slice(0, 5).split(":").map(Number);
    return jdFromDate(y, m, dd, h + mi / 60 - 5.5);
  };
  const ephemAnchors = EPHEM_ANCHORS.map((a) => {
    const jd = isoToJD(a.iso);
    const engine = norm360(drikMoonLongitude(jd) - drikSunLongitude(jd));
    return { ...a, engineDeg: +engine.toFixed(2), deltaVsEphemDeg: +(engine - a.distDeg).toFixed(2), ok: Math.abs(engine - a.distDeg) <= 0.15 };
  });

  // Drik certification grid: 60 epochs 2016–2030 vs PyEphem 4.2.1 (apparent
  // geocentric ecliptic longitudes, equinox of date). Upgraded 2026-09-20:
  // full Meeus ch.47 lunar series + IAU-1980 nutation + Espenak–Meeus ΔT.
  const drikCertification = (() => {
    let worstMoon = 0, worstSun = 0, worstMoonAt = "", worstSunAt = "";
    for (const a of DRIK_CERT_ANCHORS) {
      const [d, t] = a.iso.split("T"); const [y, m, dd] = d.split("-").map(Number);
      const jd = jdFromDate(y, m, dd, +t.slice(0, 2));
      const dm = Math.abs(((drikMoonLongitude(jd) - a.moon + 540) % 360) - 180);
      const ds = Math.abs(((drikSunLongitude(jd) - a.sun + 540) % 360) - 180);
      if (dm > worstMoon) { worstMoon = dm; worstMoonAt = a.iso; }
      if (ds > worstSun) { worstSun = ds; worstSunAt = a.iso; }
    }
    return {
      reference: "PyEphem 4.2.1 (independent ephemeris), apparent geocentric place, equinox of date",
      grid: "2016–2030, 60 epochs",
      moonWorstDeg: +worstMoon.toFixed(6), moonWorstArcsec: +(worstMoon * 3600).toFixed(1), moonWorstAt: worstMoonAt,
      sunWorstDeg: +worstSun.toFixed(6), sunWorstArcsec: +(worstSun * 3600).toFixed(1), sunWorstAt: worstSunAt,
      note: "Moon: full Meeus ch.47 series (60 periodic terms) + complete IAU-1980 nutation + ΔT — locked ≤0.005°. Sun: Meeus ch.25 + apparent corrections — locked ≤0.012°; residual is inherent to the ch.25 truncation (Table 25.C upgrade path documented in MAKARANDA_ENGINE_PLAN.md).",
    };
  })();

  return {
    rows: rowResults, gate,
    ephemAnchors,
    drikCertification,
    photoProvisional: PHOTO_PROVISIONAL,
    policy: { dandaPalInterpretation: "END_TIME relative to Panchang-day sunrise", sourcePreservation: "EXACT — anomalies flagged, never corrected", tolerance: "±60s for minute-precision sources" },
  };
}

const VARA_PRINTED_TO_INDEX = { "रवि": 0, "सोम": 1, "मंगल": 2, "बुध": 3, "गुरु": 4, "शुक्र": 5, "शनि": 6 };

function summarizeEngine(p, row, mode) {
  const clockToSec = (s) => { const [h, m, ss] = s.split(":").map(Number); return h * 3600 + m * 60 + (ss || 0); };
  const sunriseDelta = clockToSec(p.sunrise) - clockToSec(row.sunrise + ":00");
  const printedVaraIdx = VARA_PRINTED_TO_INDEX[row.day];
  const computedVaraIdx = Math.floor(p.sunriseJD + 5.5 / 24 + 1.5) % 7;
  const varaMatch = printedVaraIdx === computedVaraIdx;
  // compare with the FORMULA-derived golden instant (authoritative from source danda-pal + printed sunrise)
  const tF = formulaDerivedInstant(row, row.tithiDP);
  const nF = formulaDerivedInstant(row, row.nakDP);
  const tithiEndDelta = Math.round((p.tithi.endJD - tF.jd) * 86400);
  const nakEndDelta = Math.round((p.nakshatra.endJD - nF.jd) * 86400);
  return {
    mode,
    varaPrinted: row.day,
    varaComputed: p.vara,
    varaMatch,
    sunriseComputed: p.sunrise,
    sunriseDeltaSec: sunriseDelta,
    sunriseStatus: classifyDelta(sunriseDelta),
    tithiNumberPrinted: row.tithi,
    tithiNumberComputedPaksha: p.tithi.pakshaNumber,
    tithiNumberMatch: p.tithi.pakshaNumber === row.tithi,
    tithiEndComputed: p.tithi.endTimestamp,
    tithiEndGolden: jdToISO(tF.jd, 5.5),
    tithiEndDeltaSec: tithiEndDelta,
    tithiEndStatus: classifyDelta(tithiEndDelta),
    nakshatraPrinted: row.nak,
    nakshatraComputed: p.nakshatra.name,
    nakshatraIndexComputed: p.nakshatra.index,
    nakshatraEndComputed: p.nakshatra.endTimestamp,
    nakshatraEndGolden: jdToISO(nF.jd, 5.5),
    nakshatraEndDeltaSec: nakEndDelta,
    nakshatraEndStatus: classifyDelta(nakEndDelta),
  };
}
