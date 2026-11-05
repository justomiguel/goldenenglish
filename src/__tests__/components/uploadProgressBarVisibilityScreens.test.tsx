// REGRESSION CHECK: Account and site upload bars stay hidden until a file is in flight.
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminBadgeImageEditor } from "@/components/dashboard/admin/badges/AdminBadgeImageEditor";
import { LandingMediaSlotEditor } from "@/components/dashboard/admin/cms/LandingMediaSlotEditor";
import { SiteThemeBrandAssetsPanel } from "@/components/dashboard/admin/cms/SiteThemeBrandAssetsPanel";
import { SiteSetupWizard } from "@/components/dashboard/admin/site-setup/SiteSetupWizard";
import { ProfileAvatarChangeFab } from "@/components/molecules/ProfileAvatarChangeFab";
import { PulsarProfileForm } from "@/components/organisms/pulsar/PulsarProfileForm";
import { RegistrationMatriculaPayActions } from "@/components/register/RegistrationMatriculaPayActions";
import { dictEn } from "@/test/dictEn";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/en",
}));

vi.mock("@/app/[locale]/matricula/matriculaPayActions", () => ({
  startRegistrationEnrollmentFlowAction: vi.fn(),
  startRegistrationEnrollmentMercadoPagoAction: vi.fn(),
  switchRegistrationPaySectionAction: vi.fn(),
  uploadRegistrationEnrollmentReceiptAction: vi.fn(),
}));

vi.mock("@/app/[locale]/clase-prueba/trialFeePayActions", () => ({
  startTrialFeeFlowAction: vi.fn(),
  startTrialFeeMercadoPagoAction: vi.fn(),
}));

vi.mock("@/app/[locale]/cuenta/profileActions", () => ({
  savePulsarProfileAction: vi.fn(),
}));

vi.mock("@/app/[locale]/dashboard/admin/badges/imageBadgeActions", () => ({
  clearBadgeImageAction: vi.fn(),
  uploadBadgeImageAction: vi.fn(),
}));

vi.mock("@/app/[locale]/dashboard/admin/cms/siteThemeMediaActions", () => ({
  deleteSiteThemeMediaAction: vi.fn(),
  uploadSiteThemeMediaAction: vi.fn(),
}));

vi.mock("@/app/[locale]/dashboard/admin/cms/siteThemeBrandAssetActions", () => ({
  uploadSiteThemeFaviconFromEditorAction: vi.fn(),
  uploadSiteThemeLogoFromEditorAction: vi.fn(),
}));

function expectNoBar() {
  expect(screen.queryByRole("progressbar")).toBeNull();
}

describe("upload progress bar visibility on account and site screens", () => {
  it("hides the bar before an account or badge file is chosen", () => {
    const { unmount } = render(
      <PulsarProfileForm
        locale="en"
        email="a@b.c"
        displayName="Ada"
        phone=""
        avatarUrl={null}
        copy={dictEn.pulsar.profile}
      />,
    );
    expectNoBar();
    unmount();

    render(
      <ProfileAvatarChangeFab
        locale="en"
        displayName="Ada"
        avatarDisplayUrl={null}
        labels={dictEn.dashboard.myProfile}
        fileUploadProgress={dictEn.common.fileUpload}
      />,
    );
    expectNoBar();

    render(
      <AdminBadgeImageEditor
        locale="en"
        badgeId="badge-1"
        currentImageUrl={null}
        labels={dictEn.admin.badges}
        fileUploadProgress={dictEn.common.fileUpload}
      />,
    );
    expectNoBar();

    render(
      <RegistrationMatriculaPayActions
        locale="en"
        token="token"
        sectionLabel="A"
        methods={["transfer"]}
        transferInstructions="Bank"
        alternatives={[]}
        showPay
        showSwitch={false}
        labels={{
          flow: "Flow",
          mercadoPago: "MP",
          transfer: "Transfer",
          transferHint: "Hint",
          uploadButton: "Upload",
          pickSection: "Pick",
          error: "Error",
          receiptOk: "Saved",
        }}
      />,
    );
    expectNoBar();
  });

  it("hides the bar on idle site media controls", () => {
    const { unmount } = render(
      <LandingMediaSlotEditor
        locale="en"
        themeId="theme-1"
        section="inicio"
        slot={{ position: 1, current: null, currentPublicUrl: null, fallbackPublicUrl: "/images/fallback.png" }}
        labels={dictEn.admin.cms.templates.landing}
        fileUploadProgress={dictEn.common.fileUpload}
        onChanged={vi.fn()}
      />,
    );
    expectNoBar();
    unmount();

    render(
      <SiteThemeBrandAssetsPanel
        locale="en"
        themeId="theme-1"
        labels={dictEn.admin.cms.templates.editor.brandAssets}
        errorLabels={dictEn.admin.cms.templates.editor.errors}
        logoPathDraft=""
        faviconPathDraft=""
        bundlePrefixDraft=""
        logoAltDraft=""
        onAssetsUpdated={vi.fn()}
      />,
    );
    expectNoBar();

    render(
      <SiteSetupWizard
        locale="en"
        themeId="theme-1"
        labels={dictEn.dashboard.siteSetup}
        platformCredit="Credit"
        platformCreditAria="Credit"
      />,
    );
    expectNoBar();
  });
});
