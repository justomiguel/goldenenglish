import { z } from "zod";

export const myProfilePersonalSchema = z.object({
  locale: z.string().min(2).max(8),
  first_name: z.string().trim().min(1).max(120),
  last_name: z.string().trim().min(1).max(120),
  dni_or_passport: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(40).optional().transform((s) => (s === "" || !s ? null : s)),
  birth_date: z
    .string()
    .trim()
    .max(32)
    .optional()
    .transform((s) => (s && s.length > 0 ? s : null)),
});

export type MyProfilePersonalInput = z.infer<typeof myProfilePersonalSchema>;

export const myProfilePasswordSchema = z.object({
  locale: z.string().min(2).max(8),
  current_password: z.string().min(1),
  new_password: z.string().min(8).max(128),
});

export type MyProfilePasswordInput = z.infer<typeof myProfilePasswordSchema>;
