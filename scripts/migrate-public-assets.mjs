#!/usr/bin/env node
/**
 * Migra `public/images/**` y `public/favicon_io/**` → `landing-media`,
 * actualiza `site_themes` + `site_theme_media`. No toca `public/geo/`.
 * Ver `README-public-assets-migration.md`.
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import {
  BUCKET,
  ROOT,
  assignStorageKeys,
  buildMediaRows,
  collectMigrationUploads,
  loadEnvLocal,
  walkImages,
} from "./migrate-public-assets-lib.mjs";

async function main() {
  const argv = new Set(process.argv.slice(2));
  const dryRun = argv.has("--dry-run");
  const deletePublic = argv.has("--delete-public");
  const writeSystemProps = argv.has("--write-system-properties");

  loadEnvLocal();

  const url =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

  const imagesRoot = path.join(ROOT, "public", "images");
  const faviconRoot = path.join(ROOT, "public", "favicon_io");
  const certDir = path.join(imagesRoot, "sections", "certificaciones");

  const uploads = collectMigrationUploads(imagesRoot, faviconRoot, certDir);

  if (uploads.length === 0) {
    console.error("[migrate-public-assets] No hay ficheros que migrar.");
    process.exit(1);
  }

  if (dryRun && (!url || !serviceKey)) {
    console.log("[migrate-public-assets] DRY RUN (sin credenciales), ficheros:");
    for (const u of uploads) console.log(" ", u.local);
    process.exit(0);
  }

  if (!dryRun && (!url || !serviceKey)) {
    console.error(
      "[migrate-public-assets] Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: themeRow, error: themeErr } = await supabase
    .from("site_themes")
    .select("id, slug, properties")
    .eq("is_active", true)
    .is("archived_at", null)
    .maybeSingle();

  if (themeErr) {
    console.error("[migrate-public-assets] site_themes:", themeErr.message);
    process.exit(1);
  }
  if (!themeRow?.id) {
    console.error("[migrate-public-assets] No hay tema activo (is_active).");
    process.exit(1);
  }

  const themeId = String(themeRow.id);
  assignStorageKeys(uploads, themeId);

  console.log(`[migrate-public-assets] Tema activo: ${themeRow.slug} (${themeId})`);

  if (dryRun) {
    for (const u of uploads)
      console.log(`  [dry-run] PUT ${BUCKET}/${u.storageKey} <= ${u.local}`);
    console.log("[migrate-public-assets] Fin dry-run.");
    process.exit(0);
  }

  for (const u of uploads) {
    const buf = fs.readFileSync(u.local);
    const { error } = await supabase.storage.from(BUCKET).upload(u.storageKey, buf, {
      upsert: true,
      contentType: u.contentType,
    });
    if (error) {
      console.error(`[migrate-public-assets] Upload ${u.storageKey}:`, error.message);
      process.exit(1);
    }
    console.log(`  uploaded ${u.storageKey}`);
  }

  /** @type {Record<string, string>} */
  const props = {};
  if (
    themeRow.properties &&
    typeof themeRow.properties === "object" &&
    !Array.isArray(themeRow.properties)
  ) {
    for (const [k, v] of Object.entries(themeRow.properties)) {
      if (typeof v === "string") props[k] = v;
    }
  }

  props["app.logo.path"] = `${themeId}/migration/images/logo.png`;
  props["app.favicon.path"] = `${themeId}/migration/favicon_io/favicon.ico`;

  const { error: upThemeErr } = await supabase
    .from("site_themes")
    .update({
      properties: props,
      updated_at: new Date().toISOString(),
    })
    .eq("id", themeId);

  if (upThemeErr) {
    console.error("[migrate-public-assets] update site_themes:", upThemeErr.message);
    process.exit(1);
  }
  console.log("[migrate-public-assets] site_themes.properties (logo/favicon) OK.");

  const mediaRows = buildMediaRows(themeId, uploads);

  const { error: mediaErr } = await supabase.from("site_theme_media").upsert(
    mediaRows,
    { onConflict: "theme_id,section,position" },
  );

  if (mediaErr) {
    console.error("[migrate-public-assets] site_theme_media:", mediaErr.message);
    process.exit(1);
  }
  console.log(`[migrate-public-assets] site_theme_media: ${mediaRows.length} filas.`);

  if (writeSystemProps) {
    const sp = path.join(ROOT, "system.properties");
    let body = fs.readFileSync(sp, "utf8");
    body = body.replace(/^app\.logo\.path=.*$/m, `app.logo.path=${props["app.logo.path"]}`);
    body = body.replace(
      /^app\.favicon\.path=.*$/m,
      `app.favicon.path=${props["app.favicon.path"]}`,
    );
    fs.writeFileSync(sp, body);
    console.log("[migrate-public-assets] system.properties OK.");
  }

  if (deletePublic) {
    const toRemove = walkImages(imagesRoot).concat(
      fs.existsSync(faviconRoot)
        ? fs.readdirSync(faviconRoot).map((n) => path.join(faviconRoot, n))
        : [],
    );
    for (const file of toRemove) {
      if (!fs.statSync(file).isFile()) continue;
      if (file.endsWith(".gitkeep")) continue;
      fs.unlinkSync(file);
      console.log(`  deleted ${path.relative(ROOT, file)}`);
    }
    console.log("[migrate-public-assets] public/images y public/favicon_io limpiados.");
  }

  const pubBase = url.replace(/\/+$/u, "");
  console.log("\nEjemplo URL logo:");
  console.log(
    `${pubBase}/storage/v1/object/public/${BUCKET}/${themeId}/migration/images/logo.png`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
