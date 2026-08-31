import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { NagoLandingGallery } from "@/components/organisms/NagoLandingGallery";
import { dictEn } from "@/test/dictEn";
import { NAGO_TEMPLATE_GALLERY_URLS } from "@/lib/landing/nagoTemplateImages";

vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src} alt={props.alt} />
  ),
}));

describe("NagoLandingGallery", () => {
  it("wipes tiles and staggers only the first six", () => {
    const { container } = render(<NagoLandingGallery dict={dictEn} />);
    const tiles = container.querySelectorAll(".nago-masonry-item.nago-reveal-media");
    expect(tiles.length).toBe(NAGO_TEMPLATE_GALLERY_URLS.length);
    expect(NAGO_TEMPLATE_GALLERY_URLS.length).toBeGreaterThan(6);
    const delays = [...tiles].map((el) => {
      if (el.classList.contains("d1")) return 1;
      if (el.classList.contains("d2")) return 2;
      if (el.classList.contains("d3")) return 3;
      return 0;
    });
    expect(delays.slice(0, 6)).toEqual([1, 2, 3, 1, 2, 3]);
    expect(delays.slice(6).every((d) => d === 0)).toBe(true);
  });
});
