"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AppLocale } from "@/lib/i18n/dictionaries";
import { locales } from "@/lib/i18n/dictionaries";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ProfileAvatarErrorKey =
  | "avatarError"
  | "avatarTooBig"
  | "avatarInvalidType"
  | "avatarForbidden"
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

export async function uploadProfileAvatar(
  formData: FormData,
): Promise<UploadProfileAvatarResult> {
  const locale = parseLocale(formData.get("locale"));
  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, errorKey: "avatarNoFile" };
  }
  if (file.size > MAX_BYTES) return { ok: false, errorKey: "avatarTooBig" };

  const mime = (file.type || "").toLowerCase();
  if (!ALLOWED.has(mime)) return { ok: false, errorKey: "avatarInvalidType" };

  const ext = extFromMime(mime);
  if (!ext) return { ok: false, errorKey: "avatarInvalidType" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, errorKey: "avatarForbidden" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, avatar_url")
    .eq("id", user.id)
    .single();

  const role = profile?.role as string | undefined;
  if (role !== "student" && role !== "parent") {
    return { ok: false, errorKey: "avatarForbidden" };
  }

  const oldPath = profile?.avatar_url?.trim();
  if (
    oldPath &&
    !oldPath.startsWith("http://") &&
    !oldPath.startsWith("https://") &&
    !oldPath.includes("..") &&
    oldPath.startsWith(`${user.id}/`)
  ) {
    await supabase.storage.from("avatars").remove([oldPath.replace(/^\/+/, "")]);
  }

  const objectPath = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(objectPath, buf, { contentType: mime, upsert: false });

  if (upErr) return { ok: false, errorKey: "avatarError" };

  const { error: dbErr } = await supabase
    .from("profiles")
    .update({ avatar_url: objectPath })
    .eq("id", user.id);

  if (dbErr) {
    await supabase.storage.from("avatars").remove([objectPath]);
    return { ok: false, errorKey: "avatarError" };
  }

  revalidatePath(`/${locale}/dashboard/student/profile`);
  revalidatePath(`/${locale}/dashboard/parent/profile`);

  return { ok: true };
}
