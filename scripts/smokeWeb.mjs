// Headless smoke test: run the SPA module in Node, dispatch hashchange per page,
// report any page that stays on spinner or renders an error note.
const elements = new Map();
function fakeEl(id) {
  if (!elements.has(id)) elements.set(id, { id, innerHTML: "", textContent: "", scrollTop: 0, dataset: {}, style: {}, onclick: null, addEventListener() {}, classList: { add(){}, remove(){} }, querySelectorAll: () => [], querySelector: () => null, value: "", checked: false });
  return elements.get(id);
}
const store = {};
globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => delete store[k] };
globalThis.location = { hash: "#/" };
const winHandlers = [];
globalThis.window = { addEventListener: (ev, fn) => winHandlers.push([ev, fn]), location: globalThis.location };
globalThis.document = { querySelector: (s) => fakeEl(s), querySelectorAll: () => [], addEventListener() {}, getElementById: (s) => fakeEl("#" + s), documentElement: { dataset: {} }, body: fakeEl("#body") };
globalThis.addEventListener = () => {};
const realFetch = globalThis.fetch;
globalThis.fetch = (url, opts) => realFetch(new URL(url, "http://localhost:3000"), opts);
globalThis.setInterval = () => 0;
await import("../packages/server/web/app.js");
await new Promise((r) => setTimeout(r, 1000));
const hashFn = (winHandlers.find(([e]) => e === "hashchange") || [])[1];
if (!hashFn) { console.error("no hashchange handler registered"); process.exit(1); }
const slugs = ["dashboard","panchang","kundali","vargas-d-charts","dashas","yogas-doshas","kundali-milan","gochar-transit","muhurta","varshaphal","prashna","reports","consult-astrologers","validation-suite","settings"];
let failed = 0;
for (const slug of slugs) {
  globalThis.location.hash = "#/" + slug;
  await hashFn();
  await new Promise((r) => setTimeout(r, 700));
  const html = fakeEl("#main").innerHTML;
  const blank = html.includes("spinner") && html.length < 80;
  const err = html.includes('class="note red"');
  const status = err ? "ERROR" : blank ? "BLANK/STUCK" : `ok (${html.length} chars)`;
  if (err || blank) { failed++; console.log(`  ✘ ${slug}: ${status}`); if (err) console.log("      " + html.slice(0, 300)); }
  else console.log(`  ✔ ${slug}: ${status}`);
}
console.log(failed ? `SMOKE FAIL: ${failed} pages broken` : "SMOKE PASS: all pages render");
process.exit(failed ? 1 : 0);
