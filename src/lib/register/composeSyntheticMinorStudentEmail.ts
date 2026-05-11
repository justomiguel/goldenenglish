/** Normaliza apellidos/nombres a segmento ASCII local-part (solo [a-z0-9]). */
export function sanitizePersonNameForEmailLocalSegment(value: string): string {
  const ascii = value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/ß/gu, "ss");
  return ascii.toLowerCase().replace(/[^a-z0-9]/gu, "").slice(0, 48);
}

export function alphanumericFingerprintFromDocumentId(documentIdRaw: string): string {
  const key = documentIdRaw.replace(/[^a-zA-Z0-9]/gu, "").toLowerCase();
  return key.slice(0, 20) || "sinid";
}

export type ComposeSyntheticMinorStudentEmailOptions = {
  /**
   * Letras [a-z] (cualquier otro carácter se ignora) tras nombre+apellido y antes del guion del documento,
   * p. ej. `juanperezab-12345@...` cuando Auth ya tiene `juanperez-12345@...`.
   */
  coreSuffix?: string;
};

/**
 * Correo institucional para menores sin email explícito: nombre+apellido + huella corta del documento
 * (`juanperez-48123456@MAIL_TENANT`) para unicidad estable en Auth.
 */
export function composeSyntheticMinorStudentEmail(
  first_name: string,
  last_name: string,
  dni: string,
  domainRaw: string,
  options?: ComposeSyntheticMinorStudentEmailOptions,
): string {
  const domain = domainRaw.trim().replace(/^@+/u, "").toLowerCase();
  const a = sanitizePersonNameForEmailLocalSegment(first_name.trim());
  const b = sanitizePersonNameForEmailLocalSegment(last_name.trim());
  const uniq = alphanumericFingerprintFromDocumentId(dni.trim());
  let core = `${a}${b}`;
  if (core.length < 2) {
    core = `alumno`;
  }
  const suffixRaw = options?.coreSuffix ?? "";
  const suffixLetters = suffixRaw.toLowerCase().replace(/[^a-z]/gu, "");
  if (suffixLetters) {
    core = `${core}${suffixLetters}`;
  }
  core = core.slice(0, 48);
  let localPart = `${core}-${uniq}`;
  if (localPart.length > 64) {
    const maxCore = Math.max(1, 64 - 1 - uniq.length);
    localPart = `${core.slice(0, maxCore)}-${uniq}`;
  }
  localPart = localPart.slice(0, 64);
  return `${localPart}@${domain}`;
}
