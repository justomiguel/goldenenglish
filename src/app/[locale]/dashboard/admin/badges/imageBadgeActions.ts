"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { adminActionDict } from "@/lib/i18n/actionErrors";
import { defaultLocale } from "@/lib/i18n/dictionaries";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { auditAcademicAction } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ALLOWED_BADGE_IMAGE_MIME,
  MAX_BADGE_IMAGE_BYTES,
  localeForBadgeRevalidate,
  revalidateAdminAndPublicBadges,
  type BadgeActionResult,
} from "@/app/[locale]/dashboard/admin/badges/actionShared";

export async function uploadBadgeImageAction(formData: FormData): Promise<BadgeActionResult> {
  const localeRaw = String(formData.get("locale") ?? defaultLocale);
  const ae = await adminActionDict(localeForBadgeRevalidate(localeRaw));
  const badgeId = String(formData.get("badgeId") ?? "");
  const file = formData.get("file");
  if (!z.string().uuid().safeParse(badgeId).success) return { ok: false, message: ae.invalidId };
  if (!(file instanceof File)) return { ok: false, message: ae.invalidData };
  if (
    !ALLOWED_BADGE_IMAGE_MIME.has(file.type) ||
    file.size > MAX_BADGE_IMAGE_BYTES ||
    file.size === 0
  ) {
    return { ok: false, message: ae.invalidData };
  }
  try {
    const { user } = await assertAdmin();
    const admin = createAdminClient();
    const ext = file.type === "image/svg+xml" ? "svg" : file.type.split("/")[1] || "png";
    const path = `${badgeId}/${Date.now()}.${ext}`;
    const arrayBuf = await file.arrayBuffer();
    const upload = await admin.storage
      .from("badge-images")
      .upload(path, new Uint8Array(arrayBuf), {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });
    if (upload.error) {
      logServerException("uploadBadgeImageAction:storage", upload.error, { badgeId });
      return { ok: false, message: ae.saveFailed };
    }
    const { data: before } = await admin
      .from("badge_catalog")
      .select("id, code, image_path")
      .eq("id", badgeId)
      .maybeSingle();
    const { error: updateErr } = await admin
      .from("badge_catalog")
      .update({ image_path: path, updated_by: user.id })
      .eq("id", badgeId);
    if (updateErr) {
      logSupabaseClientError("uploadBadgeImageAction:update", updateErr, { badgeId });
      await admin.storage.from("badge-images").remove([path]);
      return { ok: false, message: ae.saveFailed };
    }
    if (before?.image_path && before.image_path !== path) {
      await admin.storage.from("badge-images").remove([String(before.image_path)]);
    }
    void auditAcademicAction({
      actorId: user.id,
      actorRole: "admin",
      action: "update",
      resourceType: "badge_catalog",
      resourceId: badgeId,
      summary: `Admin replaced image for student badge ${before?.code ?? badgeId}`,
      beforeValues: { image_path: (before?.image_path as string | null) ?? null },
      afterValues: { image_path: path },
    });
    revalidateAdminAndPublicBadges(localeForBadgeRevalidate(localeRaw));
    return { ok: true, badgeId };
  } catch (err) {
    logServerException("uploadBadgeImageAction", err);
    return { ok: false, message: ae.forbidden };
  }
}

export async function clearBadgeImageAction(raw: {
  locale: string;
  badgeId: string;
}): Promise<BadgeActionResult> {
  const ae = await adminActionDict(localeForBadgeRevalidate(raw?.locale ?? defaultLocale));
  if (!z.string().uuid().safeParse(raw.badgeId).success) {
    return { ok: false, message: ae.invalidId };
  }
  try {
    const { user } = await assertAdmin();
    const admin = createAdminClient();
    const { data: before } = await admin
      .from("badge_catalog")
      .select("id, code, image_path")
      .eq("id", raw.badgeId)
      .maybeSingle();
    const { error } = await admin
      .from("badge_catalog")
      .update({ image_path: null, updated_by: user.id })
      .eq("id", raw.badgeId);
    if (error) {
      logSupabaseClientError("clearBadgeImageAction", error, { badgeId: raw.badgeId });
      return { ok: false, message: ae.saveFailed };
    }
    if (before?.image_path) {
      await admin.storage.from("badge-images").remove([String(before.image_path)]);
    }
    void auditAcademicAction({
      actorId: user.id,
      actorRole: "admin",
      action: "update",
      resourceType: "badge_catalog",
      resourceId: raw.badgeId,
      summary: `Admin cleared image for student badge ${before?.code ?? raw.badgeId}`,
      beforeValues: { image_path: (before?.image_path as string | null) ?? null },
      afterValues: { image_path: null },
    });
    revalidateAdminAndPublicBadges(localeForBadgeRevalidate(raw.locale));
    return { ok: true, badgeId: raw.badgeId };
  } catch (err) {
    logServerException("clearBadgeImageAction", err);
    return { ok: false, message: ae.forbidden };
  }
}
