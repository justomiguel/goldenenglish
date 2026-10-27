"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { logServerAuthzDenied, logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  ACADEMIC_PROFILE_FIELD_TYPES,
  normalizeAcademicProfileFieldDraft,
} from "@/lib/academic-profile/academicProfileFieldRules";

const fieldSchema = z.object({
  locale: z.string().min(2).max(12),
  fieldId: z.string().uuid().optional(),
  label: z.string(),
  fieldType: z.enum(ACADEMIC_PROFILE_FIELD_TYPES),
  selectOptions: z.array(z.string()).default([]),
  required: z.boolean(),
  showInDirectory: z.boolean(),
});

export async function saveAcademicProfileFieldAction(
  input: z.input<typeof fieldSchema>,
): Promise<{ ok: true; id: string } | { ok: false; error: "forbidden" | "invalid" | "failed" }> {
  const parsed = fieldSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const draft = normalizeAcademicProfileFieldDraft(parsed.data);
  if (!draft.ok) return { ok: false, error: "invalid" };

  try {
    const { supabase } = await assertAdmin();
    const row = {
      label: draft.field.label,
      required: draft.field.required,
      show_in_directory: draft.field.showInDirectory,
      select_options: draft.field.selectOptions,
    };
    if (parsed.data.fieldId) {
      const { error } = await supabase
        .from("academic_profile_fields")
        .update(row)
        .eq("id", parsed.data.fieldId);
      if (error) {
        logSupabaseClientError("saveAcademicProfileFieldAction", error, { fieldId: parsed.data.fieldId });
        return { ok: false, error: "failed" };
      }
      await recordSystemAudit({
        action: "academic_profile_field_update",
        resourceType: "academic_profile_field",
        resourceId: parsed.data.fieldId,
        payload: { fieldType: draft.field.fieldType, showInDirectory: draft.field.showInDirectory },
      });
      revalidateAcademicFieldPaths(parsed.data.locale);
      return { ok: true, id: parsed.data.fieldId };
    }

    const { data: last } = await supabase
      .from("academic_profile_fields")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data, error } = await supabase
      .from("academic_profile_fields")
      .insert({
        ...row,
        field_type: draft.field.fieldType,
        sort_order: (last?.sort_order ?? 0) + 1,
      })
      .select("id")
      .single();
    if (error || !data?.id) {
      logSupabaseClientError("saveAcademicProfileFieldAction", error ?? { message: "missing id" }, {});
      return { ok: false, error: "failed" };
    }
    await recordSystemAudit({
      action: "academic_profile_field_create",
      resourceType: "academic_profile_field",
      resourceId: data.id,
      payload: { fieldType: draft.field.fieldType, showInDirectory: draft.field.showInDirectory },
    });
    revalidateAcademicFieldPaths(parsed.data.locale);
    return { ok: true, id: data.id };
  } catch (error) {
    return denyOrFail("saveAcademicProfileFieldAction", error);
  }
}

export async function archiveAcademicProfileFieldAction(input: {
  locale: string;
  fieldId: string;
}): Promise<{ ok: true } | { ok: false; error: "forbidden" | "invalid" | "failed" }> {
  const parsed = z.object({ locale: z.string().min(2).max(12), fieldId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    const { supabase } = await assertAdmin();
    const { error } = await supabase
      .from("academic_profile_fields")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", parsed.data.fieldId);
    if (error) {
      logSupabaseClientError("archiveAcademicProfileFieldAction", error, { fieldId: parsed.data.fieldId });
      return { ok: false, error: "failed" };
    }
    await recordSystemAudit({
      action: "academic_profile_field_archive",
      resourceType: "academic_profile_field",
      resourceId: parsed.data.fieldId,
      payload: { fieldId: parsed.data.fieldId },
    });
    revalidateAcademicFieldPaths(parsed.data.locale);
    return { ok: true };
  } catch (error) {
    return denyOrFail("archiveAcademicProfileFieldAction", error);
  }
}

function revalidateAcademicFieldPaths(locale: string) {
  revalidatePath(`/${locale}/dashboard/admin/students`);
  revalidatePath(`/${locale}/dashboard/admin/users`);
}

function denyOrFail(scope: string, error: unknown): { ok: false; error: "forbidden" | "failed" } {
  const message = error instanceof Error ? error.message : "";
  if (message === ADMIN_SESSION_UNAUTHORIZED || message === ADMIN_SESSION_FORBIDDEN) {
    logServerAuthzDenied(scope, { reason: message });
    return { ok: false, error: "forbidden" };
  }
  logServerException(scope, error);
  return { ok: false, error: "failed" };
}
