export type RegisterDniDraftStep = "dni" | "details" | "extras";

export type RegisterDniDraft = {
  dni: string;
  step: RegisterDniDraftStep;
};

export function registerDniDraftKey(locale: string, intent: string): string {
  return `ge:register-dni-draft:v1:${locale}:${intent}`;
}

function isDraftStep(value: unknown): value is RegisterDniDraftStep {
  return value === "dni" || value === "details" || value === "extras";
}

export function readRegisterDniDraft(key: string): RegisterDniDraft | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const dni = "dni" in parsed ? String((parsed as { dni: unknown }).dni ?? "").trim() : "";
    const step = "step" in parsed ? (parsed as { step: unknown }).step : null;
    if (!dni || !isDraftStep(step)) return null;
    return { dni, step };
  } catch {
    return null;
  }
}

export function writeRegisterDniDraft(key: string, draft: RegisterDniDraft): void {
  try {
    const dni = draft.dni.trim();
    if (!dni) {
      sessionStorage.removeItem(key);
      return;
    }
    sessionStorage.setItem(key, JSON.stringify({ dni, step: draft.step }));
  } catch {
    /* private mode / quota */
  }
}

export function clearRegisterDniDraft(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* private mode */
  }
}
