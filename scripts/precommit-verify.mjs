#!/usr/bin/env node
/**
 * Pre-commit policy checks: branding literals, i18n parity, PWA conventions, file size,
 * Tier A student/parent pages must reach SurfaceMountGate (see scripts/tier-a-surface-verify.mjs).
 * Keeps failures actionable (single line per issue).
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  findTierAStudentParentPages,
  reachesSurfaceMountGate,
} from "./tier-a-surface-verify.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const MAX_SOURCE_LINES = 250;
const BRAND_KEYS = [
  "app.name",
  "app.legal.name",
  "app.tagline",
  "app.logo.alt",
  "app.legal.registry",
  "contact.email",
  "contact.phone",
  "contact.address",
  "social.facebook",
  "social.instagram",
  "social.whatsapp",
];

/** @type {string[]} */
const errors = [];

function fail(msg) {
  errors.push(msg);
}

function sh(cmd, opts = {}) {
  return execSync(cmd, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      ...opts,
    })
    .trim();
}

/**
 * Mirror of `SYSTEM_PROPERTIES_DEFAULTS` from
 * `src/lib/theme/systemPropertiesDefaults.ts`. Kept here in sync (CI fail-safe)
 * so the precommit guardrail can run without TS compilation. Only the keys
 * listed in `BRAND_KEYS` are scanned; updating that subset is enough — the rest
 * of the values are tolerated to drift.
 */
const BRAND_DEFAULTS = {
  "app.name": "Golden English",
  "app.legal.name": "Instituto de Lenguas Golden English",
  "app.tagline": "Más de 20 años enseñando inglés, creando oportunidades",
  "app.logo.alt": "Logo GE Golden English",
  "app.legal.registry":
    "Resolución 1297/05 - Ministerio de Educación, Formosa",
  "contact.email": "crisins@hotmail.com",
  "contact.phone": "+54 9 3718 528-383 ",
  "contact.address": "Riacho He Hé, Provincia de Formosa, Argentina",
  "social.facebook": "https://www.facebook.com/Lateachergolden",
  "social.instagram": "https://www.instagram.com/goldenenglishok/",
  "social.whatsapp": "https://wa.me/5493718528383",
};

function gitTrackedSrcTsx() {
  try {
    return sh("git ls-files src").split("\n").filter((f) => /\.(tsx?)$/.test(f));
  } catch {
    return [];
  }
}

function isSkippablePath(f) {
  return (
    f.startsWith("src/dictionaries/") ||
    f.includes("__tests__/") ||
    f.endsWith(".test.ts") ||
    f.endsWith(".test.tsx") ||
    f === "src/lib/theme/systemPropertiesDefaults.ts"
  );
}

function checkBrandLiterals() {
  const needles = BRAND_KEYS.map((k) => BRAND_DEFAULTS[k]).filter(
    (v) => v && v.length >= 5,
  );

  const files = gitTrackedSrcTsx().filter((f) => !isSkippablePath(f));
  for (const file of files) {
    const abs = join(ROOT, file);
    if (!existsSync(abs)) continue;
    let content;
    try {
      content = readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    for (const s of needles) {
      if (content.includes(s)) {
        fail(
          `Hardcoded brand or contact string in ${file}: "${s.slice(0, 64)}${s.length > 64 ? "…" : ""}" — use getBrandPublic() / dictionaries.`,
        );
      }
    }
  }
}

function flattenJsonKeys(obj, prefix = "") {
  /** @type {string[]} */
  const out = [];
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const k of Object.keys(obj)) {
      const p = prefix ? `${prefix}.${k}` : k;
      if (obj[k] !== null && typeof obj[k] === "object" && !Array.isArray(obj[k])) {
        out.push(...flattenJsonKeys(obj[k], p));
      } else {
        out.push(p);
      }
    }
  }
  return out.sort();
}

