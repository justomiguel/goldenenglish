/**
 * Helpers para `migrate-public-assets.mjs` (sin dependencia de Next).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");

export const BUCKET = "landing-media";

export const SECTION_LAYOUT = [
  { section: "inicio", files: ["1.png", "2.png", "3.png"] },
  { section: "historia", files: ["1.png", "2.png"] },
  {
    section: "modalidades",
    /** Keep length aligned with `LANDING_MEDIA_SLOTS_BY_SECTION.modalidades` in `landingContentCatalog.ts`. */
    files: Array.from({ length: 12 }, (_, i) => `${i + 1}.png`),
  },
];

export const CERT_MARKERS = [
  { slot: 1, needle: "1.31.36" },
  { slot: 2, needle: "1.31.42" },
  { slot: 3, needle: "1.31.48" },
];

/**
 * Parses a dotenv-style file into a plain object (no `process.env` mutation).
 * Same rules as `loadEnvLocal` for quotes and `#` comments.
 * @param {string} filePath
 * @returns {Record<string, string>}
 */
export function readEnvFile(filePath) {
  /** @type {Record<string, string>} */
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

export function loadEnvLocal() {
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) return;
  const parsed = readEnvFile(p);
  for (const [key, val] of Object.entries(parsed)) {
    if (!process.env[key]) process.env[key] = val;
  }
}

export function mimeFor(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".ico")) return "image/x-icon";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

export function walkImages(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    if (name === ".gitkeep") continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walkImages(full, acc);
    else if (st.isFile()) acc.push(full);
  }
  return acc;
}

export function positionFromName(filename) {
  const m = /^([0-9]+)/u.exec(filename);
  if (!m) return null;
  const n = Number.parseInt(m[1], 10);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

/** Escanea `public/images` y `public/favicon_io`; lista uploads locales. */
export function collectMigrationUploads(imagesRoot, faviconRoot, certDir) {
  /** @type {{ local: string, storageKey: string, contentType: string, slot?: number, certDestName?: string }[]} */
  const uploads = [];

  const logoLocal = path.join(imagesRoot, "logo.png");
  if (fs.existsSync(logoLocal)) {
    uploads.push({ local: logoLocal, storageKey: "", contentType: "image/png" });
  }

  for (const { section, files } of SECTION_LAYOUT) {
    for (const f of files) {
      const local = path.join(imagesRoot, "golden", section, f);
      if (fs.existsSync(local))
        uploads.push({ local, storageKey: "", contentType: mimeFor(local) });
    }
  }

  if (fs.existsSync(certDir)) {
    const names = fs.readdirSync(certDir).filter((n) => /\.png$/iu.test(n));
    for (const { slot, needle } of CERT_MARKERS) {
      const match = names.find((n) => n.includes(needle));
      if (!match) {
        console.warn(
          `[migrate-public-assets] Cert slot ${slot} (“${needle}”): PNG no encontrado, omitido.`,
        );
        continue;
      }
      uploads.push({
        local: path.join(certDir, match),
        storageKey: "",
        slot,
        certDestName: `${slot}.png`,
        contentType: "image/png",
      });
    }
  }

  if (fs.existsSync(faviconRoot)) {
    for (const name of fs.readdirSync(faviconRoot)) {
      if (name === ".gitkeep") continue;
      if (name.endsWith(".webmanifest")) continue;
      const full = path.join(faviconRoot, name);
      if (!fs.statSync(full).isFile()) continue;
      uploads.push({ local: full, storageKey: "", contentType: mimeFor(full) });
    }
  }

  return uploads;
}

export function assignStorageKeys(uploads, themeId) {
  for (const u of uploads) {
    const relFromPublic = path.relative(path.join(ROOT, "public"), u.local);
    let keyPath = relFromPublic.split(path.sep).join("/");
    if (u.certDestName != null && u.slot != null) {
      keyPath = `images/golden/certificaciones/${u.certDestName}`;
    }
    u.storageKey = `${themeId}/migration/${keyPath}`;
  }
}

export function buildMediaRows(themeId, uploads) {
  /** @type {{ theme_id: string, section: string, position: number, storage_path: string }[]} */
  const mediaRows = [];

  for (const { section, files } of SECTION_LAYOUT) {
    for (const f of files) {
      const pos = positionFromName(f);
      if (pos == null) continue;
      mediaRows.push({
        theme_id: themeId,
        section,
        position: pos,
        storage_path: `${themeId}/migration/images/golden/${section}/${f}`,
      });
    }
  }

  for (const { slot } of CERT_MARKERS) {
    if (!uploads.some((u) => u.slot === slot)) continue;
    mediaRows.push({
      theme_id: themeId,
      section: "certificaciones",
      position: slot,
      storage_path: `${themeId}/migration/images/golden/certificaciones/${slot}.png`,
    });
  }

  return mediaRows;
}
