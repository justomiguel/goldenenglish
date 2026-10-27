import { createClient } from "@/lib/supabase/server";
import {
  mapRegistrationSectionPickerRows,
  normalizeRegisterPickerOptions,
  type RegistrationSectionPickerOption,
} from "@/lib/register/registrationSectionPicker";

export async function loadRegistrationSectionPickerOptions(
  cohortId?: string | null,
): Promise<RegistrationSectionPickerOption[]> {
  const supabase = await createClient();
  const args = cohortId ? { p_cohort_id: cohortId } : undefined;
  const { data, error } = args
    ? await supabase.rpc("list_registration_section_picker_options", args)
    : await supabase.rpc("list_registration_section_picker_options");
  if (!error) return mapRegistrationSectionPickerRows(data);
  const { data: legacy } = await supabase.rpc("list_registration_section_options");
  return normalizeRegisterPickerOptions(
    (legacy ?? []).map((row: { id: string; label: string }) => ({
      id: String(row.id),
      label: String(row.label),
    })),
  );
}

export async function loadRegistrationSectionPickerOptionsByCohort(
  cohortIds: string[],
): Promise<Record<string, RegistrationSectionPickerOption[]>> {
  const uniqueIds = [...new Set(cohortIds.filter(Boolean))];
  const entries = await Promise.all(
    uniqueIds.map(async (id) => {
      const options = await loadRegistrationSectionPickerOptions(id);
      return [id, options] as const;
    }),
  );
  return Object.fromEntries(entries);
}