function checkDictionaryParity() {
  const enPath = join(ROOT, "src/dictionaries/en.json");
  const esPath = join(ROOT, "src/dictionaries/es.json");
  if (!existsSync(enPath) || !existsSync(esPath)) return;
  const en = JSON.parse(readFileSync(enPath, "utf8"));
  const es = JSON.parse(readFileSync(esPath, "utf8"));
  const a = new Set(flattenJsonKeys(en));
  const b = new Set(flattenJsonKeys(es));
  const onlyEn = [...a].filter((k) => !b.has(k));
  const onlyEs = [...b].filter((k) => !a.has(k));
  for (const k of onlyEn) fail(`i18n: key absent in es.json: ${k}`);
  for (const k of onlyEs) fail(`i18n: key absent in en.json: ${k}`);
}

function checkPwaSurfaceHook() {
  const entryPath = join(ROOT, "src/hooks/useAppSurface.ts");
  const corePath = join(ROOT, "src/hooks/useAppSurfaceCore.ts");
  if (!existsSync(entryPath)) {
    fail("PWA: src/hooks/useAppSurface.ts is missing");
    return;
  }
  if (!existsSync(corePath)) {
    fail("PWA: src/hooks/useAppSurfaceCore.ts is missing");
    return;
  }
  const entry = readFileSync(entryPath, "utf8");
  if (!entry.includes("useAppSurfaceCore")) {
    fail("PWA: useAppSurface.ts must compose useAppSurfaceCore");
  }
  const src = readFileSync(corePath, "utf8");
  if (!src.includes("display-mode: standalone")) {
    fail("PWA: useAppSurfaceCore must use (display-mode: standalone) matchMedia");
  }
  if (!src.includes("standalone") || !src.includes("navigator")) {
    fail("PWA: useAppSurfaceCore must detect iOS navigator.standalone");
  }
}

function checkNoAdHocViewportWidth() {
  try {
    const out = execSync('git grep -n "window.innerWidth" -- src', {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    if (out) {
      fail(
        `PWA: do not use window.innerWidth in src (use useAppSurface / matchMedia).\n${out}`,
      );
    }
  } catch (e) {
    const code = /** @type {NodeJS.ErrnoException & { status?: number }} */ (e)?.status;
    if (code !== 1) throw e;
  }
}

function checkRootViewport() {
  const layoutPath = join(ROOT, "src/app/layout.tsx");
  if (!existsSync(layoutPath)) return;
  const src = readFileSync(layoutPath, "utf8");
  if (!src.includes("viewportFit")) {
    fail("PWA: src/app/layout.tsx must set viewport.viewportFit (e.g. cover) for safe areas");
  }
}

function stagedSrcFiles() {
  try {
    return sh("git diff --cached --name-only --diff-filter=ACM")
      .split("\n")
      .filter((f) => f.startsWith("src/") && /\.(tsx?)$/.test(f));
  } catch {
    return [];
  }
}

function checkStagedFileSizes() {
  for (const file of stagedSrcFiles()) {
    if (file.includes("__tests__/") || file.endsWith(".test.ts") || file.endsWith(".test.tsx")) {
      continue;
    }
    const abs = join(ROOT, file);
    if (!existsSync(abs)) continue;
    const lines = readFileSync(abs, "utf8").split("\n").length;
    if (lines > MAX_SOURCE_LINES) {
      fail(
        `Architecture: ${file} has ${lines} lines (limit ${MAX_SOURCE_LINES}). Split into smaller modules.`,
      );
    }
  }
}

function gitLsFilesSrc() {
  try {
    return sh("git ls-files src").split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

function checkTierAStudentParentSurface() {
  const pages = findTierAStudentParentPages(gitLsFilesSrc());
  for (const rel of pages) {
    const abs = join(ROOT, rel);
    if (!existsSync(abs)) continue;
    if (!reachesSurfaceMountGate(ROOT, abs)) {
      fail(
        `Tier A (student/parent): ${rel} must import (directly or transitively) a module that uses SurfaceMountGate. Add a client *Entry with SurfaceMountGate + narrow branch. See .cursor/rules/05-pwa-mobile-native.mdc.`,
      );
    }
  }
}

checkBrandLiterals();
checkDictionaryParity();
checkPwaSurfaceHook();
checkNoAdHocViewportWidth();
checkRootViewport();
checkStagedFileSizes();
checkTierAStudentParentSurface();

if (errors.length) {
  for (const msg of errors) {
    console.error(`\x1b[31m✖\x1b[0m ${msg}`);
  }
  process.exit(1);
}
