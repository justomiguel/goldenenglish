import { afterEach, describe, expect, it, vi } from "vitest";
import { attachStaffExtraHosts } from "@/lib/pulsar/attachVercelDomain";

describe("attachStaffExtraHosts", () => {
  const previousToken = process.env.VERCEL_TOKEN;
  const previousProject = process.env.VERCEL_PROJECT_ID;

  afterEach(() => {
    process.env.VERCEL_TOKEN = previousToken;
    process.env.VERCEL_PROJECT_ID = previousProject;
    vi.unstubAllGlobals();
  });

  it("registers a preview host and skips a local host", async () => {
    process.env.VERCEL_TOKEN = "token";
    process.env.VERCEL_PROJECT_ID = "prj_centro";
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await attachStaffExtraHosts({
      slug: "escuela",
      hosts: ["escuela.centrolisto.cl", "escuela.localhost"],
    });

    expect(result).toEqual({ ok: true, slug: "escuela", domainStatus: "attached" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(String(init.body)).toContain("escuela.centrolisto.cl");
    expect(String(init.body)).not.toContain("localhost");
  });
});
