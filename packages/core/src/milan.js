/**
 * milan.js — Ashtakoota Kundali Milan (36 guna) + Mangal analysis.
 * Calculation profile propagates: Moon longitudes come from the selected
 * engine (master spec §14.6).
 */

import { SIGN_LORDS } from "./chart.js";
import { nakshatraOf } from "./chart.js";

/* ---- Varna (1) ---- */
const VARNA_OF_SIGN = [2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1]; // Kshatriya/Vaishya/Shudra/Brahmin = 2/3/4/1

/* ---- Vashya (2): classical sign matrix (classical-v1; VERIFY edition) ---- */
const VASHYA = {
  0: [4, 7], 1: [3, 6], 2: [5, 11], 3: [7, 8], 4: [6, 10], 5: [2, 11],
  6: [0, 8], 7: [3, 6], 8: [4, 7], 9: [10, 5], 10: [9, 8], 11: [0, 5],
};

/* ---- Tara (3) ---- */
const TARA_GOOD = [true, true, false, true, false, true, false, true, true]; // janma..parama-mitra

/* ---- Yoni (4): nakshatra -> [animal, gender] ---- */
const YONI = [
  ["Horse", "M"], ["Elephant", "M"], ["Goat", "F"], ["Serpent", "M"], ["Mongoose", "F"], ["Dog", "M"],
  ["Cat", "M"], ["Sheep", "F"], ["Serpent", "F"], ["Rat", "M"], ["Rat", "F"], ["Cow", "M"],
  ["Buffalo", "M"], ["Tiger", "F"], ["Buffalo", "M"], ["Tiger", "M"], ["Hare", "M"], ["Worm", "F"],
  ["Cat", "F"], ["Monkey", "M"], ["Mongoose", "M"], ["Horse", "F"], ["Lion", "M"], ["Horse", "M"],
  ["Lion", "F"], ["Cow", "F"], ["Elephant", "F"],
];
const YONI_ENEMY = {
  Horse: "Buffalo", Buffalo: "Horse", Elephant: "Lion", Lion: "Elephant",
  Goat: "Monkey", Monkey: "Goat", Serpent: "Mongoose", Mongoose: "Serpent",
  Cow: "Tiger", Tiger: "Cow", Rat: "Cat", Cat: "Rat", Dog: "Hare", Hare: "Dog",
};

/* ---- Graha Maitri (5) ---- */
const FRIENDS = {
  Sun: ["Moon", "Mars", "Jupiter"], Moon: ["Sun", "Mercury"], Mars: ["Sun", "Moon", "Jupiter"],
  Mercury: ["Sun", "Venus"], Jupiter: ["Sun", "Moon", "Mars"], Venus: ["Mercury", "Saturn"],
  Saturn: ["Mercury", "Venus"],
};
const NEUTRAL = { Sun: ["Mercury"], Moon: [], Mars: ["Mercury", "Saturn", "Venus"], Mercury: ["Mars", "Jupiter", "Saturn"], Jupiter: ["Mercury", "Saturn"], Venus: ["Jupiter", "Moon", "Mars"], Saturn: ["Jupiter", "Sun", "Moon"] };

function maitri(lordA, lordB) {
  if (lordA === lordB) return 5;
  const fA = FRIENDS[lordA]?.includes(lordB);
  const fB = FRIENDS[lordB]?.includes(lordA);
  if (fA && fB) return 5;
  if (fA || fB) return 4;
  const nA = NEUTRAL[lordA]?.includes(lordB);
  const nB = NEUTRAL[lordB]?.includes(lordA);
  if (nA || nB) return 3;
  return 0;
}

/* ---- Gana (6) ---- */
const GANA = ["Deva", "Rakshasa", "Rakshasa", "Deva", "Deva", "Manushya", "Deva", "Rakshasa", "Rakshasa", "Rakshasa", "Manushya", "Manushya", "Deva", "Rakshasa", "Manushya", "Rakshasa", "Deva", "Rakshasa", "Manushya", "Manushya", "Manushya", "Deva", "Deva", "Rakshasa", "Manushya", "Manushya", "Deva"];

/* ---- Nadi (8) ---- */
const NADI = (nak) => nak % 3; // 0 Adi, 1 Madhya, 2 Antya

/**
 * Ashtakoota matching.
 * Inputs: moon sidereal longitudes (male & female) computed by the SELECTED
 * profile. Never mixed across profiles.
 */
