# RULES — working rules for humans & agents on this repo

These are standing orders from the product owner plus hard-won engineering rules.
Violations are bugs. When a rule conflicts with convenience, the rule wins.

## A. Domain rules (astrology correctness)

1. **Deterministic code only for astronomy.** No ML/LLM in any calculation path.
2. **LLM interprets, never calculates.** It receives structured calculation JSON only.
3. **Engines never mix.** Makaranda and Drik values never appear in one pipeline;
   comparison views are strictly side-by-side.
4. **One request = one profile.** Profile id is explicit in every calculation call;
   never inferred from UI labels. Method + profile version stored with every result.
5. **दण्ड–पल = END times** relative to that panchang day's **local sunrise**
   (1 दण्ड = 24 min, 1 पल = 24 s; `60-00` = ahoratra terminal). UI must show unit
   badge + tooltip + IST घड़ी समय.
6. **Preserve source notation verbatim.** `01|35` is not `1°35′E`; `03:4` stays `03:4`;
   `Uttrakha` stays `Uttrakha`. Interpretation is a separate, flagged, versioned layer.
7. **No arbitrary offsets / fudge factors.** Hour-level mismatch ⇒ diagnose and document
   (DATA_CONCERNS.md), never tune. Makaranda gate stays NOT PASSED until sources arrive.
8. **UNVERIFIED behind strategy interfaces.** Unknown rules/parameters ship as named
   strategies + flags, never as silent assumptions.
9. **Drik verification is independent of the MD/sheets** (KSDSU panchang is
   Makaranda-based ⇒ not a Drik reference). PyEphem is the certification reference.
10. **Chitra-definition ayanamsa (LAHIRI_CITRA)** is the drik-v1 default *until* the
    owner supplies the official IMDC/Rashtriya table; the −43…−44″ delta vs linear
    Lahiri is documented, not hidden.

## B. Engineering rules

1. **Checks before "done".** Node: `npm test` (106 hard tests) + `node scripts/smokeWeb.mjs`
   (15 routes) after *any* `app.js` edit. JVM: `mvn -q verify`. Name the code path the
   check executed; a syntax check is not a check.
2. **Generated tables are never hand-edited.** `meeusTables.js`, `vsopTables.js`,
   `*Cert.js` come only from `scripts/gen*.py`; the Python generators are the source
   of truth (astropy v4.0 raw orbital elements; CDS VI/81 VSOP87D fixed-width parse).
3. **Certification thresholds are hard tests**, not comments (locks: Spica≡180°,
   J2000±0.02°, rate 50.1–50.4″/yr, planet/node/β locks, ±60 s gate).
4. **Push protocol:** commit → push via one-shot tokenized URL → **sed the token out of
   all output** → refresh `mithila-makrand.bundle`. PAT never lands in any file.
5. **Repo-local git identity must be set each session** (`Mithila Makaranda /
   dev@mithila-makaranda.local`); it does not persist.
6. **Session-local tooling:** PyEphem & (if needed) astropy must be reinstalled at the
   start of cert work; Java 21 + Maven may need `sudo apt-get install
   openjdk-21-jdk-headless maven` after a fresh sandbox.
7. **Known technical traps (do not rediscover):** ESM exports immutable from importer;
   VSOP87 files parse by fixed-width slices only; Meeus ch.21 precession transcribed
   from memory is wrong (use the sign-locked matrix, hard-tested); PyEphem
   `Ecliptic(body).lon` is J2000-equinox (not a β reference); one-sided modular
   comparisons must use `min(r, span−r)`; `pgrep -f` self-matches (use `ss -ltnp`).
8. **Servers bind 0.0.0.0**; browser code uses relative URLs only (preview proxy).
9. **No external CDNs/fonts in the SPA** (offline/sandbox safe; in-app previews must
   not degrade).
10. **Docs trail:** behaviour change ⇒ update README/PRD/ARCHITECTURE/RULES/DESIGN/
    TASKS in the same commit where relevant; dead ends recorded (see MEMORY.md).

## C. UI / language rules

1. **Hindi is the default UI language**; English toggle must stay complete.
2. **Method/ayanamsa/profile always visible** (topbar chips + result banners);
   no vague labels like "standard".
3. **Buttons/texts aligned**; forms use the shared `formline`/`grid` conventions.
4. **Commercial-grade visuals in both themes**; light theme is parchment-gold,
   never plain black-on-white (DESIGN.md).
5. **Place entry always offers live suggestions** (offline gazetteer) while keeping
   manual lat/lon override.
6. Devanagari strings kept in source exactly as supplied; no silent "corrections".

## D. JVM port rules

1. Monolith deploy, modular Maven internals; **engines in separate modules**, shared
   SPI only in `mm-core`; `mm-api` EngineConfig is the only joint reference.
2. Java tables load from generator-emitted JSON resources — zero hand transcription.
3. `mvn verify` carries the same gates (parity vectors, cert locks, ±60 s).
4. REST contract identical to Node (`/api/v1/*`); SPA unchanged across backends.
5. Cutover only after byte-comparable payloads, endpoint by endpoint.
