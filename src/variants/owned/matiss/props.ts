import { z } from "zod";

/** Shared props until each section declares its own fields. */
export const matissSectionPropsSchema = z.object({}).passthrough();

export const MATISS_EMPTY_PROPS = {} as const;
