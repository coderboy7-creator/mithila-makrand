/**
 * planetStatus.js — graha dignity (स्थिति) + Balaadi avastha (अवस्था).
 * Deterministic, classical tables. Dignity order: exaltation > debilitation >
 * own sign > moolatrikona > sign-lord's relationship toward the planet
 * (friend / neutral / enemy) — the relationship direction matches the
 * commercial-reference PDF (Astrotalk ASDF report, 2026-09-20).
 */

import { SIGN_LORDS } from "./base.js";

export const FRIENDS = {
  Sun: ["Moon", "Mars", "Jupiter"], Moon: ["Sun", "Mercury"], Mars: ["Sun", "Moon", "Jupiter"],
  Mercury: ["Sun", "Venus"], Jupiter: ["Sun", "Moon", "Mars"], Venus: ["Mercury", "Saturn"],
  Saturn: ["Mercury", "Venus"], Rahu: ["Mercury", "Venus", "Saturn"], Ketu: ["Mercury", "Venus", "Mars"],
};
/** Classical (BPHS) neutrality; enemies = the complement. Verified vs PDF:
 *  Jupiter sees Mercury as enemy (Mercury in Sag → शत्रु), Saturn as neutral. */
export const NEUTRAL = {
  Sun: ["Mercury"], Moon: ["Mars", "Jupiter", "Venus", "Saturn"], Mars: ["Venus", "Saturn"],
  Mercury: ["Mars", "Jupiter", "Saturn"], Jupiter: ["Saturn"], Venus: ["Mars", "Jupiter"],
  Saturn: ["Jupiter"], Rahu: ["Jupiter"], Ketu: ["Jupiter", "Saturn"],
};

export const EXALTATION = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6, Rahu: 1, Ketu: 7 };
export const DEBILITATION = { Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0, Rahu: 7, Ketu: 1 };
export const OWN_SIGNS = {
  Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5], Jupiter: [8, 11], Venus: [1, 6],
  Saturn: [9, 10], Rahu: [10], Ketu: [7],
};
/** Moolatrikona ranges [sign, fromDeg, toDeg] (classical-v1). */
export const MOOLATRIKONA = {
  Sun: [4, 0, 20], Moon: [1, 4, 30], Mars: [0, 0, 12], Mercury: [5, 16, 20],
  Jupiter: [8, 0, 13], Venus: [6, 0, 15], Saturn: [10, 0, 20],
};

/**
 * Dignity of a graha in a sign.
 * Returns { key, hi, en } with key in
 * exalted|debilitated|own|moolatrikona|friend|neutral|enemy.
 */
export function dignityOf(planet, sign) {
  if (EXALTATION[planet] === sign) return { key: "exalted", hi: "उच्च", en: "Exalted" };
  if (DEBILITATION[planet] === sign) return { key: "debilitated", hi: "नीच", en: "Debilitated" };
  if (OWN_SIGNS[planet]?.includes(sign)) return { key: "own", hi: "स्वराशि", en: "Own sign" };
  const mt = MOOLATRIKONA[planet];
  if (mt && mt[0] === sign) return { key: "moolatrikona", hi: "मूलत्रिकोण", en: "Moolatrikona" };
  return null; // relationship computed by caller with degree info if needed
}

/** Relationship of the SIGN LORD toward the planet (friend/neutral/enemy). */
export function lordRelation(planet, signLord) {
  if (signLord === planet) return { key: "own", hi: "स्वराशि", en: "Own sign" };
  if (FRIENDS[signLord]?.includes(planet)) return { key: "friend", hi: "मित्र", en: "Friendly" };
  if (NEUTRAL[signLord]?.includes(planet)) return { key: "neutral", hi: "सम", en: "Neutral" };
  return { key: "enemy", hi: "शत्रु", en: "Enemy" };
}

/** Combined status as shown in reference reports (exaltation first, then lord relation). */
export function statusOf(planet, sign) {
  return dignityOf(planet, sign) ?? lordRelation(planet, SIGN_LORDS[sign]);
}

/**
 * Balaadi avastha by degrees within sign (classical):
 * 0–6 Bala, 6–12 Kumara, 12–18 Yuva, 18–24 Vriddha, 24–30 Mrita.
 */
export function avasthaOf(lon) {
  const d = ((lon % 30) + 30) % 30;
  const i = Math.min(4, Math.floor(d / 6));
  return [
    { key: "bala", hi: "बाल", en: "Bala" },
    { key: "kumara", hi: "कुमार", en: "Kumara" },
    { key: "yuva", hi: "युवा", en: "Yuva" },
    { key: "vriddha", hi: "वृद्ध", en: "Vriddha" },
    { key: "mrita", hi: "मृत", en: "Mrita" },
  ][i];
}
