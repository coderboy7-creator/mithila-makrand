/**
 * fitHybrid.mjs — fit the makaranda-v2-hybrid lunar/solar model:
 *   SS mean (traditional revolutions) + SS mandaphala (scaled)
 *   + evection eEv·sin(2D−Mm) + variation eVar·sin(2D) + annual eAnn·sin(Ms)
 *   + ayanamsa shift dA; sun: SS mean + mandaphala (scaled).
 * Prints the fitted parameter block to paste into ephemeris.js.
 */
import { SS_REVOLUTIONS, SS_ANCHORS_J2000, SS_PARAMS, ayanamsaDeg } from "../packages/core/src/ephemeris.js";
import { jdFromDate, norm360 } from "../packages/core/src/base.js";
import { parseDandaPala } from "../packages/core/src/traditionalTime.js";

const J2000 = 2451545.0;
const rpd = (r) => r / 1577917828;
const sinD = (d) => Math.sin((d * Math.PI) / 180);
const asinD = (x) => (Math.asin(x) * 180) / Math.PI;
const wrap = (x) => ((x + 540) % 360) - 180;

function model(jd, p) {
  const mM0 = norm360(SS_ANCHORS_J2000.moonMean + (jd - J2000) * rpd(SS_REVOLUTIONS.moon) * 360);
  const mS0 = norm360(SS_ANCHORS_J2000.sunMean + (jd - J2000) * rpd(SS_REVOLUTIONS.sun) * 360);
  const mM = norm360(mM0 + p.dM), mS = norm360(mS0 + p.dS);
  const Mm = wrap(mM - (SS_PARAMS.moonUccha + p.dU));
  const Ms = wrap(mS - (SS_PARAMS.sunUccha + p.dUs));
  const D = wrap(mM - mS);
  const moon = norm360(
    mM + asinD((SS_PARAMS.moonC * p.kM / 360) * sinD(Mm))
      + p.eEv * sinD(2 * D - Mm) + p.eVar * sinD(2 * D) + p.eAnn * sinD(Ms)
  );
  const sun = norm360(mS + asinD((SS_PARAMS.sunC * p.kS / 360) * sinD(Ms)));
  return { moon, sun, ayan: ayanamsaDeg("MAKARANDA_V1_CALIBRATED", jd) + p.dA };
}

