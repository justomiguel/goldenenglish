import { z } from "zod";

export const schedulePropsSchema = z.object({
  lines: z.array(z.string()),
});

export type ScheduleVariantProps = z.infer<typeof schedulePropsSchema>;
