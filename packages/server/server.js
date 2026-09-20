/**
 * server.js — monolithic application server (master spec §24: monolithic but
 * internally modular). Pure Node, zero dependencies.
 *
 *  - REST calculation API under /api/v1 (spec §18) — every request resolves
 *    an explicit calculation profile; never inferred from UI labels.
 *  - Static professional web application.
 *  - JSON-file data store mirroring the production PostgreSQL schema
 *    (users, astrologers, clients, appointments, audit_logs, golden_*...).
 *  - AI interpretation endpoint: deterministic engine + LLM adapter slot.
 */

import http from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as Core from "../core/src/index.js";
import { CITIES } from "./data/gazetteer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIR = path.join(__dirname, "web");
const CORE_DIR = path.join(__dirname, "..", "core", "src");
const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

/* ---------------- database (JSON mirror of production schema) ---------------- */

const DEFAULT_DB = {
  users: [{ id: "u-1", name: "Demo User", email: "demo@mithila.app", createdAt: new Date().toISOString() }],
  astrologers: [
    { id: "a-1", name: "Pt. Raghunath Jha", languages: ["Hindi", "Maithili", "English"], experienceYears: 31, specialties: ["Kundali", "Marriage Matching", "Muhurta"], rating: 4.9, consultations: 12400, feePerMin: 35, available: true, photoHue: 28 },
    { id: "a-2", name: "Dr. Sita Mishra", languages: ["Hindi", "English"], experienceYears: 18, specialties: ["Career & Dasha", "Varshaphal", "Gochar"], rating: 4.8, consultations: 8300, feePerMin: 28, available: true, photoHue: 262 },
    { id: "a-3", name: "Pt. Kaushik Chakravarti", languages: ["Hindi", "Bengali", "English"], experienceYears: 24, specialties: ["Prashna", "Muhurta", "Remedies"], rating: 4.7, consultations: 6120, feePerMin: 22, available: true, photoHue: 160 },
    { id: "a-4", name: "Meenakshi Bharti", languages: ["Hindi", "English", "Tamil"], experienceYears: 12, specialties: ["Kundali Milan", "Namkaran", "Panchang"], rating: 4.8, consultations: 4980, feePerMin: 19, available: false, photoHue: 330 },
  ],
  clients: [],
  appointments: [],
  saved_kundalis: [],
  audit_logs: [],
  golden_reference_cases: Core.GOLDEN_ROWS,
  golden_reference_events: Core.DERIVED_NORMALIZATION,
  calculation_profiles: ["makaranda-v1", "drik-v1", "makaranda-v2-hybrid"],
};

async function loadDB() {
  if (!existsSync(DB_PATH)) {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2));
    return structuredClone(DEFAULT_DB);
  }
  try { return JSON.parse(await readFile(DB_PATH, "utf8")); } catch { return structuredClone(DEFAULT_DB); }
}
async function saveDB(db) { await writeFile(DB_PATH, JSON.stringify(db, null, 2)); }
let DB = null;

function audit(db, endpoint, body) {
  db.audit_logs.unshift({
    ts: new Date().toISOString(),
    endpoint,
    calculationMode: body?.calculationMode ?? body?.profileId ?? null,
    profileVersion: body?.profileVersion ?? null,
    date: body?.date ?? body?.startDate ?? null,
    locationSource: body?.location?.source ?? (body?.latitude != null ? "USER_PROVIDED" : "DEFAULT"),
  });
  db.audit_logs = db.audit_logs.slice(0, 500);
}

/* ---------------- helpers ---------------- */

function profileIdFrom(body) {
  if (body?.profileId) return body.profileId;
  if (body?.calculationMode === "DRIK") return "drik-v1";
  if (body?.calculationMode === "MAKARANDA") return "makaranda-v1";
  return "makaranda-v1"; // global default = MAKARANDA (spec §3.1)
}

function ctxFrom(body) {
  const profileId = profileIdFrom(body);
  const loc = body?.latitude != null && body?.longitude != null
    ? { name: body.placeName ?? "User location", latitude: Number(body.latitude), longitude: Number(body.longitude) }
    : null;
  return Core.createContext({ profileId, date: body?.date ?? new Date().toISOString().slice(0, 10), time: body?.time ?? null, location: loc, ayanamsaOverride: body?.ayanamsa ?? null });
}

function birthJDFrom(body, ctx) {
  return Core.parseLocalToJD(body.date, body.time ?? "00:00:00", ctx.tzOffsetHours);
}

function json(res, code, obj) {
  const s = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(s);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 2_000_000) { reject(new Error("body too large")); req.destroy(); } });
    req.on("end", () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(new Error("invalid JSON body")); } });
    req.on("error", reject);
  });
}

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon" };

