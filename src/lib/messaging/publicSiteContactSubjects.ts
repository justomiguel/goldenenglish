import { z } from "zod";

export const publicSiteContactSubjectSchema = z.enum([
  "classes",
  "prices",
  "modalities",
  "other",
]);

export type PublicSiteContactSubject = z.infer<typeof publicSiteContactSubjectSchema>;
