"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logServerAuthzDenied, logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  ACADEMIC_PROFILE_FIELD_TYPES,
  academicProfileValueSlot,
} from "@/lib/academic-profile/academicProfileFieldRules";
import { auditAcademicProfileStaffAction } from "@/lib/academic-profile/auditAcademicProfileStaffAction";
import {
  openAcademicProfileStaffSession,
  staffMayWriteAcademicValue,
} from "@/lib/academic-profile/academicProfileStaffSession";
import type { SupabaseClient } from "@supabase/supabase-js";

const valueSchema = z.object({
  locale: z.string().min(2).max(12),
  studentId: z.string().uuid(),
  fieldId: z.string().uuid(),
  sectionId: z.string().uuid().optional(),
  valueText: z.string().nullable().optional(),
  valueNumber: z.number().finite().nullable().optional(),
  valueDate: z.string().nullable().optional(),
  storagePath: z.string().nullable().optional(),
});

type ValueInput = z.infer<typeof valueSchema>;

export async function saveAcademicProfileValueAction(
  input: z.input<typeof valueSchema>,
): Promise<{ ok: true } | { ok: false; error: "forbidden" | "invalid" | "required" | "failed" }> {
  const parsed = valueSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    const session = await openAcademicProfileStaffSession();
    if (!session) return { ok: false, error: "forbidden" };
    const field = await loadField(session.supabase, parsed.data.fieldId);
    if (!field) return { ok: false, error: "failed" };
    const allowed = await staffMayWriteAcademicValue(session, parsed.data);
    if (!allowed) {
      logServerAuthzDenied("saveAcademicProfileValueAction", { fieldId: parsed.data.fieldId });
      return { ok: false, error: "forbidden" };
    }
    const fieldType = ACADEMIC_PROFILE_FIELD_TYPES.find((type) => type === field.field_type);
    if (!fieldType) return { ok: false, error: "failed" };
    const slot = academicProfileValueSlot(fieldType);
    const stored = storedValue(slot, parsed.data);
    if (fieldType === "select" && stored.valueText) {
      const options = new Set(field.select_options ?? []);
      if (!options.has(stored.valueText)) {
        const kept = await selectValueUnchanged(session.supabase, parsed.data, stored.valueText);
        if (!kept) return { ok: false, error: "invalid" };
      }
    }
    if (field.required && stored.empty) return { ok: false, error: "required" };
    const error = stored.empty
      ? await deleteValue(session.supabase, parsed.data)
      : await upsertValue(session.supabase, parsed.data, stored, session.userId);
    if (error) {
      logSupabaseClientError("saveAcademicProfileValueAction", error, { fieldId: parsed.data.fieldId });
      return { ok: false, error: "failed" };
    }
    await auditAcademicProfileStaffAction({
      actorId: session.userId,
      action: "academic_profile_value_save",
      resourceType: "academic_profile_field_value",
      resourceId: parsed.data.fieldId,
      payload: { fieldId: parsed.data.fieldId, studentId: parsed.data.studentId },
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/admin/users/${parsed.data.studentId}`);
    revalidatePath(`/${parsed.data.locale}/dashboard/admin/students`);
    if (parsed.data.sectionId) {
      revalidatePath(`/${parsed.data.locale}/dashboard/teacher/sections/${parsed.data.sectionId}`);
    }
    return { ok: true };
  } catch (error) {
    logServerException("saveAcademicProfileValueAction", error);
    return { ok: false, error: "failed" };
  }
}

async function loadField(supabase: SupabaseClient, fieldId: string) {
  const { data, error } = await supabase
    .from("academic_profile_fields")
    .select("required, field_type, archived_at, select_options")
    .eq("id", fieldId)
    .maybeSingle();
  if (error || !data || data.archived_at) return null;
  return data as {
    required: boolean;
    field_type: string;
    archived_at: string | null;
    select_options: string[] | null;
  };
}

async function selectValueUnchanged(supabase: SupabaseClient, input: ValueInput, next: string) {
  const { data } = await supabase
    .from("academic_profile_field_values")
    .select("value_text")
    .eq("field_id", input.fieldId)
    .eq("student_id", input.studentId)
    .maybeSingle();
  return data?.value_text === next;
}

function storedValue(slot: "text" | "number" | "date" | "file", input: ValueInput) {
  const valueText = input.valueText?.trim() ? input.valueText.trim() : null;
  const valueNumber = slot === "number" ? (input.valueNumber ?? null) : null;
  const valueDate = slot === "date" ? (input.valueDate?.trim() || null) : null;
  const storagePath = slot === "file" ? (input.storagePath?.trim() || null) : null;
  const text = slot === "text" ? valueText : null;
  const empty =
    slot === "number" ? valueNumber == null : slot === "date" ? !valueDate : slot === "file" ? !storagePath : !text;
  return { valueText: text, valueNumber, valueDate, storagePath, empty };
}

async function deleteValue(supabase: SupabaseClient, input: ValueInput) {
  const { error } = await supabase
    .from("academic_profile_field_values")
    .delete()
    .eq("field_id", input.fieldId)
    .eq("student_id", input.studentId);
  return error;
}

async function upsertValue(
  supabase: SupabaseClient,
  input: ValueInput,
  stored: { valueText: string | null; valueNumber: number | null; valueDate: string | null; storagePath: string | null },
  userId: string,
) {
  const { error } = await supabase.from("academic_profile_field_values").upsert(
    {
      field_id: input.fieldId,
      student_id: input.studentId,
      value_text: stored.valueText,
      value_number: stored.valueNumber,
      value_date: stored.valueDate,
      storage_path: stored.storagePath,
      updated_by: userId,
    },
    { onConflict: "field_id,student_id" },
  );
  return error;
}
