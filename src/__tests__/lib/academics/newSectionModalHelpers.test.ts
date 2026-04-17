import { describe, expect, it } from "vitest";

import { defaultSectionPeriodInitial, parseCustomMaxStudents } from "@/lib/academics/newSectionModalHelpers";

describe("defaultSectionPeriodInitial", () => {
  it("uses today for start and end", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(defaultSectionPeriodInitial()).toEqual({ startsOn: today, endsOn: today });
  });
});

describe("parseCustomMaxStudents", () => {
  it("returns null when not customizing", () => {
    expect(parseCustomMaxStudents(false, "")).toEqual({ ok: true, value: null });
  });

  it("parses positive integer", () => {
    expect(parseCustomMaxStudents(true, " 12 ")).toEqual({ ok: true, value: 12 });
  });

  it("rejects invalid", () => {
    expect(parseCustomMaxStudents(true, "0")).toEqual({ ok: false });
    expect(parseCustomMaxStudents(true, "")).toEqual({ ok: false });
  });
});
