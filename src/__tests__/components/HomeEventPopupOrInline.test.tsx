/** @vitest-environment jsdom */
// Liora on narrow screens shows the next event as an inline card after the
// hero, not as a modal. Desktop keeps the modal.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { HomeEventPopupEvent } from "@/lib/dashboard/events/loadHomeEventPopup";

const surface = vi.hoisted(() => ({ current: "web-mobile" as string }));
const track = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useAppSurface", () => ({
  useAppSurface: () => surface.current,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/es",
}));

vi.mock("@/lib/analytics/trackClient", () => ({
  trackEvent: track,
}));

vi.mock("@/components/organisms/HomeEventPopup", () => ({
  HomeEventPopup: () => <div role="dialog" aria-label="popup" />,
}));

import { HomeEventPopupOrInline } from "@/components/organisms/HomeEventPopupOrInline";

const labels = {
  dialogTitle: "Próximos eventos",
  close: "Cerrar",
  previous: "Anterior",
  next: "Siguiente",
  position: "{{current}} de {{total}}",
  dateLabel: "Fecha",
  locationLabel: "Lugar",
  goToRegister: "Ir al registro",
  imageLoading: "Cargando",
  free: "Gratis",
  priceLocal: "Local",
  priceNonLocal: "No local",
};

const gala: HomeEventPopupEvent = {
  id: "gala",
  slug: "gala",
  title: "Gala",
  excerpt: "",
  coverImageUrl: null,
  eventDate: "2027-01-08T22:00:00.000Z",
  location: "Teatro",
  currency: "CLP",
  price: 0,
  priceLocal: 0,
  priceNonLocal: 0,
  priceByFlow: false,
  flowPrices: [],
};

function mountSlot() {
  const slot = document.createElement("div");
  slot.id = "home-event-inline-slot";
  document.body.appendChild(slot);
  return slot;
}

describe("HomeEventPopupOrInline", () => {
  beforeEach(() => {
    surface.current = "web-mobile";
    track.mockClear();
  });

  afterEach(() => {
    document.getElementById("home-event-inline-slot")?.remove();
  });

  it("renders the inline card inside the slot on narrow screens and no dialog", async () => {
    const slot = mountSlot();
    render(<HomeEventPopupOrInline locale="es" events={[gala]} labels={labels} />);

    const card = await screen.findByRole("region", { name: "Próximos eventos" });
    expect(slot.contains(card)).toBe(true);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("heading", { name: "Gala" })).toBeInTheDocument();
  });

  it("tracks the inline card button with its own surface", async () => {
    mountSlot();
    render(<HomeEventPopupOrInline locale="es" events={[gala]} labels={labels} />);
    await userEvent.click(await screen.findByRole("link", { name: /Ir al registro/ }));
    expect(track).toHaveBeenCalledWith("click", expect.any(String), {
      surface: "home_inline",
      event_id: "gala",
      intent: "open_register",
    });
  });

  it("keeps the modal on desktop", async () => {
    surface.current = "web-desktop";
    mountSlot();
    render(<HomeEventPopupOrInline locale="es" events={[gala]} labels={labels} />);
    expect(await screen.findByRole("dialog", { name: "popup" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Próximos eventos" })).toBeNull();
  });

  it("falls back to the modal when the page has no slot", async () => {
    render(<HomeEventPopupOrInline locale="es" events={[gala]} labels={labels} />);
    expect(await screen.findByRole("dialog", { name: "popup" })).toBeInTheDocument();
  });

  it("renders nothing without events", async () => {
    mountSlot();
    const { container } = render(<HomeEventPopupOrInline locale="es" events={[]} labels={labels} />);
    await Promise.resolve();
    expect(container).toBeEmptyDOMElement();
    expect(document.getElementById("home-event-inline-slot")).toBeEmptyDOMElement();
  });
});
