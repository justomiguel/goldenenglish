import { z } from "zod";
import {
  NAGO_EXTRAS_SCHEMA_VERSION,
  NAGO_PROTOCOL_VERSION,
} from "@/lib/register/packs/nago/protocolVersion";
import type { NagoTenantExtras } from "@/lib/register/packs/nago/types";

const bloodType = z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", "unknown"]);
const healthInsurance = z.enum(["fonasa", "isapre", "other"]);

export function buildNagoExtrasSchema(options: { isMinor: boolean }): z.ZodType<NagoTenantExtras> {
  const school = options.isMinor
    ? z.string().trim().min(1).max(120)
    : z.string().trim().max(120);

  return z
    .object({
      pack: z.literal("nago"),
      schemaVersion: z.literal(NAGO_EXTRAS_SCHEMA_VERSION),
      nationality: z.string().trim().min(1).max(80),
      address: z.string().trim().min(1).max(200),
      commune: z.string().trim().min(1).max(80),
      school,
      healthInsurance,
      healthInsuranceOther: z.string().trim().max(80),
      bloodType,
      hasAllergies: z.boolean(),
      allergiesDetail: z.string().trim().max(500),
      hasMedicalCondition: z.boolean(),
      medicalConditionDetail: z.string().trim().max(500),
      preferredHealthCenter: z.string().trim().min(1).max(160),
      emergencyName: z.string().trim().min(1).max(120),
      emergencyRelationship: z.string().trim().min(1).max(80),
      emergencyPhone: z.string().trim().min(1).max(40),
      protocol: z.object({
        version: z.literal(NAGO_PROTOCOL_VERSION),
        acceptedAt: z.string().trim().min(1),
        signerName: z.string().trim().min(1).max(120),
        signerDni: z.string().trim().min(1).max(32),
      }),
    })
    .strip()
    .superRefine((data, ctx) => {
      if (data.healthInsurance === "other" && data.healthInsuranceOther.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["healthInsuranceOther"],
          message: "required",
        });
      }
      if (data.hasAllergies && data.allergiesDetail.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["allergiesDetail"],
          message: "required",
        });
      }
      if (data.hasMedicalCondition && data.medicalConditionDetail.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["medicalConditionDetail"],
          message: "required",
        });
      }
    });
}
