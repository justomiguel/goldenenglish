import { describe, it, expect, vi, afterEach } from "vitest";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";

vi.mock("@/lib/theme/themeParser", () => ({
  loadProperties: vi.fn(() => ({})),
  getProperty: vi.fn(),
}));

import { getProperty, loadProperties } from "@/lib/theme/themeParser";

describe("getLegalAgeMajorityFromSystem", () => {
  afterEach(() => {
    vi.mocked(getProperty).mockReset();
    vi.mocked(loadProperties).mockReturnValue({});
  });

  it("returns 18 from system.properties by default", () => {
    vi.mocked(getProperty).mockImplementation((_p, _k, fb) => fb as string);
    expect(getLegalAgeMajorityFromSystem()).toBe(18);
  });

  it("returns 18 when parsed value is out of range", () => {
    vi.mocked(getProperty).mockReturnValue("200");
    expect(getLegalAgeMajorityFromSystem()).toBe(18);
  });

  it("returns parsed value when valid", () => {
    vi.mocked(getProperty).mockReturnValue("21");
    expect(getLegalAgeMajorityFromSystem()).toBe(21);
  });
});
