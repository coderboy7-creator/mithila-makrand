/**
 * rules.js — rule-based Yoga & Dosha detection (master spec §14.5).
 * Every result carries: matched rule, planets/houses involved, evidence,
 * interpretation, ruleset version, calculation profile.
 */

import { signOf, SIGN_LORDS } from "./chart.js";

const BENEFICS = ["Jupiter", "Venus", "Mercury", "Moon"];
const MALEFICS = ["Sun", "Mars", "Saturn", "Rahu", "Ketu"];

const EXALTATION = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6 };
const DEBILITATION = { Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0 };

function houses(k, planet) {
  return k.positions.filter((p) => p.name === planet).map((p) => p.house)[0];
}
function signOfPlanet(k, planet) {
  return k.positions.filter((p) => p.name === planet)[0].sign;
}
function lordHouse(k, sign) {
  return houses(k, SIGN_LORDS[sign]);
}

export function detectYogas(kundali, moonHouse = null) {
  const k = kundali;
  const results = [];
  const rule = (id, name, matched, evidence, interpretation, confidence = "VERIFIED_CLASSICAL") =>
    results.push({ ruleId: id, name, matched, evidence, interpretation, confidence, rulesetVersion: k.audit?.rulesetVersion ?? "classical-v1", profile: k.audit?.profile });

  const jupHouse = houses(k, "Jupiter");
  const moonH = moonHouse ?? houses(k, "Moon");

  // Gaja Kesari: Jupiter in kendra from Moon
  {
    const rel = ((jupHouse - moonH + 12) % 12) + 1;
    const matched = [1, 4, 7, 10].includes(rel);
    rule("Y-GAJA-KESARI", "Gaja Kesari Yoga", matched,
      { Jupiter: jupHouse, Moon: moonH, relativeHouse: rel },
      matched ? "Jupiter sits in a kendra from the Moon — classical indicator of reputation, wisdom and lasting name." : "Not formed.",
    );
  }

  // Pancha Mahapurusha
  const mahapurusha = [
    ["Mars", "Ruchaka"], ["Mercury", "Bhadra"], ["Jupiter", "Hamsa"], ["Venus", "Malavya"], ["Saturn", "Sasa"],
  ];
  for (const [planet, name] of mahapurusha) {
    const h = houses(k, planet);
    const s = signOfPlanet(k, planet);
    const strong = s === k.positions.find((p) => p.name === planet).sign && (SIGN_LORDS[s] === planet || EXALTATION[planet] === s);
    const matched = [1, 4, 7, 10].includes(h) && strong;
    rule(`Y-MAHAPURUSHA-${name.toUpperCase()}`, `${name} Mahapurusha Yoga`, matched,
      { planet, house: h, sign: s, ownOrExalted: strong },
      matched ? `${planet} in a kendra in own/exalted sign forms ${name} Mahapurusha Yoga.` : "Not formed.");
  }

  // Raj Yoga: kendra lord + trikona lord association (conjunction or mutual aspect simplified to sign co-presence)
  const lagnaSign = k.lagna.sign;
  const kendraLords = [0, 3, 6, 9].map((o) => SIGN_LORDS[(lagnaSign + o) % 12]);
  const trikonaLords = [0, 4, 8].map((o) => SIGN_LORDS[(lagnaSign + o) % 12]);
  let rajYoga = null;
  for (const a of [...new Set(kendraLords)]) {
    for (const b of [...new Set(trikonaLords)]) {
      if (a === b || a === "Sun" || a === "Moon" || b === "Sun" || b === "Moon") continue;
      const sa = signOfPlanet(k, a), sb = signOfPlanet(k, b);
      if (sa === sb || a === SIGN_LORDS[sb] || b === SIGN_LORDS[sa]) {
        rajYoga = { pair: [a, b], via: sa === sb ? "conjunction" : "sign exchange" };
      }
    }
  }
  rule("Y-RAJA", "Raj Yoga", !!rajYoga, rajYoga ?? { note: "no kendra-trikona lord association" },
    rajYoga ? `Kendra lord ${rajYoga.pair[0]} and trikona lord ${rajYoga.pair[1]} associate (${rajYoga.via}).` : "Not detected at basic level.");

  // Dhana Yoga: lords of 2/5/9/11 together with lagna lord
  const dhanaLords = [1, 4, 8, 10].map((o) => SIGN_LORDS[(lagnaSign + o) % 12]);
  const co = dhanaLords.filter((p) => signOfPlanet(k, p) === signOfPlanet(k, SIGN_LORDS[lagnaSign]));
  rule("Y-DHANA", "Dhana Yoga", co.length > 0, { lordsWithLagnaLord: co },
    co.length ? `Wealth houses' lords associate with the lagna lord: ${co.join(", ")}.` : "Not detected.");

  // Neech Bhanga
  const deb = k.positions.filter((p) => DEBILITATION[p.name] === p.sign && !["Rahu", "Ketu"].includes(p.name));
  let nb = null;
  for (const d of deb) {
    const dispLord = SIGN_LORDS[EXALTATION[d.name]];
    const dh = houses(k, dispLord);
    if ([1, 4, 7, 10].includes(dh)) nb = { planet: d.name, dispositor: dispLord, dispositorHouse: dh };
  }
  rule("Y-NEECH-BHANGA", "Neech Bhanga Raja Yoga", !!nb, nb ?? { debilitated: deb.map((d) => d.name) },
    nb ? `${nb.planet} debilitated, but its dispositor ${nb.dispositor} is in a kendra — cancellation uplifts.` : deb.length ? "Debilitation present without classical cancellation." : "No debilitated planet.");

  // Vipreet Raj Yoga: lords of 6/8/12 in 6/8/12
  const dusthanaLords = [5, 7, 11].map((o) => ({ lord: SIGN_LORDS[(lagnaSign + o) % 12], from: o + 1 }));
  const vip = dusthanaLords.filter((x) => [6, 8, 12].includes(houses(k, x.lord)));
  rule("Y-VIPREET-RAJA", "Vipreet Raj Yoga", vip.length > 0, { matches: vip },
    vip.length ? `Dusthana lord(s) in dusthanas: ${vip.map((v) => v.lord).join(", ")} — gain through reversal.` : "Not formed.");

  // Hamsa note: Raj Yoga / Dhana / Gaja Kesari covered above.
  return results;
}

