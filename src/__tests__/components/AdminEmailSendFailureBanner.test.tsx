import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import en from "@/dictionaries/en.json";
import { AdminEmailSendFailureBanner } from "@/components/dashboard/AdminEmailSendFailureBanner";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/app/[locale]/dashboard/admin/settings/dismissEmailSendFailureAction", () => ({
  dismissEmailSendFailureAction: vi.fn(),
}));

describe("AdminEmailSendFailureBanner", () => {
  it("tells staff to notify the webmaster and points at email settings", () => {
    render(<AdminEmailSendFailureBanner locale="en" labels={en.admin.settings} />);
    expect(
      screen.getByRole("status"),
    ).toHaveTextContent(en.admin.settings.emailDeliveryFailureTitle);
    expect(screen.getByText(en.admin.settings.emailDeliveryFailureLead)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: en.admin.settings.emailDeliveryFailureSettings })).toHaveAttribute(
      "href",
      "/en/dashboard/admin/settings",
    );
    expect(
      screen.getByRole("button", { name: en.admin.settings.emailDeliveryFailureDismiss }),
    ).toBeInTheDocument();
  });
});
