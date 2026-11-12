import type { MotionLevel, SpaceDensity, TypeScale } from "@/lib/design-tokens/designTokensV1";

export const DESIGN_TOKEN_SCALE_CSS: {
  type: Record<TypeScale, { base: string; ratio: string }>;
  space: Record<SpaceDensity, { unit: string; section: string }>;
  motion: Record<MotionLevel, { duration: string; ease: string }>;
} = {
  type: {
    compact: { base: "15px", ratio: "1.2" },
    standard: { base: "16px", ratio: "1.25" },
    generous: { base: "18px", ratio: "1.333" },
  },
  space: {
    compact: { unit: "0.25rem", section: "3rem" },
    standard: { unit: "0.25rem", section: "4rem" },
    airy: { unit: "0.25rem", section: "6rem" },
  },
  motion: {
    none: { duration: "0ms", ease: "linear" },
    subtle: { duration: "200ms", ease: "cubic-bezier(0.22, 1, 0.36, 1)" },
    expressive: { duration: "400ms", ease: "cubic-bezier(0.22, 1, 0.36, 1)" },
  },
};
