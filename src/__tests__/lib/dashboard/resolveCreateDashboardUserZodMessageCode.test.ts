/** @vitest-environment node */

import { describe, it, expect } from "vitest";
import { z } from "zod";
import { resolveCreateDashboardUserZodMessageCode } from "@/lib/dashboard/resolveCreateDashboardUserZodMessageCode";

describe("resolveCreateDashboardUserZodMessageCode", () => {
  it("reads the first actionable path on the create-dashboard-user shape", () => {
    expect(
      resolveCreateDashboardUserZodMessageCode(
        z
          .object({ email: z.string().trim().email() })
          .safeParse({ email: "bad" }).error!.issues,
      ),
    ).toBe("invalid_email");

    const namesSchema = z.object({
      first_name: z.string().trim().min(1).max(120),
      last_name: z.string().trim().min(1).max(120),
    });

    expect(
      resolveCreateDashboardUserZodMessageCode(
        namesSchema.safeParse({ first_name: "", last_name: "B" }).error!.issues,
      ),
    ).toBe("first_name_required");

    expect(
      resolveCreateDashboardUserZodMessageCode(
        namesSchema.safeParse({ first_name: "A", last_name: "" }).error!.issues,
      ),
    ).toBe("last_name_required");
  });
});
