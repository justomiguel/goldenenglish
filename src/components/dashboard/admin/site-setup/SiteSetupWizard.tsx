"use client";

import "./vargasWizardDesignTokens.css";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { Dictionary } from "@/types/i18n";
import { SiteSetupWizardErrorAlert } from "@/components/dashboard/admin/site-setup/SiteSetupWizardErrorAlert";
import { SiteSetupWizardStepPanels } from "@/components/dashboard/admin/site-setup/SiteSetupWizardStepPanels";
import {
  submitSiteSetupWizardClient,
  type SiteSetupWizardSubmitProgress,
} from "@/components/dashboard/admin/site-setup/submitSiteSetupWizardClient";
import { InlineUploadProgressBar } from "@/components/molecules/InlineUploadProgressBar";

type SiteSetupDict = Dictionary["dashboard"]["siteSetup"];

interface SiteSetupWizardProps {
  locale: string;
  themeId: string;
  labels: SiteSetupDict;
  platformCredit: string;
  platformCreditAria: string;
}

const STEPS = 4;

export function SiteSetupWizard({
  locale,
  themeId,
  labels,
  platformCredit,
  platformCreditAria,
}: SiteSetupWizardProps) {
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

  const [submitProgress, setSubmitProgress] =
    useState<SiteSetupWizardSubmitProgress | null>(null);

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
    setSubmitProgress(null);
    try {
      const alt = logoAlt.trim() || appName.trim();
      const result = await submitSiteSetupWizardClient({
        locale,
        themeId,
        logoFile,
        faviconFile,
        logoAlt: alt,
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
        onProgress: setSubmitProgress,
      });
      if (!result.ok) {
        setErrorKey(result.code);
        return;
      }
      router.replace(`/${locale}/dashboard/admin`);
      router.refresh();
    } catch {
      setErrorKey("generic");
    } finally {
      setBusy(false);
      setSubmitProgress(null);
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
    <section
      data-ge-design-system="vargas-wizard"
      className="vw-wizard-shell mx-auto w-full max-w-2xl px-4 py-8 md:py-12"
    >
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
        <SiteSetupWizardErrorAlert message={errorMessage} />
      ) : null}

      {submitProgress ? (
        <div className="mt-4">
          <InlineUploadProgressBar
            className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 shadow-[var(--shadow-soft)]"
            label={
              submitProgress.phase === "reading"
                ? labels.uploadProgressReading
                : labels.uploadProgressSending
            }
            {...(submitProgress.phase === "reading"
              ? { value: submitProgress.percent, indeterminate: false }
              : { indeterminate: true })}
          />
        </div>
      ) : null}

      <SiteSetupWizardStepPanels
        step={step}
        totalSteps={STEPS}
        labels={labels}
        busy={busy}
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
        onBack={goBack}
        onNext={goNext}
        onFinish={finish}
      />

      <p
        className="mt-6 text-center text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--color-primary)]"
        aria-label={platformCreditAria}
      >
        {platformCredit}
      </p>
    </section>
  );
}
