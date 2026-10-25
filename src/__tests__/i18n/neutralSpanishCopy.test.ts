/**
 * Locks user-facing Spanish to neutral Latin American tuteo.
 * Argentine voseo (tenés, hacé, acá) must not return to es.json or email templates.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../../..");
const WORD = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g;

const SAFE = new Set([
  "está", "esté", "estás", "estés", "qué", "así", "sí", "aquí", "ahí", "allá",
  "quizá", "bebé", "canadá", "mié", "hé", "llegué", "sé", "más", "además", "demás",
  "atrás", "después", "través", "inglés", "francés", "portugués", "interés", "bebés",
  "quizás", "caché",
]);

/**
 * Voseo imperatives of -ar verbs whose root already ends in r
 * (esperá, mirá, compará) end in ará/erá/irá, same letters as a future.
 * Their stem is not an infinitive, so they stay flagged.
 */
const VOSEO_FUTURE_LOOKALIKE_STEMS = new Set([
  "compar", "consider", "esper", "gener", "mir", "par", "prepar", "recuper", "separ", "super",
]);

const VOSEO_WORDS = new Set([
  "vos", "acá", "sos", "escribinos", "escribiles", "pedile", "contanos", "seguinos", "dejanos",
  "usalo", "usala", "ingresalo", "archivalo", "asignalo", "marcala", "vinculalo", "mantenla",
]);

const ARGENTINE_PARTICIPLES = new Set(["inscripto", "inscripta", "inscriptos", "inscriptas"]);

function isFuture(word: string): boolean {
  if (/rás$/.test(word)) return true;
  if (/(?:drá|brá)$/.test(word)) return true;
  if (!word.endsWith("á")) return false;
  const stem = word.slice(0, -1);
  if (!/(?:ar|er|ir)$/.test(stem)) return false;
  return !VOSEO_FUTURE_LOOKALIKE_STEMS.has(stem);
}

function voseoToken(word: string): boolean {
  const w = word.toLowerCase();
  if (ARGENTINE_PARTICIPLES.has(w)) return true;
  if (SAFE.has(w) || isFuture(w)) return false;
  if (/(?:ás|és|[áéí])$/.test(w)) return true;
  return VOSEO_WORDS.has(w);
}

function firstVoseo(text: string): string | null {
  for (const match of text.matchAll(WORD)) {
    if (voseoToken(match[0])) return match[0];
  }
  return null;
}

function walkStrings(value: unknown, found: string[]): void {
  if (typeof value === "string") {
    const token = firstVoseo(value);
    if (token) found.push(token);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) walkStrings(item, found);
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) walkStrings(item, found);
  }
}

describe("neutral Spanish copy", () => {
  it("es.json has no Argentine voseo", () => {
    const dict = JSON.parse(readFileSync(path.join(ROOT, "src/dictionaries/es.json"), "utf8"));
    const found: string[] = [];
    walkStrings(dict, found);
    expect(found).toEqual([]);
  });

  it("Spanish email templates have no Argentine voseo", () => {
    const dir = path.join(ROOT, "src/lib/email/templates");
    const offenders: string[] = [];
    for (const name of readdirSync(dir)) {
      if (!name.startsWith("registry") || !name.endsWith(".ts")) continue;
      const text = readFileSync(path.join(dir, name), "utf8").replace(/\\n/g, "\n");
      const token = firstVoseo(text);
      if (token) offenders.push(`${name}:${token}`);
    }
    expect(offenders).toEqual([]);
  });
});
