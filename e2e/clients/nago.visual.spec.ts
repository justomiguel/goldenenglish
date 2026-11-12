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
  timeout: 30_000,
};

async function openPage(page: Page, path: string, width: number) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoIsolated(page, path, { timeout: 180_000, attempts: 2 });
  await page.locator("[aria-busy='true']").waitFor({ state: "hidden", timeout: 60_000 }).catch(() => undefined);
  const hero = page.locator("#nago-hero-title");
  if ((await hero.count()) > 0) {
    await expect(hero).toBeVisible();
  } else {
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 60_000 });
  }
  await dismissHomeEventPopup(page);
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.evaluate(async () => {
    const pending = [...document.images]
      .filter((img) => !img.complete)
      .map((img) => img.decode().catch(() => undefined));
    await Promise.race([
      Promise.all(pending),
      new Promise((resolve) => setTimeout(resolve, 12000)),
    ]);
    await document.fonts.ready;
  });
  // The 1280 baseline includes the home event dialog. The 390 baseline does not.
  if (width === 390) await dismissHomeEventPopup(page);
}

async function dismissHomeEventPopup(page: Page) {
  const popup = page.getByRole("dialog", { name: "Próximos eventos" });
  if (!(await popup.isVisible().catch(() => false))) return;
  await popup.getByRole("button", { name: "Cerrar" }).click();
  await expect(popup).toBeHidden();
}

test.describe("nago public pages", () => {
  test.skip(!process.env.CLIENT_VISUAL_BASE_URL, "Set CLIENT_VISUAL_BASE_URL to the Nago host.");

  for (const [name, path] of pages) {
    for (const width of widths) {
      test(`${name} at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await openPage(page, path, width);
        const mask = name === "contact" || name === "events" ? [page.locator("img")] : [];
        await expect(page).toHaveScreenshot(`${name}-${width}.png`, { ...shot, mask });
      });
    }
  }
});
