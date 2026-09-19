import { chromium } from "playwright";

const URL = "http://localhost:3000/";

const box = (el) => el && el.boundingBox();

const report = async (page, label) => {
  const data = await page.evaluate(() => {
    const img = document.querySelector(".nav-hero-logo");
    if (!img) return null;
    const rect = img.getBoundingClientRect();
    // walk up ancestors, check clipping
    const chain = [];
    let node = img.parentElement;
    while (node && node.tagName !== "BODY") {
      const cs = getComputedStyle(node);
      const r = node.getBoundingClientRect();
      chain.push({
        cls: (node.className || "").toString().slice(0, 80),
        overflow: cs.overflow,
        rect: { top: r.top, bottom: r.bottom, height: r.height },
      });
      node = node.parentElement;
    }
    return {
      logo: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, w: rect.width, h: rect.height },
      chain,
      scrollY: window.scrollY,
      innerWidth: window.innerWidth,
    };
  });
  console.log(`--- ${label} (width=${data ? "n/a" : "no logo"})`);
  console.log(JSON.stringify(data, null, 1));
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(URL, { waitUntil: "networkidle" }).catch((e) => console.log("goto warn:", e.message));
await page.waitForSelector(".nav-hero-logo", { timeout: 15000 });
await page.waitForTimeout(800);

await report(page, "TOP scrollY=0");

await page.evaluate(() => window.scrollTo({ top: 120 }));
await page.waitForTimeout(600);
await report(page, "SCROLLED scrollY=120");

await page.evaluate(() => window.scrollTo({ top: 0 }));
await page.waitForTimeout(600);
await report(page, "BACK TO TOP");

await browser.close();
