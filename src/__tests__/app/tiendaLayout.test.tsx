import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement, ReactNode } from "react";
import { loadMerchEnabled } from "@/lib/shop/loadMerchEnabled";

const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  notFound: () => notFoundMock(),
}));

vi.mock("@/lib/shop/loadMerchEnabled", () => ({
  loadMerchEnabled: vi.fn(),
}));

vi.mock("@/components/organisms/PublicBlogPageShell", () => ({
  PublicBlogPageShell: ({ children }: { children: ReactNode }) => (
    <div data-testid="shop-shell">{children}</div>
  ),
}));

import TiendaLayout from "@/app/[locale]/tienda/layout";

describe("TiendaLayout", () => {
  beforeEach(() => {
    notFoundMock.mockClear();
  });

  it("calls notFound when merch is disabled", async () => {
    vi.mocked(loadMerchEnabled).mockResolvedValue(false);
    await expect(
      TiendaLayout({
        children: <p>catalog</p>,
        params: Promise.resolve({ locale: "en" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalled();
  });

  it("renders the public shell when merch is enabled", async () => {
    vi.mocked(loadMerchEnabled).mockResolvedValue(true);
    const element = (await TiendaLayout({
      children: <p>catalog</p>,
      params: Promise.resolve({ locale: "es" }),
    })) as ReactElement<{ locale: string; children: ReactNode }>;
    expect(notFoundMock).not.toHaveBeenCalled();
    expect(element.props.locale).toBe("es");
  });
});
