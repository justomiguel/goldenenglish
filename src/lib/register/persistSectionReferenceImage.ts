import {
  isAllowedSectionImageUpload,
  SECTION_IMAGES_BUCKET,
  sectionReferenceImageExt,
} from "@/lib/register/sectionReferenceImage";

export function decodeSectionImageBase64(base64: string): Uint8Array | null {
  const trimmed = base64.trim();
  if (!trimmed) return null;
  try {
    const buf = Buffer.from(trimmed, "base64");
    if (buf.length === 0) return null;
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

export interface SectionReferenceImageAdmin {
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        body: Uint8Array,
        opts: { cacheControl: string; contentType: string; upsert: boolean },
      ) => Promise<{ error: { message?: string } | null }>;
      remove: (paths: string[]) => Promise<{ error: { message?: string } | null }>;
    };
  };
  from: (table: string) => {
    update: (values: { reference_image_path: string | null }) => {
      eq: (
        col: string,
        id: string,
      ) => Promise<{ error: { message?: string } | null }>;
    };
  };
}

export async function persistSectionReferenceImage(input: {
  admin: SectionReferenceImageAdmin;
  sectionId: string;
  bytes: Uint8Array;
  mime: string;
  previousPath?: string | null;
}): Promise<{ ok: true; path: string } | { ok: false }> {
  if (!isAllowedSectionImageUpload(input.mime, input.bytes.byteLength)) {
    return { ok: false };
  }
  const ext = sectionReferenceImageExt(input.mime);
  if (!ext) return { ok: false };

  const path = `${input.sectionId}/${Date.now()}.${ext}`;
  const upload = await input.admin.storage.from(SECTION_IMAGES_BUCKET).upload(path, input.bytes, {
    cacheControl: "3600",
    contentType: input.mime,
    upsert: false,
  });
  if (upload.error) return { ok: false };

  const update = await input.admin
    .from("academic_sections")
    .update({ reference_image_path: path })
    .eq("id", input.sectionId);
  if (update.error) {
    await input.admin.storage.from(SECTION_IMAGES_BUCKET).remove([path]);
    return { ok: false };
  }

  const prev = input.previousPath?.trim();
  if (prev && prev !== path) {
    await input.admin.storage.from(SECTION_IMAGES_BUCKET).remove([prev]);
  }
  return { ok: true, path };
}

export async function clearSectionReferenceImage(input: {
  admin: SectionReferenceImageAdmin;
  sectionId: string;
  previousPath?: string | null;
}): Promise<{ ok: boolean }> {
  const update = await input.admin
    .from("academic_sections")
    .update({ reference_image_path: null })
    .eq("id", input.sectionId);
  if (update.error) return { ok: false };
  const prev = input.previousPath?.trim();
  if (prev) {
    await input.admin.storage.from(SECTION_IMAGES_BUCKET).remove([prev]);
  }
  return { ok: true };
}
