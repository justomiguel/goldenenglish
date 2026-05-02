import fs from "node:fs";

/** Si quedan vacías suele ser Sensitive (no exportable por CLI). */
export const SENSITIVE_INDICATOR_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "DATABASE_URL"];

export function effectiveEnvValue(raw) {
  let v = raw.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  return v;
}

/** @returns {{ count: number; sensitivePlaceholders: string[]; appKeys: number; appKeysEmpty: number }} */
export function summarizeDotEnv(filePath) {
  if (!fs.existsSync(filePath))
    return {
      count: 0,
      sensitivePlaceholders: [...SENSITIVE_INDICATOR_KEYS],
      appKeys: 0,
      appKeysEmpty: 0,
    };
  const text = fs.readFileSync(filePath, "utf8");
  let count = 0;
  let appKeys = 0;
  let appKeysEmpty = 0;
  /** @type {Record<string, string>} */
  const map = {};
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    const raw = t.slice(eq + 1).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(k)) continue;
    count++;
    map[k] = raw;
    const appPull =
      k.startsWith("NEXT_PUBLIC_") ||
      k.startsWith("SUPABASE_") ||
      k.startsWith("KV_") ||
      k.startsWith("RESEND_") ||
      k === "DATABASE_URL" ||
      k === "REDIS_URL" ||
      k === "CRON_SECRET";
    if (appPull) {
      appKeys++;
      if (effectiveEnvValue(raw).length === 0) appKeysEmpty++;
    }
  }
  const sensitivePlaceholders = SENSITIVE_INDICATOR_KEYS.filter(
    (key) => effectiveEnvValue(map[key] ?? "").length < 12,
  );
  return { count, sensitivePlaceholders, appKeys, appKeysEmpty };
}
