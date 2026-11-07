// REGRESSION CHECK: A signed-in person opens the panel. Create-site rules stay separate.
import { describe, expect, it } from "vitest";
import {
  ownerMayCreateFreeSite,
  pulsarStartFreePath,
  signedInCanOpenCreateForm,
} from "@/lib/pulsar/pulsarStartPath";

describe("pulsarStartFreePath", () => {
  it("sends a signed-out visitor to register", () => {
    expect(pulsarStartFreePath("es", false)).toBe("/es/cuenta/registro");
  });

  it("sends any signed-in account to the panel", () => {
    expect(pulsarStartFreePath("es", true)).toBe("/es/cuenta");
    expect(ownerMayCreateFreeSite("pending")).toBe(true);
    expect(ownerMayCreateFreeSite("approved")).toBe(true);
    expect(ownerMayCreateFreeSite("rejected")).toBe(false);
    expect(signedInCanOpenCreateForm({ status: "missing", ownedCount: 0 })).toBe(true);
    expect(signedInCanOpenCreateForm({ status: "pending", ownedCount: 1 })).toBe(true);
    expect(signedInCanOpenCreateForm({ status: "approved", ownedCount: 3 })).toBe(false);
    expect(signedInCanOpenCreateForm({ status: "rejected", ownedCount: 0 })).toBe(false);
  });
});