export function calculateMilan(ctx, maleMoonLon, femaleMoonLon) {
  const mNak = nakshatraOf(maleMoonLon);
  const fNak = nakshatraOf(femaleMoonLon);
  const mSign = Math.floor(maleMoonLon / 30) % 12;
  const fSign = Math.floor(femaleMoonLon / 30) % 12;
  const details = [];

  // 1 Varna
  const varna = VARNA_OF_SIGN[mSign] >= VARNA_OF_SIGN[fSign] ? 1 : 0;
  details.push({ koota: "Varna", max: 1, score: varna, note: `Groom ${VARNA_OF_SIGN[mSign]}, Bride ${VARNA_OF_SIGN[fSign]}` });

  // 2 Vashya
  let vashya = 0;
  if (VASHYA[mSign]?.includes(fSign)) vashya += 1;
  if (VASHYA[fSign]?.includes(mSign)) vashya += 1;
  details.push({ koota: "Vashya", max: 2, score: vashya, note: `Groom sign ${mSign + 1}, Bride sign ${fSign + 1}` });

  // 3 Tara
  const dMF = ((mNak.index - fNak.index) % 27 + 27) % 27;
  const dFM = ((fNak.index - mNak.index) % 27 + 27) % 27;
  const tara = (TARA_GOOD[dMF % 9] ? 1.5 : 0) + (TARA_GOOD[dFM % 9] ? 1.5 : 0);
  details.push({ koota: "Tara", max: 3, score: tara, note: `nakshatra distances ${dMF}, ${dFM}` });

  // 4 Yoni
  const [yM, gM] = YONI[mNak.index];
  const [yF, gF] = YONI[fNak.index];
  let yoni = 4;
  if (yM !== yF) yoni = YONI_ENEMY[yM] === yF ? 0 : 2;
  else if (gM !== gF) yoni = 3;
  details.push({ koota: "Yoni", max: 4, score: yoni, note: `${yM}(${gM}) vs ${yF}(${gF})` });

  // 5 Graha Maitri
  const gm = maitri(SIGN_LORDS[mSign], SIGN_LORDS[fSign]);
  details.push({ koota: "Graha Maitri", max: 5, score: gm, note: `${SIGN_LORDS[mSign]} vs ${SIGN_LORDS[fSign]}` });

  // 6 Gana
  const gana = GANA[mNak.index] === GANA[fNak.index] ? 6 : 0;
  details.push({ koota: "Gana", max: 6, score: gana, note: `${GANA[mNak.index]} vs ${GANA[fNak.index]}` });

  // 7 Bhakoot
  const dist = ((fSign - mSign) % 12 + 12) % 12;
  const doshaDist = [1, 4, 5, 7, 11].includes(dist); // 2/12, 5/9, 6/8 pairs
  const bhakoot = doshaDist ? 0 : 7;
  details.push({ koota: "Bhakoot", max: 7, score: bhakoot, note: doshaDist ? `dosha distance ${dist + 1} sign(s)` : "no dosha distance" });

  // 8 Nadi
  const nadi = NADI(mNak.index) === NADI(fNak.index) ? 0 : 8;
  details.push({ koota: "Nadi", max: 8, score: nadi, note: `Nadi ${NADI(mNak.index)} vs ${NADI(fNak.index)}` });

  const total = details.reduce((a, x) => a + x.score, 0);

  // Mangal analysis for both partners
  const mangalNote = "Mangal Dosha for marriage must be evaluated from full kundali (Mars houses from Lagna & Moon) via /kundali/calculate for each partner; if BOTH have Mangal Dosha it cancels mutually.";

  let verdict;
  if (total >= 33) verdict = "Excellent — highly recommended";
  else if (total >= 25) verdict = "Very good";
  else if (total >= 18) verdict = "Acceptable";
  else verdict = "Below classical threshold — detailed examination advised";

  return {
    system: "ASHTAKOOTA_36_GUNA",
    male: { moonSign: mSign, nakshatra: mNak.name, pada: mNak.pada },
    female: { moonSign: fSign, nakshatra: fNak.name, pada: fNak.pada },
    details,
    totalGuna: total,
    maxGuna: 36,
    verdict,
    mangalNote,
    cancellations: [
      "If both partners have Mangal Dosha, it cancels mutually (classical).",
      "Bhakoot dosha exceptions exist for specific sign pairs (classical; VERIFY edition for full list).",
      "Nadi dosha has classical exceptions for certain nakshatra pairs (flagged UNVERIFIED).",
    ],
    audit: { mode: ctx.calculationMode, profile: ctx.profileVersion, ayanamsa: ctx.ayanamsa, rulesetVersion: ctx.rulesetVersion },
  };
}
