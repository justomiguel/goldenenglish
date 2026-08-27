import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    priority,
    sizes,
    className,
  }: {
    src: string;
    alt: string;
    priority?: boolean;
    sizes?: string;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      sizes={sizes}
      className={className}
      data-priority={priority ? "true" : "false"}
    />
  ),
}));

import { LandingHeroPhoto } from "@/components/molecules/LandingHeroPhoto";

describe("LandingHeroPhoto", () => {
  it("renders the src and marks priority when asked", () => {
    const { container } = render(
      <div className="relative h-40">
        <LandingHeroPhoto
          src="/images/liora/inicio/1.jpg"
          alt=""
          sizes="100vw"
          priority
          className="object-cover"
        />
      </div>,
    );
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "/images/liora/inicio/1.jpg");
    expect(img).toHaveAttribute("data-priority", "true");
    expect(img).toHaveAttribute("sizes", "100vw");
  });

  it("defaults priority off", () => {
    const { container } = render(
      <div className="relative h-40">
        <LandingHeroPhoto src="/x.jpg" alt="x" sizes="50vw" />
      </div>,
    );
    expect(container.querySelector("img")).toHaveAttribute("data-priority", "false");
  });
});
