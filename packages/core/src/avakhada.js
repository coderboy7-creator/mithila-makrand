/**
 * avakhada.js — Janma Avakhada (जन्म अवखड़ा) from the Moon's nakshatra/pada.
 *
 * Tables sourced 2026-09-20 (cross-checked ≥2 independent publications and the
 * Astrotalk ASDF reference PDF):
 *  - varna: nakshatra-level (Rohini=Shudra verified vs PDF)
 *  - gana/nadi/yoni: classical Ashtakoota tables (Rohini=Manushya/Antya/Serpent-M vs PDF)
 *  - vashya: sign-based classical mapping (Rohini→Taurus→Chatushpada vs PDF)
 *  - 108 naming syllables (Rohini p4 = वू vs PDF)
 *  - paya: pada 1..4 = स्वर्ण/रजत/ताम्र/लोह (pada 4 = लोहा vs PDF)
 *  - yunja: nak 1–9 पूर्व, 10–18 मध्य, 19–27 अंत (Rohini = पूर्व vs PDF)
 */

import { SIGN_LORDS, norm360 } from "./base.js";

const signOf = (lon) => Math.floor(norm360(lon) / 30);
const nakIndexPada = (lon) => {
  const x = norm360(lon);
  const span = 360 / 27;
  return { index: Math.floor(x / span), pada: Math.floor((x % span) / (span / 4)) + 1 };
};

export const NAK_DEV = ["अश्विनी", "भरणी", "कृत्तिका", "रोहिणी", "मृगशिरा", "आर्द्रा", "पुनर्वसु", "पुष्य", "आश्लेषा", "मघा", "पूर्व फाल्गुनी", "उत्तर फाल्गुनी", "हस्त", "चित्रा", "स्वाति", "विशाखा", "अनुराधा", "ज्येष्ठा", "मूल", "पूर्वाषाढ़ा", "उत्तराषाढ़ा", "श्रवण", "धनिष्ठा", "शतभिषा", "पूर्व भाद्रपद", "उत्तर भाद्रपद", "रेवती"];

export const NAK_DEITY = ["अश्विनी कुमार", "यम", "अग्नि", "ब्रह्मा", "सोम", "रुद्र", "अदिति", "बृहस्पति", "नाग", "पितर", "भग", "आर्यमा", "सविता", "विश्वकर्मा", "वायु", "इन्द्राग्नि", "मित्र", "इन्द्र", "निऋति", "आप", "विश्वेदेव", "विष्णु", "वसु", "वरुण", "अज एकपाद", "अहिर्बुध्न्य", "पूषा"];

const VARNA_SEQ = ["Brahmin", "Kshatriya", "Vaishya", "Shudra", "Shudra", "Vaishya", "Kshatriya", "Brahmin", "Brahmin", "Kshatriya", "Vaishya", "Shudra", "Shudra", "Vaishya", "Kshatriya", "Brahmin", "Brahmin", "Kshatriya", "Vaishya", "Shudra", "Shudra", "Vaishya", "Kshatriya", "Brahmin", "Brahmin", "Kshatriya", "Vaishya"];
const VARNA_DEV = { Brahmin: "ब्राह्मण", Kshatriya: "क्षत्रिय", Vaishya: "वैश्य", Shudra: "शूद्र" };

export const GANA_SEQ = ["Deva", "Manushya", "Rakshasa", "Manushya", "Deva", "Manushya", "Deva", "Deva", "Rakshasa", "Rakshasa", "Manushya", "Manushya", "Deva", "Rakshasa", "Deva", "Rakshasa", "Deva", "Rakshasa", "Rakshasa", "Manushya", "Manushya", "Deva", "Rakshasa", "Rakshasa", "Manushya", "Manushya", "Deva"];
const GANA_DEV = { Deva: "देव", Manushya: "मानव", Rakshasa: "राक्षस" };

export const NADI_SEQ = ["Adi", "Madhya", "Antya", "Antya", "Madhya", "Adi", "Adi", "Madhya", "Antya", "Antya", "Madhya", "Adi", "Adi", "Madhya", "Antya", "Antya", "Madhya", "Adi", "Adi", "Madhya", "Antya", "Antya", "Madhya", "Adi", "Adi", "Madhya", "Antya"];
const NADI_DEV = { Adi: "आद्य", Madhya: "मध्य", Antya: "अंत्य" };

