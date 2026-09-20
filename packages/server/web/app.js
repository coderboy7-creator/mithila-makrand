/* ================================================================
   Mithila Makaranda — Web Application
   Professional SPA over the deterministic calculation API.
   Language: Hindi default, English toggle (persisted).
   ================================================================ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>\"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const todayISO = () => new Date().toISOString().slice(0, 10);

/* ---------------- global state ---------------- */

const state = {
  lang: localStorage.getItem("mithila.lang") || "hi",   // Hindi default
  globalProfile: localStorage.getItem("mithila.profile") || "makaranda-v1",
  overrides: JSON.parse(localStorage.getItem("mithila.overrides") || "{}"),
  location: JSON.parse(localStorage.getItem("mithila.location") || JSON.stringify({ name: "Mithila traditional reference", latitude: null, longitude: null, useCustom: false, lat: 26.5833, lon: 85.2667 })),
  birth: JSON.parse(localStorage.getItem("mithila.birth") || JSON.stringify({ name: "", date: "1990-05-15", time: "10:30:00", place: "Faridabad", lat: 28.4089, lon: 77.3178 })),
  profiles: null,
};
function persist() {
  localStorage.setItem("mithila.lang", state.lang);
  localStorage.setItem("mithila.profile", state.globalProfile);
  localStorage.setItem("mithila.overrides", JSON.stringify(state.overrides));
  localStorage.setItem("mithila.location", JSON.stringify(state.location));
  localStorage.setItem("mithila.birth", JSON.stringify(state.birth));
}

/* ---------------- i18n ---------------- */

const I18N = {
  en: {
    brandSub: "Vedic Astrology Platform",
    sideNote: "Deterministic engines · zero LLM astronomy",
    method: "Method", profile: "Profile", ayanamsa: "Ayanamsa",
    g_panchang: "Panchang", g_market: "Marketplace", g_platform: "Platform",
    nav_dashboard: "Dashboard", nav_panchang: "Panchang", nav_kundali: "Kundali", nav_vargas: "Vargas (D-charts)", nav_dashas: "Dashas", nav_yogas: "Yogas & Doshas", nav_milan: "Kundali Milan", nav_gochar: "Gochar / Transit", nav_muhurta: "Muhurta", nav_varshaphal: "Varshaphal", nav_prashna: "Prashna", nav_reports: "Reports", nav_consult: "Consult Astrologers", nav_validation: "Validation Suite", nav_settings: "Settings",
    makName: "Makaranda / Mithila", drikName: "Drik / Modern",
    hybridName: "Hybrid (experimental)",
    badgeMak: "Calculation Method: Makaranda / Mithila · Profile: makaranda-v1 · Ayanamsa: Makaranda",
    badgeDrik: "Calculation Method: Drik · Ephemeris: built-in analytical · Ayanamsa: Lahiri",
    badgeHybrid: "Calculation Method: Makaranda v2 Hybrid · Profile: makaranda-v2-hybrid · Status: UNVERIFIED_HYBRID",
    overrideFlag: "feature override (global is", resetGlobal: "Reset to Global",
    calc: "Calculate", compare: "Compare Makaranda vs Drik", date: "Date", time: "Time",
    dob: "Date of birth", tob: "Time of birth", name: "Name (optional)", place: "Place", placePh: "Type a place — pick from suggestions", lat: "Latitude", lon: "Longitude", presets: "Presets:",
    generate: "Generate Kundali", analyse: "Analyse", match: "Match", scan: "Scan windows", computeAnnual: "Compute annual chart", castPrashna: "Cast prashna chart", genReport: "Generate report", print: "🖨 Print / Save PDF", book: "Book", cancel: "Cancel", apply: "Apply", done: "Done", interpret: "Interpret",
    north: "North Indian", south: "South Indian", east: "East Indian",
    aiTitle: "AI interpretation", aiBadge: "engine JSON only — LLM never calculates", aiIdle: "Deterministic interpreter + LLM adapter slot available.",
    dpTitle: "Danda–Pala: end time counted from this Panchang day's sunrise (1 danda = 24 min, 1 pala = 24 sec)",
    dpUnit: "d.p.", clockUnit: "clock (IST)",
    dpNote: "Danda–Pala values are END times relative to that Panchang day's sunrise (1 danda = 24 min, 1 pala = 24 sec). Clock times shown alongside are IST.",
    el: "Element", val: "Value", ends: "Ends (clock)", dp: "Danda–Pala (from sunrise)",
    tithi: "Tithi", nakshatra: "Nakshatra", yoga: "Yoga", karana: "Karana",
    sunrise: "Sunrise", sunset: "Sunset", dayLen: "Day length", rahuKaal: "Rahu Kaal", gulika: "Gulika", yamaganda: "Yamaganda", abhijit: "Abhijit", durmuhurta: "Durmuhurta",
    graha: "Graha", longitudeH: "Longitude", signH: "Sign", houseH: "House", nakH: "Nakshatra", padaH: "Pada", statusH: "Status",
    retro: "R", combust: "combust", aspects: "Aspects (Parashari drishti)", planet: "Planet", aspectsFrom: "Aspects (from lagna)", aspected: "Planets aspected",
    lagna: "Lagna", empty: "empty",
    dashaSeed: "Seed", current: "current", mahadasha: "Mahadasha", period: "Period", years: "Years", antardashas: "Antardashas", span: "Span",
    present: "present", notPresent: "not present", evidence: "Evidence", confidence: "confidence", ruleset: "ruleset",
    groom: "Groom", bride: "Bride", koota: "Koota", score: "Score", note: "Note", cancellations: "Classical cancellation rules applied",
    natalDate: "Natal date (for Moon)", natalTime: "Natal time", transitDate: "Transit date", includeSeries: "include 3-year series", analyseTransit: "Analyse transit",
    activity: "Activity", from: "From", to: "To",
    returnYear: "Return year", qDate: "Question date", qTime: "Question time", qText: "Question (context only — never used for calculation)",
    avail: "available", busy: "busy", consults: "consultations", yrs: "yrs",
    bookTitle: "Book with", modeH: "Consultation mode", chat: "Chat", call: "Audio call", video: "Video call", inperson: "In person", duration: "Duration (min)", topic: "Topic / birth details to share", confirmBtn: "Confirm",
    myConsults: "My consultations (CRM)", ref: "Ref", astrologer: "Astrologer", when: "When", fee: "Fee", statusH2: "Status", noConsults: "No consultations yet.",
    gateTitle: "Makaranda release gate", engines: "Isolated engines (never mixed)", vargas15: "Divisional charts (D2–D60)", dashaSys: "Dasha systems",
    todayPanchang: "Today's Panchang", goldenDS: "Golden validation dataset", twoModes: "Two calculation modes", platformStatus: "Platform status",
    thTime: "Time", thEndpoint: "Endpoint", thMode: "Mode", noCalc: "No calculation requests yet this session.",
    goldenRows: "Golden rows", tolerance: "Tolerance", drikIdentity: "Drik tithi identity", makMax: "Makaranda max |Δ|", openSuite: "Open Validation Suite →",
    langBtn: "EN", langTitle: "Switch language / भाषा बदलें",
  },
  hi: {
    brandSub: "वैदिक ज्योतिष प्लेटफ़ॉर्म",
    sideNote: "निर्धारक (डिटरमिनिस्टिक) इंजन · LLM खगोल-गणना शून्य",
    method: "विधि", profile: "प्रोफ़ाइल", ayanamsa: "अयनांश",
    g_panchang: "पंचांग", g_market: "बाज़ार", g_platform: "प्लेटफ़ॉर्म",
    nav_dashboard: "डैशबोर्ड", nav_panchang: "पंचांग", nav_kundali: "कुंडली", nav_vargas: "वर्ग चक्र (D-चार्ट)", nav_dashas: "दशाएँ", nav_yogas: "योग व दोष", nav_milan: "कुंडली मिलान", nav_gochar: "गोचर", nav_muhurta: "मुहूर्त", nav_varshaphal: "वर्षफल", nav_prashna: "प्रश्न", nav_reports: "प्रतिवेदन", nav_consult: "ज्योतिषी परामर्श", nav_validation: "सत्यापन सूट", nav_settings: "सेटिंग्स",
    makName: "मकरंद / मिथिला", drikName: "दृक् / आधुनिक",
    hybridName: "हाइब्रिड (प्रायोगिक)",
    badgeMak: "गणना विधि: मकरंद / मिथिला · प्रोफ़ाइल: makaranda-v1 · अयनांश: मकरंद",
    badgeDrik: "गणना विधि: दृक् · एफेमेरिस: बिल्ट-इन विश्लेषिक · अयनांश: लाहिरी",
    badgeHybrid: "गणना विधि: मकरंद v2 हाइब्रिड · प्रोफ़ाइल: makaranda-v2-hybrid · स्थिति: अनसत्यापित हाइब्रिड",
    overrideFlag: "फीचर ओवरराइड (ग्लोबल है", resetGlobal: "ग्लोबल पर लौटें",
    calc: "गणना करें", compare: "मकरंद बनाम दृक् तुलना", date: "दिनांक", time: "समय",
    dob: "जन्म तिथि", tob: "जन्म समय", name: "नाम (वैकल्पिक)", place: "स्थान", placePh: "स्थान लिखें — सूची से चुनें", lat: "अक्षांश", lon: "देशांतर", presets: "प्रीसेट:",
    generate: "कुंडली बनाएँ", analyse: "विश्लेषण करें", match: "मिलान करें", scan: "मुहूर्त खोजें", computeAnnual: "वार्षिक कुंडली बनाएँ", castPrashna: "प्रश्न कुंडली बनाएँ", genReport: "प्रतिवेदन बनाएँ", print: "🖨 प्रिंट / PDF", book: "बुक करें", cancel: "रद्द करें", apply: "लागू करें", done: "ठीक है", interpret: "व्याख्या करें",
    north: "उत्तर भारतीय", south: "दक्षिण भारतीय", east: "पूर्व भारतीय",
    aiTitle: "AI व्याख्या", aiBadge: "केवल इंजन JSON — LLM गणना कभी नहीं", aiIdle: "निर्धारक व्याख्याकार + LLM एडाप्टर स्लॉट उपलब्ध।",
    dpTitle: "दण्ड–पल: इस पंचांग दिवस के सूर्योदय से गिना गया अंत समय (1 दण्ड = 24 मिनट, 1 पल = 24 सेकंड)",
    dpUnit: "द.प.", clockUnit: "घड़ी समय (IST)",
    dpNote: "दण्ड–पल मान उस पंचांग दिवस के सूर्योदय के सापेक्ष अंत समय हैं (1 दण्ड = 24 मिनट, 1 पल = 24 सेकंड)। साथ दिखाए घड़ी समय IST में हैं।",
    el: "तत्व", val: "मान", ends: "अंत (घड़ी समय)", dp: "दण्ड–पल (सूर्योदय से)",
    tithi: "तिथि", nakshatra: "नक्षत्र", yoga: "योग", karana: "करण",
    sunrise: "सूर्योदय", sunset: "सूर्यास्त", dayLen: "दिनमान", rahuKaal: "राहुकाल", gulika: "गुलिक", yamaganda: "यमघंटी", abhijit: "अभिजीत मुहूर्त", durmuhurta: "दुर्मुहूर्त",
    graha: "ग्रह", longitudeH: "रेखांश", signH: "राशि", houseH: "भाव", nakH: "नक्षत्र", padaH: "पाद", statusH: "स्थिति",
    retro: "व", combust: "दग्ध", aspects: "दृष्टियाँ (पराशरी)", planet: "ग्रह", aspectsFrom: "दृष्टि (लग्न से)", aspected: "दृष्ट ग्रह",
    lagna: "लग्न", empty: "रिक्त",
    dashaSeed: "सीड", current: "चालू", mahadasha: "महादशा", period: "अवधि", years: "वर्ष", antardashas: "अंतर्दशाएँ", span: "अवधि",
    present: "उपस्थित", notPresent: "अनुपस्थित", evidence: "प्रमाण", confidence: "विश्वास", ruleset: "नियम-समूह",
    groom: "वर", bride: "वधू", koota: "कूट", score: "अंक", note: "टिप्पणी", cancellations: "लागू शास्त्रीय अपवाद नियम",
    natalDate: "जन्म तिथि (चंद्र हेतु)", natalTime: "जन्म समय", transitDate: "गोचर दिनांक", includeSeries: "3-वर्ष शृंखला जोड़ें", analyseTransit: "गोचर विश्लेषण",
    activity: "कार्य", from: "आरंभ", to: "अंत",
    returnYear: "वर्ष", qDate: "प्रश्न दिनांक", qTime: "प्रश्न समय", qText: "प्रश्न (केवल संदर्भ — गणना में कभी प्रयुक्त नहीं)",
    avail: "उपलब्ध", busy: "व्यस्त", consults: "परामर्श", yrs: "वर्ष",
    bookTitle: "बुक करें —", modeH: "परामर्श माध्यम", chat: "चैट", call: "ऑडियो कॉल", video: "वीडियो कॉल", inperson: "सामने", duration: "अवधि (मिनट)", topic: "विषय / साझा करने हेतु जन्म विवरण", confirmBtn: "पुष्टि",
    myConsults: "मेरे परामर्श (CRM)", ref: "संदर्भ", astrologer: "ज्योतिषी", when: "कब", fee: "शुल्क", statusH2: "स्थिति", noConsults: "अभी कोई परामर्श नहीं।",
    gateTitle: "मकरंद रिलीज़ गेट", engines: "पृथक् इंजन (कभी मिश्रित नहीं)", vargas15: "वर्ग चक्र (D2–D60)", dashaSys: "दशा प्रणालियाँ",
    todayPanchang: "आज का पंचांग", goldenDS: "गोल्डन सत्यापन डेटासेट", twoModes: "दो गणना विधियाँ", platformStatus: "प्लेटफ़ॉर्म स्थिति",
    thTime: "समय", thEndpoint: "एंडपॉइंट", thMode: "विधि", noCalc: "इस सत्र में अभी कोई गणना अनुरोध नहीं।",
    goldenRows: "गोल्डन पंक्तियाँ", tolerance: "सहनशीलता", drikIdentity: "दृक् तिथि पहचान", makMax: "मकरंद अधिकतम |Δ|", openSuite: "सत्यापन सूट खोलें →",
    langBtn: "EN", langTitle: "Switch to English",
  },
};
function t(k) { return (I18N[state.lang] && I18N[state.lang][k]) || I18N.en[k] || k; }
const HI = () => state.lang === "hi";

/* ---------------- Devanagari astronomy lexicon ---------------- */

