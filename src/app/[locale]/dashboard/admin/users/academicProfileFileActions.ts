"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { EVENT_FORM_FIELD_DEFAULT_MAX_BYTES } from "@/lib/events/validateEventFormFieldFile";
import { logServerAuthzDenied, logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { ACADEMIC_PROFILE_FILES_BUCKET } from "@/lib/academic-profile/academicProfileCard";
import {
  openAcademicProfileStaffSession,
  staffMayWriteAcademicValue,
} from "@/lib/academic-profile/academicProfileStaffSession";

const prepareSchema = z.object({
  studentId: z.string().uuid(),
  fieldId: z.string().uuid(),
  sectionId: z.string().uuid().optional(),
  fileName: z.string().min(1).max(180),
  byteSize: z.number().int().positive(),
});

export async function prepareAcademicProfileFileUploadAction(
  input: z.input<typeof prepareSchema>,
): Promise<
  | { ok: true; path: string; token: string }
  | { ok: false; error: "forbidden" | "invalid" | "too_large" | "failed" }
> {
  const parsed = prepareSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (parsed.data.byteSize > EVENT_FORM_FIELD_DEFAULT_MAX_BYTES) return { ok: false, error: "too_large" };

  try {
    const session = await openAcademicProfileStaffSession();
    if (!session) return { ok: false, error: "forbidden" };
    const allowed = await staffMayWriteAcademicValue(session, parsed.data);
    if (!allowed) {
      logServerAuthzDenied("prepareAcademicProfileFileUploadAction", { fieldId: parsed.data.fieldId });
      return { ok: false, error: "forbidden" };
    }
    const path = academicProfileStoragePath(parsed.data.studentId, parsed.data.fieldId, parsed.data.fileName);
    const admin = await createAdminClient();
    const { data, error } = await admin.storage.from(ACADEMIC_PROFILE_FILES_BUCKET).createSignedUploadUrl(path);
    if (error || !data?.token) {
      if (error) logSupabaseClientError("prepareAcademicProfileFileUploadAction", error, { fieldId: parsed.data.fieldId });
      return { ok: false, error: "failed" };
    }
    return { ok: true, path, token: data.token };
  } catch (error) {
    logServerException("prepareAcademicProfileFileUploadAction", error);
    return { ok: false, error: "failed" };
  }
}

function academicProfileStoragePath(studentId: string, fieldId: string, fileName: string): string {
  const base = fileName.split(/[/\\]/).pop() ?? "file";
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "file";
  return `${studentId}/${fieldId}/${safe}`;
}
