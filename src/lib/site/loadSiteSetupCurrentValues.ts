import { getProperty } from "@/lib/theme/themeParser";
import { loadEffectiveProperties } from "@/lib/theme/loadEffectiveProperties";
import { loadAcademicsSectionDefaults } from "@/lib/academics/loadAcademicsSectionDefaults";
import { loadBillingCurrencySetting } from "@/lib/billing/loadBillingCurrencySetting";
import { createClient } from "@/lib/supabase/server";
import { resolveBrandAssetUrl } from "@/lib/brand/resolveBrandAssetUrl";

const LOGO_FALLBACK = "/images/logo.png";
const FAV_FALLBACK = "/favicon_io/favicon.ico";

/** Operational settings exposed by the wizard. Stored in `site_settings` once
 *  Phase 4 ships; for now they are read from `loadEffectiveProperties()` so the
 *  wizard always reflects the system defaults for greenfield tenants. */
export interface SiteSetupOperationalValues {
  visualPrimary: string;
  visualSecondary: string;
  visualAccent: string;
  visualBackground: string;
  visualSurface: string;
  fontPrimary: string;
  fontSecondary: string;
  fontMono: string;
  layoutMaxWidth: string;
  layoutBorderRadius: string;
  academicsSectionMaxStudents: string;
  academicsSectionMinAttendancePercent: string;
  academicsTeacherPortalRoles: string;
  attendanceTeacherScanLookbackBufferDays: string;
  attendanceTeacherOperationalCivilLookbackDays: string;
  attendanceTeacherOperationalMaxClassDays: string;
  attendanceTeacherFullCourseMaxClassDays: string;
  attendanceAdminFallbackLookbackDays: string;
  attendanceAdminMaxClassDays: string;
  attendancePickAdjacentCivilDays: string;
  attendanceHasEligibleWindowMaxScans: string;
  legalAgeMajority: string;
  studentRenewalWarnDays: string;
  billingTermEnrollment: string;
  billingTermEnrollmentEn: string;
  billingTermMonthly: string;
  billingTermMonthlyEn: string;
  billingTermPromotion: string;
  billingTermPromotionEn: string;
  billingCurrency: string;
  analyticsEventNamespace: string;
  analyticsEventVersion: string;
  analyticsTimezone: string;
}

export interface SiteSetupCurrentValues {
  appName: string;
  legalName: string;
  tagline: string;
  taglineEn: string;
  logoAlt: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  socialFacebook: string;
  socialInstagram: string;
  socialWhatsapp: string;
  /** Public URL (resolved via Storage / static path) for the logo currently
   *  saved on the active theme. Empty string when greenfield. */
  logoUrl: string;
  /** Public URL of the currently saved favicon. Empty string when greenfield. */
  faviconUrl: string;
  /** Raw `app.logo.path` value (path, not URL). Used by the wizard to know
   *  whether a logo file is already saved so it can mark the upload optional. */
  rawLogoPath: string;
  /** Raw `app.favicon.path` value. */
  rawFaviconPath: string;
  /** Operational defaults shown in the visual/academic/legal/analytics steps. */
  operational: SiteSetupOperationalValues;
}

/**
 * Returns the values currently saved for the active site theme so the wizard
 * can preload its fields in re-edit mode. In greenfield (no overrides), the
 * values come from `SYSTEM_PROPERTIES_DEFAULTS`; in an already-configured
 * tenant they come from the merged `system + site_themes.properties`.
 *
 * Server-only — uses `loadEffectiveProperties()` which talks to Supabase.
 */
export async function loadSiteSetupCurrentValues(): Promise<SiteSetupCurrentValues> {
  const supabase = await createClient();
  const [{ properties }, sectionDefaults, billingCurrency] = await Promise.all([
    loadEffectiveProperties(),
    loadAcademicsSectionDefaults(),
    loadBillingCurrencySetting(supabase),
  ]);

  const rawLogo = getProperty(properties, "app.logo.path");
  const rawFav = getProperty(properties, "app.favicon.path");
  const g = (k: string) => getProperty(properties, k);

  return {
    appName: g("app.name"),
    legalName: g("app.legal.name"),
    tagline: g("app.tagline"),
    taglineEn: g("app.tagline.en"),
    logoAlt: g("app.logo.alt"),
    contactEmail: g("contact.email"),
    contactPhone: g("contact.phone"),
    contactAddress: g("contact.address"),
    socialFacebook: g("social.facebook"),
    socialInstagram: g("social.instagram"),
    socialWhatsapp: g("social.whatsapp"),
    logoUrl: resolveBrandAssetUrl(rawLogo, LOGO_FALLBACK),
    faviconUrl: resolveBrandAssetUrl(rawFav, FAV_FALLBACK),
    rawLogoPath: rawLogo,
    rawFaviconPath: rawFav,
    operational: {
      visualPrimary: g("color.primary"),
      visualSecondary: g("color.secondary"),
      visualAccent: g("color.accent"),
      visualBackground: g("color.background"),
      visualSurface: g("color.surface"),
      fontPrimary: g("font.primary"),
      fontSecondary: g("font.secondary"),
      fontMono: g("font.mono"),
      layoutMaxWidth: g("layout.max.width"),
      layoutBorderRadius: g("layout.border.radius"),
      academicsSectionMaxStudents: g("academics.section.max_students"),
      academicsSectionMinAttendancePercent: String(sectionDefaults.minAttendancePercent),
      academicsTeacherPortalRoles: g(
        "academics.teacherPortal.allowedProfileRoles",
      ),
      attendanceTeacherScanLookbackBufferDays: g(
        "academics.attendance.matrix.teacher.scanLookbackBufferDays",
      ),
      attendanceTeacherOperationalCivilLookbackDays: g(
        "academics.attendance.matrix.teacher.operationalCivilLookbackDays",
      ),
      attendanceTeacherOperationalMaxClassDays: g(
        "academics.attendance.matrix.teacher.operationalMaxClassDays",
      ),
      attendanceTeacherFullCourseMaxClassDays: g(
        "academics.attendance.matrix.teacher.fullCourseMaxClassDays",
      ),
      attendanceAdminFallbackLookbackDays: g(
        "academics.attendance.matrix.admin.fallbackLookbackDays",
      ),
      attendanceAdminMaxClassDays: g(
        "academics.attendance.matrix.admin.maxClassDays",
      ),
      attendancePickAdjacentCivilDays: g(
        "academics.attendance.matrix.pickAdjacentCivilDays",
      ),
      attendanceHasEligibleWindowMaxScans: g(
        "academics.attendance.matrix.hasEligibleWindowMaxScans",
      ),
      legalAgeMajority: g("legal.age.majority"),
      studentRenewalWarnDays: g("student.enrollment.renewal.warn.days"),
      billingTermEnrollment: g("billing.term.enrollment"),
      billingTermEnrollmentEn: g("billing.term.enrollment.en"),
      billingTermMonthly: g("billing.term.monthly"),
      billingTermMonthlyEn: g("billing.term.monthly.en"),
      billingTermPromotion: g("billing.term.promotion"),
      billingTermPromotionEn: g("billing.term.promotion.en"),
      billingCurrency: billingCurrency.currency,
      analyticsEventNamespace: g("analytics.event.namespace"),
      analyticsEventVersion: g("analytics.event.version"),
      analyticsTimezone: g("analytics.timezone"),
    },
  };
}
