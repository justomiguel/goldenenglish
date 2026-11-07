/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { parseMozarthitosTenantExtras } from "@/lib/register/packs/mozarthitos/parseMozarthitosTenantExtras";
import { readMozarthitosExtrasFromFormData } from "@/lib/register/packs/mozarthitos/readMozarthitosExtrasFromFormData";

function form(guide?: string) {
  const fd = new FormData();
  if (guide !== undefined) fd.set("mz_guide", guide);
  return fd;
}

describe("readMozarthitosExtrasFromFormData", () => {
  it("returns undefined when the guide field is missing or blank", () => {
    expect(readMozarthitosExtrasFromFormData(form())).toBeUndefined();
    expect(readMozarthitosExtrasFromFormData(form("  "))).toBeUndefined();
  });

  it("builds the pack payload from a valid token", () => {
    expect(readMozarthitosExtrasFromFormData(form("baby_mago.pack.6m_2y"))).toEqual({
      pack: "mozarthitos",
      schemaVersion: 1,
      guide: { stage: "baby_mago", modality: "pack", ageBand: "6m_2y" },
    });
  });

  it("returns undefined for a tampered token", () => {
    expect(readMozarthitosExtrasFromFormData(form("instrument.pack.8y_plus"))).toBeUndefined();
  });
});

describe("parseMozarthitosTenantExtras", () => {
  it("accepts the stored shape", () => {
    expect(
      parseMozarthitosTenantExtras({
        pack: "mozarthitos",
        schemaVersion: 1,
        guide: { stage: "instrument", modality: "in_person", ageBand: "5y_7y" },
      }),
    ).toEqual({
      pack: "mozarthitos",
      schemaVersion: 1,
      guide: { stage: "instrument", modality: "in_person", ageBand: "5y_7y" },
    });
  });

  it("rejects other packs, unknown ids, and invalid stage and modality pairs", () => {
    expect(parseMozarthitosTenantExtras({})).toBeNull();
    expect(parseMozarthitosTenantExtras({ pack: "nago", schemaVersion: 1 })).toBeNull();
    expect(
      parseMozarthitosTenantExtras({
        pack: "mozarthitos",
        schemaVersion: 1,
        guide: { stage: "adult_choir", modality: "live_online", ageBand: "adult" },
      }),
    ).toBeNull();
    expect(
      parseMozarthitosTenantExtras({
        pack: "mozarthitos",
        schemaVersion: 2,
        guide: { stage: "baby_mago", modality: "pack", ageBand: "6m_2y" },
      }),
    ).toBeNull();
  });

  it("drops unknown keys", () => {
    const parsed = parseMozarthitosTenantExtras({
      pack: "mozarthitos",
      schemaVersion: 1,
      guide: { stage: "baby_mago", modality: "pack", ageBand: "6m_2y", note: "x" },
      html: "<script>",
    });
    expect(parsed).toEqual({
      pack: "mozarthitos",
      schemaVersion: 1,
      guide: { stage: "baby_mago", modality: "pack", ageBand: "6m_2y" },
    });
  });
});
