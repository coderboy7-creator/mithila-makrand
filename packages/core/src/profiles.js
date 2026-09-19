/**
 * profiles.js — versioned, auditable calculation profiles.
 *
 * A CalculationProfile is the ONLY way astronomical behaviour is configured.
 * Every calculation result carries the profile id + version that produced it.
 * Makaranda and Drik are completely isolated (master spec §3.3).
 *
 * CRITICAL (master spec §5): the printed Panchang longitude notation `01|35`
 * is preserved FIRST as source data. Its computational interpretation is a
 * separate, versioned, explicitly documented mapping — never a silent
 * substitution of Darbhanga/Sitamarhi GPS coordinates.
 */

import { deepFreeze, dmsToDeg } from "./base.js";

const PROFILE_MAKARANDA_V1 = {
    id: "makaranda-v1",
    mode: "MAKARANDA",
    label: "Makaranda / Mithila",
    tradition: "Makarandaanushar",
    siddhanta: "Surya Siddhanta / Makaranda tradition",
    panchang: "Mithila Vishwavidyalaya Panchang",
    timezone: "Asia/Kolkata",
    tzOffsetHours: 5.5,
    dayBoundary: "LOCAL_SUNRISE",

    /* ---- user-supplied traditional reference parameters (verbatim) ---- */
    traditionalReference: {
      akshanshLatitudePrinted: "26°35′ N",
      latitude: dmsToDeg(26, 35, 0),          // 26.5833° N (as supplied)
      deshantarPrinted: "01|35",               // preserved EXACTLY as printed
      palbhaPrinted: "06",                     // preserved EXACTLY as printed
      timezonePrinted: "IST (UTC+05:30)",
    },

    /* ---- longitude interpretation mapping (versioned, flagged) -------- */
    longitudeResolution: {
      printedValue: "01|35",
      status: "UNVERIFIED",                    // awaiting source confirmation
      selectedStrategy: "H1_DESHANTARA_UJJAIN_DANDA_PALA",
      strategies: [
        {
          id: "H1_DESHANTARA_UJJAIN_DANDA_PALA",
          description:
            "01|35 read as 1 danda 35 pala (= 38 min of time) east of the Ujjain reference meridian (75°46′E) => 75.7667° + 9.5° ≈ 85.27°E. Hypothesis only; consistent with the Mithila region but NOT independently verified against the Panchang's own computation sheets.",
          longitude: 85.2667,
          status: "UNVERIFIED_HYPOTHESIS",
        },
        {
          id: "H2_AS_PRINTED_DEGREES",
          description:
            "01|35 read literally as 1°35′ — rejected as a longitude by itself; retained for audit only.",
          longitude: null,
          status: "REJECTED_AS_INSUFFICIENT",
        },
        {
          id: "H3_DARBHANGA_GPS",
          description: "Darbhanga GPS coordinates — forbidden: never silently substituted (master spec §5).",
          longitude: 85.8987,
          status: "FORBIDDEN_UNVERIFIED",
        },
        {
          id: "H4_SITAMARHI_GPS",
          description: "Sitamarhi GPS coordinates — forbidden: never silently substituted (master spec §5).",
          longitude: 85.5,
          status: "FORBIDDEN_UNVERIFIED",
        },
        {
          id: "H5_SHADOW_ANGULA_VYANGULA",
          description:
            "Owner research (2026-09): the value printed beside the latitude is often the PALBHA / local correction, not a longitude; scribes pack latitude + shadow together to save space. Under H5, 01|35 is read as 1 angula 35 vyangula of equinox shadow — a second shadow datum, NOT a longitude. Retained for audit; would explain the printed pairing but cannot by itself produce a longitude.",
          longitude: null,
          status: "UNVERIFIED_HYPOTHESIS",
        },
        {
          id: "H6_PALA_TIME_CORRECTION",
          description:
            "Owner research (2026-09): 01|35 may be a danda|pala LOCAL TIME CORRECTION (deshantara-kala) applied to civil times, i.e. the same quantity class as H1 but packed next to latitude as a time correction rather than derived from Ujjain. Equivalent computation to H1 if the correction is +38 min east; distinct provenance. UNVERIFIED until the Panchang's computation sheets confirm.",
          longitude: 85.2667,
          status: "UNVERIFIED_HYPOTHESIS",
        },
      ],
    },

    /* ---- astronomy strategies (isolated, swappable, versioned) -------- */
    ephemerisSource: "SURYA_SIDDHANTA_TRADITIONAL (built-in deterministic implementation)",
    obliquity: 24.0, // Surya Siddhanta max declination 24°
    sunriseModel: "SIDDHANTIC_CENTER", // sun centre at horizon; no refraction
    ayanamsa: {
      strategy: "MAKARANDA_V1_CALIBRATED",
      status: "UNVERIFIED",
      note:
        "Anchor calibrated against the supplied Mithila Panchang golden nakshatra-end vectors (they imply an ayanamsa ≈ Lahiri ≈ 24.2° at 2025–2026). To be replaced by the verified Makaranda Sarani value once the source tables are supplied. SS-libration variant retained as an alternative strategy.",
      anchorDegAt2026: 24.2,
      ratePerYearDeg: 50.29 / 3600,
      alternatives: ["SS_LIBRATION_MAX27 (traditional libration model, anchor unverified)"],
    },
    palbhaUsage: {
      status: "CROSSCHECK_VERIFIED",
      note: "Palbha = equinox noon shadow (in angulas) of a 12-angula shanku/gnomon. Cross-check: 12·tan(26°35′) = 5.9998 ≈ 6.00 ⇒ the printed Palbha 06 is internally consistent with the printed Akshansha 26°35′ N. Usage in tithi/timing computation NOT yet documented by the source; still isolated behind this config and never applied silently. Owner research also notes scribes often pack latitude + palbha/correction together, informing deshantar hypotheses H5/H6.",
      equinoctialShadowAngula: 6.0,
      derivedFromLatitude: "12·tan(26°35′) = 5.9998",
    },
    rulesetVersion: "classical-v1",
};

