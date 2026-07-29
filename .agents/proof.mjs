import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3001", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4000);
const read = () => page.evaluate(() => ({
  plate: getComputedStyle(document.querySelector("[data-plate-inner]")).transform,
  tape: getComputedStyle(document.querySelector("[class*='tape-track'], .tape-track") ?? document.body).transform,
}));
const a = await read();
await page.waitForTimeout(1500);
const b = await read();
console.log("plate t0:", a.plate);
console.log("plate t1:", b.plate);
console.log("plate MOVED:", a.plate !== b.plate);
console.log("tape  MOVED:", a.tape !== b.tape);
await browser.close();
