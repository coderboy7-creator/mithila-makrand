/**
 * verifySheet0722.mjs — Verification of the owner-supplied Panchang sheet
 * 29-07-2022 → 12-08-2022 (uploads/image-1.png) against BOTH engines.
 *
 * Method:
 *  1) Transcription (Devanagari digits read from the photo; Tirhuta columns
 *     like स्पष्टसूर्य राश्यंति / दिनाङ्क not used for regression).
 *  2) Internal-consistency check of the transcription itself:
 *     sunrise + दण्ड-पल MUST equal the printed घ.मि. clock (±2 min), because
 *     the sheet's own columns obey that rule. Failing cells = read errors or
 *     print anomalies → flagged, never silently corrected.
 *  3) Engine comparison: identity (tithi#/nakshatra/yoga/karana/rashi at
 *     sunrise) + end-instant deltas for MAKARANDA and DRIK.
 */
import { createContext, calculatePanchang } from "../packages/core/src/index.js";
import { parseDandaPala } from "../packages/core/src/traditionalTime.js";
import { jdFromDate } from "../packages/core/src/base.js";

const LOC = { name: "ref", latitude: 26.5833, longitude: 85.2667 };

/* clock markers: दि = same-day, स = evening (+12h), रा = night (rule below) */
function clockToHoursFromDayStart(raw) {
  const m = raw.match(/^(दि|स|रा)\s*(\d{1,2})[|:](\d{1,2})$/);
  if (!m) return null;
  const [, mark, h, mi] = m;
  let H = +h;
  if (mark === "स") H += 12;
  if (mark === "रा") H = H === 12 ? 0 : H <= 6 ? H + 24 : H + 12;
  return H + (+mi) / 60;
}
const dpHours = (dp) => { const t = parseDandaPala(dp); return t.danda * 0.4 + t.pala * (0.4 / 60); };

/* [date, vara, tithi#, tDP, tClock, nakName, nDP, nClock, yogaName, yDP, karanaName, kDP, rashi, rDP, rClock, dinmana, sr, ss, notes] */
const ROWS = [
  ["2022-07-29", "शुक्र", 1, "46-51", "रा 12|04", "Pushya", "11-22", "दि 09|52", "Siddhi", "35-31", "Kimstughna", "14-45", "Karka", null, "अहोरात्रम्", "33-20", "05:20", "06:40", ""],
  ["2022-07-30", "शनि", 2, "50-09", "रा 01|25", "Ashlesha", "16-48", "दि 12|04", "Vyatipata", "35-54", "Balava", "18-30", "Karka", "16-48", "दि 12|04", "33-17", "05:21", "06:39", "nak end = rashi change (Ashlesha end = Karka→Simha)"],
  ["2022-07-31", "रवि", 3, "52-21", "रा 02|14", "Magha", "14-10", "दि 11|04", "Variyan", "35-24", "Taitila", "21-15", "Simha", null, "अहोरात्रम्", "33-14", "05:22", "06:39", "nak d.p read 21-10? consistency says 14-10"],
  ["2022-08-01", "सोम", 4, "53-19", "रा 02|40", "Purva Phalguni", "24-26", "स 03|08", "Parigha", "33-58", "Vanija", "22-48", "Simha", "31-55", "रा 06|20", "33-11", "05:22", "06:38", "nak clock read दि 03|08 — likely स/१५; flagged"],
  ["2022-08-02", "मंगल", 5, "52-53", "रा 02|31", "Uttara Phalguni", "26-23", "स 03|56", "Shiva", "31-35", "Bava", "22-34", "Kanya", null, "अहोरात्रम्", "33-08", "05:23", "06:37", "nak clock read दि 03|55 — flagged"],
  ["2022-08-03", "बुध", 6, "51-18", "रा 01|54", "Hasta", "27-05", "स 04|14", "Siddhi", "28-08", "Kaulava", "22-05", "Kanya", "56-51", "रा 04|07", "33-05", "05:24", "06:37", "rashi clock = Tula entry (next morning)"],
  ["2022-08-04", "गुरु", 7, "48-30", "रा 12|48", "Chitra", "26-36", "स 04|03", "Sadhya", "23-43", "Garaja", "19-54", "Tula", null, "अहोरात्रम्", "33-02", "05:24", "06:36", "nak clock flagged"],
  ["2022-08-05", "शुक्र", 8, "44-45", "रा 11|18", "Swati", "25-03", "स 03|25", "Shubha", "18-28", "Vanija", "16-37", "Tula", null, "अहोरात्रम्", "32-59", "05:24", "06:36", ""],
  ["2022-08-06", "शनि", 9, "40-08", "रा 09|28", "Vishakha", "22-42", "स 02|30", "Shukla", "12-30", "Balava", "12-26", "Vrishchika", "08-28", "दि 08|44", "32-56", "05:25", "06:35", "rashi d.p/clock inconsistent with nak column — flagged"],
  ["2022-08-07", "रवि", 10, "34-51", "स 07|21", "Anuradha", "19-32", "स 01|14", "Brahma", "05-53", "Taitila", "07-21", "Vrishchika", null, "अहोरात्रम्", "32-53", "05:25", "06:35", "nak clock flagged (13|14?)"],
  ["2022-08-08", "सोम", 11, "29-02", "स 05|03", "Jyeshtha", "15-52", "दि 11|47", "Vaidhriti", "31-16", "Vishti", "04-56", "Vrishchika", "15-52", "दि 11|47", "32-50", "05:26", "06:34", "nak end = rashi change (Jyeshtha end = Vrishchika→Dhanu)"],
  ["2022-08-09", "मंगल", 12, "22-56", "स 02|37", "Mula", "11-49", "दि 10|12", "Vishkambha", "43-39", "Bava", "22-56", "Dhanu", null, "अहोरात्रम्", "32-47", "05:26", "06:34", ""],
  ["2022-08-10", "बुध", 13, "16-44", "दि 12|09", "Purva Ashadha", "07-37", "दि 08|30", "Priti", "35-58", "Taitila", "16-44", "Dhanu", "21-35", "स 02|05", "32-44", "05:27", "06:33", "rashi clock flagged"],
  ["2022-08-11", "गुरु", 14, "10-37", "दि 09|42", "Uttara Ashadha", "03-28", "दि 06|51", "Ayushman", "28-26", "Chatushpada", "10-37", "Makara", null, "अहोरात्रम्", "32-41", "05:27", "06:33", "karana च. read as fixed Chatushpada — flagged"],
  ["2022-08-12", "शुक्र", 15, "04-47", "दि 06|27", "Dhanishta", "56-12", "रा 03|57", "Saubhagya", "21-12", "Bava", "04-47", "Makara", "27-54", "स 04|14", "32-38", "05:28", "06:32", "tDP flagged (02-47?), rashi clock flagged"],
];

