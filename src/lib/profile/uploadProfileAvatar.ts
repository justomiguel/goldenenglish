"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AppLocale } from "@/lib/i18n/dictionaries";
import { locales } from "@/lib/i18n/dictionaries";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { PROFILE_AVATAR_MAX_BYTES } from "@/lib/profile/avatarUploadLimits";
import { loadOrProvisionDashboardProfileRow } from "@/lib/profile/loadOrProvisionDashboardProfileRow";

const LOG = "[goldenenglish:avatar-upload]";
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ProfileAvatarErrorKey =
  | "avatarError"
  | "avatarTooBig"
  | "avatarInvalidType"
  | "avatarSessionMissing"
  | "avatarProfileMissing"
  | "avatarNoFile";

export type UploadProfileAvatarResult =
  | { ok: true }
  | { ok: false; errorKey: ProfileAvatarErrorKey };

function extFromMime(mime: string): string | null {
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return null;
}

function parseLocale(raw: unknown): AppLocale {
  const s = String(raw ?? "");
  return locales.includes(s as AppLocale) ? (s as AppLocale) : "es";
}

function fail(errorKey: ProfileAvatarErrorKey, details: Record<string, unknown>): UploadProfileAvatarResult {
  console.error(LOG, { errorKey, ...details });
  return { ok: false, errorKey };
}

export async function uploadProfileAvatar(
  formData: FormData,
): Promise<UploadProfileAvatarResult> {
  const locale = parseLocale(formData.get("locale"));
  const file = formData.get("avatar");

  console.info(LOG, {
    step: "start",
    hasFile: file instanceof File,
    fileSize: file instanceof File ? file.size : null,
    fileMime: file instanceof File ? file.type : null,
    fileName: file instanceof File ? file.name : null,
    locale,
  });

  if (!(file instanceof File) || file.size === 0) {
    return fail("avatarNoFile", { reason: "missing_or_empty_file" });
  }
  if (file.size > PROFILE_AVATAR_MAX_BYTES) {
    return fail("avatarTooBig", { size: file.size, max: PROFILE_AVATAR_MAX_BYTES });
  }

  const mime = (file.type || "").toLowerCase();
  if (!ALLOWED.has(mime)) {
    return fail("avatarInvalidType", { mime });
  }

  const ext = extFromMime(mime);
  if (!ext) return fail("avatarInvalidType", { mime, reason: "no_ext" });

  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  console.info(LOG, {
    step: "auth",
    hasUser: Boolean(user),
    userId: user?.id ?? null,
    authError: userErr ? { message: userErr.message, status: userErr.status } : null,
  });

  if (!user) {
    return fail("avatarSessionMissing", {
      authError: userErr ? { message: userErr.message, status: userErr.status } : null,
    });
  }

  const profile = await loadOrProvisionDashboardProfileRow(user);

  console.info(LOG, {
    step: "profile_load",
    hasProfile: Boolean(profile),
    role: profile?.role ?? null,
    hasAvatarUrl: Boolean(profile?.avatar_url),
  });

  if (!profile) {
    return fail("avatarProfileMissing", { userId: user.id });
  }

  const oldPath = profile.avatar_url?.trim();
  if (
    oldPath &&
    !oldPath.startsWith("http://") &&
    !oldPath.startsWith("https://") &&
    !oldPath.includes("..") &&
    oldPath.startsWith(`${user.id}/`)
  ) {
    const { error: rmErr } = await supabase.storage.from("avatars").remove([oldPath.replace(/^\/+/, "")]);
    console.info(LOG, { step: "remove_old", path: oldPath, error: rmErr ?? null });
  }

  const objectPath = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  console.info(LOG, {
    step: "upload_start",
    objectPath,
    bufSize: buf.byteLength,
    mime,
  });

  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(objectPath, buf, { contentType: mime, upsert: false });

  if (upErr) {
    return fail("avatarError", {
      phase: "storage_upload",
      message: upErr.message,
      name: (upErr as Error & { name?: string }).name ?? null,
      statusCode: (upErr as Error & { statusCode?: string | number }).statusCode ?? null,
      cause: (upErr as Error & { cause?: unknown }).cause ?? null,
    });
  }

  console.info(LOG, { step: "upload_ok", objectPath });

  const { error: dbErr } = await supabase
    .from("profiles")
    .update({ avatar_url: objectPath })
    .eq("id", user.id);

  if (dbErr) {
    console.error(LOG, {
      phase: "db_update",
      message: dbErr.message,
      code: dbErr.code,
      details: dbErr.details,
      hint: dbErr.hint,
    });
    await supabase.storage.from("avatars").remove([objectPath]);
    return fail("avatarError", {
      phase: "db_update",
      message: dbErr.message,
      code: dbErr.code,
    });
  }

  console.info(LOG, { step: "db_update_ok", objectPath, userId: user.id });

  revalidatePath(`/${locale}/dashboard/profile`);
  revalidatePath(`/${locale}/dashboard/student/profile`);
  revalidatePath(`/${locale}/dashboard/parent/profile`);
  revalidatePath(`/${locale}/dashboard`);

  await recordUserEventServer({
    userId: user.id,
    eventType: "action",
    entity: AnalyticsEntity.myProfile,
    metadata: { part: "avatar" },
  });

  console.info(LOG, { step: "done", objectPath });
  return { ok: true };
}
