import { expect, test } from "@playwright/test";
import { ALL_VARIANTS } from "../src/lib/design-variants/registry";
import { gotoIsolated } from "./helpers/gotoIsolated";

const widths = [1280, 390] as const;

test.describe("variant previews", () => {
  for (const variant of ALL_VARIANTS) {
    for (const fixture of [0, 1]) {
      for (const width of widths) {
        test(`${variant.id}@${variant.major} fixture ${fixture} at ${width}`, async ({ page }) => {
          await page.setViewportSize({ width, height: 900 });
          await page.emulateMedia({ reducedMotion: "reduce" });
          const id = encodeURIComponent(variant.id);
          await gotoIsolated(page, `/es/plantilla/variante/${id}/${variant.major}?fixture=${fixture}`);
          await expect(page).toHaveScreenshot(`${variant.id}@${variant.major}-${fixture}-${width}.png`, {
            animations: "disabled",
            maxDiffPixelRatio: 0.001,
          });
        });
      }
    }
  }
});
