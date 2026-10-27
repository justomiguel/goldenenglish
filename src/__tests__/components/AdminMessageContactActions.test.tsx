import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminMessageContactActions } from "@/components/dashboard/AdminMessageContactActions";
import en from "@/dictionaries/en.json";

const record = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());
const trackEvent = vi.hoisted(() => vi.fn());

vi.mock("@/app/[locale]/dashboard/admin/messages/followUpActions", () => ({
  recordPortalMessageFollowUp: record,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/lib/analytics/trackClient", () => ({
  trackEvent,
}));

const hrefs = {
  mailto: "mailto:ada@example.test?subject=Re",
  gmail: "https://mail.google.com/mail/?view=cm&fs=1&to=ada@example.test",
  outlook: "https://outlook.office.com/mail/deeplink/compose?to=ada@example.test",
  whatsapp: null,
};

describe("AdminMessageContactActions", () => {
  it("opens Gmail after the follow-up row is saved and hides WhatsApp without a phone", async () => {
    record.mockResolvedValue({ ok: true });
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const user = userEvent.setup();

    render(
      <AdminMessageContactActions
        locale="en"
        messageId="11111111-1111-4111-8111-111111111111"
        labels={en.admin.messages}
        hrefs={hrefs}
      />,
    );

    expect(screen.queryByRole("button", { name: "WhatsApp" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Gmail" }));

    expect(record).toHaveBeenCalledWith({
      locale: "en",
      messageId: "11111111-1111-4111-8111-111111111111",
      channel: "gmail",
    });
    expect(trackEvent).toHaveBeenCalledWith("click", "message", {
      channel: "gmail",
      messageId: "11111111-1111-4111-8111-111111111111",
    });
    expect(open).toHaveBeenCalledWith(hrefs.gmail, "_blank", "noopener,noreferrer");
    expect(refresh).toHaveBeenCalled();
    open.mockRestore();
  });
});
