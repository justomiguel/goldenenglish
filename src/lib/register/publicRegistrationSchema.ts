import { z } from "zod";

/** ISO date YYYY-MM-DD; not in the future; not older than ~120 years. */
function isReasonableBirthDate(s: string): boolean {
  const d = new Date(`${s}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bd = new Date(d);
  bd.setHours(0, 0, 0, 0);
  if (bd > today) return false;
  const oldest = new Date();
  oldest.setFullYear(oldest.getFullYear() - 120);
  return bd >= oldest;
}

export const publicRegistrationSchema = z.object({
  first_name: z.string().trim().min(1).max(120),
  last_name: z.string().trim().min(1).max(120),
  dni: z.string().trim().min(1).max(32),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(1).max(40),
  birth_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(isReasonableBirthDate, { message: "invalid birth_date" }),
  level_interest: z.string().trim().min(1).max(80),
});

export type PublicRegistrationInput = z.infer<typeof publicRegistrationSchema>;
