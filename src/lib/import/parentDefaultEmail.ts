/** Distinct synthetic email space so student + tutor DNI never collide. */
export function parentDefaultEmail(dni: string): string {
  const safe = dni.replace(/[^\dA-Za-z]/g, "").toLowerCase() || "sin-doc";
  return `${safe}@parents.goldenenglish.local`;
}
