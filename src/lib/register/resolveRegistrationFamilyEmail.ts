function normalizeEmail(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim().toLowerCase();
  return value.length > 0 ? value : null;
}

export function resolveRegistrationFamilyEmail(input: {
  isMinor: boolean;
  tutorEmail: string | null;
  studentEmail: string | null;
  studentEmailIsSynthetic: boolean;
}): string | null {
  if (input.isMinor) {
    return normalizeEmail(input.tutorEmail);
  }
  if (input.studentEmailIsSynthetic) return null;
  return normalizeEmail(input.studentEmail);
}
