import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { BrandPublic } from "@/lib/brand/server";
import { dictEn } from "@/test/dictEn";
import { mockPathname } from "@/test/navigationMock";
import { AdminMobileDrawer } from "@/components/dashboard/AdminMobileDrawer";

const hiddenBrand = {
  name: "Hidden Brand",
  legalName: "Hidden Brand",
  tagline: "Hidden tagline",
  taglineEn: "Hidden tagline",
  legalRegistry: "",
  logoPath: "/images/logo.png",
  logoAlt: "Hidden Brand",
  faviconPath: "/favicon.ico",
  faviconBundlePrefix: null,
  contactEmail: "",
  contactPhone: "",
  contactAddress: "",
  socialFacebook: "",
  socialInstagram: "",
  socialWhatsapp: "",
} as BrandPublic;

describe("AdminMobileDrawer", () => {
  const mqListeners: Array<(e: Event) => void> = [];
  let matches = false;

  beforeEach(() => {
    mqListeners.length = 0;
    matches = false;
    vi.spyOn(window, "matchMedia").mockImplementation(() => {
      const list = {
        get matches() {
          return matches;
        },
        media: "(min-width: 768px)",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: (_: string, cb: EventListener) => {
          mqListeners.push(cb as (e: Event) => void);
        },
        removeEventListener: (_: string, cb: EventListener) => {
          const i = mqListeners.indexOf(cb as (e: Event) => void);
          if (i !== -1) mqListeners.splice(i, 1);
        },
        dispatchEvent: vi.fn(),
      };
      return list as unknown as MediaQueryList;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.style.overflow = "";
  });

  it("portals the dialog to document.body so it escapes the header stacking context", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <header className="sticky top-0 z-50 backdrop-blur-md">
        <AdminMobileDrawer
          locale="es"
          dict={dictEn}
          newRegistrationsCount={0}
          recentInboundMessagesCount={0}
        />
      </header>,
    );

    await user.click(screen.getByRole("button", { name: dictEn.dashboard.adminNav.mobileOpen }));

    const dialog = screen.getByRole("dialog", { name: dictEn.dashboard.adminNav.aria });
    expect(dialog).toBeTruthy();
    expect(document.body.contains(dialog)).toBe(true);
    expect(container.contains(dialog)).toBe(false);
    expect(dialog.parentElement).toBe(document.body);
  });

  it("closes and unlocks body when viewport crosses md while open", async () => {
    const user = userEvent.setup();
    render(
      <AdminMobileDrawer
        locale="es"
        dict={dictEn}
        newRegistrationsCount={0}
        recentInboundMessagesCount={0}
      />,
    );

    await user.click(screen.getByRole("button", { name: dictEn.dashboard.adminNav.mobileOpen }));
    expect(document.body.style.overflow).toBe("hidden");

    matches = true;
    await act(async () => {
      for (const cb of mqListeners) {
        cb(new Event("change"));
      }
    });

    expect(document.body.style.overflow).toBe("");
    expect(screen.queryByRole("dialog", { name: dictEn.dashboard.adminNav.aria })).toBeNull();
  });

  it("shows the public site link and the language switcher", async () => {
    const user = userEvent.setup();
    render(
      <AdminMobileDrawer
        locale="es"
        dict={dictEn}
        newRegistrationsCount={0}
        recentInboundMessagesCount={0}
      />,
    );

    await user.click(screen.getByRole("button", { name: dictEn.dashboard.adminNav.mobileOpen }));

    expect(screen.getByRole("link", { name: dictEn.dashboard.adminChrome.backToSite })).toHaveAttribute(
      "href",
      "/es",
    );
    expect(screen.getByRole("navigation", { name: dictEn.common.locale.label })).toBeInTheDocument();
  });

  it("shows the institute logo and the signed-in person", async () => {
    const user = userEvent.setup();
    render(
      <AdminMobileDrawer
        locale="es"
        dict={dictEn}
        newRegistrationsCount={0}
        recentInboundMessagesCount={0}
        brand={hiddenBrand}
        profileDisplayName="Ana Pérez"
        profileRoleLabel="Admin"
      />,
    );

    await user.click(screen.getByRole("button", { name: dictEn.dashboard.adminNav.mobileOpen }));

    const profile = screen.getByRole("link", { name: dictEn.dashboard.adminNav.myProfile });
    expect(profile).toHaveAttribute("href", "/es/dashboard/profile");
    expect(profile).toHaveTextContent("Ana Pérez");
    expect(profile).toHaveTextContent("Admin");
    expect(screen.getByRole("img", { name: "Hidden Brand" })).toBeInTheDocument();
    expect(screen.getByText("Hidden Brand")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Hidden Brand/ })).toHaveAttribute(
      "href",
      "/es/dashboard/admin",
    );
    expect(screen.queryByRole("link", { name: dictEn.dashboard.adminNav.home })).toBeNull();
    expect(screen.queryByRole("link", { name: dictEn.dashboard.adminNav.students })).toBeNull();
  });

  it("filters tiles and shows an empty line when nothing matches", async () => {
    const user = userEvent.setup();
    render(
      <AdminMobileDrawer
        locale="es"
        dict={dictEn}
        newRegistrationsCount={0}
        recentInboundMessagesCount={0}
      />,
    );

    await user.click(screen.getByRole("button", { name: dictEn.dashboard.adminNav.mobileOpen }));
    await user.type(screen.getByRole("searchbox", { name: dictEn.dashboard.adminNav.mobileMenuSearch }), "zzz");

    expect(screen.getByText(dictEn.dashboard.adminNav.mobileMenuEmpty)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: dictEn.dashboard.adminNav.parents })).toBeNull();
  });

  it("closes the menu when a tile is chosen", async () => {
    const user = userEvent.setup();
    mockPathname.mockReturnValue("/es/dashboard/admin/parents");
    render(
      <AdminMobileDrawer
        locale="es"
        dict={dictEn}
        newRegistrationsCount={0}
        recentInboundMessagesCount={3}
      />,
    );

    await user.click(screen.getByRole("button", { name: dictEn.dashboard.adminNav.mobileOpen }));
    const parents = screen.getByRole("link", { name: dictEn.dashboard.adminNav.parents });
    expect(parents).toHaveAttribute("aria-current", "page");
    const messages = screen.getByRole("link", { name: new RegExp(dictEn.dashboard.adminNav.messages) });
    expect(messages).toHaveTextContent("3");

    await user.click(parents);
    expect(screen.queryByRole("dialog", { name: dictEn.dashboard.adminNav.aria })).toBeNull();
  });
});
