import { beforeEach, describe, expect, it, vi } from "vitest";

const { activateMock, warnMock } = vi.hoisted(() => ({
  activateMock: vi.fn(),
  warnMock: vi.fn(),
}));

vi.mock("@/lib/pulsar/activateFreeSiteTheme", () => ({
  activateFreeSiteTheme: (...args: unknown[]) => activateMock(...args),
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerWarn: (...args: unknown[]) => warnMock(...args),
}));

import { activateExclusiveThemeOnSave } from "@/lib/pulsar/activateExclusiveThemeOnSave";

const shared = {
  dataMode: "shared_schema",
  databaseUrl: "postgres://db.example/centrolisto",
  postgresSchema: "tenant_matiss",
};

describe("activateExclusiveThemeOnSave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    activateMock.mockResolvedValue({ ok: true });
  });

  it("activates the matiss row for its owner", async () => {
    await activateExclusiveThemeOnSave({ ...shared, slug: "matiss", brandThemeSlug: "matiss" });
    expect(activateMock).toHaveBeenCalledWith({
      databaseUrl: shared.databaseUrl,
      schema: "tenant_matiss",
      themeSlug: "matiss",
      properties: {},
    });
  });

  it("leaves a generic slug untouched", async () => {
    await activateExclusiveThemeOnSave({ ...shared, slug: "demo", brandThemeSlug: "deportes" });
    expect(activateMock).not.toHaveBeenCalled();
  });

  it("refuses matiss for another tenant", async () => {
    await activateExclusiveThemeOnSave({ ...shared, slug: "demo", brandThemeSlug: "matiss" });
    expect(activateMock).not.toHaveBeenCalled();
  });

  it("logs the code when activation fails", async () => {
    activateMock.mockResolvedValue({ ok: false, errorCode: "theme_missing" });
    await activateExclusiveThemeOnSave({ ...shared, slug: "matiss", brandThemeSlug: "matiss" });
    expect(warnMock).toHaveBeenCalledWith("activateExclusiveThemeOnSave", {
      errorCode: "theme_missing",
      slug: "matiss",
      themeSlug: "matiss",
    });
  });
});
