import "server-only";

import { logSupabaseError } from "@/lib/logging/serverActionLog";
import { decodeProfilePhoto, parseProfileDisplayName, parseProfilePhone } from "@/lib/pulsar/platformUserProfile";
import { createPulsarAdminClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";

const BUCKET = "platform-avatars";

export type PlatformUserProfile = {
  displayName: string;
  avatarUrl: string | null;
  phone: string;
};

export async function loadPlatformUserProfile(userId: string): Promise<PlatformUserProfile> {
  if (!isPulsarSupabaseConfigured()) return { displayName: "", avatarUrl: null, phone: "" };
  const admin = createPulsarAdminClient();
  const { data, error } = await admin
    .from("platform_user_profiles")
    .select("display_name, avatar_url, phone")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    logSupabaseError("loadPlatformUserProfile", error, { userId });
    return { displayName: "", avatarUrl: null, phone: "" };
  }
  return {
    displayName: typeof data?.display_name === "string" ? data.display_name : "",
    avatarUrl: typeof data?.avatar_url === "string" ? data.avatar_url : null,
    phone: typeof data?.phone === "string" ? data.phone : "",
  };
}

export async function savePlatformUserProfile(input: {
  userId: string;
  displayName: string;
  phone: string;
  photoBase64?: string;
  photoMime?: string;
}): Promise<{ ok: true; avatarUrl: string | null } | { ok: false; errorCode: "invalid_name" | "invalid_phone" | "invalid_photo" | "save_failed" }> {
  const name = parseProfileDisplayName(input.displayName);
  if (!name.ok) return { ok: false, errorCode: "invalid_name" };
  const phone = parseProfilePhone(input.phone);
  if (!phone.ok) return { ok: false, errorCode: "invalid_phone" };
  if (!isPulsarSupabaseConfigured()) return { ok: false, errorCode: "save_failed" };

  let avatarUrl: string | undefined;
  if (input.photoBase64 && input.photoMime) {
    const photo = decodeProfilePhoto(input.photoBase64, input.photoMime);
    if (!photo.ok) return { ok: false, errorCode: "invalid_photo" };
    const ext = photo.mime === "image/png" ? "png" : photo.mime === "image/webp" ? "webp" : "jpg";
    const path = `${input.userId}/avatar.${ext}`;
    const admin = createPulsarAdminClient();
    const uploaded = await admin.storage.from(BUCKET).upload(path, photo.bytes, {
      upsert: true,
      contentType: photo.mime,
    });
    if (uploaded.error) {
      logSupabaseError("savePlatformUserProfile:photo", uploaded.error, { userId: input.userId });
      return { ok: false, errorCode: "save_failed" };
    }
    const publicUrl = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    avatarUrl = `${publicUrl}?v=${Date.now()}`;
  }

  const admin = createPulsarAdminClient();
  const row: { user_id: string; display_name: string; phone: string; updated_at: string; avatar_url?: string } = {
    user_id: input.userId,
    display_name: name.name,
    phone: phone.phone,
    updated_at: new Date().toISOString(),
  };
  if (avatarUrl) row.avatar_url = avatarUrl;
  const { error } = await admin.from("platform_user_profiles").upsert(row);
  if (error) {
    logSupabaseError("savePlatformUserProfile", error, { userId: input.userId });
    return { ok: false, errorCode: "save_failed" };
  }
  return { ok: true, avatarUrl: avatarUrl ?? null };
}
