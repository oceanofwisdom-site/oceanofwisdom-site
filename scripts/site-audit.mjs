import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];
const ok = (message) => console.log("PASS " + message);
const fail = (message) => errors.push(message);
const read = (file) => {
  const full = path.join(root, file);
  if (!existsSync(full)) {
    fail("Missing file: " + file);
    return "";
  }
  return readFileSync(full, "utf8");
};

const atlasPages = [
  "classical-languages.html",
  "classical-languages-hi.html",
  "classical-languages-ta.html",
  "classical-languages-es.html",
  ...["assamese","bengali","kannada","malayalam","marathi","odia","pali","prakrit","sanskrit","tamil","telugu"].flatMap((name) =>
    ["", "-hi", "-ta", "-es"].map((suffix) => `classical-languages/${name}${suffix}.html`)
  ),
  ...["","-hi","-ta","-es"].map((suffix) => `classical-languages/connections${suffix}.html`),
  ...["","-hi","-ta","-es"].map((suffix) => `classical-languages/translator${suffix}.html`)
];

if (atlasPages.length !== 56) fail("Expected 56 Atlas routes; got " + atlasPages.length);
const atlasSet = new Set(atlasPages);

function resolveLocal(fromFile, href) {
  if (!href || /^(?:https?:|mailto:|tel:|data:|javascript:|#)/i.test(href)) return null;
  const raw = href.split(/[?#]/, 1)[0];
  if (!raw) return null;
  let rel = raw.startsWith("/")
    ? raw.slice(1)
    : path.posix.join(path.posix.dirname(fromFile), raw);
  rel = path.posix.normalize(rel);
  if (rel === ".") rel = "index.html";
  if (rel.endsWith("/")) rel += "index.html";
  return rel;
}

for (const file of atlasPages) {
  const html = read(file);
  if (!html) continue;
  const lang = (html.match(/<html\b[^>]*\blang=["']([^"']+)/i) || [])[1];
  const expected = file.endsWith("-hi.html") ? "hi"
    : file.endsWith("-ta.html") ? "ta"
    : file.endsWith("-es.html") ? "es" : "en";
  if (lang !== expected) fail(`${file}: lang=${lang || "missing"}, expected ${expected}`);
  if (!/<title>\s*[^<]+<\/title>/i.test(html)) fail(file + ": missing title");
  if (!/<!doctype html>/i.test(html)) fail(file + ": missing HTML5 doctype");
  for (const tag of ["html","head","body"]) {
    const opens = (html.match(new RegExp("<" + tag + "\\b", "gi")) || []).length;
    const closes = (html.match(new RegExp("</" + tag + ">", "gi")) || []).length;
    if (opens !== 1 || closes !== 1) fail(`${file}: expected one opening and closing ${tag} tag; got ${opens}/${closes}`);
  }
  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) fail(file + ": missing responsive viewport meta");
  const styles = [...html.matchAll(/<link\\b([^>]*)>/gi)].map((m) => (m[1].match(/\\bhref=["']([^"']+)["']/i) || [])[1]).filter(Boolean);
  if (!styles.some((href) => resolveLocal(file, href) === "language-buttons.css")) fail(file + ": missing shared language-button stylesheet");
  if (!styles.some((href) => resolveLocal(file, href) === "classical-languages/atlas.css")) fail(file + ": missing shared Atlas responsive stylesheet");

  const anchors = [...html.matchAll(/<a\b([^>]*)>/gi)];
  const languageLinks = anchors.map((m) => {
    const attrs = m[1];
    const cls = (attrs.match(/\bclass=["']([^"']*)["']/i) || [])[1] || "";
    const href = (attrs.match(/\bhref=["']([^"']*)["']/i) || [])[1] || "";
    return { cls: cls.split(/\s+/), href };
  }).filter((a) => a.cls.includes("lang-btn"));

  if (languageLinks.length !== 4) fail(`${file}: expected 4 language links, got ${languageLinks.length}`);
  const active = languageLinks.filter((a) => a.cls.includes("active")).length;
  if (active !== 1) fail(`${file}: expected exactly 1 active language link, got ${active}`);
  for (const link of languageLinks) {
    const target = resolveLocal(file, link.href);
    if (!target || !existsSync(path.join(root, target))) fail(`${file}: language target missing: ${link.href} -> ${target}`);
  }

  const homes = anchors.filter((m) => {
    const cls = (m[1].match(/\bclass=["']([^"']*)["']/i) || [])[1] || "";
    return cls.split(/\s+/).includes("home");
  });
  if (homes.length !== 1) fail(`${file}: expected exactly 1 HOME link, got ${homes.length}`);

  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((m) => m[1]);
  const duplicates = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  if (duplicates.length) fail(`${file}: duplicate IDs: ${duplicates.join(", ")}`);
}
if (errors.length === 0) ok("all 56 Atlas routes: language, title, four-way navigation, active state, HOME link and unique IDs");

const sitemap = read("sitemap.xml");
if (sitemap) {
  const locations = [...sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((m) => {
    try { return new URL(m[1].trim()).pathname.replace(/^\//, ""); } catch { return ""; }
  });
  for (const file of atlasPages) {
    const count = locations.filter((loc) => loc.replace(/\/$/, "") === file).length;
    if (count !== 1) fail(`sitemap.xml: ${file} appears ${count} times (expected once)`);
  }
  if (errors.length === 0) ok("sitemap contains every Atlas route exactly once");
}

function parseInlineScripts(file) {
  const html = read(file);
  if (!html) return;
  const blocks = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter((m) => m[2].trim());
  for (let i = 0; i < blocks.length; i++) {
    try { new Function(blocks[i][2]); }
    catch (e) { fail(`${file}: inline script ${i + 1} syntax error: ${e.message}`); }
  }
  if (!blocks.length) fail(file + ": no inline script found for syntax check");
  else if (errors.length === 0) ok(file + ": " + blocks.length + " inline script(s) parse");
}

parseInlineScripts("calendar/index.html");
parseInlineScripts("ancient-indian-tools.html");
parseInlineScripts("ancient-world-tools.html");
parseInlineScripts("classical-languages/translator.html");

function readTranslationDictionary(file, marker, endMarker) {
  const html = read(file);
  const script = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)].filter((m) => m[2].trim())[0]?.[2] || "";
  const start = script.indexOf(marker);
  const end = script.indexOf(endMarker, start);
  if (start < 0 || end < 0) {
    fail(file + ": translation dictionary boundaries not found");
    return null;
  }
  const raw = script.slice(start + marker.length, end);
  try { return new Function("return (" + raw + ");")(); }
  catch (e) { fail(file + ": translation dictionary parse error: " + e.message); return null; }
}

const calendar = read("calendar/index.html");
if (calendar) {
  const calendarScript = [...calendar.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)].filter((m) => m[2].trim())[0]?.[2] || "";
  try {
    const dict = new Function("window","document",calendarScript + ";return CAL_I18N;")(
      {}, { addEventListener(){}, querySelectorAll(){return []}, documentElement:{}, getElementById(){return null;} }
    );
    const langs = Object.keys(dict);
    const counts = langs.map((lang) => Object.keys(dict[lang]).length);
    if (langs.length !== 4 || new Set(counts).size !== 1) fail("calendar: expected four complete language dictionaries with matching keys");
    for (const lang of ["en","hi","ta","ml"]) if (!calendar.includes(`data-cal-lang="${lang}"`)) fail("calendar: missing language selector " + lang);
    const calendarIds = new Set([...calendar.matchAll(/\\bid=["']([^"']+)["']/gi)].map((m) => m[1]));
    const targets = [...calendarScript.matchAll(/set\("([^"]+)"/g)].map((m) => m[1]);
    for (const id of targets) if (!calendarIds.has(id)) fail("calendar: translation target ID is missing: " + id);
    if (errors.length === 0) ok("calendar: four matching language dictionaries, selector buttons and translation targets");
  } catch (e) { fail("calendar: dictionary harness failed: " + e.message); }
}

for (const file of ["ancient-indian-tools.html","ancient-world-tools.html"]) {
  const html = read(file);
  const script = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)].filter((m) => m[2].trim())[0]?.[2] || "";
  const dict = readTranslationDictionary(file, "const D=", ";\nlet L=");
  if (dict) {
    const langs = Object.keys(dict);
    const required = [...html.matchAll(/data-t=["']([^"']+)["']/g)].map((m) => m[1]);
    for (const lang of langs) {
      const missing = [...new Set(required)].filter((key) => !(key in dict[lang]));
      if (missing.length) fail(`${file}: ${lang} missing translations: ${missing.join(", ")}`);
    }
    if (langs.length !== 4) fail(file + ": expected four language dictionaries");
    else if (errors.length === 0) ok(file + ": all four dictionaries cover every data-t key");
  }
}

const coreQuestionPages = [
  "what-is-all-this.html",
  "am-i-connected.html",
  "i-am-that.html",
  "what-is-truth.html",
  "what-is-bliss.html"
];
for (const file of coreQuestionPages) {
  const html = read(file);
  if (!html) continue;
  const script = (html.match(/<script[^>]*id=["']oow-language-fallback["'][^>]*>([\s\S]*?)<\/script>/i) || [])[1];
  if (!script) { fail(file + ": missing language fallback script"); continue; }
  const dataMatch = script.match(/var DATA = (\{[\s\S]*?\});\s*function applyLanguage/);
  if (!dataMatch) { fail(file + ": missing language dictionary"); continue; }
  let data;
  try { data = new Function("return (" + dataMatch[1] + ");")(); }
  catch (e) { fail(file + ": language dictionary parse error: " + e.message); continue; }
  const keys = [...new Set([...html.matchAll(/data-i18n=["']([^"']+)["']/g)].map((m) => m[1]))];
  for (const lang of ["en","hi","ta","es"]) {
    if (!data[lang]) fail(file + ": missing " + lang + " dictionary");
    else {
      const missing = keys.filter((key) => !(key in data[lang]));
      if (missing.length) fail(file + ": " + lang + " missing translations: " + missing.join(", "));
    }
  }
  const nodes = keys.map((key) => ({ key, textContent: "", getAttribute(name) { return name === "data-i18n" ? this.key : null; } }));
  const buttons = ["en","hi","ta","es"].map((lang) => ({
    lang, style: {}, classList: { toggle() {} },
    getAttribute(name) { return name === "data-lang" ? this.lang : null; },
    setAttribute() {}
  }));
  const doc = {
    readyState: "complete",
    documentElement: { lang: "en", setAttribute(name, value) { if (name === "lang") this.lang = value; } },
    querySelectorAll(selector) { return selector === "[data-i18n]" ? nodes : buttons; },
    addEventListener() {}
  };
  const store = { getItem() { return null; }, setItem() {} };
  const win = {};
  try {
    new Function("window","document","localStorage",script)(win,doc,store);
    for (const lang of ["hi","ta","es"]) {
      const switched = win.switchLang(lang);
      if (!switched || doc.documentElement.lang !== lang || !nodes.every((node) => node.textContent === data[lang][node.key])) {
        fail(file + ": " + lang + " language switch did not update all translated text");
      }
    }
  } catch (e) { fail(file + ": language-switch harness error: " + e.message); }
}
if (errors.length === 0) ok("five core question pages: EN/HI/TA/ES dictionaries and live switch handlers");

const researchTools = read("ancient-indian-tools.html");
if (researchTools) {
  const expectedTools = [
    "https://www.ndl.iitkgp.ac.in/re_search",
    "https://gretil.sub.uni-goettingen.de/gretil.html",
    "https://www.sanskrit-lexicon.uni-koeln.de/",
    "https://science.nasa.gov/eyes/",
    "https://ssd.jpl.nasa.gov/horizons/",
    "https://stellarium-web.org/",
    "https://viewspace.org/en/"
  ];
  for (const url of expectedTools) if (!researchTools.includes(url)) fail("Research tools page: missing external destination " + url);
  if ((researchTools.match(/class="tool"/g) || []).length !== 11) fail("Research tools page: expected 4 Indian calculators plus 7 curated digital resources");
  if (!/43 digitised dictionaries/.test(researchTools)) fail("Research tools page: Cologne dictionary count should be 43");
  if (errors.length === 0) ok("Research tools page: seven curated external destinations and 11 total tool cards");
}

const library = read("library/index.html");
if (library) {
  const recordBlock = (library.match(/const records=\[([\s\S]*?)\];/) || [])[1] || "";
  const ids = [...recordBlock.matchAll(/\bid:"([^"]+)"/g)].map((m) => m[1]);
  const urls = [...recordBlock.matchAll(/source:"([^"]+)"/g)].map((m) => m[1]);
  const titles = [...recordBlock.matchAll(/sourceTitle:"([^"]+)"/g)].map((m) => m[1]);
  const kinds = [...recordBlock.matchAll(/sourceKind:"([^"]+)"/g)].map((m) => m[1]);
  if (ids.length !== 50 || new Set(ids).size !== 50) fail("Knowledge Library: expected 50 unique records");
  if (urls.length !== 50 || titles.length !== 50 || kinds.length !== 50) fail("Knowledge Library: each record must have a source URL, title and type");
  if (new Set(urls).size !== 50) fail("Knowledge Library: source URLs must be unique");
  const translationMatch = library.match(/const recordTranslations=(\{[\s\S]*?\});/);
  if (!translationMatch) fail("Knowledge Library: translation dictionary not found");
  else {
    try {
      const translations = new Function("return (" + translationMatch[1] + ");")();
      for (const lang of ["hi","ta","es"]) {
        if (Object.keys(translations[lang] || {}).length !== 50) fail(`Knowledge Library: ${lang} must translate all 50 records`);
      }
      if (errors.length === 0) ok("Knowledge Library: 50 unique sourced records and 150 localized record entries");
    } catch (e) { fail("Knowledge Library: translation dictionary parse error: " + e.message); }
  }
}

if (library) {
  const uiMatch = library.match(/const translations=(\{[\s\S]*?\});\s*const catNames/);
  if (!uiMatch) fail("Knowledge Library: UI translations not found");
  else {
    try {
      const ui = new Function("return (" + uiMatch[1] + ");")();
      for (const lang of ["en","hi","ta","es"]) {
        if (!ui[lang] || !ui[lang].rightsNotice) fail("Knowledge Library: missing source-rights notice translation for " + lang);
      }
      if (errors.length === 0) ok("Knowledge Library: source-access and rights notice available in four languages");
    } catch (e) { fail("Knowledge Library: UI translation parse error: " + e.message); }
  }
}

if (errors.length) {
  console.error("\nAUDIT FAILED");
  for (const error of errors) console.error(" - " + error);
  process.exitCode = 1;
} else {
  console.log("\nAUDIT PASSED");
}