export const YONI_SEQ = [["Horse", "M"], ["Elephant", "M"], ["Sheep", "F"], ["Serpent", "M"], ["Serpent", "F"], ["Dog", "F"], ["Cat", "F"], ["Goat", "M"], ["Cat", "M"], ["Rat", "M"], ["Rat", "F"], ["Cow", "M"], ["Buffalo", "F"], ["Tiger", "F"], ["Buffalo", "M"], ["Tiger", "M"], ["Deer", "F"], ["Deer", "M"], ["Dog", "M"], ["Monkey", "M"], ["Mongoose", "M"], ["Monkey", "F"], ["Lion", "F"], ["Horse", "F"], ["Lion", "M"], ["Cow", "F"], ["Elephant", "F"]];
const YONI_DEV = { Horse: "अश्व", Elephant: "गज", Sheep: "मेघ", Serpent: "सर्प", Dog: "श्वान", Cat: "मार्जार", Goat: "अज", Rat: "मूषक", Cow: "गौ", Buffalo: "महिष", Tiger: "व्याघ्र", Deer: "मृग", Monkey: "वानर", Mongoose: "नकुल", Lion: "सिंह" };

const VASHYA_OF_SIGN = ["Chatushpada", "Chatushpada", "Manava", "Keeta", "Vanachara", "Manava", "Manava", "Keeta", "Vanachara", "Chatushpada", "Manava", "Jalachara"];
const VASHYA_DEV = { Chatushpada: "चतुष्पद", Manava: "नर", Keeta: "कीट", Vanachara: "वनचर", Jalachara: "जलचर" };

const SYLLABLES = [
  ["चु", "चे", "चो", "ला"], ["ली", "लू", "ले", "लो"], ["अ", "ई", "उ", "ए"], ["ओ", "वा", "वी", "वू"],
  ["वे", "वो", "का", "की"], ["कु", "घ", "ङ", "छ"], ["के", "को", "हा", "ही"], ["हु", "हे", "हो", "ड"],
  ["डी", "डू", "डे", "डो"], ["मा", "मी", "मू", "मे"], ["मो", "टा", "टी", "टू"], ["टे", "टो", "पा", "पी"],
  ["पू", "ष", "ण", "ठ"], ["पे", "पो", "रा", "री"], ["रू", "रे", "रो", "ता"], ["ती", "तू", "ते", "तो"],
  ["ना", "नी", "नू", "ने"], ["नो", "या", "यी", "यू"], ["ये", "यो", "भा", "भी"], ["भू", "धा", "फा", "ढा"],
  ["भे", "भो", "जा", "जी"], ["खी", "खू", "खे", "खो"], ["गा", "गी", "गु", "गे"], ["गो", "सा", "सी", "सू"],
  ["से", "सो", "दा", "दी"], ["दू", "थ", "झ", "ञ"], ["दे", "दो", "च", "ची"],
];

const PAYA = [["Swarna", "स्वर्ण"], ["Rajat", "रजत"], ["Tamra", "ताम्र"], ["Loha", "लोह"]];
const TATTVA_OF_SIGN = ["अग्नि", "पृथ्वी", "वायु", "जल", "अग्नि", "पृथ्वी", "वायु", "जल", "अग्नि", "पृथ्वी", "वायु", "जल"];
const YUNJA = (nak) => (nak < 9 ? ["Purva", "पूर्व"] : nak < 18 ? ["Madhya", "मध्य"] : ["Anta", "अंत"]);

export const NAK_ATTR = NAK_DEV.map((dev, i) => ({
  index: i,
  dev,
  deity: NAK_DEITY[i],
  varna: VARNA_SEQ[i], varnaDev: VARNA_DEV[VARNA_SEQ[i]],
  gana: GANA_SEQ[i], ganaDev: GANA_DEV[GANA_SEQ[i]],
  nadi: NADI_SEQ[i], nadiDev: NADI_DEV[NADI_SEQ[i]],
  yoni: YONI_SEQ[i][0], yoniGender: YONI_SEQ[i][1], yoniDev: YONI_DEV[YONI_SEQ[i][0]],
  syllables: SYLLABLES[i],
}));

/** Complete avakhada for a sidereal Moon longitude. */
export function avakhadaOf(moonLon) {
  const nak = nakIndexPada(moonLon);
  const sign = signOf(moonLon);
  const attr = NAK_ATTR[nak.index];
  const vashya = VASHYA_OF_SIGN[sign];
  const yunja = YUNJA(nak.index);
  return {
    nakshatra: attr.dev,
    nakshatraIndex: nak.index,
    pada: nak.pada,
    nakshatraLord: ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"][nak.index % 9],
    deity: attr.deity,
    varna: attr.varna, varnaDev: attr.varnaDev,
    gana: attr.gana, ganaDev: attr.ganaDev,
    nadi: attr.nadi, nadiDev: attr.nadiDev,
    yoni: attr.yoni, yoniGender: attr.yoniGender, yoniDev: attr.yoniDev,
    vashya, vashyaDev: VASHYA_DEV[vashya],
    rashi: sign, rashiLord: SIGN_LORDS[sign],
    tattva: TATTVA_OF_SIGN[sign],
    nameSyllable: attr.syllables[nak.pada - 1],
    paya: PAYA[nak.pada - 1][0], payaDev: PAYA[nak.pada - 1][1],
    yunja: yunja[0], yunjaDev: yunja[1],
  };
}
