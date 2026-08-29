import { createClient } from "@/lib/supabase/server";
import {
  mapRegistrationSectionPickerRows,
  normalizeRegisterPickerOptions,
  type RegistrationSectionPickerOption,
} from "@/lib/register/registrationSectionPicker";

export async function loadRegistrationSectionPickerOptions(): Promise<
  RegistrationSectionPickerOption[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_registration_section_picker_options");
  if (!error) return mapRegistrationSectionPickerRows(data);
  const { data: legacy } = await supabase.rpc("list_registration_section_options");
  return normalizeRegisterPickerOptions(
    (legacy ?? []).map((row: { id: string; label: string }) => ({
      id: String(row.id),
      label: String(row.label),
    })),
  );
}
