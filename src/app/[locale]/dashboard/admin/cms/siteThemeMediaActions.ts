"use server";

import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logSupabaseError } from "@/lib/logging/serverActionLog";
import { buildLandingMediaStoragePath } from "@/lib/cms/landingMediaStoragePath";
import {
  LANDING_MEDIA_BUCKET,
} from "@/lib/cms/landingMediaPublicUrl";
import {
  LANDING_MEDIA_MAX_BYTES,
  deleteSiteThemeMediaInputSchema,
  isAcceptedLandingMediaMime,
  uploadSiteThemeMediaInputSchema,
  type LandingMediaAcceptedMime,
} from "@/lib/cms/siteThemeLandingInputSchemas";
import {
  fetchSiteThemeById,
  resolveAdminContext,
  revalidateSiteThemeSurfaces,
  type SiteThemeActionResult,
} from "./siteThemeActionShared";

/**
 * Server actions managing landing image overrides for a template.
 *
 * `uploadSiteThemeMediaAction`:
 *  - Decodes the base64 payload from the editor.
 *  - Validates MIME and size (4 MB) before touching storage so we never
 *    pay an upload cost for invalid files.
 *  - Writes to `landing-media/<theme>/<section>/<position>-<stamp>.<ext>`,
 *    inserts (or upserts) the matching `site_theme_media` row, and finally
 *    deletes the previous storage object for the slot to keep the bucket
 *    tidy.
 *
 * `deleteSiteThemeMediaAction`:
 *  - Removes the row + the storage object so the slot reverts to the
 *    bundled `/images/sections/...` fallback used by the landing.
 */

const MEDIA_ALLOWED_MIME_CODE = "media_mime_invalid" as const;
const MEDIA_TOO_LARGE_CODE = "media_too_large" as const;
const MEDIA_PAYLOAD_INVALID_CODE = "media_payload_invalid" as const;

export type SiteThemeMediaActionExtraCode =
  | typeof MEDIA_ALLOWED_MIME_CODE
  | typeof MEDIA_TOO_LARGE_CODE
  | typeof MEDIA_PAYLOAD_INVALID_CODE;

function decodeBase64(payload: string): Uint8Array | null {
  try {
    const buf = Buffer.from(payload, "base64");
    if (buf.length === 0) return null;
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

export async function uploadSiteThemeMediaAction(
  raw: unknown,
): Promise<SiteThemeActionResult | { ok: false; code: SiteThemeMediaActionExtraCode }> {
  const ctx = await resolveAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };

  const parsed = uploadSiteThemeMediaInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  if (!isAcceptedLandingMediaMime(parsed.data.contentType)) {
    return { ok: false, code: MEDIA_ALLOWED_MIME_CODE };
  }
  const mime = parsed.data.contentType as LandingMediaAcceptedMime;

  const bytes = decodeBase64(parsed.data.fileBase64);
  if (!bytes) return { ok: false, code: MEDIA_PAYLOAD_INVALID_CODE };
  if (bytes.byteLength > LANDING_MEDIA_MAX_BYTES) {
    return { ok: false, code: MEDIA_TOO_LARGE_CODE };
  }

  const { admin } = ctx;
  const existing = await fetchSiteThemeById(admin.supabase, parsed.data.id);
  if (!existing) return { ok: false, code: "not_found" };

  const { data: existingRow, error: existingErr } = await admin.supabase
    .from("site_theme_media")
    .select("id, storage_path")
    .eq("theme_id", parsed.data.id)
    .eq("section", parsed.data.section)
    .eq("position", parsed.data.position)
    .maybeSingle();
  if (existingErr) logSupabaseError("siteThemeActions:mediaLookup", existingErr);

  const storagePath = buildLandingMediaStoragePath({
    themeId: parsed.data.id,
    section: parsed.data.section,
    position: parsed.data.position,
    mime,
  });

  const { error: uploadErr } = await admin.supabase.storage
    .from(LANDING_MEDIA_BUCKET)
    .upload(storagePath, bytes, { contentType: mime, upsert: false });
  if (uploadErr) {
    logSupabaseError("siteThemeActions:mediaUpload", uploadErr);
    return { ok: false, code: "persist_failed" };
  }

  const upsertPayload = {
    theme_id: parsed.data.id,
    section: parsed.data.section,
    position: parsed.data.position,
    storage_path: storagePath,
    alt_es: parsed.data.altEs ?? null,
    alt_en: parsed.data.altEn ?? null,
  };

  const { error: dbErr } = await admin.supabase
    .from("site_theme_media")
    .upsert(upsertPayload, { onConflict: "theme_id,section,position" });
  if (dbErr) {
    logSupabaseError("siteThemeActions:mediaUpsert", dbErr);
    await admin.supabase.storage
      .from(LANDING_MEDIA_BUCKET)
      .remove([storagePath]);
    return { ok: false, code: "persist_failed" };
  }

  if (existingRow?.storage_path && existingRow.storage_path !== storagePath) {
    await admin.supabase.storage
      .from(LANDING_MEDIA_BUCKET)
      .remove([existingRow.storage_path]);
  }

  void recordSystemAudit({
    action: "site_theme_media_uploaded",
    resourceType: "site_theme",
    resourceId: parsed.data.id,
    payload: {
      section: parsed.data.section,
      position: parsed.data.position,
      bytes: bytes.byteLength,
      mime,
    },
  });

  revalidateSiteThemeSurfaces(parsed.data.locale);
  return { ok: true, id: parsed.data.id };
}

export async function deleteSiteThemeMediaAction(
  raw: unknown,
): Promise<SiteThemeActionResult> {
  const ctx = await resolveAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };

  const parsed = deleteSiteThemeMediaInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const { admin } = ctx;
  const { data: row, error: lookupErr } = await admin.supabase
    .from("site_theme_media")
    .select("id, storage_path, theme_id, section, position")
    .eq("id", parsed.data.mediaId)
    .eq("theme_id", parsed.data.id)
    .maybeSingle();
  if (lookupErr) {
    logSupabaseError("siteThemeActions:mediaDeleteLookup", lookupErr);
    return { ok: false, code: "persist_failed" };
  }
  if (!row) return { ok: false, code: "not_found" };

  const { error: dbErr } = await admin.supabase
    .from("site_theme_media")
    .delete()
    .eq("id", row.id);
  if (dbErr) {
    logSupabaseError("siteThemeActions:mediaDelete", dbErr);
    return { ok: false, code: "persist_failed" };
  }

  if (row.storage_path) {
    await admin.supabase.storage
      .from(LANDING_MEDIA_BUCKET)
      .remove([row.storage_path]);
  }

  void recordSystemAudit({
    action: "site_theme_media_deleted",
    resourceType: "site_theme",
    resourceId: parsed.data.id,
    payload: {
      section: row.section,
      position: row.position,
    },
  });

  revalidateSiteThemeSurfaces(parsed.data.locale);
  return { ok: true, id: parsed.data.id };
}
