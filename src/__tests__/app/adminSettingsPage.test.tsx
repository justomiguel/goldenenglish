import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import AdminSettingsPage from "@/app/[locale]/dashboard/admin/settings/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/en/dashboard/admin/settings",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/shop/loadMerchEnabled", () => ({
  loadMerchEnabled: async () => false,
}));

vi.mock("@/lib/settings/loadEmailSendsAdminPageModel", () => ({
  loadEmailSendsAdminPageModel: async () => null,
}));

vi.mock("@/lib/email/loadInstituteMailMonth", () => ({
  loadInstituteMailMonth: async () => null,
}));

vi.mock("@/lib/settings/loadClassRemindersAdminPageModel", () => ({
  loadClassRemindersAdminPageModel: async () => null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({}),
}));

vi.mock("@/lib/blog/integrations/google/loadGoogleTranslateCredentials", () => ({
  loadGoogleTranslateCredentials: async () => ({ apiKey: null }),
  maskGoogleApiKey: () => "",
}));

describe("AdminSettingsPage", () => {
  it("does not show the public registration section mode", async () => {
    const ui = await AdminSettingsPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(ui);

    expect(
      screen.queryByText(dictEn.admin.settings.registerSectionModeLabel),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText(dictEn.admin.settings.merch).length).toBeGreaterThan(0);
  });
});
