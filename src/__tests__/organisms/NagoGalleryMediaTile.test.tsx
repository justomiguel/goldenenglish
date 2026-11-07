import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NagoGalleryMediaTile } from "@/components/organisms/NagoGalleryMediaTile";
import type { NagoGalleryItem } from "@/lib/landing/nagoGalleryCatalog";

vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src} alt={props.alt} />
  ),
}));

const video: NagoGalleryItem = {
  eventId: "capoeira-me-chama-2022",
  kind: "video",
  src: "/images/nago/galeria/capoeira-me-chama-2022/v01.mp4",
  poster: "/images/nago/galeria/capoeira-me-chama-2022/v01.jpg",
  width: 720,
  height: 1280,
};

describe("NagoGalleryMediaTile", () => {
  it("marks a video with its poster and a play control", () => {
    render(
      <NagoGalleryMediaTile item={video} label="Play video 1" showPlay playLabel="Play" onOpen={() => undefined} />,
    );
    expect(screen.getByRole("button", { name: "Play video 1" })).toBeTruthy();
    expect(screen.getByText("Play")).toBeTruthy();
    expect(document.querySelector("img")?.getAttribute("src")).toBe(video.poster);
  });
});
