import puppeteer from "puppeteer";
import fs from "fs";

const START_FROM = 0;
const N = 100;

const browser = await puppeteer.launch({
  headless: true,
  executablePath: puppeteer.executablePath()
});
const page = await browser.newPage();

// Spoof a real browser to reduce bot detection / cookie wall aggression
await page.setUserAgent(
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
);
await page.setViewport({ width: 1920, height: 1280, deviceScaleFactor: 1 });

const schools = fs.readFileSync("./schools.txt").toString().split("\n").filter(Boolean);

/** Try to dismiss common cookie/consent modals */
const dismissCookieBanner = async () => {
  const acceptSelectors = [
    'button[id*="accept"]',
    'button[class*="accept"]',
    'button[aria-label*="Accept"]',
    '#onetrust-accept-btn-handler',   // OneTrust (used by QS)
    '.onetrust-close-btn-handler',
  ];
  for (const sel of acceptSelectors) {
    try {
      const btn = await page.$(sel);
      if (btn) {
        await btn.click();
        await new Promise(r => setTimeout(r, 500));
        return;
      }
    } catch (_) {}
  }
};

const getLogos = async (startingAt, count, saveTo) => {
  const map = {};

  for (const school of schools.slice(startingAt, startingAt + count)) {
    try {
      await page.goto(school);
    } catch (e) {
      console.log(`Navigation failed for ${school}: ${e.message}`);
      continue;
    }

    await dismissCookieBanner();

    // Wait for the heading to actually appear in the DOM
    try {
      await page.waitForSelector("h1", { timeout: 8_000 });
    } catch (_) {
      console.log(`Timed out waiting for h1 on ${school}`);
      continue;
    }

    const name = await page.evaluate(() => {
      // QS university pages use <h1> for the institution name
      const h1 = document.querySelector("h1");
      return h1 ? h1.innerText.trim() : null;
    });

    if (!name) {
      console.log(`Could not get name for URL ${school}`);
      // Debug: dump all text-white elements so you can inspect
      const candidates = await page.evaluate(() =>
        [...document.querySelectorAll(".text-white")]
          .map(el => el.innerText.trim())
          .filter(Boolean)
      );
      console.log("  .text-white candidates:", candidates);
      continue;
    }

    const logo = await page.evaluate(() => {
      const img = document.querySelector(".logo-uni");
      if (img?.src) return img.src;
      return null;
    });

    if (!logo) {
      console.log(`Could not get logo for school ${name}`);
      continue;
    }

    console.log(`"${name}": "${logo}",`);
    map[name] = logo;
  }

  fs.writeFileSync(saveTo, JSON.stringify(map, null, 2));
  console.log(`Saved ${Object.keys(map).length} entries to ${saveTo}`);
};

await getLogos(START_FROM, N, `${START_FROM}.json`);
await browser.close();