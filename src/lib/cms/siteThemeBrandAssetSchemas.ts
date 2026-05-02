import { z } from "zod";
import { siteThemeIdSchema } from "@/lib/cms/siteThemeInputSchemas";
import {
  isAcceptedLandingMediaMime,
} from "@/lib/cms/siteThemeLandingInputSchemas";

const localeId = {
  locale: z.string().min(2),
  id: siteThemeIdSchema,
} as const;

export const uploadSiteThemeLogoFromEditorSchema = z
  .object({
    ...localeId,
    contentType: z.string().min(3).max(80),
    fileBase64: z.string().min(1),
    logoAlt: z.string().trim().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (!isAcceptedLandingMediaMime(data.contentType)) {
      ctx.addIssue({
        code: "custom",
        message: "mime_invalid",
        path: ["contentType"],
      });
    }
  });

export type UploadSiteThemeLogoFromEditorInput = z.infer<
  typeof uploadSiteThemeLogoFromEditorSchema
>;

export const uploadSiteThemeFaviconFromEditorSchema = z
  .discriminatedUnion("faviconKind", [
    z
      .object({
        ...localeId,
        faviconKind: z.literal("single"),
        faviconContentType: z.string().min(3).max(80),
        faviconBase64: z.string().min(1),
      })
      .superRefine((data, ctx) => {
        if (!isAcceptedLandingMediaMime(data.faviconContentType)) {
          ctx.addIssue({
            code: "custom",
            message: "mime_invalid",
            path: ["faviconContentType"],
          });
        }
      }),
    z.object({
      ...localeId,
      faviconKind: z.literal("zip"),
      faviconZipBase64: z.string().min(1),
    }),
  ]);

export type UploadSiteThemeFaviconFromEditorInput = z.infer<
  typeof uploadSiteThemeFaviconFromEditorSchema
>;
