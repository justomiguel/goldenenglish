#!/usr/bin/env node
/**
 * Records a short silent loop of each school home page for /clientes.
 * Default slugs: golden, espaciozenit.
 *
 *   npm run previews:centrolisto
 *   SLUGS=nago,liora npm run previews:centrolisto
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "centrolisto", "clients");
const TMP_DIR = path.join(OUT_DIR, ".tmp-recordings");
const PORT = process.env.PORT ?? "3000";
const LOCALE = process.env.LOCALE ?? "es";
const SLUGS = (process.env.SLUGS ?? "golden,espaciozenit")
  .split(",")
  .map((slug) => slug.trim().toLowerCase())
  .filter(Boolean);

async function captureSlug(browser, slug) {
  const url = `http://${slug}.localhost:${PORT}/${LOCALE}`;
  const targetVideo = path.join(OUT_DIR, `${slug}.webm`);
  const targetPoster = path.join(OUT_DIR, `${slug}.jpg`);
  process.stdout.write(`Recording ${slug} (${url})... `);

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: TMP_DIR,
      size: { width: 1440, height: 900 },
    },
  });
  const page = await context.newPage();
  const video = page.video();
  const response = await page.goto(url, { waitUntil: "load", timeout: 90_000 });
  if (!response || response.status() >= 400) {
    await context.close();
    throw new Error(`${slug} returned ${response?.status() ?? "no response"}`);
  }
  await page.waitForTimeout(800);
  await page.screenshot({ path: targetPoster, type: "jpeg", quality: 78 });
  await page.waitForTimeout(5500);
  await context.close();
  if (video) {
    const recordedPath = await video.path();
    fs.copyFileSync(recordedPath, targetVideo);
    fs.unlinkSync(recordedPath);
  }
  const stat = fs.statSync(targetVideo);
  console.log(`done (${Math.round(stat.size / 1024)} KB)`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const slug of SLUGS) {
      await captureSlug(browser, slug);
    }
  } finally {
    await browser.close();
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
