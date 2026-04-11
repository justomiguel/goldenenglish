import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { reachesSurfaceMountGate } from "../../../scripts/tier-a-surface-verify.mjs";

const ROOT = process.cwd();

describe("tier-a-surface-verify", () => {
  it("student dashboard page reaches SurfaceMountGate", () => {
    const p = join(ROOT, "src/app/[locale]/dashboard/student/page.tsx");
    expect(reachesSurfaceMountGate(ROOT, p)).toBe(true);
  });

  it("parent dashboard page reaches SurfaceMountGate", () => {
    const p = join(ROOT, "src/app/[locale]/dashboard/parent/page.tsx");
    expect(reachesSurfaceMountGate(ROOT, p)).toBe(true);
  });

  it("parent payments page reaches SurfaceMountGate", () => {
    const p = join(ROOT, "src/app/[locale]/dashboard/parent/payments/page.tsx");
    expect(reachesSurfaceMountGate(ROOT, p)).toBe(true);
  });

  it("student payments page reaches SurfaceMountGate", () => {
    const p = join(ROOT, "src/app/[locale]/dashboard/student/payments/page.tsx");
    expect(reachesSurfaceMountGate(ROOT, p)).toBe(true);
  });

  it("student messages page reaches SurfaceMountGate", () => {
    const p = join(ROOT, "src/app/[locale]/dashboard/student/messages/page.tsx");
    expect(reachesSurfaceMountGate(ROOT, p)).toBe(true);
  });
});