async function serveStatic(req, res, url) {
  let p = url.pathname === "/" ? "/index.html" : url.pathname;
  let base = WEB_DIR;
  if (p.startsWith("/lib/")) { base = CORE_DIR; p = p.slice("/lib/".length); }
  const file = path.normalize(path.join(base, p));
  if (!file.startsWith(base)) { res.writeHead(403); return res.end("forbidden"); }
  try {
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 — " + url.pathname);
  }
}

/* ---------------- API routes ---------------- */

const routes = {
  "GET /api/v1/profiles": async (req, res, body, db) => {
    json(res, 200, {
      defaultProfile: "makaranda-v1",
      profiles: Core.PROFILES,
      banners: { makaranda: Core.methodBanner(Core.createContext({ profileId: "makaranda-v1", date: "2026-09-19" })), drik: Core.methodBanner(Core.createContext({ profileId: "drik-v1", date: "2026-09-19" })) },
    });
  },

  // Offline place lookup — deterministic gazetteer, no external geocoding.
  "GET /api/v1/geo/search": async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const q = (url.searchParams.get("q") ?? "").trim();
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "8", 10) || 8, 1), 15);
    if (!q) return json(res, 200, { results: [] });
    const norm = (s) => String(s ?? "").toLowerCase().normalize("NFC");
    const nq = norm(q);
    const tokens = nq.split(/\s+/).filter(Boolean);
    const scoreOf = (row) => {
      const [n, hi, r] = row;
      const hay = [norm(n), norm(hi), norm(r)];
      let score = 0;
      for (const tk of tokens) {
        let best = 0;
        for (const h of hay) {
          if (!h) continue;
          let s = 0;
          if (h === tk) s = 100;
          else if (h.startsWith(tk)) s = 80;
          else {
            const w = h.split(/[\s(,]+/).find((x) => x.startsWith(tk));
            if (w) s = 66;
            else if (h.includes(tk)) s = 40;
          }
          if (s > best) best = s;
        }
        if (!best) return 0; // every token must match somewhere
        score += best;
      }
      // small bias toward more-populated/well-known places via region bonus
      if (norm(n).startsWith(nq)) score += 12;
      return score / tokens.length;
    };
    const results = CITIES
      .map((row) => ({ row, score: scoreOf(row) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ row }) => ({ name: row[0], hi: row[1], region: row[2], country: row[3], latitude: row[4], longitude: row[5] }));
    json(res, 200, { results });
  },

  "POST /api/v1/panchang/calculate": async (req, res, body, db) => {
    const ctx = ctxFrom(body);
    const result = Core.calculatePanchang(ctx);
    if (body.compare) {
      const otherId = ctx.calculationMode === "MAKARANDA" ? "drik-v1" : "makaranda-v1";
      const ctx2 = Core.createContext({ profileId: otherId, date: ctx.localDate, location: { name: "same reference", latitude: ctx.latitude, longitude: ctx.longitude } });
      json(res, 200, { primary: result, comparison: Core.calculatePanchang(ctx2), comparisonNote: "Side-by-side only; values are never combined across engines (spec §3.3)." });
      return;
    }
    json(res, 200, result);
  },

  "POST /api/v1/kundali/calculate": async (req, res, body, db) => {
    const ctx = ctxFrom(body);
    const jd = birthJDFrom(body, ctx);
    const k = Core.calculateKundali(ctx, jd);
    if (body?.save) {
      db.saved_kundalis.push({ id: `k-${Date.now()}`, userId: body.userId ?? "u-1", name: body.name ?? "Untitled", createdAt: new Date().toISOString(), profile: ctx.profileVersion, input: { date: body.date, time: body.time, latitude: body.latitude, longitude: body.longitude, placeName: body.placeName } });
      await saveDB(db);
    }
    json(res, 200, k);
  },

  "POST /api/v1/varga/calculate": async (req, res, body, db) => {
    const ctx = ctxFrom(body);
    const jd = birthJDFrom(body, ctx);
    json(res, 200, Core.calculateVarga(ctx, jd, body.varga ?? "D9"));
  },

  "POST /api/v1/dasha/calculate": async (req, res, body, db) => {
    const ctx = ctxFrom(body);
    const jd = birthJDFrom(body, ctx);
    const k = Core.calculateKundali(ctx, jd);
    const moon = k.positions.find((p) => p.name === "Moon");
    const longs = Object.fromEntries(k.positions.map((p) => [p.name, p.longitude]));
    json(res, 200, Core.calculateDasha(ctx, jd, moon.longitude, k.lagna.sign, longs, body.system ?? "VIMSHOTTARI"));
  },

  "POST /api/v1/yoga/calculate": async (req, res, body, db) => {
    const ctx = ctxFrom(body);
    const jd = birthJDFrom(body, ctx);
    const k = Core.calculateKundali(ctx, jd);
    json(res, 200, Core.calculateYogaDosha(ctx, k));
  },

  "POST /api/v1/kundali/match": async (req, res, body, db) => {
    const ctx = ctxFrom(body);
    const jdM = Core.parseLocalToJD(body.male.date, body.male.time ?? "00:00:00", ctx.tzOffsetHours);
    const jdF = Core.parseLocalToJD(body.female.date, body.female.time ?? "00:00:00", ctx.tzOffsetHours);
    const ctxM = body.male.latitude != null ? Core.createContext({ profileId: ctx.profileVersion, date: body.male.date, location: { name: body.male.placeName ?? "Male birthplace", latitude: body.male.latitude, longitude: body.male.longitude } }) : ctx;
    const ctxF = body.female.latitude != null ? Core.createContext({ profileId: ctx.profileVersion, date: body.female.date, location: { name: body.female.placeName ?? "Female birthplace", latitude: body.female.latitude, longitude: body.female.longitude } }) : ctx;
    const moonM = Core.calculateKundali(ctxM, jdM).positions.find((p) => p.name === "Moon").longitude;
    const moonF = Core.calculateKundali(ctxF, jdF).positions.find((p) => p.name === "Moon").longitude;
    json(res, 200, Core.calculateMilan(ctx, moonM, moonF));
  },

  "POST /api/v1/transit/calculate": async (req, res, body, db) => {
    const ctx = ctxFrom(body);
    const jd = Core.parseLocalToJD(body.date, body.time ?? "12:00:00", ctx.tzOffsetHours);
    const natal = ctxFrom({ ...body, date: body.natalDate ?? body.date, time: body.natalTime ?? "00:00:00" });
    let natalMoonLon;
    if (body.natalMoonLongitude != null) natalMoonLon = body.natalMoonLongitude;
    else {
      const njd = Core.parseLocalToJD(body.natalDate ?? body.date, body.natalTime ?? "00:00:00", ctx.tzOffsetHours);
      natalMoonLon = Core.calculateKundali(natal, njd).positions.find((p) => p.name === "Moon").longitude;
    }
    const r = Core.calculateTransit(ctx, { natalMoonLon, jd });
    if (body.series) {
      r.series = {
        Jupiter: Core.transitSeries(ctx, "Jupiter", jd - 365, jd + 365 * 2, 30),
        Saturn: Core.transitSeries(ctx, "Saturn", jd - 365, jd + 365 * 2, 30),
      };
    }
    json(res, 200, r);
  },

  "POST /api/v1/muhurta/calculate": async (req, res, body, db) => {
    const ctx = ctxFrom(body);
    json(res, 200, Core.calculateMuhurta(ctx, { activity: body.activity ?? "marriage", startDate: body.startDate, endDate: body.endDate }));
  },

  "POST /api/v1/varshaphal/calculate": async (req, res, body, db) => {
    const ctx = ctxFrom(body);
    const jd = birthJDFrom(body, ctx);
    const k = Core.calculateKundali(ctx, jd);
    const sun = k.positions.find((p) => p.name === "Sun").longitude;
    json(res, 200, Core.calculateVarshaphal(ctx, {
      birthJD: jd, birthDateISO: body.date, birthLon: ctx.longitude, birthLat: ctx.latitude,
      year: body.year ?? new Date().getFullYear(), natalSunLon: sun, natalLagnaSign: k.lagna.sign,
    }));
  },

  "POST /api/v1/prashna/calculate": async (req, res, body, db) => {
    const ctx = ctxFrom(body);
    const jd = Core.parseLocalToJD(body.date, body.time ?? new Date().toTimeString().slice(0, 8), ctx.tzOffsetHours);
    json(res, 200, Core.calculatePrashna(ctx, jd));
  },

  "POST /api/v1/reports/generate": async (req, res, body, db) => {
    const ctx = ctxFrom(body);
    const jd = birthJDFrom(body, ctx);
    const k = Core.calculateKundali(ctx, jd);
    const moon = k.positions.find((p) => p.name === "Moon");
    const longs = Object.fromEntries(k.positions.map((p) => [p.name, p.longitude]));
    const dasha = Core.calculateDasha(ctx, jd, moon.longitude, k.lagna.sign, longs, "VIMSHOTTARI");
    const yoga = Core.calculateYogaDosha(ctx, k);
    const today = new Date().toISOString().slice(0, 10);
    const panchangToday = Core.calculatePanchang(Core.createContext({ profileId: ctx.profileVersion, date: today, location: { name: "report", latitude: ctx.latitude, longitude: ctx.longitude } }));
    const interpretation = Core.buildInterpretation("kundali", k);
    json(res, 200, {
      reportId: `r-${Date.now()}`,
      subject: { name: body.name ?? "Native", date: body.date, time: body.time, place: body.placeName },
      methodBanner: Core.methodBanner(ctx),
      sections: { kundali: k, dasha, yogaDosha: yoga, panchangToday },
      interpretation,
      generatedAt: new Date().toISOString(),
    });
  },

  "POST /api/v1/ai/interpret": async (req, res, body, db) => {
    // Deterministic template interpretation. The LLM adapter slot receives ONLY
    // structured calculation JSON (spec §15) — it never calculates.
    const { kind, structured } = body;
    if (!kind || !structured) return json(res, 400, { error: "kind + structured required" });
    json(res, 200, {
      interpretation: Core.buildInterpretation(kind, structured, body.lang ?? "hi"),
      llmRequest: Core.buildLLMRequest(kind, structured, body.lang ?? "hi"),
      providerStatus: "ADAPTER_SLOT — wire a provider (API key) in production; deterministic templates active in sandbox",
    });
  },

  "GET /api/v1/validation/run": async (req, res, body, db) => {
    json(res, 200, Core.runGoldenSuite());
  },

  "GET /api/v1/audit": async (req, res, body, db) => json(res, 200, { audit_logs: db.audit_logs.slice(0, 50) }),

  "GET /api/v1/astrologers": async (req, res, body, db) => json(res, 200, { astrologers: db.astrologers }),

  "POST /api/v1/consultations/book": async (req, res, body, db) => {
    const ast = db.astrologers.find((a) => a.id === body.astrologerId);
    if (!ast) return json(res, 404, { error: "astrologer not found" });
    if (!ast.available) return json(res, 409, { error: "astrologer is not accepting consultations right now" });
    const appt = {
      id: `apt-${Date.now()}`,
      userId: body.userId ?? "u-1",
      astrologerId: ast.id,
      astrologerName: ast.name,
      mode: body.mode ?? "call",
      date: body.date, time: body.time,
      durationMin: body.durationMin ?? 15,
      fee: Math.round(ast.feePerMin * (body.durationMin ?? 15)),
      topic: body.topic ?? "",
      profileUsed: body.profileId ?? "makaranda-v1",
      status: "CONFIRMED",
      createdAt: new Date().toISOString(),
      notes: [],
    };
    db.appointments.unshift(appt);
    await saveDB(db);
    json(res, 200, appt);
  },

  "GET /api/v1/consultations": async (req, res, body, db) => json(res, 200, { appointments: db.appointments }),

  "POST /api/v1/consultations/cancel": async (req, res, body, db) => {
    const appt = db.appointments.find((a) => a.id === body.id);
    if (!appt) return json(res, 404, { error: "appointment not found" });
    appt.status = "CANCELLED";
    await saveDB(db);
    json(res, 200, appt);
  },

  "POST /api/v1/kundali/save": async (req, res, body, db) => {
    db.saved_kundalis.push({ id: `k-${Date.now()}`, userId: body.userId ?? "u-1", ...body, createdAt: new Date().toISOString() });
    await saveDB(db);
    json(res, 200, { ok: true });
  },

  "GET /api/v1/kundali/saved": async (req, res, body, db) => json(res, 200, { saved: db.saved_kundalis }),
};

/* ---------------- server ---------------- */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const key = `${req.method} ${url.pathname}`;
  const started = Date.now();
  try {
    if (url.pathname.startsWith("/api/")) {
      const body = req.method === "POST" ? await readBody(req) : {};
      const handler = routes[key];
      if (!handler) return json(res, 404, { error: `no route ${key}`, routes: Object.keys(routes) });
      await handler(req, res, body, DB);
      if (url.pathname.includes("/calculate") || url.pathname.includes("/match") || url.pathname.includes("/generate")) audit(DB, url.pathname, body);
      await saveDB(DB);
      console.log(`[api] ${key} ${Date.now() - started}ms`);
      return;
    }
    await serveStatic(req, res, url);
  } catch (e) {
    console.error(`[error] ${key}:`, e.message);
    if (!res.headersSent) json(res, 500, { error: e.message });
    else res.end();
  }
});

DB = await loadDB();
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Mithila Makaranda platform running on http://0.0.0.0:${PORT}`);
  console.log(`Default calculation mode: MAKARANDA (makaranda-v1). Drik engine independent (drik-v1).`);
});