const NAK_HI = { Ashwini: "अश्विनी", Bharani: "भरणी", Krittika: "कृत्तिका", Rohini: "रोहिणी", Mrigashira: "मृगशिरा", Ardra: "आर्द्रा", Punarvasu: "पुनर्वसु", Pushya: "पुष्य", Ashlesha: "अश्लेषा", Magha: "मघा", "Purva Phalguni": "पूर्व फाल्गुनी", "Uttara Phalguni": "उत्तर फाल्गुनी", Hasta: "हस्त", Chitra: "चित्रा", Swati: "स्वाती", Vishakha: "विशाखा", Anuradha: "अनुराधा", Jyeshtha: "ज्येष्ठा", Mula: "मूल", "Purva Ashadha": "पूर्वाषाढ़ा", "Uttara Ashadha": "उत्तराषाढ़ा", Shravana: "श्रवण", Dhanishta: "धनिष्ठा", Shatabhisha: "शतभिषा", "Purva Bhadrapada": "पूर्व भाद्रपदा", "Uttara Bhadrapada": "उत्तर भाद्रपदा", Revati: "रेवती" };
const TITHI_HI = { Pratipada: "प्रतिपदा", Dwitiya: "द्वितीया", Tritiya: "तृतीया", Chaturthi: "चतुर्थी", Panchami: "पंचमी", Shashthi: "षष्ठी", Saptami: "सप्तमी", Ashtami: "अष्टमी", Navami: "नवमी", Dashami: "दशमी", Ekadashi: "एकादशी", Dwadashi: "द्वादशी", Trayodashi: "त्रयोदशी", Chaturdashi: "चतुर्दशी", Purnima: "पूर्णिमा", Amavasya: "अमावस्या" };
const PAKSHA_HI = { Shukla: "शुक्ल", Krishna: "कृष्ण" };
const YOGA_HI = { Vishkambha: "विष्कम्भ", Priti: "प्रीति", Ayushman: "आयुष्मान्", Saubhagya: "सौभाग्य", Shobhana: "शोभन", Atiganda: "अतिगण्ड", Sukarma: "सुकर्मा", Dhriti: "धृति", Shoola: "शूल", Ganda: "गण्ड", Vriddhi: "वृद्धि", Dhruva: "ध्रुव", Vyaghata: "व्याघात", Harshana: "हर्षण", Vajra: "वज्र", Siddhi: "सिद्धि", Vyatipata: "व्यतीपात", Variyan: "परिघ (वरियान्)", Parigha: "परिघ", Shiva: "शिव", Siddha: "सिद्ध", Sadhya: "साध्य", Shubha: "शुभ", Shukla: "शुक्ल", Brahma: "ब्रह्म", Indra: "इन्द्र", Vaidhriti: "वैधृति" };
const KARANA_HI = { Kimstughna: "किम्स्तुघ्न", Bava: "बव", Balava: "बालव", Kaulava: "कौलव", Taitila: "तैतिल", Garaja: "गर", Vanija: "वणिज", Vishti: "विष्टि (भद्रा)", Shakuni: "शकुनि", Chatushpada: "चतुष्पाद", Naga: "नाग" };
const PLANET_HI = { Sun: "सूर्य", Moon: "चन्द्र", Mars: "मंगल", Mercury: "बुध", Jupiter: "गुरु", Venus: "शुक्र", Saturn: "शनि", Rahu: "राहु", Ketu: "केतु" };
const SIGN_HI = ["मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];
const SIGN_LAT = ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya", "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"];
const VARA_HI = { Ravi: "रवि (रविवार)", Soma: "सोम (सोमवार)", Mangala: "मंगल (मंगलवार)", Budha: "बुध (बुधवार)", Guru: "गुरु (गुरुवार)", Shukra: "शुक्र (शुक्रवार)", Shani: "शनि (शनिवार)" };
const KOTA_HI = { Varna: "वर्ण", Vashya: "वश्य", Tara: "तारा", Yoni: "योनि", "Graha Maitri": "ग्रह मैत्री", Gana: "गण", Bhakoot: "भकूट", Nadi: "नाड़ी" };

/** Translate a known astronomy name when Hindi is active. */
function A(name) {
  if (!HI()) return name;
  return PLANET_HI[name] || NAK_HI[name] || YOGA_HI[name] || KARANA_HI[name] || TITHI_HI[name] || name;
}
const signLbl = (i) => (HI() ? SIGN_HI[i] : SIGN_LAT[i]);
const varaLbl = (v) => { if (!HI()) return v; const w = String(v).split(" ")[0]; return VARA_HI[w] || v; };
const tithiLbl = (paksha, name) => (HI() ? `${PAKSHA_HI[paksha] ?? paksha} ${TITHI_HI[name] ?? name}` : `${paksha} ${name}`);
const kootaLbl = (k) => (HI() ? KOTA_HI[k] ?? k : k);

/** Timing display helpers — always state the unit explicitly. */
const dpBadge = (dp) => `<span class="badge mono" title="${t("dpTitle")}">${t("dpUnit")} ${dp}</span>`;
const clockSpan = (ts) => `<span class="mono">${ts}</span>`;
const dpNoteBox = () => `<div class="note">${t("dpNote")}</div>`;

async function api(path, body) {
  const res = await fetch(path, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {});
  const j = await res.json().catch(() => ({ error: "bad response" }));
  if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
  return j;
}

/* ---------------- method selection (spec §4) ---------------- */

function effectiveProfile(feature) { return state.overrides[feature] || state.globalProfile; }
function isOverride(feature) { return !!state.overrides[feature]; }
function setProfile(feature, pid) {
  if (feature === "__global") state.globalProfile = pid;
  else state.overrides[feature] = pid;
  persist(); renderChrome(); route();
}
function resetOverride(feature) { delete state.overrides[feature]; persist(); renderChrome(); route(); }

const PROFILE_LABEL_KEY = { "makaranda-v1": "makName", "drik-v1": "drikName", "makaranda-v2-hybrid": "hybridName" };
const PROFILE_BADGE_KEY = { "makaranda-v1": "badgeMak", "drik-v1": "badgeDrik", "makaranda-v2-hybrid": "badgeHybrid" };
function profileLabel(pid) { return t(PROFILE_LABEL_KEY[pid] ?? "makName"); }
function methodBar(feature) {
  const eff = effectiveProfile(feature);
  const over = isOverride(feature);
  return `
  <div class="row no-print methodbar">
    <div class="seg" data-feature="${feature}">
      <button class="${eff === "makaranda-v1" ? "on" : ""}" data-pid="makaranda-v1">${t("makName")}</button>
      <button class="${eff === "drik-v1" ? "on" : ""}" data-pid="drik-v1">${t("drikName")}</button>
      <button class="${eff === "makaranda-v2-hybrid" ? "on" : ""}" data-pid="makaranda-v2-hybrid" title="${esc(t("badgeHybrid"))}">${t("hybridName")}</button>
    </div>
    ${over ? `<span class="override-flag">⚠ ${t("overrideFlag")} ${profileLabel(state.globalProfile)}) — <a href="#" data-reset="${feature}">${t("resetGlobal")}</a></span>` : ""}
    <span class="badge ${eff === "makaranda-v2-hybrid" ? "amber" : "gold"} mono method-chip">${t(PROFILE_BADGE_KEY[eff] ?? "badgeMak")}</span>
  </div>`;
}

document.addEventListener("click", (e) => {
  const seg = e.target.closest(".seg");
  if (seg && e.target.dataset.pid) { setProfile(seg.dataset.feature, e.target.dataset.pid); return; }
  if (e.target.dataset.reset) { e.preventDefault(); resetOverride(e.target.dataset.reset); return; }
});

/* ---------------- nav & chrome ---------------- */

const NAV = [
  ["", "nav_dashboard", "M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6V11h-6v9zm0-16v5h6V4h-6z"],
  ["g_panchang", "nav_panchang", "M7 2v2M17 2v2M4 8h16M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z"],
  ["", "nav_kundali", "M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.8 5.5 21l2-7.5L2 9h7z"],
  ["", "nav_vargas", "M4 4h16v16H4zM4 12h16M12 4v16"],
  ["", "nav_dashas", "M12 8v4l3 3M12 21a9 9 0 100-18 9 9 0 000 18z"],
  ["", "nav_yogas", "M12 3l1.8 5.4H20l-4.5 3.4 1.7 5.5L12 14l-5.2 3.3 1.7-5.5L4 8.4h6.2z"],
  ["", "nav_milan", "M9 12a4 4 0 100-8 4 4 0 000 8zm6 8a4 4 0 100-8 4 4 0 000 8z"],
  ["", "nav_gochar", "M3 12h4l2-7 4 14 2-7h6"],
  ["", "nav_muhurta", "M8 7V3m8 4V3M4 11h16M6 5h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z"],
  ["", "nav_varshaphal", "M12 2v20M2 12h20M5 5l14 14M19 5L5 19"],
  ["", "nav_prashna", "M9 9a3 3 0 115 2.2c-.8.7-1.5 1.3-1.5 2.3m.2 3.5h.03M12 21a9 9 0 100-18 9 9 0 000 18z"],
  ["", "nav_reports", "M8 3h8l4 4v14H4V3h4zm0 9h8m-8 4h5"],
  ["g_market", "nav_consult", "M4 6h16M4 12h16M4 18h10"],
  ["g_platform", "nav_validation", "M5 13l4 4L19 7"],
  ["", "nav_settings", "M12 15a3 3 0 100-6 3 3 0 000 6zm7-3a7 7 0 01-.1 1.2l2 1.6-2 3.4-2.4-1a7 7 0 01-2 1.2L14 21h-4l-.5-2.6a7 7 0 01-2-1.2l-2.4 1-2-3.4 2-1.6A7 7 0 015 12c0-.4 0-.8.1-1.2l-2-1.6 2-3.4 2.4 1a7 7 0 012-1.2L10 3h4l.5 2.6a7 7 0 012 1.2l2.4-1 2 3.4-2 1.6c.07.4.1.8.1 1.2z"],
];

function renderChrome() {
  const nav = $("#nav");
  let html = "";
  for (const [group, key, icon] of NAV) {
    if (group) html += `<div class="group">${t(group)}</div>`;
    const slug = key.replace(/^nav_/, "").replace(/[^a-z]+/g, "-");
    const label = t(key);
    html += `<a data-route="${slug}" class="${location.hash.slice(2) === slug ? "active" : ""}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="${icon}"/></svg>${label}</a>`;
  }
  nav.innerHTML = html;
  $$("#nav a").forEach((a) => (a.onclick = () => { location.hash = "#/" + a.dataset.route; }));
  $("#global-method-label").textContent = profileLabel(state.globalProfile);
  $("#profile-chip").textContent = `${t("profile")}: ${state.globalProfile}`;
  {
    const prof = state.profiles?.profiles?.[state.globalProfile];
    const strat = prof?.ayanamsa?.strategy;
    const AY_NAMES = { LAHIRI_CITRA: "Lahiri · Chitra", LAHIRI: "Lahiri (tabular)", RAMAN: "Raman", KRISHNAMURTI: "Krishnamurti", YUKTESHWAR: "Yukteshwar", FAGAN_BRADLEY: "Fagan–Bradley" };
    const ayLabel = state.globalProfile === "makaranda-v2-hybrid" ? "Makaranda (hybrid fit)"
      : state.globalProfile === "makaranda-v1" ? "Makaranda"
      : (AY_NAMES[strat] || strat || "Lahiri · Chitra");
    $("#ayanamsa-chip").textContent = `${t("ayanamsa")}: ${ayLabel}`;
  }
  $("#brand-sub").textContent = t("brandSub");
  $("#side-note").textContent = t("sideNote");
  $("#lang-btn").textContent = t("langBtn");
  $("#lang-btn").title = t("langTitle");
}

/* slug map: nav keys → page keys */
const SLUG_PAGE = { dashboard: "dashboard", panchang: "panchang", kundali: "kundali", vargas: "vargas-d-charts", dashas: "dashas", yogas: "yogas-doshas", milan: "kundali-milan", gochar: "gochar-transit", muhurta: "muhurta", varshaphal: "varshaphal", prashna: "prashna", reports: "reports", consult: "consult-astrologers", validation: "validation-suite", settings: "settings" };

$("#global-method").onclick = () => openMethodModal();
$("#theme-btn").onclick = () => {
  const th = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = th; localStorage.setItem("mithila.theme", th);
};
document.documentElement.dataset.theme = localStorage.getItem("mithila.theme") || "dark";
$("#lang-btn").onclick = () => { state.lang = HI() ? "en" : "hi"; persist(); renderChrome(); route(); };

function openMethodModal() {
  const mak = state.globalProfile === "makaranda-v1";
  modal(`
  <h2>${HI() ? "गणना पद्धति" : "Calculation System"}</h2>
  <p class="faint">${HI() ? "वैश्विक प्राथमिकता। प्रत्येक फ़ीचर इसे स्थानीय रूप से ओवरराइड कर सकता है; परिणाम सदैव अपनी प्रोफ़ाइल साथ ले चलते हैं।" : "Global preference. Every feature can override this locally; results always carry the profile that produced them."}</p>
  <div style="display:grid;gap:10px;margin:14px 0">
    <label class="card flat check-card">
      <input type="radio" name="gm" value="makaranda-v1" ${mak ? "checked" : ""}>
      <div><b>${t("makName")}</b> — ${HI() ? "डिफ़ॉल्ट" : "default"}<br>
      <span class="faint">Mithila Vishwavidyalaya Panchang · Makarandaanushar · Surya Siddhanta tradition · makaranda-v1</span></div>
    </label>
    <label class="card flat check-card">
      <input type="radio" name="gm" value="drik-v1" ${state.globalProfile === "drik-v1" ? "checked" : ""}>
      <div><b>${t("drikName")}</b><br>
      <span class="faint">${HI() ? "बिल्ट-इन विश्लेषिक एफेमेरिस — पूर्ण मीयस शृंखला, PyEphem-प्रमाणित (चंद्र ≤7.3″) · विन्यासयोग्य अयनांश" : "Built-in analytical ephemeris — full Meeus series, PyEphem-certified (moon ≤7.3″) · configurable ayanamsa"}</span></div>
    </label>
    <label class="card flat check-card">
      <input type="radio" name="gm" value="makaranda-v2-hybrid" ${state.globalProfile === "makaranda-v2-hybrid" ? "checked" : ""}>
      <div><b>${t("hybridName")}</b> <span class="badge amber">UNVERIFIED_HYBRID</span><br>
      <span class="faint">${HI() ? "प्रायोगिक सेतु इंजन — आधुनिक-आधारित माध्य + शास्त्रीय विक्षोभ शृंखला; सारणी आने तक" : "Experimental bridge engine — modern-anchored means + classical perturbation series; until worksheets arrive"}</span></div>
    </label>
  </div>
  <h3>${HI() ? "उन्नत" : "Advanced"}</h3>
  <div class="kv mono">
    <div>${HI() ? "पंचांग प्रोफ़ाइल" : "Panchang Profile"}</div><div>Mithila Vishwavidyalaya</div>
    <div>${t("ayanamsa")}</div><div>${state.globalProfile === "drik-v1" ? "Lahiri / Raman / KP / Yukteshwar / Fagan" : state.globalProfile === "makaranda-v2-hybrid" ? "Makaranda (calibrated anchor + hybrid fit, UNVERIFIED_HYBRID)" : "Makaranda (calibrated anchor, UNVERIFIED)"}</div>
    <div>${HI() ? "अक्षांश" : "Akshansh"}</div><div>26°35′ N</div>
    <div>${HI() ? "देशांतर (मुद्रित)" : "Deshantar (printed)"}</div><div>01|35 — UNVERIFIED</div>
    <div>${HI() ? "पलभा" : "Palbha"}</div><div>06</div>
  </div>
  <div class="row end" style="margin-top:16px">
    <button class="btn" data-close>${t("cancel")}</button>
    <button class="btn primary" id="gm-save">${t("apply")}</button>
  </div>`);
  $("#gm-save").onclick = () => {
    setProfile("__global", $$("#modal-root input[name=gm]").find((r) => r.checked).value);
    closeModal();
  };
}

function modal(html) { $("#modal-root").innerHTML = `<div class="modal-bg"><div class="modal">${html}</div></div>`; $$("#modal-root [data-close]").forEach((b) => (b.onclick = closeModal)); $("#modal-root .modal-bg").addEventListener("click", (e) => { if (e.target.classList.contains("modal-bg")) closeModal(); }); }
function closeModal() { $("#modal-root").innerHTML = ""; }

