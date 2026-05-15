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
import { useSiteSetupWizardState } from "@/hooks/useSiteSetupWizardState";
import type { SiteSetupCurrentValues } from "@/lib/site/loadSiteSetupCurrentValues";

type SiteSetupDict = Dictionary["dashboard"]["siteSetup"];

export type SiteSetupWizardMode = "create" | "edit";

interface SiteSetupWizardProps {
  locale: string;
  themeId: string;
  labels: SiteSetupDict;
  platformCredit: string;
  platformCreditAria: string;
  /** When omitted we behave as greenfield ("create"). */
  mode?: SiteSetupWizardMode;
  /** Preloaded values for re-edition. Required when `mode === "edit"`. */
  initialValues?: SiteSetupCurrentValues;
}

const STEPS = 8;

export function SiteSetupWizard({
  locale,
  themeId,
  labels,
  platformCredit,
  platformCreditAria,
  mode = "create",
  initialValues,
}: SiteSetupWizardProps) {
  const router = useRouter();
  const state = useSiteSetupWizardState(initialValues);
  const { initial } = state;
  const hasExistingLogo = mode === "edit" && initial.rawLogoPath.length > 0;
  const hasExistingFavicon =
    mode === "edit" && initial.rawFaviconPath.length > 0;

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
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
      if (!state.logoFile && !hasExistingLogo) {
        setErrorKey("logo_required");
        return;
      }
      if (!state.faviconFile && !hasExistingFavicon) {
        setErrorKey("favicon_required");
        return;
      }
      if (
        !state.appName.trim() ||
        !state.legalName.trim() ||
        !state.tagline.trim()
      ) {
        setErrorKey("invalid_input");
        return;
      }
      state.setLogoAlt(state.logoAlt.trim() || state.appName.trim());
    }
    if (step === 2) {
      if (
        !state.contactEmail.trim() ||
        !state.contactPhone.trim() ||
        !state.contactAddress.trim()
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
    if (mode === "create" && (!state.logoFile || !state.faviconFile)) {
      setErrorKey("invalid_input");
      return;
    }
    setBusy(true);
    setErrorKey(null);
    setSubmitProgress(null);
    try {
      const alt = state.logoAlt.trim() || state.appName.trim();
      const result = await submitSiteSetupWizardClient({
        locale,
        themeId,
        mode,
        logoFile: state.logoFile,
        faviconFile: state.faviconFile,
        logoAlt: alt,
        appName: state.appName,
        legalName: state.legalName,
        tagline: state.tagline,
        taglineEn: state.taglineEn,
        contactEmail: state.contactEmail,
        contactPhone: state.contactPhone,
        contactAddress: state.contactAddress,
        socialFacebook: state.socialFacebook,
        socialInstagram: state.socialInstagram,
        socialWhatsapp: state.socialWhatsapp,
        operational: state.operational,
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
        state={state}
        hasExistingLogo={hasExistingLogo}
        hasExistingFavicon={hasExistingFavicon}
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
