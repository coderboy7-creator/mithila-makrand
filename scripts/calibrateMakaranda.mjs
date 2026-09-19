/**
 * calibrateMakaranda.mjs — honest calibration experiment for the Makaranda
 * engine (demo for the engine-build plan; NOT wired into the product).
 *
 * Fits physically-meaningful parameters of the traditional SS model:
 *   Moon: dM (mean-longitude epoch offset °), dU (uccha offset °), kM (mandaphala epicycle scale)
 *   Ayanamsa: dA (°)
 *   Sun:  dS, dUs, kS
 * against every HIGH-CONFIDENCE printed end instant (golden rows + 2022 sheet).
 * No arbitrary time offsets are fitted — only model parameters.
 */
import { SS_REVOLUTIONS, SS_ANCHORS_J2000, SS_PARAMS, ayanamsaDeg } from "../packages/core/src/ephemeris.js";
import { jdFromDate, norm360 } from "../packages/core/src/base.js";
import { parseDandaPala } from "../packages/core/src/traditionalTime.js";

const J2000 = 2451545.0;
const rpd = (r) => r / 1577917828;
const sinD = (d) => Math.sin((d * Math.PI) / 180);
const asinD = (x) => (Math.asin(x) * 180) / Math.PI;

const mean = (anchor, revs, jd) => norm360(anchor + (jd - J2000) * rpd(revs) * 360);
const manda = (m, u, C) => asinD((C / 360) * sinD(m - u));

function moonTrop(jd, p) {
  const m = norm360(SS_ANCHORS_J2000.moonMean + (jd - J2000) * rpd(SS_REVOLUTIONS.moon) * 360 * (p.sM ?? 1)) + p.dM;
  return norm360(m + manda(m, SS_PARAMS.moonUccha + p.dU, SS_PARAMS.moonC * p.kM));
}
function sunTrop(jd, p) {
  const m = norm360(SS_ANCHORS_J2000.sunMean + (jd - J2000) * rpd(SS_REVOLUTIONS.sun) * 360 * (p.sS ?? 1)) + p.dS;
  return norm360(m + manda(m, SS_PARAMS.sunUccha + p.dUs, SS_PARAMS.sunC * p.kS));
}
const ayan = (jd, p) => ayanamsaDeg("MAKARANDA_V1_CALIBRATED", jd) + p.dA;

/* printed end -> JD (sunrise_printed + danda-pala) */
function endJD(dateISO, sr, dp, plus1 = false) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [h, mi] = sr.split(":").map(Number);
  const t = parseDandaPala(dp);
  let jd = jdFromDate(y, m, d, h + mi / 60 - 5.5) + t.danda * 0.4 + t.pala * (0.4 / 60);
  return jd / 1; // danda*0.4 days? NO: 1 danda = 24 min = 0.4/60*24? -> 24min=1/60 day*24? 24min = 0.0166667 d; pala 24s.
}
/* correct: 1 danda = 24 min = 24/1440 day; 1 pala = 24 s = 24/86400 day */
function endJD2(dateISO, sr, dp) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [h, mi] = sr.split(":").map(Number);
  const t = parseDandaPala(dp);
  return jdFromDate(y, m, d, h + mi / 60 - 5.5) + (t.danda * 24 * 60 + t.pala * 24) / 86400;
}

const NAK_IDX = { Pushya: 7, Ashlesha: 8, Magha: 9, "Purva Phalguni": 10, "Uttara Phalguni": 11, Hasta: 12, Chitra: 13, Swati: 14, Vishakha: 15, Anuradha: 16, Jyeshtha: 17, Mula: 18, "Purva Ashadha": 19, "Uttara Ashadha": 20, Shravana: 21, Dhanishta: 22, Shatabhisha: 23, "Purva Bhadrapada": 24, "Uttara Bhadrapada": 25, Punarvasu: 6, Revati: 26 };

