import { z } from "zod";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";

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

export function buildPublicRegistrationSchema(legalAgeMajority: number) {
  return z
    .object({
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
      tutor_name: z.string().trim().max(120).optional(),
      tutor_dni: z.string().trim().max(32).optional(),
      tutor_email: z.string().trim().max(254).optional(),
      tutor_phone: z.string().trim().max(40).optional(),
      tutor_relationship: z.string().trim().max(80).optional(),
    })
    .superRefine((data, ctx) => {
      const age = fullYearsFromIsoDate(data.birth_date);
      if (age >= legalAgeMajority) return;

      const tutorName = data.tutor_name?.trim();
      const tutorDni = data.tutor_dni?.trim();
      const tutorEmail = data.tutor_email?.trim();
      const tutorPhone = data.tutor_phone?.trim();
      const rel = data.tutor_relationship?.trim();

      if (!tutorName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tutor_name"],
          message: "required",
        });
      }
      if (!tutorDni) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tutor_dni"],
          message: "required",
        });
      }
      if (!tutorEmail || !z.string().email().safeParse(tutorEmail).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tutor_email"],
          message: "required",
        });
      }
      if (!tutorPhone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tutor_phone"],
          message: "required",
        });
      }
      if (!rel) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tutor_relationship"],
          message: "required",
        });
      }
      if (
        tutorEmail &&
        tutorEmail.toLowerCase() === data.email.toLowerCase()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tutor_email"],
          message: "same_as_student",
        });
      }
      if (tutorDni && tutorDni.toLowerCase() === data.dni.toLowerCase()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tutor_dni"],
          message: "same_as_student",
        });
      }
    });
}

export type PublicRegistrationInput = z.infer<
  ReturnType<typeof buildPublicRegistrationSchema>
>;
