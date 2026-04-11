import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { mockPathname } from "@/test/navigationMock";

const createDashboardUser = vi.hoisted(() => vi.fn());
const setInscriptionsEnabled = vi.hoisted(() => vi.fn());
const reviewPayment = vi.hoisted(() => vi.fn());
const deleteRegistration = vi.hoisted(() => vi.fn());
const acceptRegistration = vi.hoisted(() => vi.fn());

vi.mock("@/app/[locale]/dashboard/admin/users/actions", () => ({
  createDashboardUser,
}));

vi.mock("@/app/[locale]/dashboard/admin/registrations/actions", () => ({
  deleteRegistration,
  acceptRegistration,
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
import { AdminRegistrationsList } from "@/components/dashboard/AdminRegistrationsList";

describe("dashboard coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue("/es/dashboard/admin/users");
    createDashboardUser.mockResolvedValue({ ok: true });
    setInscriptionsEnabled.mockResolvedValue({ ok: true });
    reviewPayment.mockResolvedValue({ ok: true });
    deleteRegistration.mockResolvedValue({ ok: true });
    acceptRegistration.mockResolvedValue({ ok: true });
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

  it("AdminRegistrationsList shows raw status when not in known set", () => {
    const R = dictEn.admin.registrations;
    const row = {
      id: "523e4567-e89b-12d3-a456-426614174005",
      first_name: "X",
      last_name: "Y",
      dni: "0",
      email: "raw@x.co",
      phone: "+1",
      birth_date: null,
      level_interest: "B1",
      status: "legacy_import",
      created_at: "2026-02-01T00:00:00.000Z",
    };
    render(
      <AdminRegistrationsList
        locale="es"
        rows={[row]}
        labels={R}
        tableLabels={dictEn.admin.table}
        userLabels={{
          password: dictEn.admin.users.password,
          passwordHint: dictEn.admin.users.passwordHint,
        }}
      />,
    );
    expect(screen.getByText("legacy_import")).toBeInTheDocument();
  });

  it("AdminRegistrationsList shows contacted status and delete error toast", async () => {
    const R = dictEn.admin.registrations;
    const row = {
      id: "323e4567-e89b-12d3-a456-426614174002",
      first_name: "C",
      last_name: "D",
      dni: "9",
      email: "c@x.co",
      phone: "+1",
      birth_date: "1995-04-01",
      level_interest: "B1",
      status: "contacted",
      created_at: "2026-02-01T00:00:00.000Z",
    };
    deleteRegistration.mockResolvedValueOnce({ ok: false, message: "db" });
    render(
      <AdminRegistrationsList
        locale="es"
        rows={[row]}
        labels={R}
        tableLabels={dictEn.admin.table}
        userLabels={{
          password: dictEn.admin.users.password,
          passwordHint: dictEn.admin.users.passwordHint,
        }}
      />,
    );
    expect(screen.getByText(R.contacted)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: R.delete }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: R.confirmDelete }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/db/));
  });

  it("AdminRegistrationsList deletes and accepts a lead", async () => {
    const R = dictEn.admin.registrations;
    const rowNew = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      first_name: "A",
      last_name: "B",
      dni: "1",
      email: "a@x.co",
      phone: "+1555",
      birth_date: "2001-03-20",
      level_interest: "A1",
      status: "new",
      created_at: "2026-01-01T00:00:00.000Z",
    };
    const rowOld = { ...rowNew, id: "223e4567-e89b-12d3-a456-426614174001", status: "enrolled" };
    render(
      <AdminRegistrationsList
        locale="es"
        rows={[rowNew, rowOld]}
        labels={R}
        tableLabels={dictEn.admin.table}
        userLabels={{
          password: dictEn.admin.users.password,
          passwordHint: dictEn.admin.users.passwordHint,
        }}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: R.delete })[0]);
    const delDlg = screen.getByRole("dialog");
    fireEvent.click(within(delDlg).getByRole("button", { name: R.confirmDelete }));
    await waitFor(() => expect(deleteRegistration).toHaveBeenCalledWith("es", rowNew.id));
    fireEvent.click(screen.getByRole("button", { name: R.accept }));
    const accDlg = await screen.findByRole("dialog");
    fireEvent.click(within(accDlg).getByRole("button", { name: R.accept }));
    await waitFor(() =>
      expect(acceptRegistration).toHaveBeenCalledWith(
        "es",
        expect.objectContaining({ registration_id: rowNew.id }),
      ),
    );
  });

  it("AdminRegistrationAcceptModal surfaces already_processed and generic errors", async () => {
    const R = dictEn.admin.registrations;
    const rowNew = {
      id: "423e4567-e89b-12d3-a456-426614174003",
      first_name: "E",
      last_name: "F",
      dni: "2",
      email: "e@x.co",
      phone: "+1",
      birth_date: "2005-08-10",
      level_interest: "A2",
      status: "new",
      created_at: "2026-01-01T00:00:00.000Z",
    };
    acceptRegistration.mockResolvedValueOnce({ ok: false, message: "already_processed" });
    const { unmount } = render(
      <AdminRegistrationsList
        locale="es"
        rows={[rowNew]}
        labels={R}
        tableLabels={dictEn.admin.table}
        userLabels={{
          password: dictEn.admin.users.password,
          passwordHint: dictEn.admin.users.passwordHint,
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: R.accept }));
    const dlg = await screen.findByRole("dialog");
    fireEvent.change(screen.getByLabelText(dictEn.admin.users.password), {
      target: { value: "x" },
    });
    fireEvent.change(screen.getByLabelText(R.birthDate), { target: { value: "2011-06-15" } });
    fireEvent.click(within(dlg).getByRole("button", { name: R.accept }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(R.alreadyProcessed));
    unmount();

    acceptRegistration.mockResolvedValueOnce({ ok: false, message: "nope" });
    render(
      <AdminRegistrationsList
        locale="es"
        rows={[rowNew]}
        labels={R}
        tableLabels={dictEn.admin.table}
        userLabels={{
          password: dictEn.admin.users.password,
          passwordHint: dictEn.admin.users.passwordHint,
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: R.accept }));
    const dlg2 = await screen.findByRole("dialog");
    fireEvent.click(within(dlg2).getByRole("button", { name: R.accept }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/nope/));
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
