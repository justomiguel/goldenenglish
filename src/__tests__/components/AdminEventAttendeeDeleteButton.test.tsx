import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dictEn } from "@/test/dictEn";
import { AdminEventAttendeeDeleteButton } from "@/components/dashboard/admin/events/AdminEventAttendeeDeleteButton";

const detail = dictEn.admin.events.detail;

const labels = {
  delete: detail.attendeesDelete,
  deleteTooltip: detail.attendeesDeleteTooltip,
  deleteConfirmTitle: detail.attendeesDeleteConfirmTitle,
  deleteConfirmBody: detail.attendeesDeleteConfirmBody,
  deleteConfirm: detail.attendeesDeleteConfirm,
  cancel: detail.attendeesDeleteCancel,
  reasonLabel: detail.attendeesDeleteReasonLabel,
  reasonPlaceholder: detail.attendeesDeleteReasonPlaceholder,
  notify: detail.attendeesDeleteNotify,
  notifyHelp: detail.attendeesDeleteNotifyHelp,
  errorDelete: detail.attendeesErrorDelete,
  errorNotify: detail.attendeesErrorNotify,
  errorNoEmail: detail.attendeesErrorNoEmail,
  errorReason: detail.attendeesErrorReason,
};

const deleteEventAttendeeAction = vi.hoisted(() => vi.fn(async () => ({ ok: true })));
const refresh = vi.hoisted(() => vi.fn());

vi.mock("@/app/[locale]/dashboard/admin/events/actions", () => ({
  deleteEventAttendeeAction: (...args: unknown[]) => deleteEventAttendeeAction(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
  usePathname: () => "/en/dashboard/admin/events/event-1",
}));

describe("AdminEventAttendeeDeleteButton", () => {
  it("emails the reason only while the notice box stays checked", async () => {
    const user = userEvent.setup();
    deleteEventAttendeeAction.mockClear();
    render(
      <AdminEventAttendeeDeleteButton
        locale="en"
        eventId="event-1"
        attendeeId="attendee-1"
        labels={labels}
      />,
    );

    await user.click(screen.getByRole("button", { name: detail.attendeesDeleteTooltip }));
    const notice = screen.getByRole("checkbox", { name: new RegExp(detail.attendeesDeleteNotify) });
    expect(notice).toBeChecked();
    expect(screen.getByRole("button", { name: detail.attendeesDeleteConfirm })).toBeDisabled();

    await user.type(screen.getByPlaceholderText(detail.attendeesDeleteReasonPlaceholder), "Duplicate");
    await user.click(screen.getByRole("button", { name: detail.attendeesDeleteConfirm }));
    expect(deleteEventAttendeeAction).toHaveBeenCalledWith("en", "attendee-1", "event-1", {
      notify: true,
      reason: "Duplicate",
    });

    await user.click(screen.getByRole("button", { name: detail.attendeesDeleteTooltip }));
    await user.click(screen.getByRole("checkbox", { name: new RegExp(detail.attendeesDeleteNotify) }));
    await user.click(screen.getByRole("button", { name: detail.attendeesDeleteConfirm }));
    expect(deleteEventAttendeeAction).toHaveBeenLastCalledWith("en", "attendee-1", "event-1", {
      notify: false,
      reason: "",
    });
  });
});
