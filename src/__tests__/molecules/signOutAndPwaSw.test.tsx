import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { mockPush, mockRefresh } from "@/test/navigationMock";
import { SignOutButton } from "@/components/molecules/SignOutButton";
import { PwaServiceWorkerRegister } from "@/components/molecules/PwaServiceWorkerRegister";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}));

describe("SignOutButton and PwaServiceWorkerRegister", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockRefresh.mockClear();
  });

  it("SignOutButton signs out, refreshes and navigates", async () => {
    render(
      <SignOutButton locale="es" label={dictEn.nav.logout} iconOnly />,
    );
    fireEvent.click(screen.getByRole("button", { name: dictEn.nav.logout }));
    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/es");
    });
  });

  it("PwaServiceWorkerRegister registers service worker when available", async () => {
    const reg = vi.fn().mockResolvedValue(undefined);
    const orig = navigator.serviceWorker;
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { register: reg },
    });
    render(<PwaServiceWorkerRegister />);
    await waitFor(() => expect(reg).toHaveBeenCalledWith("/sw.js", { scope: "/" }));
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: orig,
    });
  });

  it("PwaServiceWorkerRegister no-ops without serviceWorker API", () => {
    const orig = navigator.serviceWorker;
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: undefined,
    });
    render(<PwaServiceWorkerRegister />);
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: orig,
    });
  });

  it("PwaServiceWorkerRegister ignores register rejection", async () => {
    const reg = vi.fn().mockRejectedValue(new Error("blocked"));
    const orig = navigator.serviceWorker;
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { register: reg },
    });
    render(<PwaServiceWorkerRegister />);
    await waitFor(() => expect(reg).toHaveBeenCalled());
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: orig,
    });
  });
});
