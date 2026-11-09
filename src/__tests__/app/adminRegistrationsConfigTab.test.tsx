import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { AdminRegistrationsTabs } from "@/components/dashboard/AdminRegistrationsTabs";
import { InscriptionsSettingsForm } from "@/components/dashboard/InscriptionsSettingsForm";
import { PublicCtaModeSettingsForm } from "@/components/dashboard/PublicCtaModeSettingsForm";

const searchState = vi.hoisted(() => ({ value: "tab=config" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/en/dashboard/admin/registrations",
  useSearchParams: () => new URLSearchParams(searchState.value),
}));

vi.mock("@/app/[locale]/dashboard/admin/settings/actions", () => ({
  setInscriptionsEnabled: vi.fn(),
  setRegistrationCohortAction: vi.fn(),
}));

vi.mock("@/app/[locale]/dashboard/admin/settings/setRegisterSectionMode", () => ({
  setRegisterSectionMode: vi.fn(),
}));

vi.mock("@/app/[locale]/dashboard/admin/settings/publicCtaModeActions", () => ({
  setPublicCtaMode: vi.fn(),
}));

const tabLabels = {
  list: dictEn.admin.registrations.pageTabList,
  config: dictEn.admin.registrations.pageTabConfig,
  aria: dictEn.admin.registrations.pageTabsAria,
};

function configForms() {
  return (
    <>
      <InscriptionsSettingsForm
        locale="en"
        initialEnabled
        initialSectionMode="student_choice"
        labels={dictEn.admin.settings}
        cohortConfig={{
          cohorts: [],
          currentCohort: null,
          activeCohort: null,
          configuredCohortId: null,
        }}
      />
      <PublicCtaModeSettingsForm
        locale="en"
        initialMode="reserve"
        labels={dictEn.admin.settings}
      />
    </>
  );
}

describe("AdminRegistrationsTabs", () => {
  it("shows the section mode on the configuration tab and hides the lead list", () => {
    searchState.value = "tab=config";
    render(<AdminRegistrationsTabs labels={tabLabels}>{configForms()}</AdminRegistrationsTabs>);

    expect(screen.getByText(dictEn.admin.settings.registerSectionModeLabel)).toBeInTheDocument();
    expect(screen.getAllByText(dictEn.admin.settings.publicCtaTitle).length).toBeGreaterThan(0);
    expect(screen.queryByText(dictEn.admin.registrations.none)).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: tabLabels.config })).toHaveAttribute("aria-selected", "true");
  });

  it("shows the lead list on the registrations tab and hides the section mode", () => {
    searchState.value = "";
    render(
      <AdminRegistrationsTabs labels={tabLabels}>
        <p>{dictEn.admin.registrations.none}</p>
      </AdminRegistrationsTabs>,
    );

    expect(screen.getByText(dictEn.admin.registrations.none)).toBeInTheDocument();
    expect(screen.queryByText(dictEn.admin.settings.registerSectionModeLabel)).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: tabLabels.list })).toHaveAttribute("aria-selected", "true");
  });
});
