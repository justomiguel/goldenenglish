import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminEventDetailSummaryTab } from "@/components/dashboard/admin/events/AdminEventDetailSummaryTab";
import en from "@/dictionaries/en.json";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/app/[locale]/dashboard/admin/events/eventShowOnHomeActions", () => ({
  updateEventShowOnHomeAction: vi.fn(),
}));

vi.mock("@/components/dashboard/admin/events/AdminEventPublishBar", () => ({
  AdminEventPublishBar: () => <div>publish</div>,
}));

vi.mock("@/components/dashboard/admin/events/AdminEventSummaryScheduleForm", () => ({
  AdminEventSummaryScheduleForm: () => <div>schedule</div>,
}));

vi.mock("@/components/dashboard/admin/events/AdminEventSummaryPricingForm", () => ({
  AdminEventSummaryPricingForm: () => <div>pricing</div>,
}));

vi.mock("@/components/dashboard/admin/events/AdminEventTranslationsEditor", () => ({
  AdminEventTranslationsEditor: () => <div>translations</div>,
}));

describe("AdminEventDetailSummaryTab", () => {
  it("shows the home popup option on a draft event", () => {
    render(
      <AdminEventDetailSummaryTab
        locale="es"
        eventId="11111111-1111-4111-8111-111111111111"
        dict={en}
        model={
          {
            event: { status: "draft", show_on_home: false },
            defaultLocale: "es",
            translations: [],
          } as never
        }
      />,
    );

    expect(
      screen.getByRole("checkbox", { name: en.admin.events.detail.showOnHome.checkboxLabel }),
    ).toBeInTheDocument();
  });
});
