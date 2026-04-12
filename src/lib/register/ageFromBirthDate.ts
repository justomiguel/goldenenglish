/** Años completos a partir de YYYY-MM-DD (medianoche local del día de nacimiento vs hoy). */
export function fullYearsFromIsoDate(isoYmd: string, ref = new Date()): number {
  const d = new Date(`${isoYmd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return 0;
  let age = ref.getFullYear() - d.getFullYear();
  const m = ref.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) {
    age -= 1;
  }
  return age;
}
