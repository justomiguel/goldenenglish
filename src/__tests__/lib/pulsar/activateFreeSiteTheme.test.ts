import { describe, expect, it } from "vitest";
import { activateFreeSiteTheme } from "@/lib/pulsar/activateFreeSiteTheme";

describe("activateFreeSiteTheme", () => {
  it("rejects a schema name before opening a connection", async () => {
    const result = await activateFreeSiteTheme({
      databaseUrl: "postgres://example",
      schema: "public",
      themeSlug: "generic-deportes",
      properties: {},
    });
    expect(result).toEqual({ ok: false, errorCode: "theme_missing" });
  });
});