/* ------------------------------------------------------------------ */
/* DRIK — modern astronomy, independent engine                          */
/* ------------------------------------------------------------------ */
const PROFILE_DRIK_V1 = {
    id: "drik-v1",
    mode: "DRIK",
    label: "Drik / Modern Astronomy",
    tradition: "Drik-ganita",
    ephemerisSource: "BUILTIN_ANALYTICAL (Meeus solar/lunar theory + JPL Keplerian elements; Swiss-Ephemeris adapter slot reserved)",
    swissEphemerisAdapter: { status: "RESERVED", note: "Native Swiss Ephemeris binding to be attached behind this adapter; the built-in analytical ephemeris is the sandbox-safe deterministic backend. Swiss Ephemeris is NEVER treated as proof of Makaranda correctness (master spec §24)." },
    timezone: "Asia/Kolkata",
    tzOffsetHours: 5.5,
    dayBoundary: "LOCAL_SUNRISE",
    obliquity: 23.4392911,
    sunriseModel: "MODERN_REFRACTION", // h0 = -0.833°, refraction + semidiameter
    ayanamsaOptions: ["LAHIRI", "RAMAN", "KRISHNAMURTI", "YUKTESHWAR", "FAGAN_BRADLEY"],
    ayanamsa: { strategy: "LAHIRI", status: "VERIFIED_STANDARD" },
    rulesetVersion: "classical-v1",
};

/* ------------------------------------------------------------------ */
/* MAKARANDA v2 HYBRID — experimental bridge engine (UNVERIFIED_HYBRID) */
/* SS framework + classical perturbation series; fitted offsets only.   */
/* Never presented as the authoritative tradition (see ENGINE_PLAN).    */
/* ------------------------------------------------------------------ */
const PROFILE_MAKARANDA_V2_HYBRID = {
  ...PROFILE_MAKARANDA_V1,
  id: "makaranda-v2-hybrid",
  engine: "HYBRID",
  label: "Makaranda v2 Hybrid (experimental)",
  siddhanta: "Surya Siddhanta framework + classical lunar perturbations (evection/variation/annual equation); fitted offsets only",
  ephemerisSource: "HYBRID_SS_PERTURBED (built-in deterministic; UNVERIFIED_HYBRID)",
  ayanamsa: {
    strategy: "MAKARANDA_V1_CALIBRATED + HYBRID_FIT",
    status: "UNVERIFIED_HYBRID",
    note: "Experimental bridge engine: modern-anchored means + classical perturbation series; tracks the printed Panchang within the traditional residual band. NOT the authoritative Makaranda tradition — docs/MAKARANDA_ENGINE_PLAN.md.",
    anchorDegAt2026: 24.2,
    ratePerYearDeg: 50.29 / 3600,
  },
  hybridFit: {
    status: "UNVERIFIED_HYBRID",
    params: "HYBRID_PARAMS (ephemeris.js)",
    fittedAgainst: "43 high-confidence printed ends (golden rows + sheet 29-07..12-08-2022)",
  },
  rulesetVersion: "classical-v1",
};

