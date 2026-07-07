import type { Dictionary } from "@/types/i18n";

/** Mi Mundo (Argentina) uses DNI / passport only — no RUT in public registration copy. */
export function resolveMiMundoRegisterDict(
  register: Dictionary["register"],
  mmRegister: Dictionary["landing"]["mm"]["register"],
): Dictionary["register"] {
  return {
    ...register,
    dni: mmRegister.dni,
    documentIdFormatHint: mmRegister.documentIdFormatHint,
    tutorDni: mmRegister.tutorDni,
  };
}