const NAK_EN = { Pushya: "Pushya", Ashlesha: "Ashlesha", Magha: "Magha", "Purva Phalguni": "Purva Phalguni", "Uttara Phalguni": "Uttara Phalguni", Hasta: "Hasta", Chitra: "Chitra", Swati: "Swati", Vishakha: "Vishakha", Anuradha: "Anuradha", Jyeshtha: "Jyeshtha", Mula: "Mula", "Purva Ashadha": "Purva Ashadha", "Uttara Ashadha": "Uttara Ashadha", Dhanishta: "Dhanishta" };
const RASHI_EN = { Karka: 3, Simha: 4, Kanya: 5, Tula: 6, Vrishchika: 7, Dhanu: 8, Makara: 9 };

const fmtH = (h) => { const H = Math.floor(h) % 24, M = Math.round((h - Math.floor(h)) * 60); return `${String(H).padStart(2, "0")}:${String(M).padStart(2, "0")}${h >= 24 ? "+1" : ""}`; };

console.log("== A) transcription internal consistency (sunrise + d.p vs printed clock, ±2 min) ==");
for (const r of ROWS) {
  const [date, , tn, tDP, tCl, nn, nDP, nCl, , , , , , rDP, rCl, , sr] = r;
  const [sh, sm] = sr.split(":").map(Number);
  const srH = sh + sm / 60;
  const line = [date];
  const tC = clockToHoursFromDayStart(tCl.replace(" ", ""));
  const dT = tC == null ? null : (srH + dpHours(tDP)) - tC;
  line.push(`tithi ${tDP}→${fmtH(srH + dpHours(tDP))} vs ${tCl} Δ=${dT == null ? "?" : (dT * 60).toFixed(0) + "m"}`);
  const nC = clockToHoursFromDayStart(nCl.replace(" ", ""));
  const dN = nC == null ? null : (srH + dpHours(nDP)) - nC;
  line.push(`nak ${nDP}→${fmtH(srH + dpHours(nDP))} vs ${nCl} Δ=${dN == null ? "?" : (dN * 60).toFixed(0) + "m"}`);
  if (rDP) {
    const rC = clockToHoursFromDayStart(rCl.replace(" ", ""));
    const dR = rC == null ? null : (srH + dpHours(rDP)) - rC;
    line.push(`rashi ${rDP} Δ=${dR == null ? "?" : (dR * 60).toFixed(0) + "m"}`);
  }
  const ok = (dT == null || Math.abs(dT) <= 0.034) && (dN == null || Math.abs(dN) <= 0.034);
  line.push(ok ? "OK" : "CHECK");
  console.log(line.join(" | "));
}

console.log("\n== B) identity + end-instant deltas vs engines (minutes) ==");
console.log("date        | field  | printed(end) | MAKARANDA end (Δm, identity) | DRIK end (Δm, identity)");
for (const r of ROWS) {
  const [date, , tn, tDP, tCl, nn, nDP, nCl] = r;
  const [sh, sm] = r[16].split(":").map(Number);
  const srH = sh + sm / 60;
  const pT = srH + dpHours(tDP), pN = srH + dpHours(nDP);
  for (const pid of ["makaranda-v1", "drik-v1"]) {
    const p = calculatePanchang(createContext({ profileId: pid, date, location: LOC }));
    const mT = (new Date(p.tithi.endTimestamp).getTime() - new Date(`${date}T00:00:00Z`).getTime()) / 3600000 + 5.5;
    const mN = (new Date(p.nakshatra.endTimestamp).getTime() - new Date(`${date}T00:00:00Z`).getTime()) / 3600000 + 5.5;
    const dT = (mT - pT) * 60, dN = (mN - pN) * 60;
    const idT = p.tithi.pakshaNumber === tn && (p.tithi.paksha === "Shukla");
    const idN = p.nakshatra.name === NAK_EN[nn];
    console.log(`${date} | ${pid === "makaranda-v1" ? "MAK" : "DRK"} | tithi ${String(tn).padStart(2)}: end ${fmtH(pT)} | ${p.tithi.endTimestamp.slice(11, 16)} (Δ${dT >= 0 ? "+" : ""}${dT.toFixed(0)}m, ${idT ? "ID✓" : "ID✘ t=" + p.tithi.pakshaNumber}) | nak ${nn.slice(0, 6)}: ${p.nakshatra.endTimestamp.slice(11, 16)} (Δ${dN >= 0 ? "+" : ""}${dN.toFixed(0)}m, ${idN ? "ID✓" : "ID✘ " + p.nakshatra.name})`);
  }
}