export const PROFILES = deepFreeze({
  "makaranda-v1": PROFILE_MAKARANDA_V1,
  "drik-v1": PROFILE_DRIK_V1,
  "makaranda-v2-hybrid": PROFILE_MAKARANDA_V2_HYBRID,
});

export const DEFAULT_PROFILE_ID = "makaranda-v1";
export const DEFAULT_DRIK_PROFILE_ID = "drik-v1";

export function getProfile(id) {
  const p = PROFILES[id];
  if (!p) throw new Error(`Unknown calculation profile: ${id}. Known: ${Object.keys(PROFILES).join(", ")}`);
  return p;
}

/**
 * Immutable CalculationContext (master spec §12). Every calculation must be
 * reproducible from this object alone. One context => exactly ONE profile.
 */
export function createContext({
  profileId = DEFAULT_PROFILE_ID,
  date,                       // "YYYY-MM-DD" (civil date in profile timezone)
  time = null,                // "HH:MM[:SS]" optional
  location = null,            // { name, latitude, longitude, source } | null => profile reference
  ayanamsaOverride = null,    // Drik only
  rulesetVersion = null,
} = {}) {
  const profile = getProfile(profileId);
  const ref = profile.traditionalReference;
  let loc;
  if (location) {
    loc = {
      name: location.name ?? "Custom",
      latitude: location.latitude,
      longitude: location.longitude,
      source: location.source ?? "USER_PROVIDED",
      precision: location.precision ?? "EXACT",
    };
    if (profile.mode === "MAKARANDA") {
      // Makaranda with a user location: traditional Panchang reference is
      // still recorded for audit; the user coordinates are used for the
      // horizon (kundali/lagna) but NEVER for the printed Panchang fields.
      loc.note = "User location used for horizon/lagna; Panchang fields remain tied to the traditional reference unless explicitly overridden.";
    }
  } else if (profile.mode === "MAKARANDA") {
    const strat = profile.longitudeResolution.strategies.find(
      (s) => s.id === profile.longitudeResolution.selectedStrategy
    );
    loc = {
      name: "Mithila traditional reference (Makaranda config)",
      latitude: ref ? ref.latitude : null,
      longitude: strat ? strat.longitude : null,
      source: "TRADITIONAL_PANCHANG_REFERENCE",
      traditionalLongitudeNotation: ref ? ref.deshantarPrinted : null,
      palbha: ref ? ref.palbhaPrinted : null,
      precision: "TRADITIONAL",
    };
  } else {
    loc = {
      name: "Faridabad (default Drik reference)",
      latitude: 28.4089,
      longitude: 77.3178,
      source: "DEFAULT_DRIK",
      precision: "APPROX",
    };
  }

  return Object.freeze({
    calculationMode: profile.mode,
    calculationProfile: profile.id,
    profileVersion: profile.id,
    calendarSystem: "GREGORIAN",
    tradition: profile.tradition ?? null,
    ayanamsa: ayanamsaOverride && profile.mode === "DRIK" ? ayanamsaOverride : profile.ayanamsa.strategy,
    latitude: loc.latitude,
    longitude: loc.longitude,
    traditionalLongitudeNotation: loc.traditionalLongitudeNotation ?? null,
    palbha: loc.palbha ?? null,
    timezone: profile.timezone,
    tzOffsetHours: profile.tzOffsetHours,
    localDate: date,
    localTime: time,
    locationSource: loc.source,
    locationName: loc.name,
    ephemerisSource: profile.ephemerisSource,
    houseSystem: "EQUAL_FROM_LAGNA",
    rulesetVersion: rulesetVersion ?? profile.rulesetVersion,
    profile,
  });
}

/** Compact method banner exactly in the form required by master spec §4.1. */
export function methodBanner(ctx) {
  if (ctx.calculationMode === "MAKARANDA") {
    return [
      "Calculation Method: Makaranda / Mithila",
      `Profile: ${ctx.profileVersion}`,
      "Ayanamsa: Makaranda (calibrated, UNVERIFIED)",
    ].join("\n");
  }
  return [
    "Calculation Method: Drik",
    `Ephemeris: ${ctx.profile.ephemerisSource}`,
    `Ayanamsa: ${ctx.ayanamsa}`,
  ].join("\n");
}