const NAK = [ // [iso, sunrise, dp, nakshatra]
  ["2022-07-29", "05:20", "11-22", "Pushya"], ["2022-07-30", "05:21", "16-48", "Ashlesha"],
  ["2022-07-31", "05:22", "14-10", "Magha"], ["2022-08-01", "05:22", "24-26", "Purva Phalguni"],
  ["2022-08-02", "05:23", "26-23", "Uttara Phalguni"], ["2022-08-03", "05:24", "27-05", "Hasta"],
  ["2022-08-04", "05:24", "26-36", "Chitra"], ["2022-08-05", "05:24", "25-03", "Swati"],
  ["2022-08-06", "05:25", "22-42", "Vishakha"], ["2022-08-07", "05:25", "19-32", "Anuradha"],
  ["2022-08-08", "05:26", "15-52", "Jyeshtha"], ["2022-08-09", "05:26", "11-49", "Mula"],
  ["2022-08-10", "05:27", "07-37", "Purva Ashadha"], ["2022-08-11", "05:27", "03-28", "Uttara Ashadha"],
  ["2022-08-12", "05:28", "56-12", "Dhanishta"],
  ["2025-07-11", "05:14", "03-44", "Purva Ashadha"], ["2025-10-05", "06:09", "02-07", "Shatabhisha"],
  ["2026-01-10", "06:46", "29-30", "Hasta"], ["2016-07-24", "05:18", "24-26", "Purva Bhadrapada"],
  ["2016-09-18", "05:56", "00-21", "Uttara Bhadrapada"], ["2022-07-27", "05:19", "60-00", "Punarvasu"],
  ["2022-11-01", "06:29", "02-25", "Uttara Ashadha"],
];
const TIT = [ // [iso, sunrise, dp, absAngle]
  ["2022-07-29", "05:20", "46-51", 12], ["2022-07-30", "05:21", "50-09", 24], ["2022-07-31", "05:22", "52-21", 36],
  ["2022-08-01", "05:22", "53-19", 48], ["2022-08-02", "05:23", "52-53", 60], ["2022-08-03", "05:24", "51-18", 72],
  ["2022-08-04", "05:24", "48-30", 84], ["2022-08-05", "05:24", "44-45", 96], ["2022-08-06", "05:25", "40-08", 108],
  ["2022-08-07", "05:25", "34-51", 120], ["2022-08-08", "05:26", "29-02", 132], ["2022-08-09", "05:26", "22-56", 144],
  ["2022-08-10", "05:27", "16-44", 156], ["2022-08-11", "05:27", "10-37", 168],
  ["2025-07-11", "05:14", "52-16", 192], ["2025-10-05", "06:09", "17-25", 156], ["2026-01-10", "06:46", "11-18", 264],
  ["2016-07-24", "05:18", "42-26", 240], ["2016-09-18", "05:56", "37-24", 204], ["2022-07-27", "05:19", "37-50", 348],
  ["2022-11-01", "06:29", "47-07", 276],
];

const nakData = NAK.map(([d, s, dp, n]) => ({ jd: endJD2(d, s, dp), ang: (NAK_IDX[n] + 1) * (360 / 27) }));
const titData = TIT.map(([d, s, dp, a]) => ({ jd: endJD2(d, s, dp), ang: a }));

const wrap = (x) => ((x + 540) % 360) - 180;

function nakResids(p) { return nakData.map((e) => wrap(moonTrop(e.jd, p) - ayan(e.jd, p) - e.ang)); }
function titResids(p) { return titData.map((e) => wrap(moonTrop(e.jd, p) - sunTrop(e.jd, p) - e.ang)); }
const rms = (r) => Math.sqrt(r.reduce((a, x) => a + x * x, 0) / r.length);

const P0 = { dM: 0, dU: 0, kM: 1, dA: 0, dS: 0, dUs: 0, kS: 1, sM: 1, sS: 1 };
const degToMin = (deg, speed) => (deg / speed) * 240; // 240 min per degree at 6°/day? use per-body speed later for reporting; keep deg for fit

console.log("BEFORE fit (current v1 params):");
console.log("  nak deg RMS", rms(nakResids(P0)).toFixed(3), " max", Math.max(...nakResids(P0).map(Math.abs)).toFixed(2));
console.log("  tithi deg RMS", rms(titResids(P0)).toFixed(3), " max", Math.max(...titResids(P0).map(Math.abs)).toFixed(2));

