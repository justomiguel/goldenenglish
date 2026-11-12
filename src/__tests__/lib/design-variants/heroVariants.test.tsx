import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GenericLandingHero } from "@/components/organisms/generic-landing/GenericLandingHero";
import type { GenericHeroLayout } from "@/lib/landing/genericLandingComposition";

const copy = {
  scene: "Sunday evening",
  title: "A family finds a seat",
  body: "The student is on the list.",
  imageAlt: "Class photo",
  name: "North Hall",
  cta: "Enroll",
} as never;

describe("GenericLandingHero variants", () => {
  it.each(["bleed", "split", "masthead", "stage", "title"] as const)(
    "renders the %s heading",
    (layout: GenericHeroLayout) => {
      render(<GenericLandingHero layout={layout} copy={copy} heroSrc="/generic/hero.jpg" />);
      expect(screen.getByRole("heading", { name: "A family finds a seat" })).toBeInTheDocument();
      expect(document.querySelector("[data-hero-layout]")).toHaveAttribute("data-hero-layout", layout);
    },
  );
});
