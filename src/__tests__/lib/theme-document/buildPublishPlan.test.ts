import { describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import { documentHash } from "@/lib/theme-document/canonicalDocument";
import { buildPublishPlan } from "@/lib/theme-document/buildPublishPlan";
import { starterDocument } from "@/lib/theme-document/starterDocument";
import type { Dictionary } from "@/types/i18n";

const document = starterDocument("idiomas", es as Dictionary, "es");

describe("buildPublishPlan", () => {
  it("publishes a valid document once and prints the version", async () => {
    const publish = vi.fn(async () => ({ ok: true as const, version: 4 }));
    const lines: string[] = [];
    const result = await buildPublishPlan({
      document,
      tenantSlug: "matiss",
      dryRun: false,
      publish,
      write: (line) => lines.push(line),
    });
    expect(result).toEqual({ ok: true, hash: await documentHash(document), version: 4 });
    expect(publish).toHaveBeenCalledTimes(1);
    expect(lines).toEqual(["4"]);
  });

  it("prints the hash on a dry run and does not publish", async () => {
    const publish = vi.fn(async () => ({ ok: true as const, version: 4 }));
    const lines: string[] = [];
    const result = await buildPublishPlan({
      document,
      tenantSlug: "matiss",
      dryRun: true,
      publish,
      write: (line) => lines.push(line),
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.version).toBeNull();
    expect(lines).toEqual([await documentHash(document)]);
    expect(publish).not.toHaveBeenCalled();
  });

  it("rejects an invalid document and does not publish", async () => {
    const publish = vi.fn(async () => ({ ok: true as const, version: 4 }));
    const result = await buildPublishPlan({
      document: { contractVersion: 1 },
      tenantSlug: "matiss",
      dryRun: false,
      publish,
      write: () => undefined,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("variant_props_invalid");
    expect(publish).not.toHaveBeenCalled();
  });
});