/* ---------------- charts ---------------- */

const SIGN_ABBR = ["Mes", "Vri", "Gem", "Kan", "Leo", "Vir", "Lib", "Vrs", "Dha", "Mak", "Kum", "Mee"];
const PLANET_ABBR = { Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me", Jupiter: "Ju", Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke" };
const SIGN_ABBR_DEV = ["मेष", "वृष", "मिथु", "कर्क", "सिंह", "कन्या", "तुला", "वृश्च", "धनु", "मकर", "कुंभ", "मीन"];
const PLANET_ABBR_DEV = { Sun: "सू", Moon: "चं", Mars: "मं", Mercury: "बु", Jupiter: "गु", Venus: "शु", Saturn: "श", Rahu: "रा", Ketu: "के" };
const chartSignAbbr = (i) => (HI() ? SIGN_ABBR_DEV[i] : SIGN_ABBR[i]);
const chartPlanetAbbr = (n) => (HI() ? PLANET_ABBR_DEV[n] ?? n : PLANET_ABBR[n] ?? n);
function chartDeg(lon) { const d = lon % 30; const dd = Math.floor(d); const mm = Math.floor((d - dd) * 60); return `${dd}°${String(mm).padStart(2, "0")}′`; }
function chartEntries(sign, signOccupants, positions) {
  const names = signOccupants[sign] || [];
  if (!positions) return names.filter((n) => n !== "Lagna").map((n) => ({ label: chartPlanetAbbr(n) }));
  return names.filter((n) => n !== "Lagna").map((n) => {
    const p = positions.find((x) => x.name === n);
    return p ? { label: `${chartPlanetAbbr(n)} ${chartDeg(p.longitude)}${p.retrograde ? (HI() ? "(व)" : "(R)") : ""}` } : { label: chartPlanetAbbr(n) };
  });
}
function chartHouseText(ax, ay, signLabel, entries, rowH) {
  const startY = ay - (entries.length * rowH) / 2 + 4;
  let s = `<text x="${ax}" y="${startY}" class="ch-sign">${signLabel}</text>`;
  entries.forEach((e, i) => { s += `<text x="${ax}" y="${startY + (i + 1) * rowH}" class="ch-planet">${e.label}</text>`; });
  return s;
}
function northChartSVG(lagnaSign, signOccupants, positions) {
  const S = 440, M = 220;
  const anchors = [[220, 92], [112, 40], [40, 112], [112, 220], [40, 328], [112, 396], [220, 348], [328, 396], [400, 328], [328, 220], [400, 112], [328, 40]];
  let g = "";
  for (let h = 0; h < 12; h++) {
    const sign = (lagnaSign + h) % 12;
    const [ax, ay] = anchors[h];
    g += chartHouseText(ax, ay, chartSignAbbr(sign) + (h === 0 ? (HI() ? " · लग्न" : " · Lag") : ""), chartEntries(sign, signOccupants, positions), 17);
  }
  return `<svg class="chart-svg" viewBox="0 0 ${S} ${S}" role="img" aria-label="North Indian chart">
<rect x="3" y="3" width="${S - 6}" height="${S - 6}" class="ch-frame"/>
<path d="M3,3 L${S-3},${S-3} M${S-3},3 L3,${S-3} M${M},3 L${S-3},${M} L${M},${S-3} L3,${M} Z" class="ch-line"/>
${g}</svg>`;
}
function eastChartSVG(lagnaSign, houseOccupantsBySign, positions) {
  const S = 440, W = S / 3, Hh = S / 4;
  const ring = [[1, 0], [2, 0], [2, 1], [2, 2], [2, 3], [1, 3], [0, 3], [0, 2], [0, 1], [0, 0]];
  let g = "";
  const cell = (sign, x, y, w, h, tag) => {
    let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="ch-cell"/>`;
    if (tag) out += `<line x1="${x}" y1="${y}" x2="${x + 26}" y2="${y + 26}" class="ch-lagna"/>`;
    return out + chartHouseText(x + w / 2, y + h / 2 - 6, chartSignAbbr(sign) + (tag ? (HI() ? " · लग्न" : " · Lag") : ""), chartEntries(sign, houseOccupantsBySign, positions), 16);
  };
  ring.forEach(([cx, cy], i) => { g += cell((lagnaSign + i) % 12, cx * W, cy * Hh, W, Hh, i === 0); });
  g += cell((lagnaSign + 10) % 12, W, Hh, W, Hh, false);
  g += cell((lagnaSign + 11) % 12, W, 2 * Hh, W, Hh, false);
  return `<svg class="chart-svg" viewBox="0 0 ${S} ${S}" role="img" aria-label="East Indian chart">${g}</svg>`;
}
function southChartSVG(lagnaSign, signOccupants, markAsLagna = true, positions) {
  const S = 440, C = 110;
  const cell = { 11: [0, 0], 0: [1, 0], 1: [2, 0], 2: [3, 0], 10: [0, 1], 3: [3, 1], 9: [0, 2], 4: [3, 2], 8: [0, 3], 7: [1, 3], 6: [2, 3], 5: [3, 3] };
  let g = "";
  for (let sign = 0; sign < 12; sign++) {
    const [cx, cy] = cell[sign];
    const x = cx * C, y = cy * C;
    const isL = markAsLagna && sign === lagnaSign;
    g += `<rect x="${x}" y="${y}" width="${C}" height="${C}" class="ch-cell"/>`;
    if (isL) g += `<line x1="${x}" y1="${y}" x2="${x + 26}" y2="${y + 26}" class="ch-lagna"/>`;
    g += chartHouseText(x + C / 2, y + C / 2 - 8, chartSignAbbr(sign) + (isL ? (HI() ? " · लग्न" : " · Lag") : ""), chartEntries(sign, signOccupants, positions), 16);
  }
  return `<svg class="chart-svg" viewBox="0 0 ${S} ${S}" role="img" aria-label="South Indian chart">${g}</svg>`;
}
function chartLegend(positions) {
  if (!positions) return "";
  return `<div class="chart-legend">${positions.filter((p) => p.name !== "Lagna").map((p) => `<span><b>${chartPlanetAbbr(p.name)}</b> ${chartSignAbbr(p.sign)} ${chartDeg(p.longitude)}${p.retrograde ? ` <em>${HI() ? "(व)" : "(R)"}</em>` : ""}</span>`).join("")}</div>`;
}

/* ---------------- shared UI bits ---------------- */

function birthFormHTML(prefix = "") {
  const b = state.birth;
  return `
  <div class="grid cols-3">
    <div><label>${t("dob")}</label><input type="date" id="${prefix}b-date" value="${b.date}"></div>
    <div><label>${t("tob")}</label><input type="time" step="1" id="${prefix}b-time" value="${b.time}"></div>
    <div><label>${t("name")}</label><input id="${prefix}b-name" value="${esc(b.name)}"></div>
    <div><label>${t("place")}</label><div class="geo-wrap"><input id="${prefix}b-place" data-geo data-geo-lat="${prefix}b-lat" data-geo-lon="${prefix}b-lon" autocomplete="off" placeholder="${t("placePh")}" value="${esc(b.place)}"><div class="geo-hint" id="${prefix}b-geo-hint"></div></div></div>
    <div><label>${t("lat")}</label><input id="${prefix}b-lat" type="number" step="0.0001" value="${b.lat}"></div>
    <div><label>${t("lon")}</label><input id="${prefix}b-lon" type="number" step="0.0001" value="${b.lon}"></div>
  </div>
  <div class="row preset-row">
    <span class="faint">${t("presets")}</span>
    ${[["Faridabad", 28.4089, 77.3178], ["Darbhanga", 26.154, 85.898], ["Sitamarhi", 26.6, 85.5], ["New Delhi", 28.6139, 77.209], ["Varanasi", 25.3176, 82.9739]].map(([n, la, lo]) => `<button class="btn small" data-preset="${la},${lo},${n}">${n}</button>`).join("")}
  </div>`;
}
function readBirth(prefix = "") {
  const g = (id) => $(`#${prefix}${id}`);
  const b = { date: g("b-date").value, time: g("b-time").value, name: g("b-name").value, place: g("b-place").value, lat: +g("b-lat").value, lon: +g("b-lon").value };
  state.birth = b; persist();
  return b;
}
document.addEventListener("click", (e) => {
  if (e.target.dataset.preset) {
    const [la, lo, n] = e.target.dataset.preset.split(",");
    state.birth.lat = +la; state.birth.lon = +lo; state.birth.place = n; persist(); route();
  }
});

/* ---------- place autocomplete (offline gazetteer via /api/v1/geo/search) ---------- */
let geoSeq = 0;
function geoClose(input) {
  const dd = document.getElementById(input.dataset.geoDd || "");
  if (dd) dd.remove();
  input.removeAttribute("data-geo-dd");
}
function geoHint(input, r) {
  const wrap = input.closest(".geo-wrap");
  const hint = wrap && wrap.querySelector(".geo-hint");
  if (!hint) return;
  hint.textContent = r
    ? `${Math.abs(r.latitude).toFixed(4)}° ${r.latitude >= 0 ? "N" : "S"} · ${Math.abs(r.longitude).toFixed(4)}° ${r.longitude >= 0 ? "E" : "W"} · ${r.region && r.region !== "—" ? r.region + ", " : ""}${r.country}`
    : "";
}
function geoSelect(input, r) {
  input.value = r.name;
  const la = document.getElementById(input.dataset.geoLat || ""), lo = document.getElementById(input.dataset.geoLon || "");
  if (la) la.value = r.latitude.toFixed(4);
  if (lo) lo.value = r.longitude.toFixed(4);
  geoHint(input, r);
  if (input.id.endsWith("b-place")) { state.birth.place = r.name; state.birth.lat = r.latitude; state.birth.lon = r.longitude; persist(); }
  geoClose(input);
}
function geoRender(input, results) {
  if (!results.length) { geoClose(input); return; }
  let dd = document.getElementById(input.dataset.geoDd || "");
  if (!dd) {
    dd = document.createElement("div");
    dd.className = "geo-dd";
    dd.id = "geo-dd-" + (++geoSeq);
    input.dataset.geoDd = dd.id;
    (input.closest(".geo-wrap") || input.parentNode).appendChild(dd);
  }
  dd.dataset.results = JSON.stringify(results);
  dd.innerHTML = results.map((r, i) => `<div class="geo-item${i === 0 ? " active" : ""}" data-geo-i="${i}"><span><b>${esc(r.name)}</b>${r.hi && r.hi !== "—" ? `<span class="geo-hi">${esc(r.hi)}</span>` : ""}</span><small>${esc(r.region && r.region !== "—" ? r.region + " · " : "")}${esc(r.country)} · ${r.latitude.toFixed(2)}°, ${r.longitude.toFixed(2)}°</small></div>`).join("");
  dd.querySelectorAll(".geo-item").forEach((el) => {
    el.addEventListener("mousedown", (e) => { e.preventDefault(); geoSelect(input, results[+el.dataset.geoI]); });
  });
}
document.addEventListener("input", (e) => {
  const input = e.target.closest ? e.target.closest("[data-geo]") : null;
  if (!input) return;
  clearTimeout(input._geoTimer);
  const q = input.value.trim();
  geoHint(input, null);
  if (q.length < 1) { geoClose(input); return; }
  input._geoTimer = setTimeout(async () => {
    const seq = ++geoSeq; input._geoSeq = seq;
    try {
      const r = await api(`/api/v1/geo/search?q=${encodeURIComponent(q)}`);
      if (input._geoSeq !== seq || !input.isConnected) return;
      geoRender(input, r.results || []);
    } catch { /* network hiccup — stay silent */ }
  }, 180);
});
document.addEventListener("keydown", (e) => {
  const input = e.target.closest ? e.target.closest("[data-geo]") : null;
  if (!input) return;
  const dd = document.getElementById(input.dataset.geoDd || "");
  if (!dd) return;
  const items = [...dd.querySelectorAll(".geo-item")];
  if (!items.length) return;
  const cur = items.findIndex((el) => el.classList.contains("active"));
  if (e.key === "ArrowDown") { e.preventDefault(); items[cur]?.classList.remove("active"); items[(cur + 1) % items.length].classList.add("active"); }
  else if (e.key === "ArrowUp") { e.preventDefault(); items[cur]?.classList.remove("active"); items[(cur - 1 + items.length) % items.length].classList.add("active"); }
  else if (e.key === "Enter") { e.preventDefault(); const sel = items.find((el) => el.classList.contains("active")) || items[0]; geoSelect(input, JSON.parse(dd.dataset.results)[+sel.dataset.geoI]); }
  else if (e.key === "Escape") { geoClose(input); }
});
document.addEventListener("click", (e) => {
  if (!e.target.closest("[data-geo]") && !e.target.closest(".geo-dd")) document.querySelectorAll(".geo-dd").forEach((d) => d.remove());
});

function bodyFromBirth(b, feature) {
  return { profileId: effectiveProfile(feature), date: b.date, time: b.time, latitude: b.lat, longitude: b.lon, placeName: b.place, name: b.name };
}

function aiPanel(kind, structured, id) {
  return `
  <div class="card flat" style="margin-top:14px">
    <div class="row"><h3 style="margin:0">${t("aiTitle")}</h3><span class="badge blue">${t("aiBadge")}</span></div>
    <div id="${id}-ai" class="muted" style="margin-top:8px">${t("aiIdle")}</div>
    <button class="btn small" style="margin-top:8px" data-ai="${id}">${t("interpret")}</button>
  </div>`;
}
window.__aiPayloads = {};
document.addEventListener("click", async (e) => {
  const id = e.target.dataset?.ai;
  if (!id) return;
  const { kind, structured } = window.__aiPayloads[id];
  const out = $(`#${id}-ai`);
  out.innerHTML = `<div class="spinner"></div>`;
  try {
    const r = await api("/api/v1/ai/interpret", { kind, structured, lang: state.lang });
    const secs = r.interpretation.sections.map((s) => `<div style="margin-bottom:8px"><b>${esc(s.title)}</b><div class="muted">${esc(s.text)}</div></div>`).join("");
    out.innerHTML = `${secs}
      <details><summary>${HI() ? "व्याख्या के साथ गई विधि-पट्टिका" : "Method banner carried with interpretation"}</summary><pre>${esc(r.interpretation.methodBanner)}</pre></details>
      <details><summary>${HI() ? "LLM अनुरोध (एडाप्टर स्लॉट)" : "LLM request (adapter slot payload)"}</summary><pre>${esc(JSON.stringify(r.llmRequest, null, 2).slice(0, 3000))}</pre></details>
      <div class="faint" style="margin-top:6px">${esc(r.providerStatus)}</div>`;
  } catch (err) { out.innerHTML = `<span class="delta-crit">${esc(err.message)}</span>`; }
});

/* ---------------- pages ---------------- */

const pages = {};

pages["dashboard"] = async (el) => {
  el.innerHTML = `
  <h1>${HI() ? "मिथिला मकरंद" : "Mithila Makaranda"}</h1>
  <div class="muted">${HI() ? "प्रोडक्शन-ग्रेड वैदिक ज्योतिष प्लेटफ़ॉर्म · मकरंदानुसार / मिथिला विश्वविद्यालय पंचांग पद्धति डिफ़ॉल्ट गणना प्रोफ़ाइल के रूप में।" : "Production-grade Vedic astrology platform · Makarandaanushar / Mithila Vishwavidyalaya Panchang methodology as the default calculation profile."}</div>
  <div class="banner" style="margin-top:14px">${esc(state.profiles?.banners?.makaranda ?? "Calculation Method: Makaranda / Mithila\nProfile: makaranda-v1")}</div>
  <div class="grid cols-4" style="margin-top:18px">
    <div class="card stat"><div class="v" id="d-gate">…</div><div class="k">${t("gateTitle")}</div></div>
    <div class="card stat"><div class="v">2</div><div class="k">${t("engines")}</div></div>
    <div class="card stat"><div class="v">15</div><div class="k">${t("vargas15")}</div></div>
    <div class="card stat"><div class="v">5</div><div class="k">${t("dashaSys")}</div></div>
  </div>
  <div class="grid cols-2" style="margin-top:16px">
    <div class="card"><h2>${t("todayPanchang")} <span class="badge gold" id="d-mode"></span></h2><div id="d-panch"><div class="spinner"></div></div></div>
    <div class="card"><h2>${t("goldenDS")}</h2><div id="d-golden"><div class="spinner"></div></div></div>
  </div>
  <div class="grid cols-2" style="margin-top:16px">
    <div class="card"><h2>${t("twoModes")}</h2>
      <table><tr><th>${t("makName")} (${HI() ? "डिफ़ॉल्ट" : "default"})</th><th>${t("drikName")}</th></tr>
      <tr><td>${HI() ? "सूर्य सिद्धांत / मकरंद परंपरा, संस्करित makaranda-v1 प्रोफ़ाइल। पारंपरिक संदर्भ: अक्षांश 26°35′N, देशांतर 01|35 (यथावत, व्याख्या UNVERIFIED), पलभा 06, IST, सूर्योदय दिन-सीमा।" : "Surya Siddhanta / Makaranda tradition, versioned makaranda-v1 profile. Traditional reference: Akshansh 26°35′N, Deshantar 01|35 (preserved verbatim, interpretation UNVERIFIED), Palbha 06, IST, sunrise day boundary."}</td>
      <td>${HI() ? "आधुनिक विश्लेषिक एफेमेरिस, विन्यासयोग्य अयनांश (लाहिरी/रमण/KP/युक्तेश्वर/फेगन)। Swiss Ephemeris एडाप्टर आरक्षित।" : "Modern analytical ephemeris with configurable ayanamsa (Lahiri/Raman/KP/Yukteshwar/Fagan). Swiss Ephemeris adapter reserved."}</td></tr></table>
      <div class="note">${HI() ? "इंजन कभी एक पाइपलाइन में मिश्रित नहीं होते। तुलना-दृश्य उन्हें केवल आमने-सामने दिखाते हैं (spec §3.3)।" : "Engines are never combined inside one pipeline. Comparison views show them side-by-side only (spec §3.3)."}</div>
    </div>
    <div class="card"><h2>${t("platformStatus")}</h2><div id="d-audit"><div class="spinner"></div></div></div>
  </div>`;
  $("#d-mode").textContent = effectiveProfile("dashboard");
  (async () => {
    try {
      const v = await api("/api/v1/validation/run");
      const pass = v.gate.makaranda.status.startsWith("PASS");
      $("#d-gate").textContent = pass ? "PASS" : "NOT PASSED";
      $("#d-gate").style.color = pass ? "var(--green)" : "var(--red)";
      const gc = $("#gate-chip");
      if (gc) gc.innerHTML = `<span class="badge ${pass ? "green" : "amber"}">${HI() ? "गोल्डन गेट" : "Golden gate"}: ${pass ? "PASS" : (HI() ? "निदान सक्रिय" : "diagnostics active")}</span>`;
      $("#d-golden").innerHTML = `
        <div class="kv">
          <div>${t("goldenRows")}</div><div>${v.rows.length}</div>
          <div>${t("tolerance")}</div><div>±${v.gate.toleranceSeconds}s</div>
          <div>${t("drikIdentity")}</div><div>${esc(v.gate.drikCrossCheck.tithiIdentityMatches)}</div>
          <div>${t("makMax")}</div><div>${Math.round(v.gate.makaranda.maxAbsDeltaSec / 60)} min</div>
        </div>
        <div class="note">${esc(v.gate.makaranda.note)}</div>
        <a href="#/validation">${t("openSuite")}</a>`;
    } catch (e) { $("#d-golden").innerHTML = esc(e.message); }
  })();
  (async () => {
    try {
      const p = await api("/api/v1/panchang/calculate", { profileId: effectiveProfile("dashboard"), date: todayISO() });
      $("#d-panch").innerHTML = `<div class="kv">
        <div>${t("date")} / ${HI() ? "वार" : "Vara"}</div><div class="mono">${p.date} · ${varaLbl(p.vara)}</div>
        <div>${t("tithi")}</div><div><b>${tithiLbl(p.tithi.paksha, p.tithi.name)}</b> — ${t("ends")}: ${clockSpan(p.tithi.endTimestamp.slice(11, 19))} · ${dpBadge(p.tithi.sourceDandaPal)}</div>
        <div>${t("nakshatra")}</div><div><b>${A(p.nakshatra.name)}</b> — ${t("ends")}: ${clockSpan(p.nakshatra.endTimestamp.slice(11, 19))} · ${dpBadge(p.nakshatra.sourceDandaPal)}</div>
        <div>${t("yoga")}</div><div><b>${A(p.yoga.name)}</b> · ${dpBadge(p.yoga.sourceDandaPal)}</div>
        <div>${t("sunrise")} / ${t("sunset")}</div><div class="mono">${p.sunrise} / ${p.sunset} <span class="faint">(${t("clockUnit")})</span></div>
        <div>${t("rahuKaal")}</div><div class="mono">${p.rahuKaal.start}–${p.rahuKaal.end} <span class="faint">(${t("clockUnit")})</span></div>
      </div>
      ${dpNoteBox()}
      <div class="banner" style="margin-top:10px">${esc([`${HI() ? "गणना विधि" : "Calculation Mode"}: ` + p.audit.mode, `${t("profile")}: ` + p.audit.profile, `${HI() ? "एफेमेरिस" : "Ephemeris"}: ` + p.audit.ephemerisSource].join("\n"))}</div>`;
    } catch (e) { $("#d-panch").innerHTML = esc(e.message); }
  })();
  (async () => {
    try {
      const a = await api("/api/v1/audit");
      $("#d-audit").innerHTML = a.audit_logs.length
        ? `<table><tr><th>${t("thTime")}</th><th>${t("thEndpoint")}</th><th>${t("thMode")}</th></tr>${a.audit_logs.slice(0, 8).map((l) => `<tr><td class="mono">${l.ts.slice(11, 19)}</td><td class="mono">${l.endpoint}</td><td>${esc(l.calculationMode ?? "—")}</td></tr>`).join("")}</table>`
        : `<div class="muted">${t("noCalc")}</div>`;
    } catch (e) { $("#d-audit").innerHTML = esc(e.message); }
  })();
};

pages["panchang"] = async (el) => {
  el.innerHTML = `
  <h1>${t("nav_panchang")}</h1><div class="muted">${HI() ? "पंचांग दिन-सीमा = स्थानीय सूर्योदय · दण्ड–पल मान अंत समय हैं।" : "Panchang day boundary = local sunrise · दण्ड–पल values are END times."}</div>
  ${methodBar("panchang")}
  <div class="formline no-print">
    <div class="fw-date"><label>${t("date")}</label><input type="date" id="p-date" value="${todayISO()}"></div>
    <button class="btn primary" id="p-go">${t("calc")}</button>
    <label class="check"><input type="checkbox" id="p-cmp"> ${t("compare")}</label>
  </div>
  <div id="p-out" style="margin-top:16px"></div>`;
  const run = async () => {
    $("#p-out").innerHTML = `<div class="spinner"></div>`;
    try {
      const r = await api("/api/v1/panchang/calculate", { profileId: effectiveProfile("panchang"), date: $("#p-date").value, compare: $("#p-cmp").checked });
      const primary = r.primary ?? r;
      const render = (p) => `
      <div class="card flat">
        <div class="row"><span class="badge gold mono">${p.date} · ${varaLbl(p.vara)}</span><span class="badge">${p.audit.mode} · ${p.audit.profile}</span></div>
        <div class="grid cols-2" style="margin-top:10px">
          <table>
            <tr><th>${t("el")}</th><th>${t("val")}</th><th>${t("ends")}</th><th>${t("dp")}</th></tr>
            <tr><td>${t("tithi")}</td><td><b>${tithiLbl(p.tithi.paksha, p.tithi.name)}</b> <span class="faint">#${p.tithi.pakshaNumber}</span></td><td class="mono">${p.tithi.endTimestamp.slice(5)}</td><td>${dpBadge(p.tithi.sourceDandaPal)}</td></tr>
            <tr><td>${t("nakshatra")}</td><td><b>${A(p.nakshatra.name)}</b> <span class="faint">${HI() ? "पाद" : "pada"} ${p.nakshatra.pada}</span></td><td class="mono">${p.nakshatra.endTimestamp.slice(5)}</td><td>${dpBadge(p.nakshatra.sourceDandaPal)}</td></tr>
            <tr><td>${t("yoga")}</td><td><b>${A(p.yoga.name)}</b></td><td class="mono">${p.yoga.endTimestamp.slice(5)}</td><td>${dpBadge(p.yoga.sourceDandaPal)}</td></tr>
            <tr><td>${t("karana")}</td><td><b>${A(p.karana.name)}</b></td><td class="mono">${p.karana.endTimestamp.slice(5)}</td><td>${dpBadge(p.karana.sourceDandaPal)}</td></tr>
          </table>
          <div class="kv">
            <div>${t("sunrise")}</div><div class="mono">${p.sunrise} <span class="faint">(${t("clockUnit")})</span></div>
            <div>${t("sunset")}</div><div class="mono">${p.sunset} <span class="faint">(${t("clockUnit")})</span></div>
            <div>${t("dayLen")}</div><div>${p.dayLengthHours} h</div>
            <div>${t("rahuKaal")}</div><div class="mono">${p.rahuKaal.start}–${p.rahuKaal.end}</div>
            <div>${t("gulika")}</div><div class="mono">${p.gulika.start}–${p.gulika.end}</div>
            <div>${t("yamaganda")}</div><div class="mono">${p.yamaganda.start}–${p.yamaganda.end}</div>
            <div>${t("abhijit")}</div><div class="mono">${p.abhijit.start}–${p.abhijit.end}</div>
            <div>${t("durmuhurta")}</div><div class="mono">${p.durmuhurtas.map((d) => d.start + "–" + d.end).join(", ") || "—"}</div>
          </div>
        </div>
        ${dpNoteBox()}
        <div class="banner" style="margin-top:12px">${esc([`${HI() ? "गणना विधि" : "Calculation Mode"}: ` + p.audit.mode, `${t("profile")}: ` + p.audit.profile, `${t("ayanamsa")}: ` + p.audit.ayanamsa, `${HI() ? "स्थान" : "Location"}: ` + p.locationReference.name].join("\n"))}</div>
      </div>`;
      window.__aiPayloads["panch"] = { kind: "panchang", structured: primary };
      $("#p-out").innerHTML = render(primary) + (r.comparison ? `<h3>${HI() ? "तुलना — कभी मिश्रित नहीं (spec §3.3)" : "Comparison — never mixed (spec §3.3)"}</h3>` + render(r.comparison) : "") + aiPanel("panchang", primary, "panch");
    } catch (e) { $("#p-out").innerHTML = `<div class="note red">${esc(e.message)}</div>`; }
  };
  $("#p-go").onclick = run; run();
};

function kundaliTables(k) {
  return `
  <table>
    <tr><th>${t("graha")}</th><th>${t("longitudeH")}</th><th>${t("signH")}</th><th>${t("houseH")}</th><th>${t("nakH")}</th><th>${t("padaH")}</th><th>${t("statusH")}</th></tr>
    ${k.positions.map((p) => `<tr>
      <td><b>${A(p.name)}</b></td>
      <td class="mono">${p.dms.d}°${String(p.dms.m).padStart(2, "0")}′${String(Math.round(p.dms.s)).padStart(2, "0")}</td>
      <td>${signLbl(p.sign)}</td><td>${p.house}</td><td>${A(p.nakshatra)}</td><td>${p.pada}</td>
      <td>${p.retrograde ? `<span class="badge amber">${t("retro")}</span> ` : ""}${p.combust ? `<span class="badge red">${t("combust")}</span>` : ""}</td>
    </tr>`).join("")}
  </table>`;
}

pages["kundali"] = async (el) => {
  el.innerHTML = `
  <h1>${t("nav_kundali")}</h1><div class="muted">${HI() ? "राशि चक्र · लग्न · ग्रह स्थितियाँ · भाव · दृष्टियाँ · दग्ध। मकरंद व दृक् दोनों प्रोफ़ाइल में।" : "Rashi chart · lagna · planetary positions · bhava placement · aspects · combustion. Works in both Makaranda and Drik profiles."}</div>
  ${methodBar("kundali")}
  <div class="card flat no-print">${birthFormHTML("k-")}</div>
  <div class="formline no-print" style="margin:12px 0">
    <button class="btn primary" id="k-go">${t("generate")}</button>
    <span class="seg" id="k-style"><button class="on" data-s="north">${t("north")}</button><button data-s="south">${t("south")}</button><button data-s="east">${t("east")}</button></span>
  </div>
  <div id="k-out"></div>`;
  let style = "north";
  $$("#k-style button").forEach((b) => (b.onclick = () => { style = b.dataset.s; $$("#k-style button").forEach((x) => x.classList.toggle("on", x === b)); if (window.__kundali) draw(window.__kundali); }));
  const draw = (k) => {
    const chart = style === "south" ? southChartSVG(k.lagna.sign, k.signOccupants, true, k.positions)
      : style === "east" ? eastChartSVG(k.lagna.sign, k.signOccupants, k.positions)
      : northChartSVG(k.lagna.sign, k.signOccupants, k.positions);
    const label = { north: HI() ? "उत्तर भारतीय (भाव स्थिर)" : "North Indian (houses fixed)", south: HI() ? "दक्षिण भारतीय (राशि स्थिर)" : "South Indian (signs fixed)", east: HI() ? "पूर्व भारतीय / मिथिला-अनुरूप" : "East Indian / Mithila-friendly" }[style];
    $("#k-chart").innerHTML = chart + chartLegend(k.positions) + `<div class="center faint">${label} · ${t("lagna")} ${signLbl(k.lagna.sign)} · ${A(k.lagna.nakshatra.name)} ${HI() ? "पाद" : "p"}${k.lagna.nakshatra.pada}</div>`;
  };
  const run = async () => {
    const b = readBirth("k-");
    $("#k-out").innerHTML = `<div class="spinner"></div>`;
    try {
      const k = await api("/api/v1/kundali/calculate", bodyFromBirth(b, "kundali"));
      window.__kundali = k;
      window.__aiPayloads["kund"] = { kind: "kundali", structured: k };
      $("#k-out").innerHTML = `
      <div class="grid cols-2">
        <div class="card flat" id="k-chart"></div>
        <div class="card flat">${kundaliTables(k)}
          <div class="banner" style="margin-top:10px">${esc([`${HI() ? "गणना विधि" : "Calculation Mode"}: ` + k.audit.mode, `${t("profile")}: ` + k.audit.profile, `${t("ayanamsa")}: ` + (k.audit.ayanamsa?.toFixed?.(4) ?? k.audit.ayanamsa), `${HI() ? "एफेमेरिस" : "Ephemeris"}: ` + (k.engine ?? "")].join("\n"))}</div>
        </div>
      </div>
      <div class="card flat" style="margin-top:14px"><h3>${t("aspects")}</h3>
        <table><tr><th>${t("planet")}</th><th>${t("aspectsFrom")}</th><th>${t("aspected")}</th></tr>
        ${k.aspects.map((a) => `<tr><td>${A(a.planet)}</td><td>${HI() ? "भाव" : "house"} ${a.aspectHouseFromLagna} (${signLbl(a.toSign)})</td><td>${a.aspectedPlanets.map(A).join(", ") || "—"}</td></tr>`).join("")}</table>
      </div>` + aiPanel("kundali", k, "kund");
      draw(k);
    } catch (e) { $("#k-out").innerHTML = `<div class="note red">${esc(e.message)}</div>`; }
  };
  $("#k-go").onclick = run; run();
};

pages["vargas-d-charts"] = async (el) => {
  const vargas = ["D2", "D3", "D4", "D7", "D9", "D10", "D12", "D16", "D20", "D24", "D27", "D30", "D40", "D45", "D60"];
  el.innerHTML = `
  <h1>${t("nav_vargas")}</h1><div class="muted">${HI() ? "गणना प्रोफ़ाइल वर्ग जनन में प्रवाहित होती है। प्रति वर्ग नियम-स्थिति रिपोर्ट होती है।" : "Calculation profile propagates into varga generation. Rule status reported per varga."}</div>
  ${methodBar("varga")}
  <div class="card flat no-print">${birthFormHTML("v-")}</div>
  <div class="row no-print" style="margin:12px 0"><div class="pill-row">${vargas.map((v) => `<button class="tag" data-v="${v}" id="vb-${v}">${v}</button>`).join("")}</div></div>
  <div id="v-out"></div>`;
  let cur = "D9";
  const run = async () => {
    const b = readBirth("v-");
    $("#v-out").innerHTML = `<div class="spinner"></div>`;
    try {
      const v = await api("/api/v1/varga/calculate", { ...bodyFromBirth(b, "varga"), varga: cur });
      $("#v-out").innerHTML = `
      <div class="grid cols-2">
        <div class="card flat center">${northChartSVG(v.lagnaSign, v.signOccupants.map((a) => a.filter((x) => x !== "Lagna")))}<div class="faint">${cur} ${t("lagna")}: ${signLbl(v.lagnaSign)}</div></div>
        <div class="card flat">
          <div class="kv"><div>${HI() ? "विभाजन" : "Division"}</div><div>D-${v.division}</div><div>${HI() ? "नियम स्थिति" : "Rule status"}</div><div><span class="badge ${v.ruleStatus === "VERIFIED_STANDARD" ? "green" : "amber"}">${v.ruleStatus}</span></div><div>${t("note")}</div><div>${esc(v.ruleNote)}</div></div>
          <table style="margin-top:10px"><tr><th>${t("planet")}</th><th>${HI() ? "वर्ग राशि" : "Varga sign"}</th></tr>${v.placements.map((p) => `<tr><td>${A(p.name)}</td><td>${signLbl(p.sign)}</td></tr>`).join("")}</table>
          <div class="note">${esc(v.vimshopakaBala.note)}</div>
          <div class="banner">${esc(`${HI() ? "गणना विधि" : "Calculation Mode"}: ` + v.audit.mode + `\n${t("profile")}: ` + v.audit.profile)}</div>
        </div>
      </div>`;
    } catch (e) { $("#v-out").innerHTML = `<div class="note red">${esc(e.message)}</div>`; }
  };
  vargas.forEach((vg) => { $(`#vb-${vg}`).onclick = () => { cur = vg; $$(".tag[data-v]").forEach((x) => x.classList.toggle("gold", x.dataset.v === vg)); run(); }; });
  $("#vb-D9").classList.add("gold");
  run();
};

pages["dashas"] = async (el) => {
  const systems = [["VIMSHOTTARI", HI() ? "विंशोत्तरी (120व)" : "Vimshottari (120y)"], ["YOGINI", HI() ? "योगिनी (36व)" : "Yogini (36y)"], ["ASHTOTTARI", HI() ? "अष्टोत्तरी (108व)" : "Ashtottari (108y)"], ["KALACHAKRA", HI() ? "कालचक्र" : "Kalachakra"], ["CHARA", HI() ? "चर (जैमिनी)" : "Chara (Jaimini)"]];
  el.innerHTML = `
  <h1>${t("nav_dashas")}</h1><div class="muted">${HI() ? "सीड विधि व प्रोफ़ाइल प्रत्येक परिणाम पर अंकित।" : "Seed method and profile identified on every result."}</div>
  ${methodBar("dasha")}
  <div class="card flat no-print">${birthFormHTML("d-")}</div>
  <div class="row no-print" style="margin:12px 0"><div class="seg seg-wrap">${systems.map(([id, n], i) => `<button data-s="${id}" class="${i === 0 ? "on" : ""}">${n}</button>`).join("")}</div></div>
  <div id="d-out"></div>`;
  let sys = "VIMSHOTTARI";
  const fmt = (jd) => new Date((jd - 2440587.5) * 86400000).toISOString().slice(0, 10);
  const run = async () => {
    const b = readBirth("d-");
    $("#d-out").innerHTML = `<div class="spinner"></div>`;
    try {
      const r = await api("/api/v1/dasha/calculate", { ...bodyFromBirth(b, "dasha"), system: sys });
      window.__aiPayloads["dasha"] = { kind: "dasha", structured: r };
      let body = "";
      const nowJD = Date.now() / 86400000 + 2440587.5;
      if (r.system === "VIMSHOTTARI") {
        body = `<div class="note">${t("dashaSeed")}: ${esc(r.seedMethod)} · ${HI() ? "प्रारंभिक lord" : "starting lord"} <b>${A(r.startingLord)}</b> · ${HI() ? "शेष" : "balance"} ${r.balanceYearsAtBirth.toFixed(3)} ${HI() ? "वर्ष" : "y"} · ${t("nakshatra")} #${r.birthNakshatraIndex}</div>
        <table><tr><th>${t("mahadasha")}</th><th>${t("period")}</th><th>${t("years")}</th><th>${t("antardashas")}</th></tr>
        ${r.mahadashas.map((m) => {
          const cur = m.startJD <= nowJD && nowJD < m.endJD;
          return `<tr ${cur ? 'style="background:rgba(216,169,68,.07)"' : ""}><td><b>${A(m.planet)}</b>${cur ? ` <span class="badge gold">${t("current")}</span>` : ""}</td><td class="mono">${fmt(m.startJD)} → ${fmt(m.endJD)}</td><td>${m.years.toFixed(2)}</td>
          <td class="faint">${(m.antardashas || []).map((a) => `${A(a.planet)} ${fmt(a.startJD).slice(0, 7)}…`).join(" · ")}</td></tr>`;
        }).join("")}</table>`;
      } else if (r.dashas) {
        body = `<div class="note">${t("dashaSeed")}: ${esc(r.seedMethod)}</div><table><tr><th>${t("period")}</th><th>${t("span")}</th><th>${t("years")}</th></tr>
        ${r.dashas.map((d) => `<tr><td>${A(d.planet ?? d.yogini ?? "")}</td><td class="mono">${fmt(d.startJD)} → ${fmt(d.endJD)}</td><td>${d.years}</td></tr>`).join("")}</table>`;
      } else {
        body = `<pre>${esc(JSON.stringify(r, null, 2))}</pre>`;
      }
      $("#d-out").innerHTML = `<div class="card flat">${body}<div class="banner" style="margin-top:10px">${esc("System: " + r.system + `\n${HI() ? "विधि" : "Mode"}: ` + r.audit.mode + ` · ${t("profile")}: ` + r.audit.profile)}</div></div>` + aiPanel("dasha", r, "dasha");
    } catch (e) { $("#d-out").innerHTML = `<div class="note red">${esc(e.message)}</div>`; }
  };
  $$(".seg button[data-s]", el).forEach((btn) => (btn.onclick = () => { sys = btn.dataset.s; $$(".seg button[data-s]", el).forEach((x) => x.classList.toggle("on", x === btn)); run(); }));
  run();
};

pages["yogas-doshas"] = async (el) => {
  el.innerHTML = `
  <h1>${HI() ? "योग व दोष विश्लेषण" : "Yoga & Dosha analysis"}</h1><div class="muted">${HI() ? "साक्ष्य, नियम-संस्करण व गणना प्रोफ़ाइल सहित नियम-आधारित पहचान।" : "Rule-based detection with evidence, ruleset version and calculation profile."}</div>
  ${methodBar("yoga")}
  <div class="card flat no-print">${birthFormHTML("y-")}</div>
  <div class="formline no-print" style="margin:12px 0"><button class="btn primary" id="y-go">${t("analyse")}</button></div>
  <div id="y-out"></div>`;
  const run = async () => {
    const b = readBirth("y-");
    $("#y-out").innerHTML = `<div class="spinner"></div>`;
    try {
      const r = await api("/api/v1/yoga/calculate", bodyFromBirth(b, "yoga"));
      window.__aiPayloads["yoga"] = { kind: "yoga", structured: r };
      const card = (x, isDosha) => `
      <div class="card flat" style="border-left:3px solid ${x.matched ? (isDosha ? "var(--red)" : "var(--green)") : "var(--line)"}">
        <div class="row"><b>${esc(x.name)}</b>${x.matched ? `<span class="badge ${isDosha ? "red" : "green"}">${t("present")}</span>` : `<span class="badge">${t("notPresent")}</span>`}<span class="badge mono">${x.ruleId}</span></div>
        <div class="muted" style="margin-top:6px">${esc(x.interpretation)}</div>
        <details><summary>${t("evidence")}</summary><pre>${esc(JSON.stringify(x.evidence, null, 2))}</pre></details>
        <div class="faint">${t("confidence")}: ${x.confidence} · ${t("ruleset")}: ${x.rulesetVersion} · ${t("profile")}: ${x.profile}</div>
      </div>`;
      $("#y-out").innerHTML = `
      <div class="grid cols-2">
        <div><h3>${HI() ? "योग" : "Yogas"}</h3><div class="grid">${r.yogas.map((x) => card(x, false)).join("")}</div></div>
        <div><h3>${HI() ? "दोष" : "Doshas"}</h3><div class="grid">${r.doshas.map((x) => card(x, true)).join("")}</div></div>
      </div>` + aiPanel("yoga", r, "yoga");
    } catch (e) { $("#y-out").innerHTML = `<div class="note red">${esc(e.message)}</div>`; }
  };
  $("#y-go").onclick = run; run();
};

pages["kundali-milan"] = async (el) => {
  el.innerHTML = `
  <h1>${t("nav_milan")}</h1><div class="muted">${HI() ? "अष्टकूट 36-गुण मिलान, मंगल विश्लेषण व शास्त्रीय अपवाद सहित। चंद्र रेखांश केवल चुनी प्रोफ़ाइल से।" : "Ashtakoota 36-guna matching with Mangal analysis and classical cancellations. Moon longitudes computed by the selected profile only."}</div>
  ${methodBar("milan")}
  <div class="grid cols-2">
    <div class="card flat"><h3>${t("groom")}</h3>
      <label>${t("date")}</label><input type="date" id="m-md" value="1988-11-02"><label>${t("time")}</label><input type="time" step="1" id="m-mt" value="08:15:00">
      <label>${t("place")}</label><div class="geo-wrap"><input data-geo data-geo-lat="m-mla" data-geo-lon="m-mlo" autocomplete="off" placeholder="${t("placePh")}"><div class="geo-hint"></div></div>
      <label>${t("lat")}</label><input type="number" step="0.0001" id="m-mla" value="26.5833"><label>${t("lon")}</label><input type="number" step="0.0001" id="m-mlo" value="85.2667"></div>
    <div class="card flat"><h3>${t("bride")}</h3>
      <label>${t("date")}</label><input type="date" id="m-fd" value="1992-03-14"><label>${t("time")}</label><input type="time" step="1" id="m-ft" value="17:40:00">
      <label>${t("place")}</label><div class="geo-wrap"><input data-geo data-geo-lat="m-fla" data-geo-lon="m-flo" autocomplete="off" placeholder="${t("placePh")}"><div class="geo-hint"></div></div>
      <label>${t("lat")}</label><input type="number" step="0.0001" id="m-fla" value="28.4089"><label>${t("lon")}</label><input type="number" step="0.0001" id="m-flo" value="77.3178"></div>
  </div>
  <div class="formline no-print" style="margin:12px 0"><button class="btn primary" id="m-go">${t("match")}</button></div>
  <div id="m-out"></div>`;
  const run = async () => {
    $("#m-out").innerHTML = `<div class="spinner"></div>`;
    try {
      const r = await api("/api/v1/kundali/match", {
        profileId: effectiveProfile("milan"),
        male: { date: $("#m-md").value, time: $("#m-mt").value, latitude: +$("#m-mla").value, longitude: +$("#m-mlo").value },
        female: { date: $("#m-fd").value, time: $("#m-ft").value, latitude: +$("#m-fla").value, longitude: +$("#m-flo").value },
      });
      window.__aiPayloads["milan"] = { kind: "milan", structured: r };
      $("#m-out").innerHTML = `
      <div class="card flat">
        <div class="row"><div style="font-size:34px;font-family:Georgia,serif;color:var(--gold2)">${r.totalGuna}<span class="faint" style="font-size:16px"> / 36</span></div>
        <div><b>${esc(r.verdict)}</b><div class="faint">${t("groom")} ${HI() ? "चंद्र" : "Moon"}: ${signLbl(r.male.moonSign)} · ${A(r.male.nakshatra)} ${HI() ? "पाद" : "p"}${r.male.pada} &nbsp;|&nbsp; ${t("bride")} ${HI() ? "चंद्र" : "Moon"}: ${signLbl(r.female.moonSign)} · ${A(r.female.nakshatra)} ${HI() ? "पाद" : "p"}${r.female.pada}</div></div></div>
        <table style="margin-top:12px"><tr><th>${t("koota")}</th><th>${t("score")}</th><th style="width:40%"></th><th>${t("note")}</th></tr>
        ${r.details.map((d) => `<tr><td><b>${kootaLbl(d.koota)}</b></td><td>${d.score} / ${d.max}</td><td><div class="bar"><i style="width:${(d.score / d.max) * 100}%"></i></div></td><td class="faint">${esc(d.note)}</td></tr>`).join("")}</table>
        <div class="note">${esc(r.mangalNote)}</div>
        <details><summary>${t("cancellations")}</summary><ul>${r.cancellations.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></details>
        <div class="banner">${esc(`${HI() ? "विधि" : "Mode"}: ` + r.audit.mode + ` · ${t("profile")}: ` + r.audit.profile + ` · ${t("ayanamsa")}: ` + r.audit.ayanamsa)}</div>
      </div>` + aiPanel("milan", r, "milan");
    } catch (e) { $("#m-out").innerHTML = `<div class="note red">${esc(e.message)}</div>`; }
  };
  $("#m-go").onclick = run; run();
};

pages["gochar-transit"] = async (el) => {
  el.innerHTML = `
  <h1>${t("nav_gochar")}</h1><div class="muted">${HI() ? "गुरु · शनि · राहु/केतु · साढ़े साती · ढैय्या — जन्म चंद्र के सापेक्ष।" : "Jupiter · Saturn · Rahu/Ketu · Sade Sati · Dhaiya — relative to natal Moon."}</div>
  ${methodBar("gochar")}
  <div class="card flat no-print">
    <div class="grid cols-3">
      <div><label>${t("natalDate")}</label><input type="date" id="g-nd" value="${state.birth.date}"></div>
      <div><label>${t("natalTime")}</label><input type="time" step="1" id="g-nt" value="${state.birth.time}"></div>
      <div><label>${t("transitDate")}</label><input type="date" id="g-td" value="${todayISO()}"></div>
    </div>
  </div>
  <div class="formline no-print" style="margin:12px 0"><button class="btn primary" id="g-go">${t("analyseTransit")}</button><label class="check"><input type="checkbox" id="g-series" checked> ${t("includeSeries")}</label></div>
  <div id="g-out"></div>`;
  const run = async () => {
    $("#g-out").innerHTML = `<div class="spinner"></div>`;
    try {
      const r = await api("/api/v1/transit/calculate", {
        profileId: effectiveProfile("gochar"),
        date: $("#g-td").value, natalDate: $("#g-nd").value, natalTime: $("#g-nt").value,
        latitude: state.birth.lat, longitude: state.birth.lon, series: $("#g-series").checked,
      });
      const s = r.snapshot;
      $("#g-out").innerHTML = `
      <div class="card flat">
        <div class="row"><b style="font-size:17px">${esc(r.sadeSati.phase)}</b></div>
        <div class="kv" style="margin-top:10px">
          <div>${HI() ? "जन्म चंद्र" : "Natal Moon"}</div><div>${signLbl(r.sadeSati.natalMoonSign)}</div>
          <div>${HI() ? "गोचर शनि" : "Transit Saturn"}</div><div>${signLbl(r.sadeSati.saturnSign)}</div>
          <div>${A("Jupiter")}</div><div>${signLbl(s.Jupiter.sign)} · ${s.Jupiter.longitude.toFixed(2)}°</div>
          <div>${HI() ? "राहु / केतु" : "Rahu / Ketu"}</div><div>${signLbl(s.Rahu.sign)} / ${signLbl(s.Ketu.sign)}</div>
          <div>${HI() ? "दिनांक" : "As of"}</div><div class="mono">${s.timestamp}</div>
        </div>
        <div class="banner" style="margin-top:10px">${esc(`${HI() ? "विधि" : "Mode"}: ` + r.audit.mode + ` · ${t("profile")}: ` + r.audit.profile)}</div>
      </div>
      ${r.series ? `<div class="card flat" style="margin-top:14px"><h3>${HI() ? "3-वर्ष शृंखला (मासिक)" : "3-year series (monthly)"}</h3>
        <div class="grid cols-2">
          <div><b>${A("Saturn")}</b><table>${r.series.Saturn.map((x) => `<tr><td class="mono">${x.timestamp.slice(0, 10)}</td><td>${signLbl(x.sign)}</td></tr>`).join("")}</table></div>
          <div><b>${A("Jupiter")}</b><table>${r.series.Jupiter.map((x) => `<tr><td class="mono">${x.timestamp.slice(0, 10)}</td><td>${signLbl(x.sign)}</td></tr>`).join("")}</table></div>
        </div></div>` : ""}`;
    } catch (e) { $("#g-out").innerHTML = `<div class="note red">${esc(e.message)}</div>`; }
  };
  $("#g-go").onclick = run; run();
};

pages["muhurta"] = async (el) => {
  const acts = [["marriage", HI() ? "विवाह" : "Marriage"], ["grihaPravesh", HI() ? "गृह प्रवेश" : "Griha Pravesh"], ["business", HI() ? "व्यवसाय" : "Business"], ["travel", HI() ? "यात्रा" : "Travel"], ["vehicle", HI() ? "वाहन" : "Vehicle"], ["property", HI() ? "संपत्ति" : "Property"], ["naming", HI() ? "नामकरण" : "Naming ceremony"]];
  el.innerHTML = `
  <h1>${t("nav_muhurta")}</h1><div class="muted">${HI() ? "स्पष्ट ओवरराइड न होने पर चुनी पंचांग गणना प्रोफ़ाइल ही विरासत में मिलती है।" : "Inherits the selected Panchang calculation profile unless explicitly overridden."}</div>
  ${methodBar("muhurta")}
  <div class="formline no-print">
    <div class="fw-act"><label>${t("activity")}</label><select id="mu-act">${acts.map(([id, n]) => `<option value="${id}">${n}</option>`).join("")}</select></div>
    <div><label>${t("from")}</label><input type="date" id="mu-a" value="${todayISO()}"></div>
    <div><label>${t("to")}</label><input type="date" id="mu-b" value="${new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)}"></div>
    <button class="btn primary" id="mu-go">${t("scan")}</button>
  </div>
  <div id="mu-out" style="margin-top:14px"></div>`;
  const run = async () => {
    $("#mu-out").innerHTML = `<div class="spinner"></div>`;
    try {
      const r = await api("/api/v1/muhurta/calculate", { profileId: effectiveProfile("muhurta"), activity: $("#mu-act").value, startDate: $("#mu-a").value, endDate: $("#mu-b").value });
      $("#mu-out").innerHTML = `
      <div class="note">${esc(r.ruleset.label)} — ${esc(r.ruleset.notes || "classical-v1 ruleset")}</div>
      <div class="pill-row" style="margin-bottom:10px">${r.suitableDates.map((d) => `<span class="badge green mono">${d}</span>`).join("") || `<span class="muted">${HI() ? "इस अवधि में पूर्ण उपयुक्त दिनांक नहीं।" : "No fully suitable dates in range."}</span>`}</div>
      <table><tr><th>${t("date")}</th><th>${HI() ? "वार" : "Vara"}</th><th>${t("tithi")}</th><th>${t("nakshatra")}</th><th>${HI() ? "निर्णय" : "Verdict"}</th><th>${t("rahuKaal")}</th></tr>
      ${r.days.map((d) => `<tr>
        <td class="mono">${d.date}</td><td>${varaLbl(d.vara).split(" ")[0]}</td><td>${A(d.tithi)}</td><td>${A(d.nakshatra)}</td>
        <td>${d.suitable ? `<span class="badge green">${HI() ? "उपयुक्त" : "SUITABLE"}</span>` : `<span class="badge red">${HI() ? "वर्जित" : "avoid"}</span><div class="faint">${d.reasons.map(esc).join("; ")}</div>`}</td>
        <td class="mono">${d.rahuKaal.start}–${d.rahuKaal.end} <span class="faint">(${t("clockUnit")})</span></td></tr>`).join("")}</table>
      ${dpNoteBox()}
      <div class="banner" style="margin-top:10px">${esc(`${HI() ? "विधि" : "Mode"}: ` + r.audit.mode + ` · ${t("profile")}: ` + r.audit.profile + ` · Ruleset: classical-v1`)}</div>`;
    } catch (e) { $("#mu-out").innerHTML = `<div class="note red">${esc(e.message)}</div>`; }
  };
  $("#mu-go").onclick = run; run();
};

pages["varshaphal"] = async (el) => {
  el.innerHTML = `
  <h1>${HI() ? "वर्षफल — वार्षिक कुंडली" : "Varshaphal — annual chart"}</h1><div class="muted">${HI() ? "सूर्य वापसी · मुंथा · मुद्दा दशा सीड · ताजिक योग स्लॉट।" : "Solar return · Muntha · Mudda dasha seed · Tajik yoga slot."}</div>
  ${methodBar("varshaphal")}
  <div class="card flat no-print">${birthFormHTML("vp-")}
    <div class="grid cols-3" style="margin-top:8px"><div><label>${t("returnYear")}</label><input type="number" id="vp-year" value="${new Date().getFullYear()}"></div></div>
  </div>
  <div class="formline no-print" style="margin:12px 0"><button class="btn primary" id="vp-go">${t("computeAnnual")}</button></div>
  <div id="vp-out"></div>`;
  const run = async () => {
    const b = readBirth("vp-");
    $("#vp-out").innerHTML = `<div class="spinner"></div>`;
    try {
      const r = await api("/api/v1/varshaphal/calculate", { ...bodyFromBirth(b, "varshaphal"), year: +$("#vp-year").value });
      const k = r.annualChart;
      $("#vp-out").innerHTML = `
      <div class="grid cols-2">
        <div class="card flat center">${northChartSVG(k.lagna.sign, k.signOccupants, k.positions)}<div class="faint">${HI() ? "वार्षिक लग्न" : "Annual lagna"} ${signLbl(k.lagna.sign)}</div></div>
        <div class="card flat">
          <div class="kv"><div>${HI() ? "सूर्य वापसी" : "Solar return at"}</div><div class="mono">${r.solarReturnTimestamp}</div>
          <div>${HI() ? "मुंथा" : "Muntha"}</div><div>${signLbl(r.muntha.sign)} <span class="faint">${esc(r.muntha.note)}</span></div>
          <div>${HI() ? "मुद्दा दशा सीड" : "Mudda dasha seed"}</div><div>${r.muddaDashaSeed.sunMoonDistance.toFixed(2)}° ${HI() ? "सूर्य–चंद्र" : "sun–moon"}</div></div>
          <div class="note">${esc(r.tajikYogas.note)}</div>
          ${kundaliTables(k)}
          <div class="banner" style="margin-top:10px">${esc(`${HI() ? "विधि" : "Mode"}: ` + r.audit.mode + ` · ${t("profile")}: ` + r.audit.profile)}</div>
        </div>
      </div>`;
    } catch (e) { $("#vp-out").innerHTML = `<div class="note red">${esc(e.message)}</div>`; }
  };
  $("#vp-go").onclick = run; run();
};

pages["prashna"] = async (el) => {
  el.innerHTML = `
  <h1>${HI() ? "प्रश्न — होरेरी" : "Prashna — horary"}</h1><div class="muted">${HI() ? "प्रश्न क्षण की कुंडली, शास्त्रीय संकेतकों सहित।" : "Chart of the question moment with classical indicators."}</div>
  ${methodBar("prashna")}
  <div class="card flat no-print"><div class="grid cols-3">
    <div><label>${t("qDate")}</label><input type="date" id="q-d" value="${todayISO()}"></div>
    <div><label>${t("qTime")}</label><input type="time" step="1" id="q-t" value="${new Date().toTimeString().slice(0, 8)}"></div>
    <div><label>${t("qText")}</label><input id="q-text"></div>
  </div></div>
  <div class="formline no-print" style="margin:12px 0"><button class="btn primary" id="q-go">${t("castPrashna")}</button></div>
  <div id="q-out"></div>`;
  const run = async () => {
    $("#q-out").innerHTML = `<div class="spinner"></div>`;
    try {
      const r = await api("/api/v1/prashna/calculate", { profileId: effectiveProfile("prashna"), date: $("#q-d").value, time: $("#q-t").value, latitude: state.birth.lat, longitude: state.birth.lon });
      const k = r.chart;
      $("#q-out").innerHTML = `
      <div class="grid cols-2">
        <div class="card flat center">${northChartSVG(k.lagna.sign, k.signOccupants, k.positions)}<div class="faint">${HI() ? "प्रश्न लग्न" : "Prashna lagna"} ${signLbl(k.lagna.sign)} · ${r.timestamp}</div></div>
        <div class="card flat">
          <div class="kv">
            <div>${HI() ? "लग्नेश" : "Lagna lord"}</div><div>${A(r.indicators.lagnaAndLord.lagnaLord)} ${HI() ? "भाव" : "house"} ${r.indicators.lagnaAndLord.lagnaLordHouse}</div>
            <div>${HI() ? "एकादश भाव" : "11th house"}</div><div>${r.indicators.eleventhHouse.occupants.map(A).join(", ") || t("empty")}</div>
            <div>${HI() ? "दशम भाव" : "10th house"}</div><div>${r.indicators.tenthHouse.occupants.map(A).join(", ") || t("empty")}</div>
            <div>${HI() ? "चंद्र नक्षत्र" : "Moon nakshatra"}</div><div>${A(r.indicators.moonCondition.nakshatra)}</div>
          </div>
          <div class="note">${esc(r.indicators.lagnaAndLord.note)}</div>
          <div class="note">${esc(r.indicators.moonCondition.note)}</div>
          <div class="note">${esc(r.indicators.advancedRules.note)}</div>
          <div class="banner">${esc(`${HI() ? "विधि" : "Mode"}: ` + r.audit.mode + ` · ${t("profile")}: ` + r.audit.profile)}</div>
        </div>
      </div>`;
    } catch (e) { $("#q-out").innerHTML = `<div class="note red">${esc(e.message)}</div>`; }
  };
  $("#q-go").onclick = run; run();
};

pages["reports"] = async (el) => {
  el.innerHTML = `
  <h1>${t("nav_reports")}</h1><div class="muted">${HI() ? "व्यापक जन्म-प्रतिवेदन। चुनी गणना प्रोफ़ाइल विरासत में लेकर स्पष्ट दिखाता है।" : "Comprehensive natal report. Inherits the selected calculation profile and shows it explicitly."}</div>
  ${methodBar("reports")}
  <div class="card flat no-print">${birthFormHTML("r-")}</div>
  <div class="formline no-print" style="margin:12px 0"><button class="btn primary" id="r-go">${t("genReport")}</button><button class="btn" id="r-print" disabled>${t("print")}</button></div>
  <div id="r-out"></div>`;
  $("#r-print").onclick = () => window.print();
  $("#r-go").onclick = async () => {
    const b = readBirth("r-");
    $("#r-out").innerHTML = `<div class="spinner"></div>`;
    try {
      const r = await api("/api/v1/reports/generate", bodyFromBirth(b, "reports"));
      $("#r-print").disabled = false;
      const k = r.sections.kundali;
      $("#r-out").innerHTML = `
      <div class="card flat report-print">
        <h2>${HI() ? "व्यापक ज्योतिषीय प्रतिवेदन —" : "Comprehensive Astrological Report —"} ${esc(r.subject.name || (HI() ? "जातक" : "Native"))}</h2>
        <div class="banner">${esc(r.methodBanner)}\n${HI() ? "जन्म" : "Born"}: ${r.subject.date} ${r.subject.time ?? ""} · ${esc(r.subject.place ?? "")} · ${HI() ? "जनित" : "Generated"} ${r.generatedAt}</div>
        <div class="grid cols-2" style="margin-top:12px">
          <div class="center">${northChartSVG(k.lagna.sign, k.signOccupants, k.positions)}</div>
          <div>${kundaliTables(k)}</div>
        </div>
        <h3>${HI() ? "सक्रिय विंशोत्तरी महादशाएँ" : "Active Vimshottari Mahadashas"}</h3>
        <table><tr><th>${HI() ? "lord" : "Lord"}</th><th>${t("period")}</th></tr>${r.sections.dasha.mahadashas.slice(0, 5).map((m) => `<tr><td>${A(m.planet)}</td><td class="mono">${new Date((m.startJD - 2440587.5) * 86400000).toISOString().slice(0, 10)} → ${new Date((m.endJD - 2440587.5) * 86400000).toISOString().slice(0, 10)}</td></tr>`).join("")}</table>
        <h3>${HI() ? "पहचाने गए योग व दोष" : "Yogas & Doshas detected"}</h3>
        <ul>${[...r.sections.yogaDosha.yogas, ...r.sections.yogaDosha.doshas].filter((x) => x.matched).map((x) => `<li><b>${esc(x.name)}</b> — ${esc(x.interpretation)}</li>`).join("") || `<li>${HI() ? "शास्त्रीय सीमाओं पर कोई नहीं।" : "None at classical thresholds."}</li>`}</ul>
        <h3>${HI() ? "व्याख्या (निर्धारक टेम्पलेट)" : "Interpretation (deterministic template)"}</h3>
        ${r.interpretation.sections.map((s) => `<p><b>${esc(s.title)}.</b> <span class="muted">${esc(s.text)}</span></p>`).join("")}
        <div class="footer-note">${HI() ? "ऊपर के सभी खगोलीय मान निर्धारक " + r.sections.kundali.audit.mode + " इंजन (प्रोफ़ाइल " + r.sections.kundali.audit.profile + ") द्वारा उत्पादित हैं। व्याख्या परत को केवल संरचित JSON मिला; उसने कोई गणना स्वयं नहीं की।" : `All astronomical values above were produced by the deterministic ${r.sections.kundali.audit.mode} engine (profile ${r.sections.kundali.audit.profile}). The interpretation layer received structured JSON only and performed no calculation of its own.`}</div>
      </div>`;
    } catch (e) { $("#r-out").innerHTML = `<div class="note red">${esc(e.message)}</div>`; }
  };
};

pages["consult-astrologers"] = async (el) => {
  el.innerHTML = `
  <h1>${t("nav_consult")}</h1><div class="muted">${HI() ? "बाज़ार, बुकिंग व परामर्श CRM।" : "Marketplace, booking and consultation CRM."}</div>
  <div class="grid cols-2" id="ast-grid"></div>
  <h3 style="margin-top:22px">${t("myConsults")}</h3>
  <div id="apt-list"></div>`;
  const hue = (h) => `linear-gradient(135deg, hsl(${h},60%,45%), hsl(${h + 40},65%,35%))`;
  try {
    const { astrologers } = await api("/api/v1/astrologers");
    $("#ast-grid").innerHTML = astrologers.map((a) => `
      <div class="card astro-card">
        <div class="avatar" style="background:${hue(a.photoHue)}">${a.name.split(" ").slice(-1)[0][0]}${a.name.split(" ")[1]?.[0] ?? ""}</div>
        <div style="flex:1">
          <b>${a.name}</b> ${a.available ? `<span class="badge green">${t("avail")}</span>` : `<span class="badge">${t("busy")}</span>`}
          <div class="stars">${"★".repeat(Math.round(a.rating))}<span class="faint"> ${a.rating} · ${a.consultations.toLocaleString()} ${t("consults")} · ${a.experienceYears} ${t("yrs")}</span></div>
          <div class="pill-row" style="margin:6px 0">${a.specialties.map((s) => `<span class="tag">${s}</span>`).join("")}</div>
          <div class="faint">${a.languages.join(" · ")} · ₹${a.feePerMin}/min</div>
        </div>
        <button class="btn primary small" data-book="${a.id}" ${a.available ? "" : "disabled"}>${t("book")}</button>
      </div>`).join("");
    $$("[data-book]").forEach((b) => (b.onclick = () => openBooking(astrologers.find((a) => a.id === b.dataset.book))));
    refreshAppointments();
  } catch (e) { $("#ast-grid").innerHTML = `<div class="note red">${esc(e.message)}</div>`; }

  function openBooking(a) {
    modal(`
    <h2>${t("bookTitle")} ${esc(a.name)}</h2>
    <label>${t("modeH")}</label>
    <select id="bk-mode"><option value="chat">${t("chat")}</option><option value="call" selected>${t("call")}</option><option value="video">${t("video")}</option><option value="in-person">${t("inperson")}</option></select>
    <div class="grid cols-3">
      <div><label>${t("date")}</label><input type="date" id="bk-date" value="${new Date(Date.now() + 86400000).toISOString().slice(0, 10)}"></div>
      <div><label>${t("time")}</label><input type="time" id="bk-time" value="18:00"></div>
      <div><label>${t("duration")}</label><select id="bk-dur"><option>10</option><option selected>15</option><option>30</option><option>45</option></select></div>
    </div>
    <label>${t("topic")}</label><textarea id="bk-topic" rows="3"></textarea>
    <div class="note">${HI() ? "आपका परामर्श अनुरोध वर्तमान गणना विधि साथ ले चलेगा:" : "Your consultation request will carry the current calculation method:"} <b>${profileLabel(effectiveProfile("consult"))} (${effectiveProfile("consult")})</b></div>
    <div class="row end" style="margin-top:12px"><button class="btn" data-close>${t("cancel")}</button><button class="btn primary" id="bk-go">${t("confirmBtn")} — ₹${a.feePerMin * 15}</button></div>`);
    $("#bk-dur").onchange = () => { $("#bk-go").textContent = `${t("confirmBtn")} — ₹${a.feePerMin * +$("#bk-dur").value}`; };
    $("#bk-go").onclick = async () => {
      try {
        const appt = await api("/api/v1/consultations/book", { astrologerId: a.id, mode: $("#bk-mode").value, date: $("#bk-date").value, time: $("#bk-time").value, durationMin: +$("#bk-dur").value, topic: $("#bk-topic").value, profileId: effectiveProfile("consult") });
        closeModal(); refreshAppointments();
        modal(`<h2>${HI() ? "परामर्श पुष्टि ✅" : "Consultation confirmed ✅"}</h2><div class="kv"><div>${t("ref")}</div><div class="mono">${appt.id}</div><div>${t("astrologer")}</div><div>${esc(appt.astrologerName)}</div><div>${t("when")}</div><div class="mono">${appt.date} ${appt.time} · ${appt.durationMin} min</div><div>${t("fee")}</div><div>₹${appt.fee}</div><div>${t("statusH2")}</div><div><span class="badge green">${appt.status}</span></div></div><div class="row end" style="margin-top:14px"><button class="btn primary" data-close>${t("done")}</button></div>`);
      } catch (err) { modal(`<h2>${HI() ? "बुकिंग विफल" : "Booking failed"}</h2><div class="note red">${esc(err.message)}</div><div class="row end"><button class="btn" data-close>${t("cancel")}</button></div>`); }
    };
  }

  async function refreshAppointments() {
    try {
      const { appointments } = await api("/api/v1/consultations");
      $("#apt-list").innerHTML = appointments.length ? `<table><tr><th>${t("ref")}</th><th>${t("astrologer")}</th><th>${t("when")}</th><th>${t("modeH")}</th><th>${t("fee")}</th><th>${t("profile")}</th><th>${t("statusH2")}</th><th></th></tr>
      ${appointments.map((x) => `<tr><td class="mono">${x.id}</td><td>${esc(x.astrologerName)}</td><td class="mono">${x.date} ${x.time}</td><td>${x.mode}</td><td>₹${x.fee}</td><td class="faint">${x.profileUsed}</td>
      <td>${x.status === "CONFIRMED" ? '<span class="badge green">CONFIRMED</span>' : '<span class="badge red">CANCELLED</span>'}</td>
      <td>${x.status === "CONFIRMED" ? `<button class="btn small danger" data-cancel="${x.id}">${t("cancel")}</button>` : ""}</td></tr>`).join("")}</table>` : `<div class="muted">${t("noConsults")}</div>`;
      $$("[data-cancel]").forEach((b) => (b.onclick = async () => { await api("/api/v1/consultations/cancel", { id: b.dataset.cancel }); refreshAppointments(); }));
    } catch (e) { $("#apt-list").innerHTML = `<div class="note red">${esc(e.message)}</div>`; }
  }
};

pages["validation-suite"] = async (el) => {
  el.innerHTML = `
  <h1>${HI() ? "गोल्डन सत्यापन सूट" : "Golden Validation Suite"}</h1>
  <div class="muted">${HI() ? "प्रदत्त मिथिला विश्वविद्यालय पंचांग डेटा = गोल्डन संदर्भ। स्रोत स्ट्रिंग यथावत; विसंगतियाँ फ्लैग होती हैं, सुधारी नहीं जातीं। दण्ड–पल = अंत समय।" : "Supplied Mithila Vishwavidyalaya Panchang data = golden reference. Source strings preserved exactly; anomalies flagged, never corrected. दण्ड–पल = END times."}</div>
  <div id="val-out"><div class="spinner"></div></div>`;
  try {
    const v = await api("/api/v1/validation/run");
    const pass = v.gate.makaranda.status.startsWith("PASS");
    $("#val-out").innerHTML = `
    <div class="grid cols-4" style="margin-top:14px">
      <div class="card stat"><div class="v" style="color:${pass ? "var(--green)" : "var(--red)"}">${pass ? "PASS" : "NOT PASSED"}</div><div class="k">${t("gateTitle")}</div></div>
      <div class="card stat"><div class="v">${v.gate.drikCrossCheck.tithiIdentityMatches}</div><div class="k">${t("drikIdentity")}</div></div>
      <div class="card stat"><div class="v">±${v.gate.toleranceSeconds}s</div><div class="k">${t("tolerance")}</div></div>
      <div class="card stat"><div class="v">${v.gate.hybrid?.nakshatraIdentityMatches ?? "—"} · ${v.gate.hybrid?.tithiIdentityMatches ?? "—"}</div><div class="k">${HI() ? "हाइब्रिड आइडेंटिटी (नक्षत्र · तिथि) — निदानात्मक" : "Hybrid identities (nak · tithi) — diagnostic"}</div></div>
      <div class="card stat"><div class="v" style="color:var(--green)">≤${v.drikCertification?.moonWorstArcsec ?? "?"}" · ≤${v.drikCertification?.sunWorstArcsec ?? "?"}" · ${HI() ? "ग्रह" : "planets"} ≤${v.drikCertification?.planetLonWorstArcsec ?? "?"}"</div><div class="k">${HI() ? "दृक् प्रमाणन (चंद्र · सूर्य · ग्रह · राहु) बनाम PyEphem, 2016–2030" : "Drik certified (moon · sun · planets · Rahu) vs PyEphem, 2016–2030"}</div></div>
    </div>
    <div class="note">${esc(v.gate.makaranda.note)}</div>
    <div class="note green">${esc(v.gate.drikCrossCheck.note)}</div>
    <div class="note amber">${esc((v.gate.hybrid?.status ?? "") + " — " + (v.gate.hybrid?.note ?? ""))}</div>
    <h3>${HI() ? "गोल्डन पंक्तियाँ — अवशेष व निदान" : "Golden rows — residuals & diagnostics"}</h3>
    <table><tr><th>${t("date")}</th><th>${HI() ? "स्रोत (यथावत)" : "Source (preserved)"}</th><th>${HI() ? "मकरंद सूर्योदय Δ" : "Makaranda sunrise Δ"}</th><th>${t("tithi")} (M)</th><th>${HI() ? "तिथि-अंत Δ" : "Tithi-end Δ"}</th><th>${HI() ? "नक्षत्र-अंत Δ" : "Nak-end Δ"}</th><th>${HI() ? "दृक् तिथि" : "Drik tithi"}</th><th>${HI() ? "हाइब्रिड तिथि" : "Hybrid tithi"}</th><th>${HI() ? "फ्लैग" : "Flags"}</th></tr>
    ${v.rows.map((r) => {
      const m = r.makaranda ?? {}, d = r.drik ?? {}, h = r.hybrid ?? {};
      const dd = (s) => { if (s == null) return "—"; const min = Math.round(s / 60); return `${min >= 0 ? "+" : ""}${min} min`; };
      return `<tr>
        <td class="mono">${r.date}</td>
        <td class="mono" style="font-size:11.5px">${HI() ? "तिथि" : "tithi"} ${r.sourceTraditional.tithi.sourceTraditionalValue} · ${HI() ? "नक्षत्र" : "nak"} ${r.sourceTraditional.nakshatra.sourceTraditionalValue}<br><span class="faint">${t("clockUnit")}: ${esc(r.sourceTraditional.tithiClock.raw ?? "")} / ${esc(r.sourceTraditional.nakshatraClock.raw ?? "")}</span></td>
        <td class="${m.sunriseStatus?.includes("PASS") ? "delta-pass" : m.sunriseStatus?.includes("WARN") ? "delta-warn" : "delta-crit"}">${dd(m.sunriseDeltaSec)}</td>
        <td>${m.tithiNumberComputedPaksha}/${m.tithiNumberPrinted} ${m.tithiNumberMatch ? "✔" : "✘"}</td>
        <td class="${m.tithiEndStatus?.includes("PASS") ? "delta-pass" : m.tithiEndStatus?.includes("WARN") ? "delta-warn" : "delta-crit"}">${dd(m.tithiEndDeltaSec)}</td>
        <td class="${m.nakshatraEndStatus?.includes("PASS") ? "delta-pass" : m.nakshatraEndStatus?.includes("WARN") ? "delta-warn" : "delta-crit"}">${dd(m.nakshatraEndDeltaSec)}</td>
        <td>${d.tithiNumberComputedPaksha ?? "?"} ${d.tithiNumberMatch ? "✔" : "✘"}</td>
        <td>${h.tithiNumberComputedPaksha ?? "?"} ${h.tithiNumberMatch ? "✔" : "✘"} <span class="faint">(${HI() ? "नक्षत्र" : "nak"}: ${h.nakshatraIndexComputed ?? "?"})</span></td>
        <td>${r.anomaly ? `<span class="badge red" title="${esc(r.anomaly)}">ANOMALY</span>` : ""} ${r.ahoratram ? '<span class="badge amber">AHORATRAM</span>' : ""}</td>
      </tr>`;
    }).join("")}</table>
    <h3>${HI() ? "दस्तावेज़-व्युत्पन्न असंगतियाँ (रखी गईं, सुधारी नहीं)" : "Document-derived normalization inconsistencies (kept, not corrected)"}</h3>
    <table><tr><th>${t("date")}</th><th>${HI() ? "क्षेत्र" : "Field"}</th><th>${HI() ? "सूत्र (सूर्योदय + दण्ड–पल)" : "Formula (sunrise + danda–pala)"}</th><th>${HI() ? "दस्तावेज़ में" : "Document listed"}</th><th>Δ</th><th>${t("statusH2")}</th></tr>
    ${v.rows.map((r) => ["tithi", "nakshatra"].map((f) => {
      const c = r.documentDerivedComparison[f];
      if (c.status === "OK") return "";
      return `<tr><td class="mono">${r.date}</td><td>${f}</td><td class="mono">${c.formula}</td><td class="mono">${c.listed}</td><td>${Math.round(c.deltaSec / 60)} min</td><td><span class="badge red">DERIVATION_INCONSISTENCY</span></td></tr>`;
    }).join("")).join("")}
    </table>
    <h3>${HI() ? "स्वतंत्र एफेमेरिस प्रमाणन (PyEphem 4.2.1)" : "Independent ephemeris certification (PyEphem 4.2.1)"}</h3>
    <div class="note green">${HI() ? "प्रत्येक मुद्रित तिथि-अंत पर दृक् इंजन द्वारा चंद्र–सूर्य वियोग; बाह्य एफेमेरिस (PyEphem) से जाँचा गया। यह हमारे आधुनिक इंजन को प्रमाणित करता है; दिखाया गया मुद्रित-बनाम-आधुनिक अंतर पारंपरिक मॉडल का अपना अवशेष-बैंड है।" : "Moon−sun separation computed by the Drik engine at each printed tithi end, checked against an external ephemeris (PyEphem). This certifies our modern engine; the printed-vs-modern gap shown is the traditional model's own residual band."}</div>
    <table><tr><th>${HI() ? "मुद्रित तिथि-अंत (IST)" : "Printed tithi end (IST)"}</th><th>${HI() ? "संदर्भ" : "Reference"}</th><th>PyEphem °</th><th>${HI() ? "इंजन °" : "Engine °"}</th><th>Δ</th><th>${t("statusH2")}</th></tr>
    ${(v.ephemAnchors ?? []).map((a) => `<tr><td class="mono">${a.iso}</td><td style="font-size:12px">${esc(a.ref)}</td><td class="mono">${a.distDeg}</td><td class="mono">${a.engineDeg}</td><td class="mono">${a.deltaVsEphemDeg}</td><td>${a.ok ? '<span class="badge green">≤0.15°</span>' : '<span class="badge red">CHECK</span>'}</td></tr>`).join("")}</table>
    <h3>${HI() ? "दृक् इंजन प्रमाणन ग्रिड (60 युग, 2016–2030)" : "Drik engine certification grid (60 epochs, 2016–2030)"}</h3>
    <div class="note green">${esc((v.drikCertification?.reference ?? "") + " — " + (v.drikCertification?.grid ?? ""))}<br>${esc(v.drikCertification?.note ?? "")}</div>
    <div class="kv mono" style="margin-top:8px">
      <div>${HI() ? "चंद्रमा — सबसे बड़ा अवशेष" : "Moon — worst residual"}</div><div>${v.drikCertification?.moonWorstArcsec ?? "?"}" = ${v.drikCertification?.moonWorstDeg ?? "?"}° @ ${v.drikCertification?.moonWorstAt ?? ""} <span class="badge green">≤0.005° LOCKED</span></div>
      <div>${HI() ? "सूर्य — सबसे बड़ा अवशेष" : "Sun — worst residual"}</div><div>${v.drikCertification?.sunWorstArcsec ?? "?"}" = ${v.drikCertification?.sunWorstDeg ?? "?"}° @ ${v.drikCertification?.sunWorstAt ?? ""} <span class="badge green">≤0.012° LOCKED</span></div>
      <div>${HI() ? "ग्रह (बुध–शनि) — देशांतर, पूर्ण VSOP87D" : "Planets (Mer–Sat) — longitude, full VSOP87D"}</div><div>${v.drikCertification?.planetLonWorstArcsec ?? "?"}" @ ${v.drikCertification?.planetLonWorstAt ?? ""} <span class="badge green">≤0.001° LOCKED</span> · ${HI() ? "अक्षांश" : "latitude"} ≤${v.drikCertification?.planetLatWorstArcsec ?? "?"}" <span class="badge green">≤0.005° LOCKED</span></div>
      <div>${HI() ? "राहु — सत्य दोलन-ग्रंथि (ऑस्कुलेटिंग नोड)" : "Rahu — true osculating node"}</div><div>${v.drikCertification?.rahuWorstArcsec ?? "?"}" @ ${v.drikCertification?.rahuWorstAt ?? ""} <span class="badge green">≤0.05° LOCKED</span> <span class="faint">(${HI() ? "चंद्र-β तल × ग्रंथि ज्यामिति; राशि/नक्षत्र कभी नहीं बदलता" : "lunar-β floor × node geometry; never flips rashi/nakshatra"})</span></div>
      <div>${HI() ? "चंद्र अक्षांश (β)" : "Moon latitude (β)"}</div><div>${v.drikCertification?.moonBetaWorstArcsec ?? "?"}" @ ${v.drikCertification?.moonBetaWorstAt ?? ""} <span class="badge green">≤0.005° LOCKED</span></div>
    </div>
    <h3>${HI() ? "PROVISIONAL फ़ोटो निष्कर्षण (स्वामी पुष्टि की प्रतीक्षा)" : "PROVISIONAL photo extractions (awaiting owner confirmation)"}</h3>
    <table><tr><th>${t("date")}</th><th>${HI() ? "स्रोत" : "Source"}</th><th>${HI() ? "नए पढ़े क्षेत्र" : "Newly read fields"}</th><th>${t("statusH2")}</th></tr>
    ${(v.photoProvisional ?? []).map((p) => `<tr><td class="mono">${p.date}</td><td style="font-size:12px">${esc(p.source)}</td><td class="mono" style="font-size:11.5px">${esc(Object.entries(p.fields).map(([k, x]) => `${k}=${x}`).join(" · "))}</td><td><span class="badge amber">PROVISIONAL</span></td></tr>`).join("")}</table>
    <h3>${HI() ? "डेटा सत्यापन चिंताएँ — लाइव स्थिति" : "Data verification concerns — live status"}</h3>
    <div class="note red">${HI() ? `खुला — 25-06-2026 नक्षत्र "स्वाती": PyEphem-प्रमाणित दृक् चंद्र उस सूर्योदय पर ≈ तुला 21° (विशाखा क्षेत्र) है; स्वाती हेतु ≈ तुला 13°20′ चाहिए — ठीक एक नक्षत्र (13°20′) का अंतर, जो किसी एफेमेरिस त्रुटि से संभव नहीं। कृपया मुद्रित शीट की जोड़ी जाँचें।<br>
    खुला — देशांतर "01|35": अर्थ अपुष्ट। H1 (उज्जयिन से पूर्व 1द35प ≈ 85.27°E); स्वामी-शोध H5 (अंगुल|व्यंगुल छाया पैकिंग) व H6 (पल समय-संशोधन) प्रोफ़ाइल में दर्ज।<br>
    खुला — मकरंद सारणी + आधिकारिक अयनांश (2016–2026) अप्राप्त; गेट जान-बूझकर NOT PASSED।<br>
    खुला — मुद्रित सूर्योदय हमारे गणित सूर्योदय से ~3–25 मिनट बाद है; देशांतर/देशांतर-काल प्रश्न (H6 देखें)।<br>
    स्वामी-पुष्ट — सूर्यास्त 12-घंटा चक्र में मुद्रित (05-10-2025 "05:51" = 17:51); +12h केवल व्याख्या में।<br>
    स्वामी-पुष्ट — "पू." = पूर्वाषाढ़ा।<br>
    स्वामी-पुष्ट — 27-07-2022 मान मूल पंचांग से पुनः सत्यापित; तीनों मान यथावत; प्रदर्शन-परंपरा प्रश्न के रूप में।<br>
    हल — पलभा "06": विषुवत् दोपहर छाया; 12·tan(26°35′) = 5.9998 ≈ 6.00 ⇒ अक्षांश से संगत।<br>
    लंबित — योग/करण/चंद्रोदय स्तंभ: नई फ़ोटो शीटें ingested; पूर्ण पंक्ति-लेखन स्वामी-सत्यापन की प्रतीक्षा में।` : `OPEN — 25-06-2026 nakshatra "स्वाती": Drik-precise moon at 25-06-2026 sunrise ≈ Tula 21° (Vishakha window), while Swati would require ≈ Tula 13°20′; a ~13°20′ (one-nakshatra) gap that no ephemeris error can produce. Please check the printed sheet's pairing.<br>
    OPEN — Deshantar "01|35": meaning unconfirmed. H1 (1d35p east of Ujjain ≈ 85.27°E); owner-research H5 (angula|vyangula shadow packing) and H6 (pala time-correction) registered.<br>
    OPEN — Makaranda Sarani tables + official ayanamsa values (2016–2026) not yet supplied; gate stays NOT PASSED by design.<br>
    OPEN — Printed sunrise runs ~3–25 min later than our siddhantic sunrise at 85.27°E; likely a meridian/deshantara-kala question (see H6).<br>
    OWNER-CONFIRMED — sunset printed on a 12-hour cycle (05-10-2025 "05:51" = 17:51); +12h applied in interpretation only.<br>
    OWNER-CONFIRMED — "पू." = Purva Ashadha.<br>
    OWNER-CONFIRMED — 27-07-2022 printed values re-verified from the original Panchang; all values retained; display-convention question.<br>
    SOLVED — Palbha "06": equinox noon shadow; 12·tan(26°35′) = 5.9998 ≈ 6.00 ⇒ consistent with Akshansha.<br>
    PENDING — Yoga/Karana/moonrise columns: new photo sheets ingested; full row transcription awaiting owner-verified extraction.`}</div>
    <details><summary>${HI() ? "पूर्ण सूट JSON" : "Full suite JSON"}</summary><pre>${esc(JSON.stringify(v, null, 2).slice(0, 6000))}…</pre></details>`;
  } catch (e) { $("#val-out").innerHTML = `<div class="note red">${esc(e.message)}</div>`; }
};

pages["settings"] = async (el) => {
  const profiles = state.profiles?.profiles ?? {};
  const mak = profiles["makaranda-v1"] ?? {};
  const hyb = profiles["makaranda-v2-hybrid"] ?? {};
  el.innerHTML = `
  <h1>${t("nav_settings")}</h1>
  <div class="grid cols-2">
    <div class="card">
      <h2>${HI() ? "वैश्विक गणना प्राथमिकता" : "Global calculation preference"}</h2>
      <div class="seg" data-feature="__global">
        <button class="${state.globalProfile === "makaranda-v1" ? "on" : ""}" data-pid="makaranda-v1">${t("makName")} (${HI() ? "डिफ़ॉल्ट" : "default"})</button>
        <button class="${state.globalProfile === "drik-v1" ? "on" : ""}" data-pid="drik-v1">${t("drikName")}</button>
        <button class="${state.globalProfile === "makaranda-v2-hybrid" ? "on" : ""}" data-pid="makaranda-v2-hybrid" title="${esc(t("badgeHybrid"))}">${t("hybridName")}</button>
      </div>
      <h3>${HI() ? "प्रति-फ़ीचर ओवरराइड" : "Per-feature overrides"}</h3>
      <table><tr><th>${HI() ? "फ़ीचर" : "Feature"}</th><th>${HI() ? "ओवरराइड" : "Override"}</th><th></th></tr>
      ${["panchang", "kundali", "varga", "dasha", "yoga", "milan", "gochar", "muhurta", "varshaphal", "prashna", "reports"].map((f) => `<tr><td>${f}</td><td>${state.overrides[f] ? `<span class="badge amber">${state.overrides[f]}</span>` : `<span class="faint">${HI() ? "ग्लोबल" : "global"}</span>`}</td><td>${state.overrides[f] ? `<a href="#" data-reset="${f}">${t("resetGlobal")}</a>` : ""}</td></tr>`).join("")}</table>
      <h3>${HI() ? "भाषा" : "Language"}</h3>
      <div class="row"><button class="btn" id="s-lang">${HI() ? "Switch to English" : "हिंदी में बदलें"}</button></div>
    </div>
    <div class="card">
      <h2>${HI() ? "मकरंद पारंपरिक संदर्भ (makaranda-v1)" : "Makaranda traditional reference (makaranda-v1)"}</h2>
      <div class="kv mono">
        <div>${t("nav_panchang")}</div><div>${esc(mak.panchang ?? "")}</div>
        <div>${HI() ? "परंपरा" : "Tradition"}</div><div>${esc(mak.tradition ?? "")}</div>
        <div>${HI() ? "सिद्धांत" : "Siddhanta"}</div><div>${esc(mak.siddhanta ?? "")}</div>
        <div>${HI() ? "अक्षांश" : "Akshansh"}</div><div>${esc(mak.traditionalReference?.akshanshLatitudePrinted ?? "")}</div>
        <div>${HI() ? "देशांतर (मुद्रित)" : "Deshantar (printed)"}</div><div>${esc(mak.traditionalReference?.deshantarPrinted ?? "")}</div>
        <div>${HI() ? "पलभा" : "Palbha"}</div><div>${esc(mak.traditionalReference?.palbhaPrinted ?? "")}</div>
        <div>${HI() ? "दिन-सीमा" : "Day boundary"}</div><div>${esc(mak.dayBoundary ?? "")}</div>
        <div>${t("ayanamsa")}</div><div>${esc(mak.ayanamsa?.strategy ?? "")} — ${esc(mak.ayanamsa?.status ?? "")}</div>
      </div>
      <h3>${HI() ? "देशांतर व्याख्या रणनीतियाँ (संस्करित)" : "Longitude interpretation strategies (versioned)"}</h3>
      ${(mak.longitudeResolution?.strategies ?? []).map((s) => `<details><summary>${s.id} — <span class="badge ${s.status.includes("FORBIDDEN") ? "red" : s.status.includes("UNVERIFIED") ? "amber" : "green"}">${s.status}</span>${mak.longitudeResolution.selectedStrategy === s.id ? ' <span class="badge gold">SELECTED</span>' : ""}</summary><div class="muted" style="margin-top:6px">${esc(s.description)}</div></details>`).join("")}
      <div class="note">${HI() ? "मुद्रित संकेतन ही अभिलेख-स्रोत है। संगणकीय व्याख्या द्वितीय है, प्रलेखित है, और कभी दरभंगा/सीतामढ़ी GPS की मौन जगह नहीं।" : "The printed notation is the source of record. Computational interpretation is second, documented, and never a silent substitution of Darbhanga/Sitamarhi GPS coordinates."}</div>
    </div>
  </div>
  <div class="card" style="margin-top:16px">
    <h2>${HI() ? "दृक् इंजन" : "Drik engine"}</h2>
    <div class="kv"><div>${HI() ? "एफेमेरिस" : "Ephemeris"}</div><div>${esc(profiles["drik-v1"]?.ephemerisSource ?? "")}</div>
    <div>Swiss Ephemeris</div><div>${esc(profiles["drik-v1"]?.swissEphemerisAdapter?.note ?? "")}</div>
    <div>${HI() ? "अयनांश विकल्प" : "Ayanamsa options"}</div><div>${(profiles["drik-v1"]?.ayanamsaOptions ?? []).join(", ")}</div></div>
  </div>
  <div class="card" style="margin-top:16px">
    <h2>${HI() ? "मकरंद v2 हाइब्रिड (प्रायोगिक सेतु इंजन)" : "Makaranda v2 Hybrid (experimental bridge engine)"} <span class="badge amber">UNVERIFIED_HYBRID</span></h2>
    <div class="kv mono" style="margin-top:8px">
      <div>${HI() ? "इंजन" : "Engine"}</div><div>${esc(hyb.engine ?? "")}</div>
      <div>${HI() ? "सिद्धांत" : "Siddhanta"}</div><div>${esc(hyb.siddhanta ?? "")}</div>
      <div>${HI() ? "एफेमेरिस" : "Ephemeris"}</div><div>${esc(hyb.ephemerisSource ?? "")}</div>
      <div>${t("ayanamsa")}</div><div>${esc(hyb.ayanamsa?.strategy ?? "")} — ${esc(hyb.ayanamsa?.status ?? "")}</div>
      <div>${HI() ? "फिट स्रोत" : "Fitted against"}</div><div>${esc(hyb.hybridFit?.fittedAgainst ?? "")}</div>
      <div>${HI() ? "प्राचल" : "Parameters"}</div><div>${esc(hyb.hybridFit?.params ?? "")}</div>
    </div>
    <div class="note amber">${esc(hyb.ayanamsa?.note ?? "")}</div>
  </div>`;
  $("#s-lang").onclick = () => { state.lang = HI() ? "en" : "hi"; persist(); renderChrome(); route(); };
};

/* ---------------- router ---------------- */

async function route() {
  const hash = location.hash.replace(/^#\//, "") || "dashboard";
  renderChrome();
  const el = $("#main");
  const pageKey = SLUG_PAGE[hash] ?? "dashboard";
  const fn = pages[pageKey] ?? pages["dashboard"];
  el.innerHTML = `<div class="spinner"></div>`;
  try { await fn(el); } catch (e) { el.innerHTML = `<div class="note red">${esc(e.message)}</div>`; }
  el.scrollTop = 0;
}
window.addEventListener("hashchange", route);

setInterval(() => {
  const d = new Date();
  const loc = HI() ? "hi-IN" : "en-IN";
  $("#clock").textContent = d.toLocaleDateString(loc, { weekday: "short", day: "2-digit", month: "short", year: "numeric" }) + " · " + d.toLocaleTimeString(loc, { hour12: false }) + " IST";
}, 1000);

(async () => {
  try { state.profiles = await api("/api/v1/profiles"); } catch {}
  route();
})();
