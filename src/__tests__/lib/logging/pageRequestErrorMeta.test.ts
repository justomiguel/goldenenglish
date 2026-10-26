import { describe, expect, it } from "vitest";
import { pageRequestErrorMeta } from "@/lib/logging/pageRequestErrorMeta";

describe("pageRequestErrorMeta", () => {
  it("keeps host, path, and digest, and drops the header bag", () => {
    const meta = pageRequestErrorMeta({
      error: Object.assign(new Error("missing url"), { digest: "13648600" }),
      path: "/es",
      method: "GET",
      hostHeader: "www.liorastudio.cl",
      routePath: "/[locale]",
      routeType: "render",
      digest: "13648600",
    });

    expect(meta).toMatchObject({
      host: "www.liorastudio.cl",
      path: "/es",
      method: "GET",
      routePath: "/[locale]",
      routeType: "render",
      digest: "13648600",
      errorName: "Error",
      errorMessage: "missing url",
    });
    expect(meta).not.toHaveProperty("cookie");
    expect(JSON.stringify(meta)).not.toContain("sb_secret");
  });
});
