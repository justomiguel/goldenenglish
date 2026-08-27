export interface RegisterExtrasPrefill {
  tutorPrefill: { name: string; relationship: string; phone: string; dni: string };
  signerPrefill: { name: string; dni: string };
}

export function collectRegisterExtrasPrefill(
  form: HTMLFormElement,
  input: { isMinor: boolean; existingConfirmed: boolean },
): RegisterExtrasPrefill {
  const fd = new FormData(form);
  const tutorPrefill = {
    name: String(fd.get("tutor_name") ?? "").trim(),
    relationship: String(fd.get("tutor_relationship") ?? "").trim(),
    phone: String(fd.get("tutor_phone") ?? "").trim(),
    dni: String(fd.get("tutor_dni") ?? "").trim(),
  };
  const first = String(fd.get("first_name") ?? "").trim();
  const last = String(fd.get("last_name") ?? "").trim();
  const dni = String(fd.get("dni") ?? "").trim();
  const signerPrefill = input.existingConfirmed
    ? { name: "", dni: "" }
    : input.isMinor
      ? { name: tutorPrefill.name, dni: tutorPrefill.dni }
      : { name: `${first} ${last}`.trim(), dni };
  return { tutorPrefill, signerPrefill };
}
