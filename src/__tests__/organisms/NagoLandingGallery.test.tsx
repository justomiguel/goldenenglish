import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NagoLandingGallery } from "@/components/organisms/NagoLandingGallery";
import { dictEn } from "@/test/dictEn";

vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src} alt={props.alt} />
  ),
}));

const g = dictEn.landing.nago.galeria;

describe("NagoLandingGallery", () => {
  it("keeps both events on the page with three photos each", () => {
    render(<NagoLandingGallery dict={dictEn} />);
    expect(screen.getByRole("heading", { name: g.events.conexionInternacional2025 })).toBeTruthy();
    expect(screen.getByRole("heading", { name: g.events.capoeiraMeChama2022 })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /open photo/i })).toHaveLength(6);
    expect(screen.getAllByText(g.playVideo)).toHaveLength(3);
    expect(document.querySelector('img[src*="conexion-internacional-2025/04.jpg"]')).toBeNull();
    expect(document.querySelector('img[src*="v04.jpg"]')).toBeNull();
    expect(document.querySelector('img[src*="nago-gal-01.png"]')).toBeNull();
  });

  it("opens a photo carousel and leaves both events on the page", async () => {
    const user = userEvent.setup();
    render(<NagoLandingGallery dict={dictEn} />);
    const conexion = document.querySelector('img[src*="conexion-internacional-2025/01.jpg"]');
    await user.click(conexion!.closest("button")!);
    const dialog = screen.getByRole("dialog", { name: g.sectionTitle });
    expect(dialog.querySelector("img")?.getAttribute("src")).toContain("/01.jpg");
    await user.click(screen.getByRole("button", { name: g.carouselNext }));
    expect(dialog.querySelector("img")?.getAttribute("src")).toContain("/02.jpg");
    await user.click(screen.getByRole("button", { name: g.lightboxClose }));
    expect(screen.getByRole("heading", { name: g.events.capoeiraMeChama2022 })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /open photo/i })).toHaveLength(6);
  });

  it("opens a video without replacing the event groups", async () => {
    const user = userEvent.setup();
    render(<NagoLandingGallery dict={dictEn} />);
    await user.click(screen.getByRole("button", { name: "Play video 1" }));
    const dialog = screen.getByRole("dialog", { name: g.sectionTitle });
    expect(dialog.querySelector("video")?.getAttribute("src")).toContain("v01.mp4");
    expect(screen.getByRole("slider", { name: g.seekVideo })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: g.lightboxClose }));
    expect(screen.getAllByRole("button", { name: /play video/i })).toHaveLength(3);
    expect(screen.getByRole("heading", { name: g.events.conexionInternacional2025 })).toBeTruthy();
  });
});
