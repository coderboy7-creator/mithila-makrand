# Mithila Makaranda — Mobile (Android + iOS)

React Native (Expo) application shell. The **entire deterministic calculation
core is shared with the web platform**: `packages/core` is pure JavaScript
with zero dependencies, so it runs unmodified under Hermes/JavaScriptCore on
Android and iOS.

```
┌───────────────────────────┐   ┌───────────────────────────┐
│  Web (server + SPA)       │   │  React Native (Expo)      │
│  packages/server          │   │  packages/mobile          │
└──────────────┬────────────┘   └──────────────┬────────────┘
               │        imports                 │
               └───────────────►┌──────────────┴───────────┐
                                │  @mithila/core            │
                                │  deterministic engines    │
                                │  Makaranda + Drik         │
                                └───────────────────────────┘
```

## Wiring options

1. **Offline-first**: import `@mithila/core` directly in the app — all
   Kundali/Panchang/Dasha/Milan calculations run on-device with identical
   results to the server (same code, same golden-test guarantees).
2. **Server-backed**: call the same `/api/v1/*` REST endpoints for
   CRM/booking/payments/AI-interpretation features.

The calculation-method contract is identical to web: every request carries an
explicit `profileId` (`makaranda-v1` default, `drik-v1` alternative); the UI
must render the method banner (`methodBanner()` helper) and expose per-feature
overrides + "Reset to Global", exactly as the web app does (master spec §4).

## Running

```bash
npm i -g expo-cli
cd packages/mobile
npm install
expo start --android   # Android
expo start --ios       # iOS
```

## Screen map (mirrors web)

Dashboard · Panchang · Kundali (N/S/E charts) · Vargas · Dashas · Yogas &
Doshas · Milan · Gochar · Muhurta · Varshaphal · Prashna · Reports (PDF via
expo-print) · Consult (booking + CRM) · Validation dashboard · Settings.

## Build notes

- Production PDFs: `expo-print` rendering the same report JSON produced by
  `/api/v1/reports/generate`.
- Deep links: `mithila://kundali?profile=makaranda-v1&...`
- Store compliance: no astronomy is ever computed by the AI layer; the
  interpretation payload contract is the same adapter-slot JSON as web.
