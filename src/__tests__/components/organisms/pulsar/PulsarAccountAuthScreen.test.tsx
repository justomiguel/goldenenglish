// REGRESSION CHECK: Account auth uses the public chrome and the wardrobe photo.
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/es/cuenta/registro",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/app/[locale]/cuenta/actions", () => ({
  registerPulsarOwnerAction: vi.fn(),
}));

vi.mock("@/app/[locale]/admin/sessionActions", () => ({
  resolvePulsarPostLoginPath: vi.fn(),
}));

vi.mock("@/lib/supabase/pulsarBrowser", () => ({
  createPulsarBrowserClient: vi.fn(),
}));

import es from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";
import { PulsarAccountAuthScreen } from "@/components/organisms/pulsar/PulsarAccountAuthScreen";

const dict = es as unknown as Dictionary;

describe("PulsarAccountAuthScreen", () => {
  it("shows the logo and the stitched-mark photo on register", () => {
    render(
      <PulsarAccountAuthScreen
        locale="es"
        dict={dict}
        market="cl"
        mode="register"
        copy={dict.pulsar.account}
        nextPath="/es/cuenta"
      />,
    );

    expect(screen.getAllByRole("link", { name: "CentroListo" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: dict.pulsar.account.authPhotoAlt })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: dict.pulsar.account.registerTitle })).toBeInTheDocument();
  });
});