export function detectDoshas(kundali) {
  const k = kundali;
  const results = [];
  const rule = (id, name, matched, evidence, interpretation, remedies, confidence = "VERIFIED_CLASSICAL") =>
    results.push({ ruleId: id, name, matched, evidence, interpretation, remedies, confidence, rulesetVersion: k.audit?.rulesetVersion ?? "classical-v1", profile: k.audit?.profile });

  // Mangal Dosha: Mars in 1/2/4/7/8/12 from Lagna (and from Moon separately)
  const marsLagna = houses(k, "Mars");
  const mangalLagna = [1, 2, 4, 7, 8, 12].includes(marsLagna);
  const moonSign = k.positions.find((p) => p.name === "Moon").sign;
  const marsSign = k.positions.find((p) => p.name === "Mars").sign;
  const fromMoon = ((marsSign - moonSign + 12) % 12) + 1;
  const mangalMoon = [1, 2, 4, 7, 8, 12].includes(fromMoon);
  rule("D-MANGAL", "Mangal Dosha", mangalLagna || mangalMoon,
    { marsHouseFromLagna: marsLagna, marsHouseFromMoon: fromMoon },
    (mangalLagna || mangalMoon) ? "Mars occupies a Mangal position; considered in marriage matching with classical cancellations." : "No Mangal Dosha.",
    ["Kumbh Vivah symbolic remedy (traditional)", "Mangal shanti procedures per family tradition"]);

  // Kaal Sarp: all 7 planets between Rahu–Ketu axis
  const rahuSign = k.positions.find((p) => p.name === "Rahu").sign;
  const ketuSign = k.positions.find((p) => p.name === "Ketu").sign;
  const seven = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  const between = (s, a, b) => { let i = a; for (let n = 0; n < 12; n++) { if (i === s) return true; i = (i + 1) % 12; if (i === b) return false; } return false; };
  const inArc1 = seven.every((p) => between(k.positions.find((x) => x.name === p).sign, rahuSign, ketuSign));
  const inArc2 = seven.every((p) => between(k.positions.find((x) => x.name === p).sign, ketuSign, rahuSign));
  rule("D-KAAL-SARP", "Kaal Sarp Dosha", inArc1 || inArc2,
    { rahuSign, ketuSign, allSevenInOneArc: inArc1 || inArc2 },
    (inArc1 || inArc2) ? "All seven planets lie on one side of the Rahu–Ketu axis." : "Not present (partial configurations possible).",
    ["Traditional Kaal Sarp shanti per family custom"]);

  // Pitra Dosha: Sun + Rahu conjunction (basic classical form)
  const sunSign = k.positions.find((p) => p.name === "Sun").sign;
  const pitra = sunSign === rahuSign;
  rule("D-PITRA", "Pitra Dosha", pitra, { sunSign, rahuSign },
    pitra ? "Sun conjoins Rahu — classical Pitra Dosha indicator." : "Not detected in basic form.",
    ["Pitru shanti / daan per tradition"]);

  return results;
}

export function calculateYogaDosha(ctx, kundali) {
  return {
    yogas: detectYogas(kundali),
    doshas: detectDoshas(kundali),
    audit: { mode: ctx.calculationMode, profile: ctx.profileVersion, ayanamsa: ctx.ayanamsa, rulesetVersion: ctx.rulesetVersion },
  };
}
