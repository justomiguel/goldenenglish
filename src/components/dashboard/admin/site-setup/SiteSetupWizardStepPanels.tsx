import type { Dictionary } from "@/types/i18n";
import { SiteSetupContactStep } from "@/components/dashboard/admin/site-setup/SiteSetupContactStep";
import { SiteSetupInstituteStep } from "@/components/dashboard/admin/site-setup/SiteSetupInstituteStep";
import { SiteSetupIntroStep } from "@/components/dashboard/admin/site-setup/SiteSetupIntroStep";
import { SiteSetupReviewStep } from "@/components/dashboard/admin/site-setup/SiteSetupReviewStep";
import { SiteSetupWizardNav } from "@/components/dashboard/admin/site-setup/SiteSetupWizardNav";

type SiteSetupDict = Dictionary["dashboard"]["siteSetup"];

export interface SiteSetupWizardStepPanelsProps {
  step: number;
  totalSteps: number;
  labels: SiteSetupDict;
  busy: boolean;
  appName: string;
  setAppName: (v: string) => void;
  legalName: string;
  setLegalName: (v: string) => void;
  tagline: string;
  setTagline: (v: string) => void;
  taglineEn: string;
  setTaglineEn: (v: string) => void;
  logoAlt: string;
  setLogoAlt: (v: string) => void;
  setLogoFile: (f: File | null) => void;
  setFaviconFile: (f: File | null) => void;
  contactEmail: string;
  setContactEmail: (v: string) => void;
  contactPhone: string;
  setContactPhone: (v: string) => void;
  contactAddress: string;
  setContactAddress: (v: string) => void;
  socialFacebook: string;
  setSocialFacebook: (v: string) => void;
  socialInstagram: string;
  setSocialInstagram: (v: string) => void;
  socialWhatsapp: string;
  setSocialWhatsapp: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
  onFinish: () => void;
}

export function SiteSetupWizardStepPanels({
  step,
  totalSteps,
  labels,
  busy,
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
  setLogoFile,
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
