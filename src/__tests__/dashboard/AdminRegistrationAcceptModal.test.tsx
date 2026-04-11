import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { AdminRegistrationAcceptModal } from "@/components/dashboard/AdminRegistrationAcceptModal";

describe("AdminRegistrationAcceptModal", () => {
  it("calls onClose when cancel is pressed", () => {
    const onClose = vi.fn();
    const row = {
      id: "323e4567-e89b-12d3-a456-426614174004",
      first_name: "A",
      last_name: "B",
      dni: "1",
      email: "a@a.co",
      phone: "+1",
      birth_date: "2010-01-01",
      level_interest: "A1",
      status: "new" as const,
      created_at: "2026-01-01T00:00:00.000Z",
    };
    render(
      <AdminRegistrationAcceptModal
        locale="es"
        row={row}
        busy={false}
        onBusy={vi.fn()}
        onClose={onClose}
        onSuccess={vi.fn()}
        labels={dictEn.admin.registrations}
        userLabels={{
          password: dictEn.admin.users.password,
          passwordHint: dictEn.admin.users.passwordHint,
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: dictEn.admin.registrations.cancel }));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when dialog fires close", () => {
    const onClose = vi.fn();
    const row = {
      id: "323e4567-e89b-12d3-a456-426614174004",
      first_name: "A",
      last_name: "B",
      dni: "1",
      email: "a@a.co",
      phone: "+1",
      birth_date: "2010-01-01",
      level_interest: "A1",
      status: "new" as const,
      created_at: "2026-01-01T00:00:00.000Z",
    };
    render(
      <AdminRegistrationAcceptModal
        locale="es"
        row={row}
        busy={false}
        onBusy={vi.fn()}
        onClose={onClose}
        onSuccess={vi.fn()}
        labels={dictEn.admin.registrations}
        userLabels={{
          password: dictEn.admin.users.password,
          passwordHint: dictEn.admin.users.passwordHint,
        }}
      />,
    );
    const dlg = document.querySelector("dialog");
    expect(dlg).toBeTruthy();
    dlg!.dispatchEvent(new Event("close"));
    expect(onClose).toHaveBeenCalled();
  });
});
