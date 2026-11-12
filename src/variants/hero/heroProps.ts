import { z } from "zod";

export const heroPropsSchema = z.object({
  scene: z.string(),
  title: z.string(),
  body: z.string(),
  imageAlt: z.string(),
  name: z.string(),
  heroSrc: z.string(),
});

export type HeroVariantProps = z.infer<typeof heroPropsSchema>;
