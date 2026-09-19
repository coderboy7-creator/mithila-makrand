// Fit the tiny HYBRID offsets {dM, dA, dS} against high-confidence printed ends.
// Tithi target elongations are derived as 12*round(elong/12) (end-of-tithi geometry),
// independent of any label convention.
import { HYBRID_PARAMS, hybridTrueSidereal, drikTrueSidereal } from "../packages/core/src/ephemeris.js";
import { jdFromDate } from "../packages/core/src/base.js";
import { parseDandaPala } from "../packages/core/src/traditionalTime.js";
const wrap = (x) => ((x + 540) % 360) - 180;
const endJD2 = (d, sr, dp) => { const [y, m, dd] = d.split("-").map(Number); const [h, mi] = sr.split(":").map(Number); const t = parseDandaPala(dp); return jdFromDate(y, m, dd, h + mi / 60 - 5.5) + (t.danda * 1440 + t.pala * 24) / 86400; };
const NAK_IDX = { Pushya: 7, Ashlesha: 8, Magha: 9, "Purva Phalguni": 10, "Uttara Phalguni": 11, Hasta: 12, Chitra: 13, Swati: 14, Vishakha: 15, Anuradha: 16, Jyeshtha: 17, Mula: 18, "Purva Ashadha": 19, "Uttara Ashadha": 20, Dhanishta: 22, Shatabhisha: 23, "Purva Bhadrapada": 24, "Uttara Bhadrapada": 25, Punarvasu: 6 };
const NAK = [["2022-07-29","05:20","11-22","Pushya"],["2022-07-30","05:21","16-48","Ashlesha"],["2022-07-31","05:22","14-10","Magha"],["2022-08-01","05:22","24-26","Purva Phalguni"],["2022-08-02","05:23","26-23","Uttara Phalguni"],["2022-08-03","05:24","27-05","Hasta"],["2022-08-04","05:24","26-36","Chitra"],["2022-08-05","05:24","25-03","Swati"],["2022-08-06","05:25","22-42","Vishakha"],["2022-08-07","05:25","19-32","Anuradha"],["2022-08-08","05:26","15-52","Jyeshtha"],["2022-08-09","05:26","11-49","Mula"],["2022-08-10","05:27","07-37","Purva Ashadha"],["2022-08-11","05:27","03-28","Uttara Ashadha"],["2022-08-12","05:28","56-12","Dhanishta"],["2025-07-11","05:14","03-44","Purva Ashadha"],["2025-10-05","06:09","02-07","Shatabhisha"],["2026-01-10","06:46","29-30","Hasta"],["2016-07-24","05:18","24-26","Purva Bhadrapada"],["2016-09-18","05:56","00-21","Uttara Bhadrapada"],["2022-07-27","05:19","60-00","Punarvasu"],["2022-11-01","06:29","02-25","Uttara Ashadha"]];
const TIT = [["2022-07-29","05:20","46-51"],["2022-07-30","05:21","50-09"],["2022-07-31","05:22","52-21"],["2022-08-01","05:22","53-19"],["2022-08-02","05:23","52-53"],["2022-08-03","05:24","51-18"],["2022-08-04","05:24","48-30"],["2022-08-05","05:24","44-45"],["2022-08-06","05:25","40-08"],["2022-08-07","05:25","34-51"],["2022-08-08","05:26","29-02"],["2022-08-09","05:26","22-56"],["2022-08-10","05:27","16-44"],["2022-08-11","05:27","10-37"],["2025-07-11","05:14","52-16"],["2025-10-05","06:09","17-25"],["2026-01-10","06:46","11-18"],["2016-07-24","05:18","42-26"],["2016-09-18","05:56","37-24"],["2022-07-27","05:19","37-50"],["2022-11-01","06:29","47-07"]];
const nak = NAK.map(([d, s, dp, n]) => ({ jd: endJD2(d, s, dp), ang: (NAK_IDX[n] + 1) * (360 / 27), tag: d }));
const tit = TIT.map(([d, s, dp]) => {
  const jd = endJD2(d, s, dp);
  const m = drikTrueSidereal(jd, "LAHIRI");
  const el = ((m.sidereal.Moon - m.sidereal.Sun) % 360 + 360) % 360;
  return { jd, ang: 12 * Math.round(el / 12), tag: d };
});
const rms = (r) => Math.sqrt(r.reduce((a, x) => a + x * x, 0) / r.length);
const evalNak = () => nak.map((e) => wrap(hybridTrueSidereal(e.jd).sidereal.Moon - e.ang));
const evalTit = () => tit.map((e) => { const m = hybridTrueSidereal(e.jd); return wrap(m.sidereal.Moon - m.sidereal.Sun - e.ang); });
HYBRID_PARAMS.dM = HYBRID_PARAMS.dA = HYBRID_PARAMS.dS = 0;
console.log("base: nak RMS", rms(evalNak()).toFixed(3), "deg | tithi RMS", rms(evalTit()).toFixed(3));
let best = { dM: 0, dA: 0 }, bestR = 1e9;
for (let pass = 0; pass < 2; pass++) {
  const st = pass === 0 ? 0.05 : 0.01, cM = best.dM, cA = best.dA, R = pass === 0 ? 1.5 : 0.06;
  for (let dM = cM - R; dM <= cM + R + 1e-9; dM += st)
    for (let dA = cA - R; dA <= cA + R + 1e-9; dA += st) {
      HYBRID_PARAMS.dM = dM; HYBRID_PARAMS.dA = dA;
      const r = rms(evalNak()); if (r < bestR) { bestR = r; best = { dM, dA }; }
    }
  HYBRID_PARAMS.dM = best.dM; HYBRID_PARAMS.dA = best.dA;
}
let bdS = 0, bR = 1e9;
for (let pass = 0; pass < 2; pass++) {
  const st = pass === 0 ? 0.05 : 0.01, c = bdS, R = pass === 0 ? 1.5 : 0.06;
  for (let dS = c - R; dS <= c + R + 1e-9; dS += st) { HYBRID_PARAMS.dS = dS; const r = rms(evalTit()); if (r < bR) { bR = r; bdS = dS; } }
  HYBRID_PARAMS.dS = bdS;
}
const minN = evalNak().map((d) => (d / 13.176) * 1440), minT = evalTit().map((d) => (d / 12.19) * 1440);
console.log("FIT:", JSON.stringify({ dM: +best.dM.toFixed(3), dA: +best.dA.toFixed(3), dS: +bdS.toFixed(3) }));
console.log(`nak: max ${Math.max(...minN.map(Math.abs)).toFixed(0)}m rms ${rms(minN).toFixed(0)}m | tithi: max ${Math.max(...minT.map(Math.abs)).toFixed(0)}m rms ${rms(minT).toFixed(0)}m`);
nak.forEach((e, i) => console.log(` ${e.tag} nak ${minN[i] >= 0 ? "+" : ""}${minN[i].toFixed(0)}m`));
tit.forEach((e, i) => console.log(` ${e.tag} tit ${minT[i] >= 0 ? "+" : ""}${minT[i].toFixed(0)}m`));
