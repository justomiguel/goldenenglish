import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminPortalMessageDetailView } from "@/components/dashboard/AdminPortalMessageDetailView";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import en from "@/dictionaries/en.json";

const labels = en.admin.messages;

describe("AdminPortalMessageDetailView", () => {
  it("shows one from-to-time line, an explicit visible body heading, and keeps the participant tour anchor", () => {
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
    expect(screen.getByRole("heading", { name: labels.detailBodyLabel })).toBeInTheDocument();
    expect(screen.getByText("Hello there")).toBeInTheDocument();
    expect(document.querySelector(`[data-tour="${ADMIN_TOUR_ANCHORS.messagesDetailParticipants}"]`)).toBeTruthy();
    const bodySection = document.querySelector(
      `[data-tour="${ADMIN_TOUR_ANCHORS.messagesDetailBody}"]`,
    );
    expect(bodySection).toBeTruthy();
    const bodyBox = screen.getByTestId("admin-portal-msg-body-box");
    expect(bodyBox.className).toContain("border-l-4");
    expect(bodyBox).toHaveTextContent("Hello there");
  });

  it("separates contact-form metadata before <hr> from the highlighted message body box", () => {
    render(
      <AdminPortalMessageDetailView
        locale="es"
        labels={labels}
        detail={{
          createdAt: "2026-01-15T15:00:00.000Z",
          bodyHtmlDisplay:
            "<p><strong>Asunto</strong> Clases</p><p><strong>Correo</strong> ana@example.com</p><hr /><p>Quiero inscribirme en danza</p>",
          fromName: "Ana",
          toName: "Administración",
          fromRoleLabel: labels.roleSiteContact,
          toRoleLabel: labels.roleAdmin,
        }}
      />,
    );

    const metaBox = screen.getByTestId("admin-portal-msg-contact-meta");
    expect(metaBox).toHaveTextContent("Asunto Clases");
    expect(metaBox).toHaveTextContent("Correo ana@example.com");
    expect(metaBox).not.toHaveTextContent("Quiero inscribirme en danza");

    const bodyBox = screen.getByTestId("admin-portal-msg-body-box");
    expect(bodyBox).toHaveTextContent("Quiero inscribirme en danza");
    expect(bodyBox).not.toHaveTextContent("Asunto Clases");
  });
});
