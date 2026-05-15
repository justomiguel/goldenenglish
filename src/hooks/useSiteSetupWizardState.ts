"use client";

import { useState } from "react";
import type {
  SiteSetupCurrentValues,
  SiteSetupOperationalValues,
} from "@/lib/site/loadSiteSetupCurrentValues";

const EMPTY_OPERATIONAL: SiteSetupOperationalValues = {
  visualPrimary: "",
  visualSecondary: "",
  visualAccent: "",
  visualBackground: "",
  visualSurface: "",
  fontPrimary: "",
  fontSecondary: "",
  fontMono: "",
  layoutMaxWidth: "",
  layoutBorderRadius: "",
  academicsSectionMaxStudents: "",
  academicsTeacherPortalRoles: "",
  attendanceTeacherScanLookbackBufferDays: "",
  attendanceTeacherOperationalCivilLookbackDays: "",
  attendanceTeacherOperationalMaxClassDays: "",
  attendanceTeacherFullCourseMaxClassDays: "",
  attendanceAdminFallbackLookbackDays: "",
  attendanceAdminMaxClassDays: "",
  attendancePickAdjacentCivilDays: "",
  attendanceHasEligibleWindowMaxScans: "",
  legalAgeMajority: "",
  studentRenewalWarnDays: "",
  billingTermEnrollment: "",
  billingTermEnrollmentEn: "",
  billingTermMonthly: "",
  billingTermMonthlyEn: "",
  billingTermPromotion: "",
  billingTermPromotionEn: "",
  analyticsEventNamespace: "",
  analyticsEventVersion: "",
  analyticsTimezone: "",
};

const EMPTY_INITIAL: SiteSetupCurrentValues = {
  appName: "",
  legalName: "",
  tagline: "",
  taglineEn: "",
  logoAlt: "",
  contactEmail: "",
  contactPhone: "",
  contactAddress: "",
  socialFacebook: "",
  socialInstagram: "",
  socialWhatsapp: "",
  logoUrl: "",
  faviconUrl: "",
  rawLogoPath: "",
  rawFaviconPath: "",
  operational: EMPTY_OPERATIONAL,
};

/**
 * Encapsulates the wizard form state so `SiteSetupWizard.tsx` stays focused on
 * orchestration (validation per step, submit, error handling). Splitting the
 * hook out keeps every file inside the 250-line architectural budget while the
 * wizard grows to cover branding, contact, social, visual, academic, legal /
 * billing and analytics inputs.
 */
export function useSiteSetupWizardState(
  initialValues: SiteSetupCurrentValues | undefined,
) {
  const initial = initialValues ?? EMPTY_INITIAL;
  const op = initial.operational ?? EMPTY_OPERATIONAL;

  const [appName, setAppName] = useState(initial.appName);
  const [legalName, setLegalName] = useState(initial.legalName);
  const [tagline, setTagline] = useState(initial.tagline);
  const [taglineEn, setTaglineEn] = useState(initial.taglineEn);
  const [logoAlt, setLogoAlt] = useState(initial.logoAlt);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  const [contactEmail, setContactEmail] = useState(initial.contactEmail);
  const [contactPhone, setContactPhone] = useState(initial.contactPhone);
  const [contactAddress, setContactAddress] = useState(initial.contactAddress);
  const [socialFacebook, setSocialFacebook] = useState(initial.socialFacebook);
  const [socialInstagram, setSocialInstagram] = useState(
    initial.socialInstagram,
  );
  const [socialWhatsapp, setSocialWhatsapp] = useState(initial.socialWhatsapp);

  const [operational, setOperational] = useState(op);

  const updateOperational = <K extends keyof SiteSetupOperationalValues>(
    key: K,
    value: SiteSetupOperationalValues[K],
  ) => setOperational((prev) => ({ ...prev, [key]: value }));

  return {
    initial,
    appName,
    setAppName,
    legalName,
    setLegalName,
    tagline,
    setTagline,
    taglineEn,
    setTaglineEn,
    logoAlt,
    setLogoAlt,
    logoFile,
    setLogoFile,
    faviconFile,
    setFaviconFile,
    contactEmail,
    setContactEmail,
    contactPhone,
    setContactPhone,
    contactAddress,
    setContactAddress,
    socialFacebook,
    setSocialFacebook,
    socialInstagram,
    setSocialInstagram,
    socialWhatsapp,
    setSocialWhatsapp,
    operational,
    updateOperational,
  };
}

export type SiteSetupWizardState = ReturnType<typeof useSiteSetupWizardState>;
