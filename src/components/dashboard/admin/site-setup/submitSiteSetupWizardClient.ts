import { completeInitialSiteSetupAction } from "@/app/[locale]/dashboard/admin/site-setup/siteSetupActions";
import { readImageFileAsBase64 } from "@/components/dashboard/admin/site-setup/readImageFileAsBase64";
import { faviconFileIsZip } from "@/lib/site/faviconUploadFileKind";

export type SiteSetupWizardSubmitProgress =
  | { phase: "reading"; percent: number }
  | { phase: "sending" };

export async function submitSiteSetupWizardClient(args: {
  locale: string;
  themeId: string;
  logoFile: File;
  faviconFile: File;
  logoAlt: string;
  appName: string;
  legalName: string;
  tagline: string;
  taglineEn?: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  socialFacebook?: string;
  socialInstagram?: string;
  socialWhatsapp?: string;
  onProgress: (p: SiteSetupWizardSubmitProgress) => void;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const {
    onProgress,
    logoFile,
    faviconFile,
    locale,
    themeId,
    logoAlt,
    appName,
    legalName,
    tagline,
    taglineEn,
    contactEmail,
    contactPhone,
    contactAddress,
    socialFacebook,
    socialInstagram,
    socialWhatsapp,
  } = args;

  const logoData = await readImageFileAsBase64(logoFile, {
    onProgress: (r) =>
      onProgress({ phase: "reading", percent: Math.round(r * 50) }),
  });

  const favData = await readImageFileAsBase64(faviconFile, {
    onProgress: (r) =>
      onProgress({ phase: "reading", percent: Math.round(50 + r * 50) }),
  });

  onProgress({ phase: "sending" });

  const favZip = faviconFileIsZip(faviconFile);
  const common = {
    locale,
    themeId,
    appName: appName.trim(),
    legalName: legalName.trim(),
    tagline: tagline.trim(),
    taglineEn: taglineEn?.trim() || undefined,
    logoAlt: logoAlt.trim(),
    contactEmail: contactEmail.trim(),
    contactPhone: contactPhone.trim(),
    contactAddress: contactAddress.trim(),
    socialFacebook: socialFacebook?.trim() || undefined,
    socialInstagram: socialInstagram?.trim() || undefined,
    socialWhatsapp: socialWhatsapp?.trim() || undefined,
    logoContentType: logoData.mime || "image/png",
    logoBase64: logoData.base64,
  };

  const res = favZip
    ? await completeInitialSiteSetupAction({
        ...common,
        faviconKind: "zip",
        faviconZipBase64: favData.base64,
      })
    : await completeInitialSiteSetupAction({
        ...common,
        faviconKind: "single",
        faviconContentType: favData.mime || "image/png",
        faviconBase64: favData.base64,
      });

  if (!res.ok) return { ok: false, code: res.code };
  return { ok: true };
}
