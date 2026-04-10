import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { mockPathname } from "@/test/navigationMock";

const createDashboardUser = vi.hoisted(() => vi.fn());
const setInscriptionsEnabled = vi.hoisted(() => vi.fn());
const reviewPayment = vi.hoisted(() => vi.fn());

vi.mock("@/app/[locale]/dashboard/admin/users/actions", () => ({
  createDashboardUser,
}));

vi.mock("@/app/[locale]/dashboard/admin/settings/actions", () => ({
  setInscriptionsEnabled,
}));

vi.mock("@/app/[locale]/dashboard/admin/payments/actions", () => ({
  reviewPayment,
}));

import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { AdminCreateUserForm } from "@/components/dashboard/AdminCreateUserForm";
import { InscriptionsSettingsForm } from "@/components/dashboard/InscriptionsSettingsForm";
import { PaymentReviewRow } from "@/components/dashboard/PaymentReviewRow";

describe("dashboard coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue("/es/dashboard/admin/users");
    createDashboardUser.mockResolvedValue({ ok: true });
    setInscriptionsEnabled.mockResolvedValue({ ok: true });
    reviewPayment.mockResolvedValue({ ok: true });
  });

  it("AdminSidebar marks active link and handles mobile select", () => {
    const loc = { href: "" };
    vi.stubGlobal("location", loc as Location);
    render(
      <AdminSidebar
        locale="es"
        dict={dictEn.dashboard.adminNav}
        newRegistrationsCount={100}
      />,
    );
    expect(screen.getByRole("navigation", { name: dictEn.dashboard.adminNav.aria })).toBeInTheDocument();
    const select = screen.getByRole("combobox", {
      name: dictEn.dashboard.adminNav.mobileSelect,
    });
    fireEvent.change(select, { target: { value: "/es/dashboard/admin/import" } });
    expect(loc.href).toBe("/es/dashboard/admin/import");
    vi.unstubAllGlobals();
  });

  it("AdminCreateUserForm shows success and error messages", async () => {
    createDashboardUser.mockResolvedValueOnce({ ok: true });
    const { unmount } = render(<AdminCreateUserForm labels={dictEn.admin.users} />);
    fillCreateUserForm();
    fireEvent.click(screen.getByRole("button", { name: dictEn.admin.users.submit }));
    await waitFor(() => {
      expect(screen.getByText(dictEn.admin.users.success)).toBeInTheDocument();
    });
    unmount();
    createDashboardUser.mockResolvedValueOnce({ ok: false, message: "nope" });
    render(<AdminCreateUserForm labels={dictEn.admin.users} />);
    fillCreateUserForm();
    fireEvent.click(screen.getByRole("button", { name: dictEn.admin.users.submit }));
    await waitFor(() => {
      expect(screen.getByText(/nope/)).toBeInTheDocument();
    });
  });

  it("InscriptionsSettingsForm saves and errors", async () => {
    setInscriptionsEnabled.mockResolvedValueOnce({ ok: true });
    const { unmount } = render(
      <InscriptionsSettingsForm
        locale="es"
        initialEnabled={false}
        labels={dictEn.admin.settings}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox"));
    await waitFor(() => {
      expect(screen.getByText(dictEn.admin.settings.saved)).toBeInTheDocument();
    });
    unmount();
    setInscriptionsEnabled.mockResolvedValueOnce({ ok: false });
    render(
      <InscriptionsSettingsForm
        locale="es"
        initialEnabled={false}
        labels={dictEn.admin.settings}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox"));
    await waitFor(() => {
      expect(screen.getByText(dictEn.admin.settings.error)).toBeInTheDocument();
    });
  });

  it("PaymentReviewRow approve calls reviewPayment", async () => {
    render(
      <ul>
        <PaymentReviewRow
          paymentId="p1"
          studentLabel="S"
          periodLabel="2026-03"
          amountLabel="$10"
          previewUrl="https://x.com/a.png"
          labels={dictEn.admin.payments}
        />
      </ul>,
    );
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "ok" } });
    fireEvent.click(screen.getByRole("button", { name: dictEn.admin.payments.approve }));
    await waitFor(() =>
      expect(reviewPayment).toHaveBeenCalledWith({
        paymentId: "p1",
        status: "approved",
        adminNotes: "ok",
      }),
    );
  });

  it("PaymentReviewRow reject action and preview branches", async () => {
    render(
      <ul>
        <PaymentReviewRow
          paymentId="p9"
          studentLabel="S"
          periodLabel="2026-03"
          amountLabel="$10"
          previewUrl="https://x.com/a.png"
          labels={dictEn.admin.payments}
        />
      </ul>,
    );
    fireEvent.click(screen.getByRole("button", { name: dictEn.admin.payments.reject }));
    await waitFor(() =>
      expect(reviewPayment).toHaveBeenCalledWith({
        paymentId: "p9",
        status: "rejected",
        adminNotes: undefined,
      }),
    );
  });

  it("PaymentReviewRow hides img for pdf and handles missing preview", () => {
    render(
      <ul>
        <PaymentReviewRow
          paymentId="p2"
          studentLabel="S"
          periodLabel="2026-03"
          amountLabel="$10"
          previewUrl="https://x.com/r.pdf"
          labels={dictEn.admin.payments}
        />
        <PaymentReviewRow
          paymentId="p3"
          studentLabel="S"
          periodLabel="2026-03"
          amountLabel="$10"
          previewUrl={null}
          labels={dictEn.admin.payments}
        />
      </ul>,
    );
    expect(document.querySelectorAll("img")).toHaveLength(0);
  });
});

function fillCreateUserForm() {
  const L = dictEn.admin.users;
  fireEvent.change(screen.getByLabelText(L.email), {
    target: { value: "u@x.co" },
  });
  fireEvent.change(screen.getByLabelText(L.password), {
    target: { value: "secret1" },
  });
  fireEvent.change(screen.getByLabelText(L.firstName), { target: { value: "A" } });
  fireEvent.change(screen.getByLabelText(L.lastName), { target: { value: "B" } });
  fireEvent.change(screen.getByLabelText(L.dni), { target: { value: "1" } });
  fireEvent.change(screen.getByLabelText(L.phone), { target: { value: "+1555" } });
}
