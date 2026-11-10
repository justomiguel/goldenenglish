// REGRESSION CHECK: The third frame opens video 1. A photo slide must not render a video element.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import dictEs from "@/dictionaries/es.json";
import { LioraLandingGallery } from "@/components/organisms/LioraLandingGallery";
import type { Dictionary } from "@/types/i18n";

beforeAll(() => {
  HTMLVideoElement.prototype.play = vi.fn(() => Promise.resolve());
  HTMLVideoElement.prototype.pause = vi.fn();
});

describe("LioraLandingGallery", () => {
  it("keeps a photo slide free of video and plays video 1 from the third frame", async () => {
    const user = userEvent.setup();
    render(<LioraLandingGallery dict={dictEs as Dictionary} />);

    await user.click(screen.getByRole("button", { name: "Ampliar foto 1" }));
    expect(document.querySelector("video")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Reproducir video 1" }));
    expect(document.querySelector("video")).toHaveAttribute(
      "src",
      "/images/liora/galeria/v1.mp4",
    );
    expect(screen.getByRole("button", { name: "Reproducir" })).toBeInTheDocument();
  });
});
