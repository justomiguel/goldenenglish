import { z } from "zod";

/** Shared CEFR levels for CSV import and course resolution from registration interest. */
export const cefrLevelEnum = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
export type CefrLevel = z.infer<typeof cefrLevelEnum>;

export const csvStudentRowSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  dni_or_passport: z.string().min(1),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
  email: z.string().optional(),
  level: cefrLevelEnum.optional(),
  academic_year: z.coerce.number().int().min(2000).max(2100).optional(),
  tutor_dni: z.string().optional(),
  tutor_email: z.string().optional(),
  tutor_first_name: z.string().optional(),
  tutor_last_name: z.string().optional(),
  tutor_phone: z.string().optional(),
  monthly_fee: z.coerce.number().nonnegative().optional(),
});

export type CsvStudentRow = z.infer<typeof csvStudentRowSchema>;

export const csvStudentRowsSchema = z.array(csvStudentRowSchema);
