import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";

const { signOutMock, pushMock, refreshMock } = vi.hoisted(() => ({
  signOutMock: vi.fn(),
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("@/app/[locale]/admin/sessionActions", () => ({
  signOutPulsarSessionAction: (...args: unknown[]) => signOutMock(...args),
}));

import { PulsarSessionMenu } from "@/components/organisms/pulsar/PulsarSessionMenu";

const copy = (es as unknown as Dictionary).pulsar.session;

describe("PulsarSessionMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("links to login when there is no email", () => {
    render(<PulsarSessionMenu locale="es" email={null} copy={copy} />);
    expect(screen.getByRole("link", { name: copy.signIn })).toHaveAttribute("href", "/es/cuenta/login");
  });

  it("returns home after a successful sign-out", async () => {
    signOutMock.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<PulsarSessionMenu locale="es" email="owner@school.test" copy={copy} />);
    await user.click(screen.getByRole("button", { name: copy.signOut }));
    expect(signOutMock).toHaveBeenCalledWith("es");
    expect(pushMock).toHaveBeenCalledWith("/es");
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("stays on the page when sign-out fails", async () => {
    signOutMock.mockResolvedValue({ ok: false });
    const user = userEvent.setup();
    render(<PulsarSessionMenu locale="es" email="owner@school.test" copy={copy} />);
    await user.click(screen.getByRole("button", { name: copy.signOut }));
    expect(pushMock).not.toHaveBeenCalled();
  });
});
