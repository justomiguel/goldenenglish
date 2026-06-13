import { z } from "zod";

/**
 * Zod 4-safe optional object field: missing key, `undefined`, or `""` → `undefined`;
 * otherwise validates with `schema`.
 */
export function zodOptionalEmptyField<T extends z.ZodTypeAny>(schema: T) {
  return z.optional(
    z
      .union([z.literal(""), schema])
      .transform((v): z.infer<T> | undefined =>
        v === "" ? undefined : (v as z.infer<T>),
      ),
  );
}

/** Optional URL field accepting empty client strings. */
export function zodOptionalEmptyUrl(maxLen = 500) {
  return zodOptionalEmptyField(z.string().trim().max(maxLen).url());
}
