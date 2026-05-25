import { completeInitialSiteSetupAction } from "@/app/[locale]/dashboard/admin/site-setup/siteSetupActions";
import { readImageFileAsBase64 } from "@/components/dashboard/admin/site-setup/readImageFileAsBase64";
import { faviconFileIsZip } from "@/lib/site/faviconUploadFileKind";
import type { SiteSetupOperationalValues } from "@/lib/site/loadSiteSetupCurrentValues";

export type SiteSetupWizardSubmitProgress =
  | { phase: "reading"; percent: number }
  | { phase: "sending" };

export type SiteSetupWizardMode = "create" | "edit";

function flattenOperational(
  op: SiteSetupOperationalValues | undefined,
): Record<string, string | undefined> {
  if (!op) return {};
  const o: Record<string, string | undefined> = {};
  const set = (k: string, v: string) => {
    const trimmed = v.trim();
    if (trimmed) o[k] = trimmed;
  };
  set("visualPrimary", op.visualPrimary);
  set("visualSecondary", op.visualSecondary);
  set("visualAccent", op.visualAccent);
  set("visualBackground", op.visualBackground);
  set("visualSurface", op.visualSurface);
  set("fontPrimary", op.fontPrimary);
  set("fontSecondary", op.fontSecondary);
  set("fontMono", op.fontMono);
  set("layoutMaxWidth", op.layoutMaxWidth);
  set("layoutBorderRadius", op.layoutBorderRadius);
  set("academicsSectionMaxStudents", op.academicsSectionMaxStudents);
  set("academicsSectionMinAttendancePercent", op.academicsSectionMinAttendancePercent);
  set("academicsTeacherPortalRoles", op.academicsTeacherPortalRoles);
  set(
    "attendanceTeacherScanLookbackBufferDays",
    op.attendanceTeacherScanLookbackBufferDays,
  );
  set(
    "attendanceTeacherOperationalCivilLookbackDays",
    op.attendanceTeacherOperationalCivilLookbackDays,
  );
  set(
    "attendanceTeacherOperationalMaxClassDays",
    op.attendanceTeacherOperationalMaxClassDays,
  );
  set(
    "attendanceTeacherFullCourseMaxClassDays",
    op.attendanceTeacherFullCourseMaxClassDays,
  );
  set(
    "attendanceAdminFallbackLookbackDays",
    op.attendanceAdminFallbackLookbackDays,
  );
  set("attendanceAdminMaxClassDays", op.attendanceAdminMaxClassDays);
  set("attendancePickAdjacentCivilDays", op.attendancePickAdjacentCivilDays);
  set(
    "attendanceHasEligibleWindowMaxScans",
    op.attendanceHasEligibleWindowMaxScans,
  );
  set("legalAgeMajority", op.legalAgeMajority);
  set("studentRenewalWarnDays", op.studentRenewalWarnDays);
  set("billingTermEnrollment", op.billingTermEnrollment);
  set("billingTermEnrollmentEn", op.billingTermEnrollmentEn);
  set("billingTermMonthly", op.billingTermMonthly);
  set("billingTermMonthlyEn", op.billingTermMonthlyEn);
  set("billingTermPromotion", op.billingTermPromotion);
  set("billingTermPromotionEn", op.billingTermPromotionEn);
  set("billingCurrency", op.billingCurrency);
  set("analyticsEventNamespace", op.analyticsEventNamespace);
  set("analyticsEventVersion", op.analyticsEventVersion);
  set("analyticsTimezone", op.analyticsTimezone);
  return o;
}

export async function submitSiteSetupWizardClient(args: {
  locale: string;
  themeId: string;
  mode: SiteSetupWizardMode;
  logoFile: File | null;
  faviconFile: File | null;
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
  operational?: SiteSetupOperationalValues;
  onProgress: (p: SiteSetupWizardSubmitProgress) => void;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const {
    onProgress,
    logoFile,
    faviconFile,
    locale,
    themeId,
    mode,
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
    operational,
  } = args;

  // Read files only when provided. In edit mode either may be null.
  const logoData = logoFile
    ? await readImageFileAsBase64(logoFile, {
        onProgress: (r) =>
          onProgress({ phase: "reading", percent: Math.round(r * 50) }),
      })
    : null;
  const favData = faviconFile
    ? await readImageFileAsBase64(faviconFile, {
        onProgress: (r) =>
          onProgress({
            phase: "reading",
            percent: Math.round(50 + r * 50),
          }),
      })
    : null;

  onProgress({ phase: "sending" });

  const common = {
    locale,
    themeId,
    mode,
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
    logoContentType: logoData?.mime || (logoFile ? "image/png" : undefined),
    logoBase64: logoData?.base64,
    ...flattenOperational(operational),
  };

  const favZip = faviconFile ? faviconFileIsZip(faviconFile) : false;

  const res = faviconFile
    ? favZip
      ? await completeInitialSiteSetupAction({
          ...common,
          faviconKind: "zip",
          faviconZipBase64: favData?.base64,
        })
      : await completeInitialSiteSetupAction({
          ...common,
          faviconKind: "single",
          faviconContentType: favData?.mime || "image/png",
          faviconBase64: favData?.base64,
        })
    : await completeInitialSiteSetupAction({
        ...common,
        faviconKind: "none",
      });

  if (!res.ok) return { ok: false, code: res.code };
  return { ok: true };
}
