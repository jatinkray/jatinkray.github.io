// Local review for "The Reliability Report" portfolio
const path = require("path");
const puppeteer = require(
  "/home/paakhi/.npm/_npx/7d92d9a2d2ccc630/node_modules/puppeteer"
);

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });
  const consoleMsgs = [];
  const failed = [];

  const capture = async (label, width, height, fullPage) => {
    const page = await browser.newPage();
    page.on("console", (m) => consoleMsgs.push(`[${label}] ${m.type()}: ${m.text()}`));
    page.on("pageerror", (e) => consoleMsgs.push(`[${label}] PAGEERROR: ${e.message}`));
    page.on("requestfailed", (r) => failed.push(`[${label}] ${r.url()} :: ${r.failure()?.errorText}`));
    page.on("response", (r) => { if (r.status() >= 400) failed.push(`[${label}] HTTP ${r.status()} ${r.url()}`); });
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.goto("http://127.0.0.1:8899/", { waitUntil: "networkidle0", timeout: 45000 });
    // scroll through to trigger reveals + lazy images
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
    });
    await new Promise((r) => setTimeout(r, 1400));
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 700));
    const state = await page.evaluate(() => ({
      title: document.title,
      reveals: document.querySelectorAll("[data-rv]").length,
      ins: document.querySelectorAll("[data-rv].in").length,
      h1: document.querySelector("h1")?.textContent,
      totalH: document.body.scrollHeight,
      meters: [...document.querySelectorAll(".m-fill")].map((m) => m.style.width),
      dialOffset: document.querySelector(".dial-arc")?.style.strokeDashoffset,
      counts: [...document.querySelectorAll(".count")].slice(0, 8).map((c) => c.textContent),
      typed: document.getElementById("typed")?.textContent,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      // new checks: flow diagrams must not scroll horizontally
      diagramScrolls: [...document.querySelectorAll(".case-diagram")].map((d) => ({
        scrollW: d.scrollWidth,
        clientW: d.clientWidth,
        scrollable: d.scrollWidth > d.clientWidth + 1,
      })),
      missions: [...document.querySelectorAll(".mission .m-company")].map((m) => m.textContent.trim()),
    }));
    console.log(`\n=== ${label} ===`);
    console.log(JSON.stringify(state, null, 2));
    await page.screenshot({
      path: path.join(__dirname, "..", ".review", `${label}.png`),
      fullPage,
    });
    await page.close();
  };

  await capture("desktop-full", 1440, 900, true);
  await capture("desktop-hero", 1440, 900, false);
  await capture("mobile-full", 390, 844, true);

  // interaction tests
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto("http://127.0.0.1:8899/", { waitUntil: "networkidle0" });

  // theme
  const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.click("#theme-toggle");
  const lightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const themeAttr = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  console.log("\n=== interactions ===");
  console.log("theme:", darkBg, "->", lightBg, "attr:", themeAttr);
  await page.click("#theme-toggle");

  // tabs + lightbox
  await page.evaluate(() => document.querySelector("#parqtel").scrollIntoView());
  await new Promise((r) => setTimeout(r, 500));
  await page.click("#parqtel .case-tab:nth-child(2)");
  const src = await page.evaluate(() => document.querySelector("#parqtel .case-frame img").src.split("/").pop());
  console.log("tab click ->", src);
  await page.click("#parqtel .case-frame");
  const lb1 = await page.evaluate(() => ({
    open: document.getElementById("lightbox").classList.contains("open"),
    img: document.getElementById("lb-img").src.split("/").pop(),
  }));
  console.log("lightbox:", JSON.stringify(lb1));
  await page.keyboard.press("Escape");
  const lb2 = await page.evaluate(() => !document.getElementById("lightbox").classList.contains("open"));
  console.log("closed on Esc:", lb2);

  // scrollspy: scroll to #mission, check active nav
  await page.evaluate(() => document.querySelector("#mission").scrollIntoView());
  await new Promise((r) => setTimeout(r, 900));
  const active = await page.evaluate(() => document.querySelector(".side-nav a.active")?.textContent.trim());
  console.log("scrollspy active at #mission:", active);

  // links & anchors
  const externals = await page.$$eval("a[href^='http']", (els) => [...new Set(els.map((e) => e.href))].sort());
  console.log("external links:", JSON.stringify(externals, null, 1));
  const anchors = await page.$$eval("a[href^='#']", (els) => els.map((e) => e.getAttribute("href")));
  const ids = await page.$$eval("[id]", (els) => els.map((e) => e.id));
  const broken = anchors.filter((a) => a !== "#" && !ids.includes(a.slice(1)));
  console.log("broken anchors:", broken.length ? broken : "(none)");
  const phoneRefs = await page.content().then((c) => (c.includes("97154") || c.includes("+971") ? "PHONE FOUND!" : "no phone refs ✓"));
  console.log("phone check:", phoneRefs);

  console.log("\nERRORS:", errors.length ? errors : "(none)");
  console.log("CONSOLE:", consoleMsgs.length ? consoleMsgs.slice(0, 20) : "(clean)");
  console.log("FAILED:", failed.length ? failed.slice(0, 20) : "(none)");
  await browser.close();
})().catch((e) => {
  console.error("REVIEW FAILED:", e.message);
  process.exit(1);
});
