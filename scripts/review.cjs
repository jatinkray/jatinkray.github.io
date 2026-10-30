// Local review for jatinkray.github.io
//   python3 -m http.server 8899        (from the repo root)
//   node scripts/review.cjs            screenshots to .review/ + checks; exits 1 on failure
//   node scripts/review.cjs --og       re-render assets/img/og-image.png from scripts/og-src.html
// Env: BASE (default http://127.0.0.1:8899/), PUPPETEER (path to the puppeteer module), CHROME.
const path = require("path");
const fs = require("fs");
const puppeteer = require(
  process.env.PUPPETEER || "/home/paakhi/.npm/_npx/7d92d9a2d2ccc630/node_modules/puppeteer"
);

const BASE = process.env.BASE || "http://127.0.0.1:8899/";
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, ".review");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok: !!ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail === undefined ? "" : "  " + JSON.stringify(detail)}`);
};

// WCAG relative luminance / contrast for #rrggbb
const lum = (hex) => {
  const c = hex.replace("#", "").match(/../g).map((x) => parseInt(x, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: process.env.CHROME || "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });
  const errors = [];
  const open = async ({ width = 1440, height = 900, theme = "dark", reduce = false, js = true } = {}) => {
    const page = await browser.newPage();
    page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
    page.on("console", (m) => { if (m.type() === "error" || m.type() === "warn") errors.push(`console.${m.type()}: ${m.text()}`); });
    page.on("requestfailed", (r) => errors.push("requestfailed: " + r.url()));
    page.on("response", (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`); });
    await page.setJavaScriptEnabled(js);
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    if (reduce) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await page.evaluateOnNewDocument((t) => { try { localStorage.setItem("theme", t); } catch (e) {} }, theme);
    await page.goto(BASE, { waitUntil: "networkidle0", timeout: 45000 });
    await page.evaluate(() => document.fonts.ready);
    return page;
  };

  if (process.argv.includes("--og")) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await page.goto(new URL("scripts/og-src.html", BASE).href, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(ROOT, "assets/img/og-image.png") });
    console.log("wrote assets/img/og-image.png");
    await browser.close();
    return;
  }

  fs.mkdirSync(OUT, { recursive: true });

  // ---- static screenshots (reduced motion = final, fully revealed state) ----
  for (const [label, opts, full] of [
    ["desktop-dark", { theme: "dark", reduce: true }, true],
    ["desktop-light", { theme: "light", reduce: true }, true],
    ["mobile-dark", { width: 390, height: 844, reduce: true }, true],
  ]) {
    const page = await open(opts);
    await page.screenshot({ path: path.join(OUT, `${label}-hero.png`) });
    if (full) await page.screenshot({ path: path.join(OUT, `${label}-full.png`), fullPage: true });
    await page.close();
  }

  // ---- layout: no horizontal overflow at common widths ----
  for (const w of [320, 390, 768, 1024, 1280, 1440]) {
    const page = await open({ width: w, height: 900, reduce: true });
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`no horizontal overflow at ${w}px`, over <= 0, over > 0 ? { overflowPx: over } : undefined);
    await page.close();
  }

  // ---- structure + accessibility basics ----
  {
    const page = await open({ reduce: true });
    const s = await page.evaluate(() => {
      const ids = new Set([...document.querySelectorAll("[id]")].map((e) => e.id));
      const name = (el) => (el.getAttribute("aria-label") || el.textContent || "").trim();
      return {
        h1: document.querySelectorAll("h1").length,
        brokenAnchors: [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute("href")).filter((h) => h.length > 1 && !ids.has(h.slice(1))),
        imgsNoAlt: [...document.querySelectorAll("main img")].filter((i) => !i.getAttribute("alt")).length,
        unnamedControls: [...document.querySelectorAll("a, button")].filter((e) => !e.hidden && !name(e)).map((e) => e.outerHTML.slice(0, 80)),
        externalNoopener: [...document.querySelectorAll('a[target="_blank"]')].filter((a) => !/noopener/.test(a.rel)).length,
        phone: /\+?971|54596|545 ?961/.test(document.documentElement.outerHTML),
        replayStatic: document.querySelector("#replay").classList.contains("static"),
        hiddenReveals: [...document.querySelectorAll("[data-reveal]")].filter((e) => getComputedStyle(e).opacity !== "1").length,
      };
    });
    check("exactly one h1", s.h1 === 1, s.h1);
    check("no broken in-page anchors", !s.brokenAnchors.length, s.brokenAnchors);
    check("all content images have alt text", s.imgsNoAlt === 0);
    check("all links and buttons have accessible names", !s.unnamedControls.length, s.unnamedControls);
    check("target=_blank links use rel=noopener", s.externalNoopener === 0);
    check("no phone number on the page", !s.phone);
    check("reduced motion: replay shows its final state", s.replayStatic);
    check("reduced motion: nothing left hidden by reveal", s.hiddenReveals === 0, s.hiddenReveals);
    await page.close();
  }

  // ---- colour contrast of text tokens, both themes ----
  for (const theme of ["dark", "light"]) {
    const page = await open({ theme, reduce: true });
    const t = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      const v = {};
      ["bg", "bg-alt", "surface", "surface-2", "ink", "ink-2", "ink-3", "accent", "on-accent", "ok", "warn", "info"]
        .forEach((k) => (v[k] = cs.getPropertyValue("--" + k).trim()));
      return v;
    });
    const pairs = [];
    for (const fg of ["ink", "ink-2", "ink-3", "accent", "ok", "warn", "info"])
      for (const bg of ["bg", "bg-alt", "surface", "surface-2"]) pairs.push([fg, bg]);
    pairs.push(["on-accent", "accent"]);
    const low = pairs.map(([f, b]) => [f, b, +contrast(t[f], t[b]).toFixed(2)]).filter((p) => p[2] < 4.5);
    check(`${theme}: text tokens reach 4.5:1`, !low.length, low);
    await page.close();
  }

  // ---- interactions ----
  {
    const ctx = browser.defaultBrowserContext();
    await ctx.overridePermissions(new URL(BASE).origin, ["clipboard-read", "clipboard-write", "clipboard-sanitized-write"]);
    const page = await open({ theme: "dark" });

    // incident replay: autoplays, passes through approval, can pause, ends resolved
    await sleep(1500);
    const early = await page.evaluate(() => ({ state: replay.dataset.state, shown: replay.querySelectorAll(".rp-log li.on").length }));
    check("replay autoplays from the alert", early.state === "firing" || early.state === "investigating", early);
    await page.screenshot({ path: path.join(OUT, "replay-early.png") });
    await sleep(10200);
    const mid = await page.evaluate(() => replay.dataset.state);
    check("replay reaches the approval gate", mid === "approval", mid);
    await page.screenshot({ path: path.join(OUT, "replay-approval.png") });
    await page.click(".rp-btn");
    const frozen = await page.evaluate(() => getComputedStyle(replay).getPropertyValue("--p"));
    await sleep(1200);
    const still = await page.evaluate(() => ({ p: getComputedStyle(replay).getPropertyValue("--p"), label: document.querySelector(".rp-btn").getAttribute("aria-label") }));
    check("pause button stops the replay", still.p === frozen && /Play/.test(still.label), still);
    await page.click(".rp-btn");
    await sleep(11500);
    const end = await page.evaluate(() => ({ state: replay.dataset.state, shown: replay.querySelectorAll(".rp-log li.on").length, label: document.querySelector(".rp-btn").getAttribute("aria-label") }));
    check("replay ends resolved with every step shown", end.state === "resolved" && end.shown === 9 && /Replay/.test(end.label), end);

    // theme toggle flips and persists
    await page.click("#theme");
    const th = await page.evaluate(() => ({ attr: document.documentElement.getAttribute("data-theme"), saved: localStorage.getItem("theme"), label: document.querySelector("#theme").getAttribute("aria-label") }));
    check("theme toggle switches to light and persists", th.attr === "light" && th.saved === "light" && /dark/.test(th.label), th);
    await page.click("#theme");

    // gallery tabs + lightbox
    await page.evaluate(() => document.querySelector("#parqtel").scrollIntoView());
    await sleep(600);
    await page.click('#parqtel .g-tab:nth-child(4)');
    const tab = await page.evaluate(() => ({
      src: document.querySelector("#parqtel .g-frame img").getAttribute("src"),
      pressed: [...document.querySelectorAll("#parqtel .g-tab")].map((b) => b.getAttribute("aria-pressed")).join(""),
    }));
    check("gallery tab swaps the screenshot", /traces\.jpg$/.test(tab.src) && tab.pressed === "falsefalsefalsetruefalsefalse", tab);
    await page.click("#parqtel .g-frame");
    await sleep(300);
    const lbOpen = await page.evaluate(() => ({ open: lb.open, img: document.getElementById("lb-img").getAttribute("src"), focus: document.activeElement.className }));
    check("lightbox opens with the current screenshot", lbOpen.open && /traces\.jpg$/.test(lbOpen.img), lbOpen);
    await page.screenshot({ path: path.join(OUT, "lightbox.png") });
    await page.keyboard.press("Escape");
    await sleep(200);
    check("lightbox closes on Escape", await page.evaluate(() => !lb.open));

    // scrollspy
    await page.evaluate(() => document.querySelector("#experience").scrollIntoView());
    await sleep(800);
    const active = await page.evaluate(() => document.querySelector(".nav a.active")?.getAttribute("href"));
    check("nav highlights the section in view", active === "#experience", active);

    // copy email
    await page.evaluate(() => document.querySelector("#contact").scrollIntoView());
    await page.click("[data-copy]");
    await sleep(300);
    const copied = await page.evaluate(async () => ({ msg: document.querySelector(".copy-msg").textContent, clip: await navigator.clipboard.readText().catch(() => "") }));
    check("copy button copies the email", copied.msg === "Copied" && copied.clip === "jatin.kumar.ray@gmail.com", copied);

    // links inventory
    const ext = await page.$$eval('a[href^="http"], a[href^="mailto"], a[href$=".pdf"]', (els) => [...new Set(els.map((e) => e.getAttribute("href")))].sort());
    console.log("links:", JSON.stringify(ext, null, 1));
    await page.close();
  }

  // ---- no JavaScript: everything readable ----
  {
    const page = await open({ js: false });
    const nojs = await page.evaluate(() => ({
      rows: [...document.querySelectorAll(".rp-log li")].filter((li) => getComputedStyle(li).opacity === "1" && getComputedStyle(li).visibility === "visible").length,
      hidden: [...document.querySelectorAll("[data-reveal]")].filter((e) => getComputedStyle(e).opacity !== "1").length,
      state: document.querySelector("#replay").dataset.state,
    }));
    check("no JS: full incident log and all sections visible", nojs.rows === 9 && nojs.hidden === 0 && nojs.state === "resolved", nojs);
    await page.close();
  }

  check("no console errors or failed requests", !errors.length, errors.slice(0, 10));
  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed. Screenshots in .review/`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error("REVIEW FAILED:", e.message);
  process.exit(1);
});
