"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { getDictionary, defaultLocale, locales, type AppLocale } from "@/lib/i18n/dictionaries";
import { logServerActionException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { PROFILE_AVATAR_MAX_BYTES } from "@/lib/profile/avatarUploadLimits";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedMime = new Set(["image/jpeg", "image/png", "image/webp"]);
const schema = z.object({
  locale: z.string().min(2).max(8),
  targetUserId: z.string().uuid(),
});

type AdminAvatarResult = { ok: true; message: string } | { ok: false; message: string };

function extFromMime(mime: string): string | null {
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return null;
}

function parseLocale(raw: unknown): AppLocale {
  const locale = String(raw ?? "");
  return locales.includes(locale as AppLocale) ? (locale as AppLocale) : defaultLocale;
}

export async function uploadAdminStudentAvatarAction(formData: FormData): Promise<AdminAvatarResult> {
  const locale = parseLocale(formData.get("locale"));
  const dict = await getDictionary(locale);
  try {
    const parsed = schema.safeParse({
      locale,
      targetUserId: formData.get("targetUserId"),
    });
    if (!parsed.success) return { ok: false, message: dict.admin.users.detailAvatarErrInvalid };

    const file = formData.get("avatar");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, message: dict.admin.users.detailAvatarErrNoFile };
    }
    if (file.size > PROFILE_AVATAR_MAX_BYTES) {
      return { ok: false, message: dict.admin.users.detailAvatarErrTooBig };
    }

    const mime = (file.type || "").toLowerCase();
    const ext = extFromMime(mime);
    if (!allowedMime.has(mime) || !ext) {
      return { ok: false, message: dict.admin.users.detailAvatarErrInvalidType };
    }

    await assertAdmin();
    const admin = createAdminClient();
    const { targetUserId } = parsed.data;
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role, avatar_url")
      .eq("id", targetUserId)
      .maybeSingle();
    if (profileError || !profile) {
      if (profileError) logSupabaseClientError("uploadAdminStudentAvatarAction:profile", profileError, { targetUserId });
      return { ok: false, message: dict.admin.users.detailAvatarErrInvalid };
    }
    if (profile.role !== "student") {
      return { ok: false, message: dict.admin.users.detailAvatarErrNotStudent };
    }

    const oldPath = String(profile.avatar_url ?? "").trim();
    if (oldPath && oldPath.startsWith(`${targetUserId}/`) && !oldPath.includes("..")) {
      await admin.storage.from("avatars").remove([oldPath.replace(/^\/+/, "")]);
    }

    const objectPath = `${targetUserId}/${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await admin.storage
      .from("avatars")
      .upload(objectPath, buffer, { contentType: mime, upsert: false });
    if (uploadError) {
      logSupabaseClientError("uploadAdminStudentAvatarAction:upload", uploadError, { targetUserId });
      return { ok: false, message: dict.admin.users.detailAvatarErrSave };
    }

    const { error: updateError } = await admin
      .from("profiles")
      .update({ avatar_url: objectPath })
      .eq("id", targetUserId);
    if (updateError) {
      await admin.storage.from("avatars").remove([objectPath]);
      logSupabaseClientError("uploadAdminStudentAvatarAction:update", updateError, { targetUserId });
      return { ok: false, message: dict.admin.users.detailAvatarErrSave };
    }

    void recordSystemAudit({
      action: "admin_student_avatar_update",
      resourceType: "profiles",
      resourceId: targetUserId,
      payload: { contentType: mime, size: file.size },
    });
    revalidatePath(`/${locale}/dashboard/admin/users/${targetUserId}`);
    revalidatePath(`/${locale}/dashboard/admin/users`);
    return { ok: true, message: dict.admin.users.detailAvatarSuccess };
  } catch (error) {
    logServerActionException("uploadAdminStudentAvatarAction", error);
    const fallback = await getDictionary(defaultLocale);
    return { ok: false, message: fallback.admin.users.detailAvatarErrSave };
  }
}
