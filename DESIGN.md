# DESIGN — visual & interaction system

Two complete themes, one component language. Dark cosmic is default; light is a
parchment-gold companion of equal polish. Hindi-first typography throughout.

## 1. Brand & mood

- Mithila heritage × modern product: deep night sky, temple gold, saffron accents.
- Everything that calculates is *visible and labelled*; everything decorative is
  subtle — content legibility always beats glow.

## 2. Tokens (web/styles.css `:root`)

| Token | Dark | Light |
|---|---|---|
| `--bg` | `#0b0714` (plum/saffron radial glows + starfield) | `#f6efe0` (ivory, warm glows, faint gold dots) |
| `--panel` | `rgba(24,17,38,.78)` glass | `#fffbf2` |
| `--panel2 / 3` | `#1d1430 / #2a1e45` | `#f8f1e0 / #efe4ca` |
| `--line` | `rgba(216,169,68,.16)` | `rgba(146,106,24,.28)` |
| `--text` | `#f3ecdd` | `#2e2415` |
| `--muted / --faint` | `#b3a8c9 / #837899` | `#6b5b41 / #93825f` |
| `--gold / --gold2` | `#d8a944 / #f6cf6f` | `#a97a1e / #8a6410` |
| `--saffron` | `#e8833a` | `#c2661f` |
| semantic | green `#4ecb8d`, red `#ff7d7d`, amber, magenta `#e26ee5`, accent `#8fb0ff` | darker readable variants |
| radius / shadow | 16px / `0 14px 40px rgba(0,0,0,.45)` | same radius, warm shadow |

- Headings: Georgia/serif; `h1` = gradient gold text (brown-gold in light) + soft drop-shadow.
- Body: system stack headed by **"Noto Sans Devanagari"**; tabular numerals in tables.

## 3. Layout shell

- App grid: sidebar (248 px, glass, glowing conic-gradient ॐ logo, grouped nav with
  gold active pill) + topbar (glass, method pill, profile/ayanamsa chips, clock,
  language + theme toggles) + scrollable main.
- Content: `.card` glass panels with 16 px radius, gold hairline border, hover lift +
  gold bloom; `h2` gets a 52 px gold underline glow. Grids: cols-2/3/4 with 1100/800 px
  breakpoints collapsing to one column.
- Hero band (dashboard): layered saffron/plum radial gradients, giant translucent ॐ,
  gradient title, status chips (Deterministic engines · LLM ≠ calculation · DRIK certified).

## 4. Charts

- North/East/South SVG renderers, `viewBox 440²`.
- Luminous gold: outer glow via CSS `drop-shadow`, rounded joins, per-chart radial
  gold-tint backdrop (`chartGlowBg`, unique gradient id per instance).
- **Per-graha glyph colours** (dark / light):
  सू `#ffb45e/#a34d05` · चं `#8fd0ff/#1668a8` · मं `#ff8080/#c02f2f` ·
  बु `#5ee0a1/#0c7d4d` · गु `#f6cf6f/#8a6410` · शु `#ff9ecf/#b03a86` ·
  श `#8fb0ff/#2d55b0` · रा `#e26ee5/#96269a` · के `#b28bff/#5a35c0`.
- Sign labels gold-bold; lagna marker saffron diagonal; legend repeats glyph colours
  with sign + degrees + retro `(व)/(R)` in saffron.

## 5. Components

- Buttons: `.btn` glass; `.btn.primary` = gold gradient with inner highlight + outer
  bloom; hover brightens. Danger/ghost variants kept.
- Badges/chips: pill, semantic colours (`gold/green/red/amber/blue`), wrap-safe for
  Devanagari.
- Inputs/selects: 9–10 px radius panels; focus = gold outline; labels upper-case
  small (Devanagari-safe letter-spacing).
- Segmented controls (`.seg`) for chart style / method sub-choices; active = gold tint.
- Modals: blurred backdrop, 16 px radius panel.
- Tables: small-caps headers, hairline rows, hover warm tint, tabular figures.
- Place autocomplete (`.geo-wrap/.geo-dd`): absolute dropdown under input, 180 ms
  debounce, arrow-key + Enter/Escape navigation, outside-click close; items show
  name + Devanagari alias + region/country + coords; selection fills lat/lon and a
  quiet `.geo-hint` line confirms coordinates.
- Scrollbars: gold gradient thumb; selection = gold.

## 6. Motion & depth

- Restraint: hover lifts (transform/border/shadow 150–180 ms), starfield twinkle
  (9 s alternate), spinner only for async panels. No parallax, no scroll-jack.

## 7. i18n & alignment conventions

- Hindi default; every string via `t()`; EN parity mandatory.
- दण्ड–पल displays: unit badge + tooltip + "(घड़ी समय IST)" clock readout.
- Form rows align label/input/button baselines (`formline`); no ragged controls.
- Method/profile chips right-aligned in section headers (`method-chip`).

## 8. Print & a11y

- Print stylesheet: white, chrome hidden, cards avoid page breaks, banners grey.
- SVG charts carry `role="img"` + aria-labels; focus states visible; contrast AA in
  both themes (planet colours have dedicated light variants).

## 9. Do / Don't

- Do keep both themes at parity when adding components (every new selector gets a
  light override where the dark default would fail contrast).
- Do use variables, not hex, in components (theme switch is attribute-only).
- Don't introduce external font/image CDNs; don't use pure `#fff/#000` surfaces;
  don't let glow reduce text contrast; don't add colour without a light-theme twin.
