// REGRESSION CHECK: Sign-in must assign window.location so the next document
// request carries the Pulsar session cookies. A client router.push can land
// back on the login form.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";

const { signInMock, resolveMock, assignSpy } = vi.hoisted(() => ({
  signInMock: vi.fn(),
  resolveMock: vi.fn(),
  assignSpy: vi.fn(),
}));

vi.mock("@/lib/supabase/pulsarBrowser", () => ({
  createPulsarBrowserClient: () => ({
    auth: { signInWithPassword: signInMock },
  }),
}));

vi.mock("@/app/[locale]/admin/sessionActions", () => ({
  resolvePulsarPostLoginPath: (...args: unknown[]) => resolveMock(...args),
}));

vi.mock("@/lib/pulsar/centrolistoAnalytics", () => ({
  trackCentrolistoGaEvent: vi.fn(),
}));

import { PulsarAccountAuthForm } from "@/components/organisms/pulsar/PulsarAccountAuthForm";

const copy = (es as unknown as Dictionary).pulsar.account;

describe("PulsarAccountAuthForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signInMock.mockResolvedValue({ error: null });
    resolveMock.mockResolvedValue("/es/cuenta");
    vi.stubGlobal("location", { ...window.location, assign: assignSpy });
  });

  it("assigns the resolved panel path after a successful sign-in", async () => {
    const user = userEvent.setup();
    render(
      <PulsarAccountAuthForm locale="es" mode="login" copy={copy} nextPath="/es/admin" />,
    );
    await user.type(screen.getByLabelText(copy.email), "owner@school.test");
    await user.type(screen.getByLabelText(copy.password), "secret-pass");
    await user.click(screen.getByRole("button", { name: copy.submitLogin }));
    expect(resolveMock).toHaveBeenCalledWith("es", "/es/admin");
    expect(assignSpy).toHaveBeenCalledWith("/es/cuenta");
  });
});
