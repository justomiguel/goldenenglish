/** Normalizes DNI/passport and derived initial password (padded to 6). */
export function normalizeDni(raw: string): { dni: string; password: string } {
  const d = raw.replace(/\./g, "").replace(/\s/g, "").trim();
  const password = d.length >= 6 ? d : d.padEnd(6, "0");
  return { dni: d, password };
}

/** Synthetic email for students without an address (dev / import flow). */
export function defaultEmail(dni: string): string {
  const safe = dni.replace(/[^\dA-Za-z]/g, "").toLowerCase() || "sin-doc";
  return `${safe}@students.goldenenglish.local`;
}
