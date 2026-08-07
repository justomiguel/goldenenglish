import { describe, expect, it } from "vitest";
import {
  LIORA_CLASS_KEYS,
  LIORA_SATURDAY_SCHEDULE,
  LIORA_SEDE_KEYS,
} from "@/lib/landing/lioraSchedule";
import { LIORA_LANDING_COPY_KEYS_BY_SECTION } from "@/lib/cms/landingLioraCatalog";

describe("LIORA_SATURDAY_SCHEDULE", () => {
  it("covers every sede exactly once", () => {
    const keys = LIORA_SATURDAY_SCHEDULE.map((s) => s.sedeKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect([...keys].sort()).toEqual([...LIORA_SEDE_KEYS].sort());
  });

  it("gives every sede at least one slot", () => {
    for (const sede of LIORA_SATURDAY_SCHEDULE) {
      expect(sede.slots.length).toBeGreaterThan(0);
    }
  });

  it("uses 24h HH:MM – HH:MM ranges", () => {
    for (const sede of LIORA_SATURDAY_SCHEDULE) {
      for (const slot of sede.slots) {
        expect(slot.time).toMatch(/^\d{2}:\d{2} – \d{2}:\d{2}$/);
      }
    }
  });

  it("only references known class keys, each with a translatable title", () => {
    const ofertaKeys = LIORA_LANDING_COPY_KEYS_BY_SECTION.oferta;
    for (const sede of LIORA_SATURDAY_SCHEDULE) {
      for (const slot of sede.slots) {
        expect(LIORA_CLASS_KEYS).toContain(slot.classKey);
        expect(ofertaKeys).toContain(`liora.clases.${slot.classKey}.title`);
      }
    }
  });

  it("keeps slots in ascending start time within each sede", () => {
    for (const sede of LIORA_SATURDAY_SCHEDULE) {
      const starts = sede.slots.map((slot) => slot.time.slice(0, 5));
      expect(starts).toEqual([...starts].sort());
    }
  });

  it("matches the published Saturday timetable", () => {
    expect(LIORA_SATURDAY_SCHEDULE).toEqual([
      {
        sedeKey: "sanMiguel",
        slots: [
          { time: "09:00 – 10:00", classKey: "infantil", ages: "6 a 9" },
          { time: "10:00 – 11:00", classKey: "preBallet", ages: "3 a 5" },
        ],
      },
      {
        sedeKey: "providencia",
        slots: [
          { time: "16:00 – 17:00", classKey: "preBallet", ages: "3 a 4" },
          { time: "17:00 – 18:00", classKey: "infantil", ages: "6 a 9" },
        ],
      },
      {
        sedeKey: "maipu",
        slots: [{ time: "19:00 – 20:00", classKey: "adulto", ages: "15+" }],
      },
    ]);
  });
});
