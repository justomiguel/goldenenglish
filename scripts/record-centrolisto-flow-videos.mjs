#!/usr/bin/env node
/**
 * Records the 4 CentroListo landing moments on real institute hosts.
 * Needs `npm run dev:pulsar`. Admin clips reuse a copy of the local Chrome profile via CDP.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { prepareChromeProfileCopy } from "./record-centrolisto-chrome-profile.mjs";
import {
  launchChromeCdp,
  recordCdpPageToWebm,
  waitForCdp,
} from "./record-centrolisto-cdp-chrome.mjs";
import { FLOWS, SURFACES } from "./record-centrolisto-flow-defs.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "videos", "centrolisto");
const TMP_DIR = path.join(OUT_DIR, ".tmp-recordings");
const FLOW_ONLY = process.env.FLOW_ONLY
  ? process.env.FLOW_ONLY.split(",").map((n) => Number(n.trim()))
  : null;

const CURSOR_INIT = `
(() => {
  if (window.__clCursor) return;
  window.__clCursor = true;
  const el = document.createElement("div");
  el.id = "cl-demo-cursor";
  el.style.cssText = "position:fixed;z-index:2147483647;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:#1D4D3C;box-shadow:0 0 0 6px rgba(29,77,60,.18);pointer-events:none;left:24px;top:24px;transition:left .12s cubic-bezier(.22,1,.36,1),top .12s cubic-bezier(.22,1,.36,1);";
  const mount = () => { if (!document.getElementById("cl-demo-cursor")) document.documentElement.appendChild(el); };
  if (document.documentElement) mount();
  document.addEventListener("DOMContentLoaded", mount);
  document.addEventListener("mousemove", (e) => { el.style.left = e.clientX + "px"; el.style.top = e.clientY + "px"; }, { passive: true });
})();
`;

function selectedFlows() {
  return FLOWS.filter((flow) => !FLOW_ONLY || FLOW_ONLY.includes(flow.index));
}

async function waitUntilCompiled(page) {
  await page.waitForLoadState("domcontentloaded", { timeout: 90_000 }).catch(() => {});
  await page.waitForFunction(
    () => {
      const text = document.body?.innerText ?? "";
      return !text.includes("Compiling") && !text.includes("Rendering");
    },
    { timeout: 90_000 },
  ).catch(() => {});
}

function readyMarker(url) {
  if (url.includes("/academic")) return /Cohortes|secciones/i;
  if (url.includes("/finance")) return /Cobrado|Finanzas|Cobranzas/i;
  if (url.includes("/register")) return /DNI|documento|inscrib/i;
  return null;
}

async function playSteps(page, steps) {
  await page.addInitScript(CURSOR_INIT);
  for (const step of steps) {
    await page.goto(step.url, { waitUntil: "commit", timeout: 90_000 });
    await waitUntilCompiled(page);
    const marker = readyMarker(step.url);
    if (marker) {
      await page.waitForFunction(
        (source) => new RegExp(source, "i").test(document.body?.innerText ?? ""),
        marker.source,
        { timeout: 90_000 },
      ).catch(() => {});
    }
    await page.waitForTimeout(600);
    await page.mouse.move(80, 90, { steps: 8 });
    if (step.scrollY) {
      await page.mouse.wheel(0, step.scrollY);
      await page.waitForTimeout(400);
    }
    await page.mouse.move(220, 180, { steps: 10 });
    await page.waitForTimeout(step.dwellMs ?? 1400);
  }
}

async function recordPublicFlow(browser, flow, surface) {
  const targetFile = path.join(OUT_DIR, `flow-${flow.index}-${surface.key}.webm`);
  process.stdout.write(`Recording ${path.basename(targetFile)} (${flow.name})... `);
  const context = await browser.newContext({
    viewport: { width: surface.width, height: surface.height },
    deviceScaleFactor: 1,
    recordVideo: { dir: TMP_DIR, size: { width: surface.width, height: surface.height } },
    locale: "es-419",
  });
  const page = await context.newPage();
  const video = page.video();
  await playSteps(page, flow.steps);
  await context.close();
  if (video) {
    const recordedPath = await video.path();
    fs.copyFileSync(recordedPath, targetFile);
    fs.unlinkSync(recordedPath);
  }
  const stat = fs.statSync(targetFile);
  console.log(`done (${Math.round(stat.size / 1024)} KB)`);
}

async function recordAuthFlow(page, flow, surface) {
  const targetFile = path.join(OUT_DIR, `flow-${flow.index}-${surface.key}.webm`);
  const frameDir = path.join(TMP_DIR, `auth-${flow.index}-${surface.key}`);
  process.stdout.write(`Recording ${path.basename(targetFile)} (${flow.name})... `);
  fs.rmSync(frameDir, { recursive: true, force: true });
  await recordCdpPageToWebm(page, {
    width: surface.width,
    height: surface.height,
    outFile: targetFile,
    tmpDir: frameDir,
    run: () => playSteps(page, flow.steps),
  });
  fs.rmSync(frameDir, { recursive: true, force: true });
  const stat = fs.statSync(targetFile);
  console.log(`done (${Math.round(stat.size / 1024)} KB)`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const flows = selectedFlows();
  const publicFlows = flows.filter((flow) => !flow.needsAuth);
  const authFlows = flows.filter((flow) => flow.needsAuth);

  const publicBrowser = publicFlows.length ? await chromium.launch({ headless: true }) : null;
  let chromeProc = null;
  let authBrowser = null;
  try {
    for (const flow of publicFlows) {
      for (const surface of SURFACES) {
        await recordPublicFlow(publicBrowser, flow, surface);
      }
    }
    if (authFlows.length) {
      const chromeLaunch = prepareChromeProfileCopy(process.env.CHROME_PROFILE || "Profile 3");
      const launched = launchChromeCdp(chromeLaunch);
      chromeProc = launched.proc;
      await waitForCdp(launched.port);
      authBrowser = await chromium.connectOverCDP(launched.cdpUrl);
      const context = authBrowser.contexts()[0];
      const page = context.pages()[0] ?? (await context.newPage());
      for (const flow of authFlows) {
        for (const surface of SURFACES) {
          await recordAuthFlow(page, flow, surface);
        }
      }
    }
  } finally {
    if (publicBrowser) await publicBrowser.close();
    if (authBrowser) await authBrowser.close().catch(() => {});
    if (chromeProc) chromeProc.kill("SIGTERM");
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  }
}

await main();
