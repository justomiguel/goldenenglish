import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { HomeEventPopupEvent } from "@/lib/dashboard/events/loadHomeEventPopup";

vi.mock("next/image", () => ({
  default: ({
    src,
    priority,
  }: {
    src: string;
    priority?: boolean;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" data-priority={priority ? "true" : "false"} />
  ),
}));

import { HomeEventPopupSlide } from "@/components/organisms/HomeEventPopupSlide";

const labels = {
  dateLabel: "Fecha",
  locationLabel: "Lugar",
  goToRegister: "Ir a la inscripción",
  imageLoading: "Cargando imagen",
  free: "Gratis",
  priceLocal: "Local",
  priceNonLocal: "No local",
};

function event(): HomeEventPopupEvent {
  return {
    id: "evt",
    slug: "capoeira-me-chama",
    title: "Capoeira Me Chama",
    excerpt: "",
    coverImageUrl: "https://example.supabase.co/storage/v1/object/public/event-media/events/evt/cover.jpg",
    eventDate: "2026-11-01T18:00:00.000Z",
    location: null,
    currency: "CLP",
    price: 0,
    priceLocal: 0,
    priceNonLocal: 0,
    priceByFlow: false,
    flowPrices: [],
  };
}

describe("HomeEventPopupSlide LCP", () => {
  it("loads the cover with priority", () => {
    const { container } = render(
      <HomeEventPopupSlide locale="es" event={event()} labels={labels} onOpenEvent={() => {}} />,
    );
    expect(container.querySelector("img")).toHaveAttribute("data-priority", "true");
  });
});
