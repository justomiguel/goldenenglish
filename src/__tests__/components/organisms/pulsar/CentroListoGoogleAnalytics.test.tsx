import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CentroListoGoogleAnalytics } from "@/components/organisms/pulsar/CentroListoGoogleAnalytics";

const pathname = vi.hoisted(() => ({ value: "/es" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.value,
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("next/script", () => ({
  default: ({ src }: { src?: string }) => <script data-testid="ga-script" data-src={src} />,
}));

// REGRESSION CHECK: Marketing clicks must reach gtag. Admin paths must not.

describe("CentroListoGoogleAnalytics", () => {
  beforeEach(() => {
    pathname.value = "/es";
    window.gtag = vi.fn();
    window.__clGaConfigured = undefined;
  });

  it("loads the GA4 script and records a page view", () => {
    render(<CentroListoGoogleAnalytics measurementId="G-TEST1234" />);
    expect(screen.getByTestId("ga-script")).toHaveAttribute(
      "data-src",
      "https://www.googletagmanager.com/gtag/js?id=G-TEST1234",
    );
    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "page_view",
      expect.objectContaining({ page_path: "/es" }),
    );
  });

  it("records a link click with the visible label", async () => {
    const user = userEvent.setup();
    render(
      <>
        <CentroListoGoogleAnalytics measurementId="G-TEST1234" />
        <a href="#contacto">Escribir</a>
      </>,
    );
    await user.click(screen.getByRole("link", { name: "Escribir" }));
    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "cl_click",
      expect.objectContaining({ link_text: "Escribir", outbound: false }),
    );
  });

  it("does not load the tag on admin", () => {
    pathname.value = "/es/admin";
    render(<CentroListoGoogleAnalytics measurementId="G-TEST1234" />);
    expect(screen.queryByTestId("ga-script")).toBeNull();
    expect(window.gtag).not.toHaveBeenCalled();
  });
});
