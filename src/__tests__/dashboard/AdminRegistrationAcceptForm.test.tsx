import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { AdminRegistrationAcceptForm } from "@/components/dashboard/AdminRegistrationAcceptForm";

const acceptRegistration = vi.hoisted(() => vi.fn());

vi.mock("@/app/[locale]/dashboard/admin/registrations/actions", () => ({
  acceptRegistration: (...a: unknown[]) => acceptRegistration(...a),
}));

const row = {
  id: "323e4567-e89b-12d3-a456-426614174004",
  first_name: "A",
  last_name: "B",
  dni: "9",
  email: "z@z.co",
  phone: "+9",
  level_interest: "B1",
  status: "new" as const,
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("AdminRegistrationAcceptForm", () => {
  beforeEach(() => {
    acceptRegistration.mockReset();
  });

  it("submits and calls onSuccess", async () => {
    acceptRegistration.mockResolvedValue({ ok: true });
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const onBusy = vi.fn();
    render(
      <AdminRegistrationAcceptForm
        locale="es"
        row={row}
        busy={false}
        onBusy={onBusy}
        onClose={onClose}
        onSuccess={onSuccess}
        labels={dictEn.admin.registrations}
        userLabels={{
          password: dictEn.admin.users.password,
          passwordHint: dictEn.admin.users.passwordHint,
        }}
      />,
    );
    fireEvent.change(screen.getByLabelText(dictEn.admin.users.password), {
      target: { value: "secret12" },
    });
    fireEvent.click(screen.getByRole("button", { name: dictEn.admin.registrations.accept }));
    await waitFor(() => expect(acceptRegistration).toHaveBeenCalled());
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it("shows generic error when accept fails without message", async () => {
    acceptRegistration.mockResolvedValue({ ok: false });
    render(
      <AdminRegistrationAcceptForm
        locale="es"
        row={row}
        busy={false}
        onBusy={vi.fn()}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        labels={dictEn.admin.registrations}
        userLabels={{
          password: dictEn.admin.users.password,
          passwordHint: dictEn.admin.users.passwordHint,
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: dictEn.admin.registrations.accept }));
    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(dictEn.admin.registrations.acceptError);
      expect(alert.textContent?.endsWith(":") || alert.textContent?.endsWith(": ")).toBe(true);
    });
  });
});
