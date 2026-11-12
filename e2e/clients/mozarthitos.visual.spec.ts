import { expect, test, type Page } from "@playwright/test";
import { gotoIsolated } from "../helpers/gotoIsolated";

const widths = [1280, 390] as const;

const pages = [
  ["home", "/es"],
  ["register", "/es/register"],
  ["contact", "/es/contact"],
  ["blog", "/es/blog"],
  ["privacy", "/es/privacidad"],
  ["answers", "/es/preguntas"],
  ["events", "/es/events"],
] as const;

const shot = {
  animations: "disabled" as const,
  fullPage: true,
  maxDiffPixelRatio: 0.001,
};

async function openPage(page: Page, path: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoIsolated(page, path, { timeout: 180_000, attempts: 2 });
  await page.locator("[aria-busy='true']").waitFor({ state: "hidden", timeout: 60_000 }).catch(() => undefined);
  const hero = page.locator("#mz-hero-title");
  if ((await hero.count()) > 0) {
    await expect(hero).toBeVisible();
  } else {
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 60_000 });
  }
  const popup = page.getByRole("dialog", { name: "Próximos eventos" });
  if (await popup.isVisible().catch(() => false)) {
    await popup.getByRole("button", { name: "Cerrar" }).click();
    await expect(popup).toBeHidden();
  }
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.evaluate(async () => {
    const pending = [...document.images]
      .filter((img) => !img.complete)
      .map((img) => img.decode().catch(() => undefined));
    await Promise.race([
      Promise.all(pending),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
    await document.fonts.ready;
  });
}

test.describe("mozarthitos public pages", () => {
  test.skip(!process.env.CLIENT_VISUAL_BASE_URL, "Set CLIENT_VISUAL_BASE_URL to the Mozarthitos host.");

  for (const [name, path] of pages) {
    for (const width of widths) {
      test(`${name} at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await openPage(page, path);
        const mask = name === "contact" || name === "events" ? [page.locator("img")] : [];
        await expect(page).toHaveScreenshot(`${name}-${width}.png`, { ...shot, mask });
      });
    }
  }
});
