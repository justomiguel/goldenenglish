import type { PublicRegistrationFormDraft } from "@/lib/register/publicRegistrationSchema";
import type { RegistrationExtrasPackId } from "@/lib/register/packs/extrasPackForTemplateKind";
import { readNagoExtrasFromFormData } from "@/lib/register/packs/nago/readNagoExtrasFromFormData";
import type { RegisterIntent } from "@/lib/settings/resolveRegisterIntent";

export function publicRegistrationInputFromFormData(
  fd: FormData,
  extrasPack: RegistrationExtrasPackId | null,
  intent: RegisterIntent,
): PublicRegistrationFormDraft {
  return {
    first_name: String(fd.get("first_name") ?? ""),
    last_name: String(fd.get("last_name") ?? ""),
    dni: String(fd.get("dni") ?? ""),
    email: String(fd.get("email") ?? ""),
    phone: String(fd.get("phone") ?? ""),
    birth_date: String(fd.get("birth_date") ?? ""),
    preferred_section_id: String(fd.get("preferred_section_id") ?? ""),
    additional_section_ids: fd.getAll("additional_section_ids").map(String).filter(Boolean),
    tutor_name: String(fd.get("tutor_name") ?? ""),
    tutor_dni: String(fd.get("tutor_dni") ?? ""),
    tutor_email: String(fd.get("tutor_email") ?? ""),
    tutor_phone: String(fd.get("tutor_phone") ?? ""),
    tutor_relationship: String(fd.get("tutor_relationship") ?? ""),
    tenant_extras: extrasPack === "nago" ? readNagoExtrasFromFormData(fd) : undefined,
    intent,
    privacy_accepted: fd.get("privacy_accepted") === "yes",
  };
}