/* coarse grid over moon+ayan */
let best = { ...P0 }, bestR = 1e9;
for (let sM = 1 - 5e-5; sM <= 1 + 5.001e-5; sM += 1.25e-5)
  for (let dA = -2; dA <= 2.001; dA += 0.5)
    for (let dM = -3; dM <= 3.001; dM += 0.5)
      for (let dU = -15; dU <= 15.001; dU += 3)
        for (let kM = 0.85; kM <= 1.151; kM += 0.05) {
          const p = { ...best, sM, dA, dM, dU, kM };
          const r = rms(nakResids(p));
          if (r < bestR) { bestR = r; best = p; }
        }
/* refine */
for (let pass = 0; pass < 3; pass++) {
  const b = { ...best };
  for (let sM = b.sM - 1.25e-5; sM <= b.sM + 1.251e-5; sM += 3.125e-6)
    for (let dA = b.dA - 0.5; dA <= b.dA + 0.501; dA += 0.1)
      for (let dM = b.dM - 0.5; dM <= b.dM + 0.501; dM += 0.1)
        for (let dU = b.dU - 3; dU <= b.dU + 3.001; dU += 0.6)
          for (let kM = b.kM - 0.05; kM <= b.kM + 0.051; kM += 0.01) {
            const p = { ...b, sM, dA, dM, dU, kM };
            const r = rms(nakResids(p));
            if (r < bestR) { bestR = r; best = p; }
          }
}
console.log("\nAFTER moon+ayan fit:", JSON.stringify({ dM: +best.dM.toFixed(3), dU: +best.dU.toFixed(2), kM: +best.kM.toFixed(3), dA: +best.dA.toFixed(3) }));
console.log("  nak deg RMS", rms(nakResids(best)).toFixed(3), " max", Math.max(...nakResids(best).map(Math.abs)).toFixed(2));

/* sun fit with moon fixed */
let bestS = { ...best }, bestSR = 1e9;
for (let sS = 1 - 5e-5; sS <= 1 + 5.001e-5; sS += 1.25e-5)
  for (let dS = -2; dS <= 2.001; dS += 0.25)
    for (let dUs = -15; dUs <= 15.001; dUs += 1.5)
      for (let kS = 0.85; kS <= 1.151; kS += 0.05) {
        const p = { ...bestS, sS, dS, dUs, kS };
        const r = rms(titResids(p));
        if (r < bestSR) { bestSR = r; bestS = p; }
      }
console.log("\nAFTER sun fit:", JSON.stringify({ dS: +bestS.dS.toFixed(3), dUs: +bestS.dUs.toFixed(2), kS: +bestS.kS.toFixed(3) }));
console.log("  tithi deg RMS", rms(titResids(bestS)).toFixed(3), " max", Math.max(...titResids(bestS).map(Math.abs)).toFixed(2));

/* report in minutes using body speeds (moon 13.176°/d, tithi rate 12.19°/d) */
const minNak = nakResids(bestS).map((d) => Math.abs(d / 13.176) * 1440);
const minTit = titResids(bestS).map((d) => Math.abs(d / 12.19) * 1440);
console.log("\nFINAL residual in MINUTES of time:");
console.log("  nakshatra ends: max", Math.max(...minNak).toFixed(0), "min; RMS", Math.sqrt(minNak.reduce((a, x) => a + x * x, 0) / minNak.length).toFixed(0), "min");
console.log("  tithi ends:     max", Math.max(...minTit).toFixed(0), "min; RMS", Math.sqrt(minTit.reduce((a, x) => a + x * x, 0) / minTit.length).toFixed(0), "min");
nakData.forEach((e, i) => console.log(`  ${new Date((e.jd - 2440587.5) * 86400000).toISOString().slice(0, 10)} nak Δ${(minNak[i] * Math.sign(nakResids(bestS)[i])).toFixed(0)}m`));
