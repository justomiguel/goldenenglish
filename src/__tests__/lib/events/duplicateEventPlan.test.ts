import { describe, expect, it } from "vitest";
import {
  buildDuplicateEventInsert,
  duplicateEventTitle,
  pickDuplicateEventSlug,
  remapDuplicateFlowId,
  type DuplicateEventSource,
} from "@/lib/events/duplicateEventPlan";

const source: DuplicateEventSource = {
  title: "Taller",
  description: "<p>Hola</p>",
  event_date: "2026-11-01T15:00:00.000Z",
  location: "Sala 1",
  section_id: null,
  private_to_section: false,
  capacity: 20,
  price: 10000,
  price_local: 10000,
  price_non_local: 12000,
  currency: "CLP",
  default_locale: "es",
  cover_image_path: null,
  bank_transfer_instructions: null,
  collect_birth_date: true,
  require_phone: false,
  require_birth_date: false,
  registration_field_order: ["base:email"],
  price_by_flow: true,
  allow_multiple_tickets: false,
  max_tickets_per_registration: null,
  companion_collect_dni: false,
  companion_collect_birth_date: false,
  companion_collect_email: false,
};

describe("duplicateEventPlan", () => {
  it("builds a draft owned by the actor and clears the home flag", () => {
    const row = buildDuplicateEventInsert(source, {
      actorId: "admin-1",
      slug: "taller-copia",
      title: duplicateEventTitle(source.title),
    });
    expect(row.title).toBe("Taller (copia)");
    expect(row.status).toBe("draft");
    expect(row.show_on_home).toBe(false);
    expect(row.view_count).toBe(0);
    expect(row.created_by).toBe("admin-1");
    expect(row.price_by_flow).toBe(true);
    expect(row.published_at).toBeNull();
  });

  it("appends a number when the slug is taken", () => {
    expect(pickDuplicateEventSlug("taller-copia", new Set(["taller-copia"]))).toBe("taller-copia-2");
    expect(pickDuplicateEventSlug("", new Set())).toBe("event");
    expect(duplicateEventTitle("  ")).toBe("copia");
    const taken = new Set(["event", ...Array.from({ length: 98 }, (_, index) => `event-${index + 2}`)]);
    expect(pickDuplicateEventSlug("event", taken)).toBe("event-100");
  });

  it("copies the minor price and the seat map when the source has them", () => {
    const row = buildDuplicateEventInsert(
      {
        ...source,
        allow_minor_tickets: true,
        minor_ticket_price: 4000,
        bank_transfer_sources_config: { enabled: true },
        seat_map_config: { enabled: true },
      },
      { actorId: "admin-1", slug: "taller-copia", title: "Taller (copia)" },
    );
    expect(row).toMatchObject({
      allow_minor_tickets: true,
      minor_ticket_price: 4000,
      bank_transfer_sources_config: { enabled: true },
      seat_map_config: { enabled: true },
    });
  });

  it("remaps a flow id and drops an unknown flow", () => {
    const flowIds = new Map([["flow-1", "flow-new"]]);
    expect(remapDuplicateFlowId("flow-1", flowIds)).toBe("flow-new");
    expect(remapDuplicateFlowId("missing", flowIds)).toBeNull();
    expect(remapDuplicateFlowId(null, flowIds)).toBeNull();
  });
});
