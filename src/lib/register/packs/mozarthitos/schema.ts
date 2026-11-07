import { z } from "zod";
import {
  MZ_GUIDE_AGE_BANDS,
  MZ_GUIDE_MODALITIES,
  MZ_GUIDE_STAGE_MODALITIES,
  MZ_GUIDE_STAGES,
  type MzGuideChoice,
} from "@/lib/landing/mozarthitos/familyGuideCatalog";

export const MOZARTHITOS_EXTRAS_SCHEMA_VERSION = 1 as const;

export interface MozarthitosTenantExtras {
  pack: "mozarthitos";
  schemaVersion: typeof MOZARTHITOS_EXTRAS_SCHEMA_VERSION;
  guide: MzGuideChoice;
}

export const mozarthitosExtrasSchema: z.ZodType<MozarthitosTenantExtras> = z
  .object({
    pack: z.literal("mozarthitos"),
    schemaVersion: z.literal(MOZARTHITOS_EXTRAS_SCHEMA_VERSION),
    guide: z
      .object({
        stage: z.enum(MZ_GUIDE_STAGES),
        modality: z.enum(MZ_GUIDE_MODALITIES),
        ageBand: z.enum(MZ_GUIDE_AGE_BANDS),
      })
      .strip()
      .refine((g) => MZ_GUIDE_STAGE_MODALITIES[g.stage].includes(g.modality)),
  })
  .strip();
