import type { Dictionary } from "@/types/i18n";
import { SiteSetupAcademicsStep } from "@/components/dashboard/admin/site-setup/SiteSetupAcademicsStep";
import { SiteSetupAnalyticsStep } from "@/components/dashboard/admin/site-setup/SiteSetupAnalyticsStep";
import { SiteSetupContactStep } from "@/components/dashboard/admin/site-setup/SiteSetupContactStep";
import { SiteSetupInstituteStep } from "@/components/dashboard/admin/site-setup/SiteSetupInstituteStep";
import { SiteSetupIntroStep } from "@/components/dashboard/admin/site-setup/SiteSetupIntroStep";
import { SiteSetupLegalBillingStep } from "@/components/dashboard/admin/site-setup/SiteSetupLegalBillingStep";
import { SiteSetupReviewStep } from "@/components/dashboard/admin/site-setup/SiteSetupReviewStep";
import { SiteSetupVisualStep } from "@/components/dashboard/admin/site-setup/SiteSetupVisualStep";
import { SiteSetupWizardNav } from "@/components/dashboard/admin/site-setup/SiteSetupWizardNav";
import type { SiteSetupWizardState } from "@/hooks/useSiteSetupWizardState";

type SiteSetupDict = Dictionary["dashboard"]["siteSetup"];

export interface SiteSetupWizardStepPanelsProps {
  step: number;
  totalSteps: number;
  labels: SiteSetupDict;
  busy: boolean;
  state: SiteSetupWizardState;
  hasExistingLogo?: boolean;
  hasExistingFavicon?: boolean;
  onBack: () => void;
  onNext: () => void;
  onFinish: () => void;
}

export function SiteSetupWizardStepPanels({
  step,
  totalSteps,
  labels,
  busy,
  state,
  hasExistingLogo = false,
  hasExistingFavicon = false,
  onBack,
  onNext,
  onFinish,
}: SiteSetupWizardStepPanelsProps) {
  return (
    <div className="vw-wizard-card mt-8 rounded-[var(--layout-border-radius)] p-6">
      {step === 0 ? <SiteSetupIntroStep labels={labels.intro} /> : null}
      {step === 1 ? (
        <SiteSetupInstituteStep
          labels={labels.institute}
          appName={state.appName}
          setAppName={state.setAppName}
          legalName={state.legalName}
          setLegalName={state.setLegalName}
          tagline={state.tagline}
          setTagline={state.setTagline}
          taglineEn={state.taglineEn}
          setTaglineEn={state.setTaglineEn}
          logoAlt={state.logoAlt}
          setLogoAlt={state.setLogoAlt}
          setLogoFile={state.setLogoFile}
          setFaviconFile={state.setFaviconFile}
          initialLogoUrl={state.initial.logoUrl}
          initialFaviconUrl={state.initial.faviconUrl}
          hasExistingLogo={hasExistingLogo}
          hasExistingFavicon={hasExistingFavicon}
        />
      ) : null}
      {step === 2 ? (
        <SiteSetupContactStep
          contact={labels.contact}
          social={labels.social}
          contactEmail={state.contactEmail}
          setContactEmail={state.setContactEmail}
          contactPhone={state.contactPhone}
          setContactPhone={state.setContactPhone}
          contactAddress={state.contactAddress}
          setContactAddress={state.setContactAddress}
          socialFacebook={state.socialFacebook}
          setSocialFacebook={state.setSocialFacebook}
          socialInstagram={state.socialInstagram}
          setSocialInstagram={state.setSocialInstagram}
          socialWhatsapp={state.socialWhatsapp}
          setSocialWhatsapp={state.setSocialWhatsapp}
        />
      ) : null}
      {step === 3 ? (
        <SiteSetupVisualStep
          labels={labels.visual}
          operational={state.operational}
          update={state.updateOperational}
        />
      ) : null}
      {step === 4 ? (
        <SiteSetupAcademicsStep
          labels={labels.academics}
          operational={state.operational}
          update={state.updateOperational}
        />
      ) : null}
      {step === 5 ? (
        <SiteSetupLegalBillingStep
          labels={labels.legalBilling}
          operational={state.operational}
          update={state.updateOperational}
        />
      ) : null}
      {step === 6 ? (
        <SiteSetupAnalyticsStep
          labels={labels.analytics}
          operational={state.operational}
          update={state.updateOperational}
        />
      ) : null}
      {step === 7 ? (
        <SiteSetupReviewStep
          labels={labels.review}
          appName={state.appName}
          legalName={state.legalName}
          tagline={state.tagline}
          contactEmail={state.contactEmail}
          contactPhone={state.contactPhone}
          contactAddress={state.contactAddress}
          socialFacebook={state.socialFacebook}
          socialInstagram={state.socialInstagram}
          socialWhatsapp={state.socialWhatsapp}
        />
      ) : null}

      <SiteSetupWizardNav
        step={step}
        totalSteps={totalSteps}
        labelsButtons={labels.buttons}
        introContinue={labels.intro.continue}
        busy={busy}
        onBack={onBack}
        onNext={onNext}
        onFinish={onFinish}
      />
    </div>
  );
}
