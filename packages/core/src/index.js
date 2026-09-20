/**
 * index.js — core orchestration. ONE calculation request = ONE profile.
 * Engines are never mixed (master spec §3.3).
 */

export * from "./base.js";
export * from "./traditionalTime.js";
export * from "./profiles.js";
export * from "./ephemeris.js";
export * from "./solar.js";
export * from "./panchang.js";
export * from "./chart.js";
export * from "./planetStatus.js";
export * from "./avakhada.js";
export * from "./dasha.js";
export * from "./rules.js";
export * from "./milan.js";
export * from "./gochar.js";
export * from "./muhurta.js";
export * from "./annual.js";
export * from "./golden.js";
export * from "./interpret.js";

import { createContext } from "./profiles.js";
import { parseLocalToJD } from "./base.js";
import { calculatePanchang } from "./panchang.js";
import { calculateKundali, planetaryPositions, ascendantSidereal } from "./chart.js";
import { calculateVarga } from "./chart.js";
import { calculateDasha } from "./dasha.js";
import { calculateYogaDosha } from "./rules.js";
import { calculateMilan } from "./milan.js";
import { calculateTransit } from "./gochar.js";
import { calculateMuhurta } from "./muhurta.js";
import { calculateVarshaphal, calculatePrashna } from "./annual.js";
import { runGoldenSuite } from "./golden.js";
import { buildInterpretation, buildLLMRequest } from "./interpret.js";

/** Birth-input helper: resolve a full context + instant JD. */
export function birthContext({ profileId, date, time, latitude, longitude, placeName }) {
  const ctx = createContext({
    profileId,
    date,
    time,
    location: latitude != null ? { name: placeName ?? "Birth place", latitude, longitude } : null,
  });
  const jd = parseLocalToJD(date, time ?? "00:00:00", ctx.tzOffsetHours);
  return { ctx, jd };
}

export const CoreAPI = {
  createContext,
  birthContext,
  calculatePanchang,
  calculateKundali,
  calculateVarga,
  calculateDasha,
  calculateYogaDosha,
  calculateMilan,
  calculateTransit,
  calculateMuhurta,
  calculateVarshaphal,
  calculatePrashna,
  planetaryPositions,
  ascendantSidereal,
  runGoldenSuite,
  interpret: buildInterpretation,
  llmRequest: buildLLMRequest,
};
