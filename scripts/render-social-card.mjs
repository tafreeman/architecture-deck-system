// Renders scripts/social-card.html → public/brand/architecture-deck-system.png
// Screenshots the 1280x640 .card element. Run: node scripts/render-social-card.mjs
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(here, "social-card.html");
const outPath = resolve(here, "..", "public", "brand", "architecture-deck-system.png");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
const card = page.locator(".card");
await card.waitFor({ state: "visible" });
await card.screenshot({ path: outPath });
await browser.close();
console.log(`Rendered → ${outPath}`);
