import { z } from "zod";

export const joinBillingDispositionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("current") }),
  z.object({ kind: z.literal("behind") }),
  z.object({
    kind: z.literal("scholarship"),
    percent: z.number().int().min(1).max(100),
    scope: z.enum(["join_month", "rest_of_cycle"]),
  }),
]);

export type JoinBillingDisposition = z.infer<typeof joinBillingDispositionSchema>;

export function parseJoinDispositionInput(raw: unknown): JoinBillingDisposition | null {
  const parsed = joinBillingDispositionSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
