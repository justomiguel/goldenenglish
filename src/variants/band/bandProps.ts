import { z } from "zod";

export const bandItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  sentence: z.string(),
  src: z.string(),
});

export const bandPropsSchema = z.object({
  items: z.array(bandItemSchema),
});

export type BandItem = z.infer<typeof bandItemSchema>;
export type BandVariantProps = z.infer<typeof bandPropsSchema>;
