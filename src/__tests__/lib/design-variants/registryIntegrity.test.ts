import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ALL_VARIANTS } from "@/lib/design-variants/registry";
import { CLIENT_VARIANT_ENTRIES } from "@/variants/clientEntries";

function dictionaryHas(root: unknown, labelKey: string): boolean {
  let cursor: unknown = root;
  for (const part of labelKey.split(".")) {
    if (!cursor || typeof cursor !== "object" || !(part in cursor)) return false;
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return typeof cursor === "string";
}

describe("ALL_VARIANTS", () => {
  const en = JSON.parse(readFileSync("src/dictionaries/en.json", "utf8")) as unknown;

  it("keeps id and major unique, and requires pwa on interactive variants", () => {
    const seen = new Set<string>();
    for (const variant of ALL_VARIANTS) {
      const key = `${variant.id}@${variant.major}`;
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
      if (variant.interactive) {
        expect(variant.pwa, key).toBeTypeOf("function");
        expect(CLIENT_VARIANT_ENTRIES[key], key).toBeTruthy();
      }
    }
  });

  it("keeps editor field keys inside the props schema and label keys in en.json", () => {
    for (const variant of ALL_VARIANTS) {
      const shape = variant.propsSchema instanceof z.ZodObject ? Object.keys(variant.propsSchema.shape) : [];
      for (const field of variant.editorFields) {
        expect(shape, `${variant.id} ${field.key}`).toContain(field.key);
        expect(dictionaryHas(en, field.labelKey), field.labelKey).toBe(true);
      }
    }
  });
});
