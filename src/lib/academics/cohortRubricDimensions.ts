import { z } from "zod";
import type { RubricDimensionDef } from "@/types/rubricDimensions";
import { ASSESSMENT_RUBRIC_KEYS } from "@/lib/academics/assessmentRubricDefaults";

const dimensionRow = z.object({
  key: z.string().min(1).max(64),
  label: z.string().min(1).max(120),
  scaleMin: z.coerce.number().finite().optional(),
  scaleMax: z.coerce.number().finite().optional(),
});

/**
 * Parses cohort JSONB `rubric_dimensions` as an array of dimension rows.
 * Returns [] if null, invalid type, or empty array.
 */
export function parseCohortRubricDimensionsJson(raw: unknown): RubricDimensionDef[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const out: RubricDimensionDef[] = [];
  for (const item of raw) {
    const p = dimensionRow.safeParse(item);
    if (!p.success) continue;
    const min = p.data.scaleMin ?? 1;
    const max = p.data.scaleMax ?? 5;
    if (!(min < max) || min < 0 || max > 100) continue;
    out.push({
      key: p.data.key.trim(),
      label: p.data.label.trim(),
      scaleMin: min,
      scaleMax: max,
    });
  }
  return out;
}

/**
 * When the cohort has no template, use stable keys with labels from i18n (caller supplies labels by key).
 */
export function defaultRubricDimensionsFromI18n(labelsByKey: Record<string, string>): RubricDimensionDef[] {
  return ASSESSMENT_RUBRIC_KEYS.map((key) => ({
    key,
    label: labelsByKey[key] ?? key,
    scaleMin: 1,
    scaleMax: 5,
  }));
}

export function normalizeRubricValuesForDimensions(
  raw: unknown,
  dimensions: RubricDimensionDef[],
): Record<string, number> {
  const o = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const next: Record<string, number> = {};
  for (const d of dimensions) {
    const n = Number(o[d.key]);
    const mid = (d.scaleMin + d.scaleMax) / 2;
    if (Number.isFinite(n) && n >= d.scaleMin && n <= d.scaleMax) {
      next[d.key] = n;
    } else {
      next[d.key] = mid;
    }
  }
  return next;
}

export function validateRubricAgainstDimensions(
  rubric: Record<string, number>,
  dimensions: RubricDimensionDef[],
): boolean {
  const keys = new Set(Object.keys(rubric));
  if (keys.size !== dimensions.length) return false;
  for (const d of dimensions) {
    if (!keys.has(d.key)) return false;
    const v = rubric[d.key];
    if (typeof v !== "number" || !Number.isFinite(v) || v < d.scaleMin || v > d.scaleMax) return false;
  }
  return true;
}
