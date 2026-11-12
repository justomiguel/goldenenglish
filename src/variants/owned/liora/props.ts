import { z } from "zod";

/** Shared props until each section declares its own fields. */
export const lioraSectionPropsSchema = z.object({}).passthrough();
