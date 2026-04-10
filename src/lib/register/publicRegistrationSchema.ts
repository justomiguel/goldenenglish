import { z } from "zod";

export const publicRegistrationSchema = z.object({
  first_name: z.string().trim().min(1).max(120),
  last_name: z.string().trim().min(1).max(120),
  dni: z.string().trim().min(1).max(32),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional(),
  level_interest: z.string().trim().max(80).optional(),
});

export type PublicRegistrationInput = z.infer<typeof publicRegistrationSchema>;