function endJD2(dateISO, sr, dp) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [h, mi] = sr.split(":").map(Number);
  const t = parseDandaPala(dp);
  return jdFromDate(y, m, d, h + mi / 60 - 5.5) + (t.danda * 1440 + t.pala * 24) / 86400;
}
const NAK_IDX = { Pushya: 7, Ashlesha: 8, Magha: 9, "Purva Phalguni": 10, "Uttara Phalguni": 11, Hasta: 12, Chitra: 13, Swati: 14, Vishakha: 15, Anuradha: 16, Jyeshtha: 17, Mula: 18, "Purva Ashadha": 19, "Uttara Ashadha": 20, Dhanishta: 22, Shatabhisha: 23, "Purva Bhadrapada": 24, "Uttara Bhadrapada": 25, Punarvasu: 6 };
const NAK = [
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
const TIT = [
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

const rms = (r) => Math.sqrt(r.reduce((a, x) => a + x * x, 0) / r.length);
const nakRes = (p) => nakData.map((e) => { const m = model(e.jd, p); return wrap(m.moon - m.ayan - e.ang); });
const titRes = (p) => titData.map((e) => { const m = model(e.jd, p); return wrap(m.moon - m.sun - e.ang); });

let best = { dM: 0, dU: 0, kM: 1, dA: 0, dS: 0, dUs: 0, kS: 1, eEv: 0, eVar: 0, eAnn: 0 }, bestR = 1e9;
/* stage 1 */
for (let eEv = 0; eEv <= 1.601; eEv += 0.2)
  for (let kM = 1.0; kM <= 1.351; kM += 0.05)
    for (let dU = -10; dU <= 10.001; dU += 2.5)
      for (let dM = -2; dM <= 2.001; dM += 0.5)
        for (let dA = -2; dA <= 2.001; dA += 0.5) {
          const p = { ...best, eEv, eVar: 0.66, eAnn: 0.12, kM, dU, dM, dA };
          const r = rms(nakRes(p));
          if (r < bestR) { bestR = r; best = { ...p }; }
        }
console.log("stage1 nak RMS deg", rms(nakRes(best)).toFixed(3), JSON.stringify(best));
/* stage 2 refine all moon params */
for (let pass = 0; pass < 2; pass++) {
  const b = { ...best };
  for (let eEv = Math.max(0, b.eEv - 0.2); eEv <= b.eEv + 0.201; eEv += 0.1)
    for (let eVar = Math.max(0, b.eVar - 0.2); eVar <= b.eVar + 0.201; eVar += 0.1)
      for (let eAnn = Math.max(0, b.eAnn - 0.1); eAnn <= b.eAnn + 0.101; eAnn += 0.05)
        for (let kM = b.kM - 0.05; kM <= b.kM + 0.051; kM += 0.02)
          for (let dU = b.dU - 2.5; dU <= b.dU + 2.501; dU += 1)
            for (let dM = b.dM - 0.5; dM <= b.dM + 0.501; dM += 0.2)
              for (let dA = b.dA - 0.5; dA <= b.dA + 0.501; dA += 0.2) {
                const p = { ...b, eEv, eVar, eAnn, kM, dU, dM, dA };
                const r = rms(nakRes(p));
                if (r < bestR) { bestR = r; best = { ...p }; }
              }
}
console.log("stage2 nak RMS deg", rms(nakRes(best)).toFixed(3), "max", Math.max(...nakRes(best).map((x) => Math.abs(x))).toFixed(2));
/* sun */
let bestSR = 1e9; const bS0 = { ...best };
for (let dS = -2; dS <= 2.001; dS += 0.25)
  for (let dUs = -10; dUs <= 10.001; dUs += 1)
    for (let kS = 0.9; kS <= 1.301; kS += 0.05) {
      const p = { ...best, dS, dUs, kS };
      const r = rms(titRes(p));
      if (r < bestSR) { bestSR = r; best = { ...p }; }
    }
console.log("sun fit tithi RMS deg", rms(titRes(best)).toFixed(3), "max", Math.max(...titRes(best).map((x) => Math.abs(x))).toFixed(2));

const minN = nakRes(best).map((d) => (d / 13.176) * 1440);
const minT = titRes(best).map((d) => (d / 12.19) * 1440);
console.log("\nFINAL (minutes): nak max", Math.max(...minN.map(Math.abs)).toFixed(0), "rms", rms(minN).toFixed(0), "| tithi max", Math.max(...minT.map(Math.abs)).toFixed(0), "rms", rms(minT).toFixed(0));
console.log("\nHYBRID_PARAMS =", JSON.stringify({
  dM: +best.dM.toFixed(4), dU: +best.dU.toFixed(3), kM: +best.kM.toFixed(4),
  eEv: +best.eEv.toFixed(3), eVar: +best.eVar.toFixed(3), eAnn: +best.eAnn.toFixed(4), dA: +best.dA.toFixed(4),
  dS: +best.dS.toFixed(4), dUs: +best.dUs.toFixed(3), kS: +best.kS.toFixed(4),
}, null, 1));
nakData.forEach((e, i) => console.log(`  ${new Date((e.jd - 2440587.5) * 86400000).toISOString().slice(0, 10)} nak Δ${minN[i].toFixed(0)}m`));
titData.forEach((e, i) => console.log(`  ${new Date((e.jd - 2440587.5) * 86400000).toISOString().slice(0, 10)} tit Δ${minT[i].toFixed(0)}m`));
