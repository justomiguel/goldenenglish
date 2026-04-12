import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { mockPush } from "@/test/navigationMock";

const submitPublicRegistration = vi.hoisted(() => vi.fn());

vi.mock("@/app/[locale]/register/actions", () => ({
  submitPublicRegistration,
}));

import { RegisterForm } from "@/components/register/RegisterForm";

describe("RegisterForm", () => {
  beforeEach(() => {
    submitPublicRegistration.mockReset();
  });

  function fillAndSubmit() {
    const r = dictEn.register;
    fireEvent.change(screen.getByLabelText(r.firstName), {
      target: { value: "A" },
    });
    fireEvent.change(screen.getByLabelText(r.lastName), { target: { value: "B" } });
    fireEvent.change(screen.getByLabelText(r.dni), { target: { value: "12345678" } });
    fireEvent.change(screen.getByLabelText(r.email), {
      target: { value: "a@b.co" },
    });
    fireEvent.change(screen.getByLabelText(r.phone), {
      target: { value: "+100" },
    });
    fireEvent.change(screen.getByLabelText(r.birthDate), {
      target: { value: "2000-06-15" },
    });
    fireEvent.change(screen.getByLabelText(r.level), {
      target: { value: "B1" },
    });
    fireEvent.click(screen.getByRole("button", { name: r.submit }));
  }

  it("opens success dialog on ok", async () => {
    submitPublicRegistration.mockResolvedValue({ ok: true });
    render(
      <RegisterForm locale="es" dict={dictEn.register} legalAgeMajority={18} />,
    );
    fillAndSubmit();
    await waitFor(() => {
      expect(screen.getByText(dictEn.register.successTitle)).toBeInTheDocument();
    });
    expect(submitPublicRegistration).toHaveBeenCalledWith(
      "es",
      expect.objectContaining({
        first_name: "A",
        last_name: "B",
        dni: "12345678",
        email: "a@b.co",
        phone: "+100",
        birth_date: "2000-06-15",
        level_interest: "B1",
      }),
    );
  });

  it("shows closed copy when server returns closed", async () => {
    submitPublicRegistration.mockResolvedValue({
      ok: false,
      message: dictEn.register.closed,
    });
    render(
      <RegisterForm locale="es" dict={dictEn.register} legalAgeMajority={18} />,
    );
    fillAndSubmit();
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(dictEn.register.closed);
    });
  });

  it("shows validation copy when server returns validation message", async () => {
    submitPublicRegistration.mockResolvedValue({
      ok: false,
      message: dictEn.register.validationError,
    });
    render(
      <RegisterForm locale="es" dict={dictEn.register} legalAgeMajority={18} />,
    );
    fillAndSubmit();
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(dictEn.register.validationError);
    });
  });

  it("shows generic error for other failures", async () => {
    submitPublicRegistration.mockResolvedValue({ ok: false, message: undefined });
    render(
      <RegisterForm locale="es" dict={dictEn.register} legalAgeMajority={18} />,
    );
    fillAndSubmit();
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(dictEn.register.error);
    });
  });

  it("shows tutor fields when birth date indicates minor", () => {
    render(
      <RegisterForm locale="es" dict={dictEn.register} legalAgeMajority={18} />,
    );
    fireEvent.change(screen.getByLabelText(dictEn.register.birthDate), {
      target: { value: "2015-01-01" },
    });
    expect(screen.getByText(dictEn.register.tutorSectionTitle)).toBeInTheDocument();
  });

  it("routes home from success dialog", async () => {
    submitPublicRegistration.mockResolvedValue({ ok: true });
    render(
      <RegisterForm locale="es" dict={dictEn.register} legalAgeMajority={18} />,
    );
    fillAndSubmit();
    await waitFor(() => {
      expect(screen.getByText(dictEn.register.successTitle)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(dictEn.register.backHome));
    expect(mockPush).toHaveBeenCalledWith("/es");
  });
});
