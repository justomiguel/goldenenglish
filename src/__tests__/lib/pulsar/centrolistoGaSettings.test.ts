import { beforeEach, describe, expect, it, vi } from "vitest";

const maybeSingle = vi.hoisted(() => vi.fn());
const updateEq = vi.hoisted(() => vi.fn());
const insert = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/pulsar", () => ({
  isPulsarSupabaseConfigured: () => true,
  createPulsarAdminClient: () => ({
    from(table: string) {
      if (table === "platform_audit_log") return { insert };
      return {
        select: () => ({ eq: () => ({ maybeSingle }) }),
        update: () => ({ eq: updateEq }),
      };
    },
  }),
}));

import {
  loadCentrolistoGaMeasurementId,
  saveCentrolistoGaMeasurementId,
} from "@/lib/pulsar/centrolistoGaSettings";

const actor = { actorUserId: "00000000-0000-0000-0000-000000000001", actorEmail: "admin@centrolisto.cl" };

// REGRESSION CHECK: A bad id must not be written. A blank id clears the column.

describe("centrolistoGaSettings", () => {
  beforeEach(() => {
    maybeSingle.mockReset();
    updateEq.mockReset();
    insert.mockReset();
    updateEq.mockResolvedValue({ error: null });
    insert.mockResolvedValue({ error: null });
  });

  it("loads a valid measurement id", async () => {
    maybeSingle.mockResolvedValue({ data: { ga_measurement_id: "G-ABC123" }, error: null });
    await expect(loadCentrolistoGaMeasurementId()).resolves.toBe("G-ABC123");
  });

  it("rejects an invalid id and stores a blank id as null", async () => {
    await expect(
      saveCentrolistoGaMeasurementId({ ...actor, measurementId: "UA-1" }),
    ).resolves.toEqual({ ok: false, errorCode: "invalid_input" });
    expect(updateEq).not.toHaveBeenCalled();

    await expect(
      saveCentrolistoGaMeasurementId({ ...actor, measurementId: "  " }),
    ).resolves.toEqual({ ok: true, measurementId: null });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ action: "settings.ga_measurement_id", changed_fields: ["ga_measurement_id"] }),
    );
  });
});
