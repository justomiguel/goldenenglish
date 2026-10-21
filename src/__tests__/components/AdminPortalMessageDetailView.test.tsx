import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminPortalMessageDetailView } from "@/components/dashboard/AdminPortalMessageDetailView";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import en from "@/dictionaries/en.json";

const labels = en.admin.messages;

describe("AdminPortalMessageDetailView", () => {
  it("shows one from-to-time line and keeps the participant tour anchor", () => {
    render(
      <AdminPortalMessageDetailView
        locale="en"
        labels={labels}
        detail={{
          createdAt: "2026-01-15T15:00:00.000Z",
          bodyHtmlDisplay: "<p>Hello there</p>",
          fromName: "Parent One",
          toName: "Admin One",
          fromRoleLabel: labels.roleParent,
          toRoleLabel: labels.roleAdmin,
        }}
      />,
    );

    expect(screen.getByText(/Parent One → Admin One/)).toBeInTheDocument();
    expect(screen.getByText("Hello there")).toBeInTheDocument();
    expect(document.querySelector(`[data-tour="${ADMIN_TOUR_ANCHORS.messagesDetailParticipants}"]`)).toBeTruthy();
  });
});
