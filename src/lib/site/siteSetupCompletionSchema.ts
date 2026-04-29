import { z } from "zod";
import {
  isAcceptedLandingMediaMime,
  LANDING_MEDIA_MAX_BYTES,
} from "@/lib/cms/siteThemeLandingInputSchemas";

/** Empty string or omitted → skip URL validation. */
const optionalHttpUrl = z.preprocess(
  (raw) => {
    if (raw === undefined || raw === null) return undefined;
    if (typeof raw === "string" && raw.trim() === "") return undefined;
    return raw;
  },
  z.string().trim().max(500).url().optional(),
);

export const completeInitialSiteSetupInputSchema = z
  .object({
    locale: z.string().min(2).max(12),
    themeId: z.string().uuid(),
    appName: z.string().trim().min(1).max(120),
    legalName: z.string().trim().min(1).max(200),
    tagline: z.string().trim().min(1).max(300),
    taglineEn: z.string().trim().max(300).optional(),
    logoAlt: z.string().trim().min(1).max(200),
    contactEmail: z.string().trim().email().max(200),
    contactPhone: z.string().trim().min(3).max(80),
    contactAddress: z.string().trim().min(3).max(400),
    socialFacebook: optionalHttpUrl,
    socialInstagram: optionalHttpUrl,
    socialWhatsapp: optionalHttpUrl,
    logoContentType: z.string().min(3).max(80),
    logoBase64: z.string().min(1),
    faviconContentType: z.string().min(3).max(80),
    faviconBase64: z.string().min(1),
  })
  .superRefine((data, ctx) => {
    if (!isAcceptedLandingMediaMime(data.logoContentType)) {
      ctx.addIssue({
        code: "custom",
        message: "logo_mime_invalid",
        path: ["logoContentType"],
      });
    }
    if (!isAcceptedLandingMediaMime(data.faviconContentType)) {
      ctx.addIssue({
        code: "custom",
        message: "favicon_mime_invalid",
        path: ["faviconContentType"],
      });
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
