import { z } from "zod";
import {
  isAcceptedLandingMediaMime,
  LANDING_MEDIA_MAX_BYTES,
} from "@/lib/cms/siteThemeLandingInputSchemas";

/** Accepts `""` from clients; absolute URLs after `coerceInitialSiteSetupSocialFields`. */
const optionalSocialUrlStored = z.preprocess(
  (raw) => {
    if (raw === undefined || raw === null) return undefined;
    if (typeof raw === "string" && raw.trim() === "") return undefined;
    return raw;
  },
  z.string().trim().max(500).url().optional(),
);

const optionalShortString = z.preprocess(
  (raw) =>
    typeof raw === "string" && raw.trim() === "" ? undefined : raw,
  z.string().trim().max(120).optional(),
);

const optionalCssToken = z.preprocess(
  (raw) =>
    typeof raw === "string" && raw.trim() === "" ? undefined : raw,
  z.string().trim().max(60).optional(),
);

const optionalIntegerString = z.preprocess(
  (raw) =>
    typeof raw === "string" && raw.trim() === "" ? undefined : raw,
  z
    .string()
    .trim()
    .max(10)
    .regex(/^\d+$/u, { message: "expected_integer" })
    .optional(),
);

const siteSetupSharedSchema = z.object({
  locale: z.string().min(2).max(12),
  themeId: z.string().uuid(),
  /** Defaults to "create" (greenfield). "edit" allows logo/favicon to be omitted
   *  so admins re-running the wizard can update only the fields they care about. */
  mode: z.enum(["create", "edit"]).optional(),
  appName: z.string().trim().min(1).max(120),
  legalName: z.string().trim().min(1).max(200),
  tagline: z.string().trim().min(1).max(300),
  taglineEn: z.string().trim().max(300).optional(),
  logoAlt: z.string().trim().min(1).max(200),
  contactEmail: z.string().trim().email().max(200),
  contactPhone: z.string().trim().min(3).max(80),
  contactAddress: z.string().trim().min(3).max(400),
  socialFacebook: optionalSocialUrlStored,
  socialInstagram: optionalSocialUrlStored,
  socialWhatsapp: optionalSocialUrlStored,
  logoContentType: z.string().min(3).max(80).optional(),
  logoBase64: z.string().min(1).optional(),
  // Visual tokens (stored as theme overrides).
  visualPrimary: optionalCssToken,
  visualSecondary: optionalCssToken,
  visualAccent: optionalCssToken,
  visualBackground: optionalCssToken,
  visualSurface: optionalCssToken,
  fontPrimary: optionalShortString,
  fontSecondary: optionalShortString,
  fontMono: optionalShortString,
  layoutMaxWidth: optionalCssToken,
  layoutBorderRadius: optionalCssToken,
  // Operational settings (persisted in `site_settings` in Phase 4).
  academicsSectionMaxStudents: optionalIntegerString,
  academicsTeacherPortalRoles: optionalShortString,
  attendanceTeacherScanLookbackBufferDays: optionalIntegerString,
  attendanceTeacherOperationalCivilLookbackDays: optionalIntegerString,
  attendanceTeacherOperationalMaxClassDays: optionalIntegerString,
  attendanceTeacherFullCourseMaxClassDays: optionalIntegerString,
  attendanceAdminFallbackLookbackDays: optionalIntegerString,
  attendanceAdminMaxClassDays: optionalIntegerString,
  attendancePickAdjacentCivilDays: optionalIntegerString,
  attendanceHasEligibleWindowMaxScans: optionalIntegerString,
  legalAgeMajority: optionalIntegerString,
  studentRenewalWarnDays: optionalIntegerString,
  billingTermEnrollment: optionalShortString,
  billingTermEnrollmentEn: optionalShortString,
  billingTermMonthly: optionalShortString,
  billingTermMonthlyEn: optionalShortString,
  billingTermPromotion: optionalShortString,
  billingTermPromotionEn: optionalShortString,
  analyticsEventNamespace: optionalShortString,
  analyticsEventVersion: optionalShortString,
  analyticsTimezone: optionalShortString,
});

export const completeInitialSiteSetupInputSchema = z
  .discriminatedUnion("faviconKind", [
    siteSetupSharedSchema.extend({
      faviconKind: z.literal("single"),
      faviconContentType: z.string().min(3).max(80).optional(),
      faviconBase64: z.string().min(1).optional(),
    }),
    siteSetupSharedSchema.extend({
      faviconKind: z.literal("zip"),
      faviconZipBase64: z.string().min(1).optional(),
    }),
    /** "none" is only valid in edit mode and indicates no favicon change. */
    siteSetupSharedSchema.extend({
      faviconKind: z.literal("none"),
    }),
  ])
  .superRefine((data, ctx) => {
    const mode = data.mode ?? "create";
    // Greenfield must provide logo + favicon files.
    if (mode === "create") {
      if (!data.logoContentType || !data.logoBase64) {
        ctx.addIssue({
          code: "custom",
          message: "logo_required",
          path: ["logoBase64"],
        });
      }
      if (data.faviconKind === "none") {
        ctx.addIssue({
          code: "custom",
          message: "favicon_required",
          path: ["faviconKind"],
        });
      } else if (
        data.faviconKind === "single" &&
        (!data.faviconContentType || !data.faviconBase64)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "favicon_required",
          path: ["faviconBase64"],
        });
      } else if (
        data.faviconKind === "zip" &&
        !("faviconZipBase64" in data ? data.faviconZipBase64 : undefined)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "favicon_required",
          path: ["faviconZipBase64"],
        });
      }
    }
    if (data.logoContentType && !isAcceptedLandingMediaMime(data.logoContentType)) {
      ctx.addIssue({
        code: "custom",
        message: "logo_mime_invalid",
        path: ["logoContentType"],
      });
    }
    if (data.faviconKind === "single") {
      if (
        data.faviconContentType &&
        !isAcceptedLandingMediaMime(data.faviconContentType)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "favicon_mime_invalid",
          path: ["faviconContentType"],
        });
      }
    }
  });

export type CompleteInitialSiteSetupInput = z.infer<
  typeof completeInitialSiteSetupInputSchema
>;

export function decodeSiteSetupFileBase64(payload: string): Uint8Array | null {
  try {
    const buf = Buffer.from(payload, "base64");
    if (buf.length === 0) return null;
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

export function assertSiteSetupFileSize(bytes: Uint8Array): boolean {
  return bytes.byteLength > 0 && bytes.byteLength <= LANDING_MEDIA_MAX_BYTES;
}
