/**
 * interpret.js — AI interpretation layer (master spec §15, §27).
 *
 * HARD RULE: this layer NEVER calculates astronomy. It receives structured
 * calculation JSON only and produces language. It exposes:
 *   1) buildInterpretation(kind, structured) — deterministic template prose
 *   2) buildLLMRequest(kind, structured)     — the exact prompt + payload an
 *      external LLM provider would receive (provider adapter slot).
 *
 * The LLM may explain, summarize and rephrase. It may NOT change calculated
 * numbers or invent missing astronomy.
 */

import { SIGN_NAMES } from "./panchang.js";

const SIGN_NAME = (i) => SIGN_NAMES[i] ?? `sign ${i + 1}`;
const HI_SIGN = ["मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];
const HI_PLANET = { Sun: "सूर्य", Moon: "चन्द्र", Mars: "मंगल", Mercury: "बुध", Jupiter: "गुरु", Venus: "शुक्र", Saturn: "शनि", Rahu: "राहु", Ketu: "केतु" };
const HI_PAKSHA = { Shukla: "शुक्ल", Krishna: "कृष्ण" };
const HI_TITHI = { Pratipada: "प्रतिपदा", Dwitiya: "द्वितीया", Tritiya: "तृतीया", Chaturthi: "चतुर्थी", Panchami: "पंचमी", Shashthi: "षष्ठी", Saptami: "सप्तमी", Ashtami: "अष्टमी", Navami: "नवमी", Dashami: "दशमी", Ekadashi: "एकादशी", Dwadashi: "द्वादशी", Trayodashi: "त्रयोदशी", Chaturdashi: "चतुर्दशी", Purnima: "पूर्णिमा", Amavasya: "अमावस्या" };
const HI_NAK = { Ashwini: "अश्विनी", Bharani: "भरणी", Krittika: "कृत्तिका", Rohini: "रोहिणी", Mrigashira: "मृगशिरा", Ardra: "आर्द्रा", Punarvasu: "पुनर्वसु", Pushya: "पुष्य", Ashlesha: "अश्लेषा", Magha: "मघा", "Purva Phalguni": "पूर्व फाल्गुनी", "Uttara Phalguni": "उत्तर फाल्गुनी", Hasta: "हस्त", Chitra: "चित्रा", Swati: "स्वाती", Vishakha: "विशाखा", Anuradha: "अनुराधा", Jyeshtha: "ज्येष्ठा", Mula: "मूल", "Purva Ashadha": "पूर्वाषाढ़ा", "Uttara Ashadha": "उत्तराषाढ़ा", Shravana: "श्रवण", Dhanishta: "धनिष्ठा", Shatabhisha: "शतभिषा", "Purva Bhadrapada": "पूर्व भाद्रपदा", "Uttara Bhadrapada": "उत्तर भाद्रपदा", Revati: "रेवती" };
const HI_YOGA = { Vishkambha: "विष्कम्भ", Priti: "प्रीति", Ayushman: "आयुष्मान्", Saubhagya: "सौभाग्य", Shobhana: "शोभन", Atiganda: "अतिगण्ड", Sukarma: "सुकर्मा", Dhriti: "धृति", Shoola: "शूल", Ganda: "गण्ड", Vriddhi: "वृद्धि", Dhruva: "ध्रुव", Vyaghata: "व्याघात", Harshana: "हर्षण", Vajra: "वज्र", Siddhi: "सिद्धि", Vyatipata: "व्यतीपात", Variyan: "परिघ", Parigha: "परिघ", Shiva: "शिव", Siddha: "सिद्ध", Sadhya: "साध्य", Shubha: "शुभ", Shukla: "शुक्ल", Brahma: "ब्रह्म", Indra: "इन्द्र", Vaidhriti: "वैधृति" };
const HI_KARANA = { Kimstughna: "किम्स्तुघ्न", Bava: "बव", Balava: "बालव", Kaulava: "कौलव", Taitila: "तैतिल", Garaja: "गर", Vanija: "वणिज", Vishti: "विष्टि", Shakuni: "शकुनि", Chatushpada: "चतुष्पाद", Naga: "नाग" };
const HI_VARA = { Ravi: "रवि (रविवार)", Soma: "सोम (सोमवार)", Mangala: "मंगल (मंगलवार)", Budha: "बुध (बुधवार)", Guru: "गुरु (गुरुवार)", Shukra: "शुक्र (शुक्रवार)", Shani: "शनि (शनिवार)" };

/** lang: "hi" (default UI) or "en". This layer NEVER calculates. */
export function buildInterpretation(kind, data, lang = "hi") {
  const hi = lang === "hi";
  const SN = (i) => (hi ? HI_SIGN[i] ?? SIGN_NAME(i) : SIGN_NAME(i));
  const PN = (n) => (hi ? HI_PLANET[n] ?? n : n);
  const banner = data?.audit ? [`Calculation Method: ${data.audit.mode}`, `Profile: ${data.audit.profile}`, `Ayanamsa: ${data.audit.ayanamsa}`] : [];
  const out = { kind, methodBanner: banner.join("\n"), lang, sections: [], llmReady: true };

  switch (kind) {
    case "kundali": {
      const l = data.lagna;
      out.sections.push({ title: "Chart overview", text: `With ${SIGN_NAME(l.sign)} rising, the native's outward temperament follows the qualities of this sign. All positions below are computed in the ${data.audit.mode} profile; none are estimated by the interpretation layer.` });
      const moon = data.positions.find((p) => p.name === "Moon");
      out.sections.push({ title: "Moon & mind", text: `The Moon is placed in ${SIGN_NAME(moon.sign)} (${moon.nakshatra}, pada ${moon.pada}). This determines the rashi used for Panchang-style matching and transit analysis.` });
      const retro = data.positions.filter((p) => p.retrograde).map((p) => p.name);
      if (retro.length) out.sections.push({ title: "Retrograde grahas", text: `${retro.join(", ")} appear retrograde at birth, internalising their significations (classical reading).` });
      const combust = data.positions.filter((p) => p.combust).map((p) => p.name);
      if (combust.length) out.sections.push({ title: "Combustion", text: `${combust.join(", ")} are within traditional combustion orbs of the Sun (Surya Siddhanta orbs).` });
      break;
    }
    case "dasha": {
      const md = data.mahadashas?.[0];
      out.sections.push({ title: hi ? `दशा: ${data.system}` : `Dasha: ${data.system}`, text: data.seedMethod });
      if (md) out.sections.push(hi
        ? { title: "वर्तमान महादशा", text: `${PN(md.planet)} महादशा (${md.years.toFixed(2)} वर्ष) — संदर्भ दिनांक पर सक्रिय वैषयिक काल। उप-काल का समय निर्धारक इंजन से आता है; यह पाठ केवल सारांश है।` }
        : { title: "Current Mahadasha", text: `${md.planet} mahadasha (${md.years.toFixed(2)} yr) — the thematic period active at the reference date. Sub-period timing comes from the deterministic engine; this text only summarises.` });
      break;
    }
    case "yoga": {
      for (const y of data.yogas.filter((x) => x.matched)) out.sections.push({ title: y.name, text: y.interpretation });
      for (const d of data.doshas.filter((x) => x.matched)) out.sections.push({ title: d.name, text: `${d.interpretation} Remedies: ${d.remedies.join("; ")}.` });
      if (!out.sections.length) out.sections.push({ title: "No major combinations", text: "The selected rule set found no matched yoga/dosha at classical thresholds." });
      break;
    }
    case "milan": {
      out.sections.push(hi
        ? { title: "अष्टकूट सारांश", text: `36 में से ${data.totalGuna} गुण मिले — ${data.verdict}.` }
        : { title: "Ashtakoota summary", text: `${data.totalGuna} of 36 gunas matched — ${data.verdict}.` });
      for (const d of data.details) if (d.score < d.max) out.sections.push({ title: `${d.koota} (${d.score}/${d.max})`, text: d.note });
      break;
    }
    case "panchang": {
      const VW = String(data.vara ?? "").split(" ")[0];
      out.sections.push(hi
        ? { title: "पंचांग", text: `${data.date}: ${HI_VARA[VW] ?? data.vara}; ${HI_PAKSHA[data.tithi.paksha] ?? data.tithi.paksha} ${HI_TITHI[data.tithi.name] ?? data.tithi.name} का अंत ${data.tithi.endTimestamp}; नक्षत्र ${HI_NAK[data.nakshatra.name] ?? data.nakshatra.name} का अंत ${data.nakshatra.endTimestamp}; योग ${HI_YOGA[data.yoga.name] ?? data.yoga.name}; करण ${HI_KARANA[data.karana?.name] ?? data.karana?.name ?? "—"}. सूर्योदय ${data.sunrise}, सूर्यास्त ${data.sunset} (घड़ी समय IST)। राहुकाल ${data.rahuKaal.start}–${data.rahuKaal.end}।` }
        : { title: "Panchang", text: `${data.date}: ${data.vara}; ${data.tithi.paksha} ${data.tithi.name} ends ${data.tithi.endTimestamp}; nakshatra ${data.nakshatra.name} ends ${data.nakshatra.endTimestamp}; yoga ${data.yoga.name}. Sunrise ${data.sunrise}, sunset ${data.sunset}. Rahu Kaal ${data.rahuKaal.start}–${data.rahuKaal.end}.` });
      out.sections.push(hi
        ? { title: "विधि टिप्पणी", text: `${data.calculationMode} इंजन (प्रोफ़ाइल ${data.profileVersion}) द्वारा उत्पादित; दण्ड–पल मान स्रोत परंपरा के अनुसार सूर्योदय के सापेक्ष अंत समय हैं।` }
        : { title: "Method note", text: `Produced by the ${data.calculationMode} engine (profile ${data.profileVersion}); दण्ड–पल values are END times relative to sunrise per the source convention.` });
      break;
    }
    case "transit": {
      out.sections.push(hi
        ? { title: "गोचर स्थिति", text: data.sadeSati.phase + (data.sadeSati.active ? ` (गोचर शनि ${SN(data.sadeSati.saturnSign)} में, जन्म चंद्र ${SN(data.sadeSati.natalMoonSign)} में)।` : "।") }
        : { title: "Transit status", text: data.sadeSati.phase + (data.sadeSati.active ? ` (Saturn in ${SN(data.sadeSati.saturnSign)} vs natal Moon in ${SN(data.sadeSati.natalMoonSign)}).` : ".") });
      break;
    }
    default:
      out.sections.push({ title: "Interpretation", text: "Structured result received; add a template for this feature." });
  }
  return out;
}

export function buildLLMRequest(kind, structured, lang = "hi") {
  const hi = lang === "hi";
  return {
    provider: "ADAPTER_SLOT", // wire any provider (Claude/GPT/Gemini/...) behind this slot
    system: hi
      ? "आप पेशेवर वैदिक ज्योतिष व्याख्याकार हैं। आपको केवल निर्धारक इंजन का संरचित गणना JSON मिलता है। नियम: (1) कोई अंक न बदलें/पुनः न गणें; (2) खगोलीय डेटा न गढ़ें; (3) सूचना अनुपस्थित हो तो कहें; (4) हर उत्तर में गणना विधि/प्रोफ़ाइल बैनर उद्धृत करें; (5) स्पष्ट, warmth भरे और व्यावसायिक रहें। उत्तर हिंदी में दें।"
      : "You are a professional Vedic astrology interpreter. You receive ONLY structured calculation JSON from a deterministic engine. Rules: (1) never alter or recompute any number; (2) never invent astronomical data; (3) if information is missing, say so; (4) quote the calculation method/profile banner in every answer; (5) be clear, warm and professional.",
    user: `${hi ? "इस " : "Interpret this "}${kind} ${hi ? "परिणाम की व्याख्या करें:" : "result:"}\n${JSON.stringify(structured, null, 2)}`,
    payload: structured,
  };
}
