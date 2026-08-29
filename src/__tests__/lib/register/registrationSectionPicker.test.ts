/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  assignRegisterPickerOverlapColumns,
  comboOptionsForRegisterPicker,
  flattenRegisterPickerCells,
  mapRegistrationSectionPickerRows,
  resolveRegisterPickerWeekWindowMinutes,
  type RegisterPickerCell,
  type RegistrationSectionPickerOption,
} from "@/lib/register/registrationSectionPicker";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

const options: RegistrationSectionPickerOption[] = [
  {
    id: A,
    label: "Yoga mañana",
    hasOpenSeat: true,
    offersTrial: true,
    slots: [{ dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }],
  },
  {
    id: B,
    label: "Yoga tarde",
    hasOpenSeat: false,
    offersTrial: true,
    slots: [{ dayOfWeek: 1, startTime: "18:00", endTime: "19:00" }],
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    label: "Sin trial",
    hasOpenSeat: true,
    offersTrial: false,
    slots: [{ dayOfWeek: 2, startTime: "10:00", endTime: "11:00" }],
  },
];

describe("flattenRegisterPickerCells", () => {
  it("builds one cell per slot and marks full cells disabled", () => {
    const cells = flattenRegisterPickerCells(options, "reserve");
    expect(cells).toHaveLength(3);
    expect(cells.find((c) => c.sectionId === B)?.disabled).toBe(true);
    expect(cells.find((c) => c.sectionId === A)?.disabled).toBe(false);
  });

  it("hides sections that do not offer trial when intent is trial", () => {
    const cells = flattenRegisterPickerCells(options, "trial");
    expect(cells.map((c) => c.sectionId)).toEqual([A, B]);
  });
});

describe("comboOptionsForRegisterPicker", () => {
  it("omits full sections from the combo", () => {
    const combo = comboOptionsForRegisterPicker(options, "reserve");
    expect(combo.map((o) => o.id)).toEqual([
      A,
      "33333333-3333-4333-8333-333333333333",
    ]);
  });

  it("omits full and non-trial sections for trial intent", () => {
    const combo = comboOptionsForRegisterPicker(options, "trial");
    expect(combo.map((o) => o.id)).toEqual([A]);
  });
});

describe("resolveRegisterPickerWeekWindowMinutes", () => {
  it("fits the visible day to offered slots instead of a full 7–22 editor window", () => {
    expect(
      resolveRegisterPickerWeekWindowMinutes([
        { startTime: "09:00", endTime: "10:00" },
        { startTime: "18:00", endTime: "19:00" },
      ]),
    ).toEqual({ start: 8 * 60 + 30, end: 19 * 60 + 30 });
  });

  it("keeps a short morning offer readable with a few hour marks", () => {
    const window = resolveRegisterPickerWeekWindowMinutes([
      { startTime: "09:00", endTime: "10:00" },
    ]);
    expect(window.end - window.start).toBeGreaterThanOrEqual(4 * 60);
    expect(window.start).toBeLessThanOrEqual(8 * 60 + 30);
  });
});

describe("assignRegisterPickerOverlapColumns", () => {
  it("splits overlapping same-day cells into side-by-side columns", () => {
    const cells: RegisterPickerCell[] = [
      { sectionId: A, label: "A", dayOfWeek: 4, startTime: "17:30", endTime: "18:30", disabled: false },
      { sectionId: B, label: "B", dayOfWeek: 4, startTime: "17:30", endTime: "19:30", disabled: false },
      {
        sectionId: "33333333-3333-4333-8333-333333333333",
        label: "C",
        dayOfWeek: 4,
        startTime: "18:30",
        endTime: "19:30",
        disabled: false,
      },
    ];
    const layout = assignRegisterPickerOverlapColumns(cells);
    const cols = [...layout.values()].map((v) => v.col);
    expect(new Set(cols).size).toBe(2);
    expect([...layout.values()].every((v) => v.colCount === 2)).toBe(true);
  });
});

describe("mapRegistrationSectionPickerRows", () => {
  it("maps RPC rows and parses slots", () => {
    const mapped = mapRegistrationSectionPickerRows([
      {
        id: A,
        label: "Yoga mañana",
        schedule_slots: [{ dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }],
        has_open_seat: false,
        offers_trial: true,
      },
    ]);
    expect(mapped).toEqual([
      {
        id: A,
        label: "Yoga mañana",
        hasOpenSeat: false,
        offersTrial: true,
        slots: [{ dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }],
      },
    ]);
  });
});
