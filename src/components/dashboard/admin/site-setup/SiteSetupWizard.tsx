"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { Dictionary } from "@/types/i18n";
import { completeInitialSiteSetupAction } from "@/app/[locale]/dashboard/admin/site-setup/siteSetupActions";
import { SiteSetupContactStep } from "@/components/dashboard/admin/site-setup/SiteSetupContactStep";
import { SiteSetupInstituteStep } from "@/components/dashboard/admin/site-setup/SiteSetupInstituteStep";
import { SiteSetupIntroStep } from "@/components/dashboard/admin/site-setup/SiteSetupIntroStep";
import { SiteSetupReviewStep } from "@/components/dashboard/admin/site-setup/SiteSetupReviewStep";
import { SiteSetupWizardNav } from "@/components/dashboard/admin/site-setup/SiteSetupWizardNav";
import { readImageFileAsBase64 } from "@/components/dashboard/admin/site-setup/readImageFileAsBase64";

type SiteSetupDict = Dictionary["dashboard"]["siteSetup"];

interface SiteSetupWizardProps {
  locale: string;
  themeId: string;
  labels: SiteSetupDict;
}

const STEPS = 4;

export function SiteSetupWizard({ locale, themeId, labels }: SiteSetupWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const [appName, setAppName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [tagline, setTagline] = useState("");
  const [taglineEn, setTaglineEn] = useState("");
  const [logoAlt, setLogoAlt] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialWhatsapp, setSocialWhatsapp] = useState("");

  const stepLabel = useMemo(() => {
    return labels.stepLabel
      .replace("{{current}}", String(step + 1))
      .replace("{{total}}", String(STEPS));
  }, [labels.stepLabel, step]);

  const resolveError = useCallback(
    (code: string) => {
      const map = labels.errors as Record<string, string>;
      return map[code] ?? labels.errors.generic;
    },
    [labels.errors],
  );

  const goNext = () => {
    setErrorKey(null);
    if (step === 1) {
      if (!logoFile) {
        setErrorKey("logo_required");
        return;
      }
      if (!faviconFile) {
        setErrorKey("favicon_required");
        return;
      }
      if (!appName.trim() || !legalName.trim() || !tagline.trim()) {
        setErrorKey("invalid_input");
        return;
      }
      const alt = logoAlt.trim() || appName.trim();
      setLogoAlt(alt);
    }
    if (step === 2) {
      if (
        !contactEmail.trim() ||
        !contactPhone.trim() ||
        !contactAddress.trim()
      ) {
        setErrorKey("invalid_input");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS - 1));
  };

  const goBack = () => {
    setErrorKey(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const finish = async () => {
    if (!logoFile || !faviconFile) {
      setErrorKey("invalid_input");
      return;
    }
    setBusy(true);
    setErrorKey(null);
    try {
      const logoData = await readImageFileAsBase64(logoFile);
      const favData = await readImageFileAsBase64(faviconFile);
      const alt = logoAlt.trim() || appName.trim();
      const res = await completeInitialSiteSetupAction({
        locale,
        themeId,
        appName: appName.trim(),
        legalName: legalName.trim(),
        tagline: tagline.trim(),
        taglineEn: taglineEn.trim() || undefined,
        logoAlt: alt,
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        contactAddress: contactAddress.trim(),
        socialFacebook: socialFacebook.trim() || undefined,
        socialInstagram: socialInstagram.trim() || undefined,
        socialWhatsapp: socialWhatsapp.trim() || undefined,
        logoContentType: logoData.mime || "image/png",
        logoBase64: logoData.base64,
        faviconContentType: favData.mime || "image/png",
        faviconBase64: favData.base64,
      });
      if (!res.ok) {
        setErrorKey(res.code);
        return;
      }
      router.replace(`/${locale}/dashboard/admin`);
      router.refresh();
    } catch {
      setErrorKey("generic");
    } finally {
      setBusy(false);
    }
  };

  const errorMessage = errorKey
    ? errorKey === "logo_required"
      ? labels.institute.logoRequired
      : errorKey === "favicon_required"
        ? labels.institute.faviconRequired
        : resolveError(errorKey)
    : null;

  return (
    <div className="mx-auto max-w-2xl">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {stepLabel}
      </p>
      <h1 className="font-display text-2xl font-semibold text-[var(--color-primary)]">
        {labels.pageTitle}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
        {labels.pageLead}
      </p>

      {errorMessage ? (
        <p
          className="mt-4 rounded-[var(--layout-border-radius)] border border-[var(--color-error)] bg-[var(--color-muted)] px-3 py-2 text-sm text-[var(--color-error)]"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-8 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        {step === 0 ? <SiteSetupIntroStep labels={labels.intro} /> : null}
        {step === 1 ? (
          <SiteSetupInstituteStep
            labels={labels.institute}
            appName={appName}
            setAppName={setAppName}
            legalName={legalName}
            setLegalName={setLegalName}
            tagline={tagline}
            setTagline={setTagline}
            taglineEn={taglineEn}
            setTaglineEn={setTaglineEn}
            logoAlt={logoAlt}
            setLogoAlt={setLogoAlt}
            setLogoFile={setLogoFile}
            setFaviconFile={setFaviconFile}
          />
        ) : null}
        {step === 2 ? (
          <SiteSetupContactStep
            contact={labels.contact}
            social={labels.social}
            contactEmail={contactEmail}
            setContactEmail={setContactEmail}
            contactPhone={contactPhone}
            setContactPhone={setContactPhone}
            contactAddress={contactAddress}
            setContactAddress={setContactAddress}
            socialFacebook={socialFacebook}
            setSocialFacebook={setSocialFacebook}
            socialInstagram={socialInstagram}
            setSocialInstagram={setSocialInstagram}
            socialWhatsapp={socialWhatsapp}
            setSocialWhatsapp={setSocialWhatsapp}
          />
        ) : null}
        {step === 3 ? (
          <SiteSetupReviewStep
            labels={labels.review}
            appName={appName}
            legalName={legalName}
            tagline={tagline}
            contactEmail={contactEmail}
            contactPhone={contactPhone}
            contactAddress={contactAddress}
            socialFacebook={socialFacebook}
            socialInstagram={socialInstagram}
            socialWhatsapp={socialWhatsapp}
          />
        ) : null}

        <SiteSetupWizardNav
          step={step}
          totalSteps={STEPS}
          labelsButtons={labels.buttons}
          introContinue={labels.intro.continue}
          busy={busy}
          onBack={goBack}
          onNext={goNext}
          onFinish={finish}
        />
      </div>
    </div>
  );
}
