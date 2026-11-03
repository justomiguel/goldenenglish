#!/usr/bin/env node
/**
 * Saves the top of each generic template page.
 * The Pulsar dev server must already be on PORT (default 3000).
 *
 *   node scripts/capture-generic-template-previews.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PORT = process.env.PORT ?? "3000";
const KINDS = ["deportes", "jardin", "colegio", "musica", "idiomas"];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
try {
  for (const kind of KINDS) {
    const url = `http://127.0.0.1:${PORT}/es/plantilla/${kind}`;
    const response = await page.goto(url, { waitUntil: "load", timeout: 60_000 });
    if (!response || response.status() >= 400) {
      throw new Error(`${kind} returned ${response?.status() ?? "no response"}`);
    }
    await page.waitForTimeout(600);
    const target = path.join(ROOT, "public", "generic", kind, "preview.jpg");
    await page.screenshot({ path: target, type: "jpeg", quality: 80 });
    console.log(kind);
  }
} finally {
  await browser.close();
}
