import { describe, expect, it, vi } from "vitest";
import { submitSiteSetupWizardClient } from "@/components/dashboard/admin/site-setup/submitSiteSetupWizardClient";

// REGRESSION CHECK: Wizard submit orchestrates two FileReader passes then server action.
vi.mock(
  "@/components/dashboard/admin/site-setup/readImageFileAsBase64",
  () => ({
    readImageFileAsBase64: vi.fn(
      async (
        _file: File,
        opts?: { onProgress?: (r: number) => void },
      ): Promise<{ base64: string; mime: string }> => {
        opts?.onProgress?.(0.5);
        opts?.onProgress?.(1);
        return { base64: "eA==", mime: "image/png" };
      },
    ),
  }),
);

const completeMock = vi.fn();

vi.mock("@/app/[locale]/dashboard/admin/site-setup/siteSetupActions", () => ({
  completeInitialSiteSetupAction: (...args: unknown[]) => completeMock(...args),
}));

describe("submitSiteSetupWizardClient", () => {
  it("reports reading then sending and returns ok when action succeeds", async () => {
    completeMock.mockResolvedValueOnce({ ok: true });

    const logo = new File([""], "logo.png", { type: "image/png" });
    const fav = new File([""], "fav.png", { type: "image/png" });
    const progress: Array<{ phase: string; percent?: number }> = [];

    const result = await submitSiteSetupWizardClient({
      locale: "es",
      themeId: "t1",
      logoFile: logo,
      faviconFile: fav,
      logoAlt: "Alt",
      appName: "A",
      legalName: "L",
      tagline: "T",
      contactEmail: "e@e.com",
      contactPhone: "1",
      contactAddress: "x",
      onProgress: (p) =>
        progress.push(
          p.phase === "reading"
            ? { phase: p.phase, percent: p.percent }
            : { phase: p.phase },
        ),
    });

    expect(result).toEqual({ ok: true });
    expect(progress.some((x) => x.phase === "reading")).toBe(true);
    expect(progress.some((x) => x.phase === "sending")).toBe(true);
    expect(completeMock).toHaveBeenCalledTimes(1);
  });

  it("returns action code when setup fails", async () => {
    completeMock.mockResolvedValueOnce({ ok: false, code: "persist_failed" });

    const logo = new File([""], "logo.png", { type: "image/png" });
    const fav = new File([""], "fav.png", { type: "image/png" });

    const result = await submitSiteSetupWizardClient({
      locale: "es",
      themeId: "t1",
      logoFile: logo,
      faviconFile: fav,
      logoAlt: "Alt",
      appName: "A",
      legalName: "L",
      tagline: "T",
      contactEmail: "e@e.com",
      contactPhone: "1",
      contactAddress: "x",
      onProgress: vi.fn(),
    });

    expect(result).toEqual({ ok: false, code: "persist_failed" });
  });
});
