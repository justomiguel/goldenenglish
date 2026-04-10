import { z } from "zod";

const cef = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);

export const csvStudentRowSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  dni_or_passport: z.string().min(1),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
  email: z.string().optional(),
  level: cef.optional(),
  academic_year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export type CsvStudentRow = z.infer<typeof csvStudentRowSchema>;

export const csvStudentRowsSchema = z.array(csvStudentRowSchema);
