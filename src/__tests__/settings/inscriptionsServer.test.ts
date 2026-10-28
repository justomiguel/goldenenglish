// REGRESSION CHECK: Public registration cohort resolution must fall back to the is_current cohort when registration_cohort_id is unset or references an unknown/archived cohort.
import { describe, it, expect, vi, beforeEach } from "vitest";

const chain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(),
};

const mockFrom = vi.fn(() => chain);

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: mockFrom,
  })),
}));

import {
  getInscriptionsEnabled,
  getRegisterShowAllSections,
  parseConfiguredCohortId,
  parseSiteSettingsBoolean,
  resolveRegistrationCohortState,
} from "@/lib/settings/inscriptionsServer";

describe("getInscriptionsEnabled", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chain.maybeSingle.mockResolvedValue({ data: null });
  });

  it("returns true when row missing", async () => {
    await expect(getInscriptionsEnabled()).resolves.toBe(true);
    expect(mockFrom).toHaveBeenCalledWith("site_settings");
  });

  it("reads boolean jsonb", async () => {
    chain.maybeSingle.mockResolvedValue({ data: { value: false } });
    await expect(getInscriptionsEnabled()).resolves.toBe(false);
  });

  it("reads nested enabled", async () => {
    chain.maybeSingle.mockResolvedValue({
      data: { value: { enabled: true } },
    });
    await expect(getInscriptionsEnabled()).resolves.toBe(true);
  });

  it("defaults to true for unexpected value shapes", async () => {
    chain.maybeSingle.mockResolvedValue({ data: { value: "yes" } });
    await expect(getInscriptionsEnabled()).resolves.toBe(true);
  });
});

describe("parseSiteSettingsBoolean", () => {
  it("uses the fallback for missing or unexpected values", () => {
    expect(parseSiteSettingsBoolean(undefined, false)).toBe(false);
    expect(parseSiteSettingsBoolean("yes", false)).toBe(false);
    expect(parseSiteSettingsBoolean({ enabled: true }, false)).toBe(true);
  });
});

describe("getRegisterShowAllSections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chain.maybeSingle.mockResolvedValue({ data: null });
  });

  it("returns false when the row is missing", async () => {
    await expect(getRegisterShowAllSections()).resolves.toBe(false);
  });

  it("reads a true boolean", async () => {
    chain.maybeSingle.mockResolvedValue({ data: { value: true } });
    await expect(getRegisterShowAllSections()).resolves.toBe(true);
  });
});

describe("parseConfiguredCohortId & resolveRegistrationCohortState", () => {
  const cohort2026 = {
    id: "00000000-0000-4000-8000-000000002026",
    name: "Ciclo 2026",
    isCurrent: true,
  };
  const cohort2027 = {
    id: "00000000-0000-4000-8000-000000002027",
    name: "Ciclo 2027",
    isCurrent: false,
  };

  it("parses valid UUID strings and objects and rejects invalid values", () => {
    expect(parseConfiguredCohortId(cohort2027.id)).toBe(cohort2027.id);
    expect(parseConfiguredCohortId({ cohortId: cohort2027.id })).toBe(cohort2027.id);
    expect(parseConfiguredCohortId("not-a-uuid")).toBeNull();
    expect(parseConfiguredCohortId(null)).toBeNull();
  });

  it("falls back to current cohort when no registration_cohort_id is configured", () => {
    const state = resolveRegistrationCohortState([cohort2026, cohort2027], null);
    expect(state.currentCohort).toEqual(cohort2026);
    expect(state.activeCohort).toEqual(cohort2026);
    expect(state.configuredCohortId).toBeNull();
  });

  it("selects the configured next-year cohort when present in non-archived cohorts", () => {
    const state = resolveRegistrationCohortState(
      [cohort2026, cohort2027],
      cohort2027.id,
    );
    expect(state.currentCohort).toEqual(cohort2026);
    expect(state.activeCohort).toEqual(cohort2027);
    expect(state.configuredCohortId).toBe(cohort2027.id);
  });

  it("falls back to current cohort when configured cohort ID is not in active list", () => {
    const state = resolveRegistrationCohortState(
      [cohort2026, cohort2027],
      "00000000-0000-4000-8000-000000009999",
    );
    expect(state.activeCohort).toEqual(cohort2026);
    expect(state.configuredCohortId).toBeNull();
  });
});
