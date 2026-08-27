import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const createAnonReadOnlyClient = vi.fn();

vi.mock("@/lib/supabase/anon", () => ({
  createAnonReadOnlyClient: () => createAnonReadOnlyClient(),
}));

const VALID = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";

async function load(token: string) {
  const { loadSectionEnrollmentLink } = await import(
    "@/lib/register/loadSectionEnrollmentLink"
  );
  return loadSectionEnrollmentLink(token);
}

describe("loadSectionEnrollmentLink", () => {
  beforeEach(() => {
    vi.resetModules();
    rpc.mockReset();
    createAnonReadOnlyClient.mockReset();
    createAnonReadOnlyClient.mockReturnValue({ rpc });
  });

  it("never queries when the token is not a uuid", async () => {
    await expect(load("not-a-token")).resolves.toBeNull();
    expect(createAnonReadOnlyClient).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns null when the public env is missing", async () => {
    createAnonReadOnlyClient.mockReturnValue(null);
    await expect(load(VALID)).resolves.toBeNull();
  });

  it("maps the resolved row into the link context", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          section_id: "11111111-1111-1111-1111-111111111111",
          section_name: "Sección B",
          cohort_name: "Ciclo 2026",
          schedule_slots: [{ dayOfWeek: 1, startTime: "18:00:00", endTime: "19:30:00" }],
          seats_remaining: 4,
          reference_image_path: "sec/1.jpg",
        },
      ],
      error: null,
    });

    await expect(load(VALID)).resolves.toEqual({
      token: VALID,
      sectionId: "11111111-1111-1111-1111-111111111111",
      sectionName: "Sección B",
      cohortName: "Ciclo 2026",
      scheduleSlots: [{ dayOfWeek: 1, startTime: "18:00", endTime: "19:30" }],
      seatsRemaining: 4,
      referenceImagePath: "sec/1.jpg",
    });
    expect(rpc).toHaveBeenCalledWith("resolve_section_enrollment_link", {
      p_token: VALID,
    });
  });

  it("treats an unlimited section as null seats rather than zero", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          section_id: "11111111-1111-1111-1111-111111111111",
          section_name: "Sección B",
          cohort_name: "Ciclo 2026",
          schedule_slots: [],
          seats_remaining: null,
        },
      ],
      error: null,
    });
    const link = await load(VALID);
    expect(link?.seatsRemaining).toBeNull();
  });

  // A full section must stay 0: collapsing it to null would advertise a section
  // with no cap, so families would see open seats where there are none.
  it("keeps a full section at zero seats instead of unlimited", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          section_id: "11111111-1111-1111-1111-111111111111",
          section_name: "Sección B",
          cohort_name: "Ciclo 2026",
          schedule_slots: [],
          seats_remaining: 0,
        },
      ],
      error: null,
    });
    const link = await load(VALID);
    expect(link?.seatsRemaining).toBe(0);
  });

  it("returns null on an rpc error", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(load(VALID)).resolves.toBeNull();
  });

  it("returns null on an empty result", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await expect(load(VALID)).resolves.toBeNull();
  });

  it("returns null on a row without a section", async () => {
    rpc.mockResolvedValue({ data: [{ section_name: "Huérfana" }], error: null });
    await expect(load(VALID)).resolves.toBeNull();
  });
});
