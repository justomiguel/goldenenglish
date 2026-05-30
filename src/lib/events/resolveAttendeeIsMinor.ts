export function resolveAttendeeIsMinor(
  birthDateIso: string | null | undefined,
  legalAgeMajority: number,
  now = new Date(),
): boolean {
  if (!birthDateIso) return false;
  const birth = new Date(birthDateIso);
  if (Number.isNaN(birth.valueOf())) return false;

  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - birth.getUTCMonth();
  const dayDelta = now.getUTCDate() - birth.getUTCDate();
  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
    age -= 1;
  }
  return age < legalAgeMajority;
}
