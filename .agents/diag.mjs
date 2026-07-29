import { chromium } from "playwright";

async function probe(url, label, reducedMotion) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
  } catch {
    console.log(`${label}: NOT REACHABLE`);
    await browser.close();
    return;
  }
  await page.waitForTimeout(4000);

  const sample = () =>
    page.evaluate(() => {
      const plate = document.querySelector("[data-plate-inner]");
      const tape = document.querySelector(".tape-track, [class*='tape']");
      const h1 = document.querySelector("h1");
      return {
        plate: plate ? getComputedStyle(plate).transform : "none",
        tape: tape ? getComputedStyle(tape).transform : "none",
        h1: h1 ? getComputedStyle(h1).fontSize : "?",
        lenis: document.documentElement.className.includes("lenis"),
        sweep: !!document.querySelector(".hero-sweep"),
        plates: document.querySelectorAll("[data-plate]").length,
      };
    });

  const a = await sample();
  await page.waitForTimeout(1200);
  const b = await sample();

  console.log(
    `${label}\n  h1 font-size: ${a.h1}\n  lenis: ${a.lenis}  sweep el: ${a.sweep}  plates: ${a.plates}` +
      `\n  plate transform moved: ${a.plate !== b.plate}\n  tape transform moved: ${a.tape !== b.tape}` +
      `\n  plate t0: ${a.plate}\n  plate t1: ${b.plate}`,
  );
  await browser.close();
}

await probe("http://localhost:3001", "PROD BUILD :3001 (normal)", null);
await probe("http://localhost:3001", "PROD BUILD :3001 (reduced motion ON)", "reduce");
await probe("http://localhost:3000", "YOUR DEV SERVER :3000 (normal)", null);
