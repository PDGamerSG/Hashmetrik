import { chromium } from "playwright";
const browser = await chromium.launch();
for (const rm of [undefined, "no-preference", "reduce"]) {
  const ctx = await browser.newContext(rm === undefined ? {} : { reducedMotion: rm });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3001", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3500);
  const r = await page.evaluate(() => ({
    reduce: matchMedia("(prefers-reduced-motion: reduce)").matches,
    lenis: document.documentElement.className.includes("lenis"),
    plate: getComputedStyle(document.querySelector("[data-plate-inner]")).transform.slice(0, 40),
  }));
  console.log(`emulate=${rm ?? "SYSTEM DEFAULT (no override)"} →`, JSON.stringify(r));
  await ctx.close();
}
await browser.close();
