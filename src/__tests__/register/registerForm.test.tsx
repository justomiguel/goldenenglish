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
    fireEvent.click(screen.getByRole("button", { name: r.submit }));
  }

  it("opens success dialog on ok", async () => {
    submitPublicRegistration.mockResolvedValue({ ok: true });
    render(<RegisterForm locale="es" dict={dictEn.register} />);
    fillAndSubmit();
    await waitFor(() => {
      expect(screen.getByText(dictEn.register.successTitle)).toBeInTheDocument();
    });
  });

  it("shows closed copy when server returns closed", async () => {
    submitPublicRegistration.mockResolvedValue({
      ok: false,
      message: "closed",
    });
    render(<RegisterForm locale="es" dict={dictEn.register} />);
    fillAndSubmit();
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(dictEn.register.closed);
    });
  });

  it("shows generic error for other failures", async () => {
    submitPublicRegistration.mockResolvedValue({ ok: false, message: "x" });
    render(<RegisterForm locale="es" dict={dictEn.register} />);
    fillAndSubmit();
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(dictEn.register.error);
    });
  });

  it("routes home from success dialog", async () => {
    submitPublicRegistration.mockResolvedValue({ ok: true });
    render(<RegisterForm locale="es" dict={dictEn.register} />);
    fillAndSubmit();
    await waitFor(() => {
      expect(screen.getByText(dictEn.register.successTitle)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(dictEn.register.backHome));
    expect(mockPush).toHaveBeenCalledWith("/es");
  });
});
