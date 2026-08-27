"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import { revalidatePath } from "next/cache";
import {
  clearSectionReferenceImage,
  decodeSectionImageBase64,
  persistSectionReferenceImage,
} from "@/lib/register/persistSectionReferenceImage";
import { logServerActionException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

const uuid = z.string().uuid();

type ImageActionResult = { ok: true } | { ok: false };

async function revalidateSection(locale: string, cohortId: string, sectionId: string) {
  revalidateAcademicSurfaces(locale);
  revalidatePath(`/${locale}/dashboard/admin/academic/${cohortId}`, "page");
  revalidatePath(`/${locale}/dashboard/admin/academic/${cohortId}/${sectionId}`, "page");
}

async function loadSectionImageState(sectionId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("academic_sections")
    .select("id, cohort_id, reference_image_path")
    .eq("id", sectionId)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("sectionReferenceImage:select", error, { sectionId });
    return null;
  }
  const row = data as {
    id?: string;
    cohort_id?: string;
    reference_image_path?: string | null;
  } | null;
  if (!row?.id || !row.cohort_id) return null;
  return {
    admin,
    sectionId: row.id,
    cohortId: row.cohort_id,
    previousPath: row.reference_image_path ?? null,
  };
}

export async function uploadSectionReferenceImageAction(input: {
  locale: string;
  sectionId: string;
  imageBase64: string;
  imageMime: string;
}): Promise<ImageActionResult> {
  const sectionId = uuid.safeParse(input.sectionId.trim());
  const bytes = decodeSectionImageBase64(input.imageBase64);
  if (!sectionId.success || !bytes) return { ok: false };

  try {
    await assertAdmin();
    const state = await loadSectionImageState(sectionId.data);
    if (!state) return { ok: false };
    const persisted = await persistSectionReferenceImage({
      admin: state.admin as never,
      sectionId: state.sectionId,
      bytes,
      mime: input.imageMime.trim(),
      previousPath: state.previousPath,
    });
    if (!persisted.ok) return { ok: false };
    await revalidateSection(input.locale, state.cohortId, state.sectionId);
    return { ok: true };
  } catch (err) {
    logServerActionException("uploadSectionReferenceImageAction", err, {
      sectionId: input.sectionId.trim(),
    });
    return { ok: false };
  }
}

export async function removeSectionReferenceImageAction(input: {
  locale: string;
  sectionId: string;
}): Promise<ImageActionResult> {
  const sectionId = uuid.safeParse(input.sectionId.trim());
  if (!sectionId.success) return { ok: false };

  try {
    await assertAdmin();
    const state = await loadSectionImageState(sectionId.data);
    if (!state) return { ok: false };
    const cleared = await clearSectionReferenceImage({
      admin: state.admin as never,
      sectionId: state.sectionId,
      previousPath: state.previousPath,
    });
    if (!cleared.ok) return { ok: false };
    await revalidateSection(input.locale, state.cohortId, state.sectionId);
    return { ok: true };
  } catch (err) {
    logServerActionException("removeSectionReferenceImageAction", err, {
      sectionId: input.sectionId.trim(),
    });
    return { ok: false };
  }
}
