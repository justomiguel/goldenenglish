/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAdminEventActor, createAdminClient, recordSystemAudit, revalidatePath } =
  vi.hoisted(() => ({
    mockRequireAdminEventActor: vi.fn(),
    createAdminClient: vi.fn(),
    recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
    revalidatePath: vi.fn(),
  }));

vi.mock("@/app/[locale]/dashboard/admin/events/eventActionsShared", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/app/[locale]/dashboard/admin/events/eventActionsShared")
  >();
  return {
    ...actual,
    requireAdminEventActor: () => mockRequireAdminEventActor(),
    revalidateEventFormSurfaces: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => createAdminClient() }));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({ recordSystemAudit }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/logging/serverActionLog", () => ({ logSupabaseClientError: vi.fn() }));

import {
  addEventTicketPackageAction,
  archiveEventTicketPackageAction,
  moveEventTicketPackageAction,
  updateEventTicketPackageAction,
} from "@/app/[locale]/dashboard/admin/events/eventTicketPackageActions";

const EVENT_ID = "00000000-0000-4000-8000-0000000000e1";
const OTHER_EVENT_ID = "00000000-0000-4000-8000-0000000000e2";
const PKG_ID = "00000000-0000-4000-8000-0000000000a1";
const SIBLING_ID = "00000000-0000-4000-8000-0000000000a2";
const ACTOR = "00000000-0000-4000-8000-0000000000u1";

interface ClientOpts {
  pkg?: Record<string, unknown> | null;
  siblings?: Record<string, unknown>[];
  insertError?: { message: string; code?: string } | null;
  updateError?: { message: string } | null;
  activeCount?: number;
}

function buildAdminClient(opts: ClientOpts = {}) {
  const pkg =
    "pkg" in opts
      ? opts.pkg
      : { id: PKG_ID, event_id: EVENT_ID, position: 1, archived_at: null };

  const inserted: Record<string, unknown>[] = [];
  const updates: { id: string; patch: Record<string, unknown> }[] = [];

  const from = vi.fn((table: string) => {
    if (table !== "event_ticket_packages") throw new Error(`unexpected table ${table}`);
    return {
      insert: (row: Record<string, unknown>) => {
        inserted.push(row);
        return Promise.resolve({ error: opts.insertError ?? null });
      },
      update: (patch: Record<string, unknown>) => ({
        eq: (_col: string, id: string) => {
          updates.push({ id, patch });
          return Promise.resolve({ error: opts.updateError ?? null });
        },
      }),
      select: (columns: string) => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: pkg, error: null }),
          is: () => ({
            order: () =>
              Promise.resolve({
                data:
                  columns.includes("position") && opts.siblings
                    ? opts.siblings
                    : [
                        { id: SIBLING_ID, position: 0 },
                        { id: PKG_ID, position: 1 },
                      ],
                error: null,
              }),
          }),
        }),
      }),
    };
  });

  return { client: { from }, inserted, updates };
}

const validPackage = {
  locale: "es",
  eventId: EVENT_ID,
  name: "VIP",
  price: 12000,
  capacity: 20,
  benefits: ["Cena", "Ubicación preferencial"],
};

describe("event ticket package actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdminEventActor.mockResolvedValue(ACTOR);
  });

  describe("authorization", () => {
    it("refuses every action to a non-admin", async () => {
      mockRequireAdminEventActor.mockResolvedValue(null);

      await expect(addEventTicketPackageAction(validPackage)).resolves.toMatchObject({
        ok: false,
        message: "forbidden",
      });
      await expect(
        updateEventTicketPackageAction({ ...validPackage, packageId: PKG_ID }),
      ).resolves.toMatchObject({ ok: false, message: "forbidden" });
      await expect(
        moveEventTicketPackageAction({ locale: "es", packageId: PKG_ID, direction: "up" }),
      ).resolves.toMatchObject({ ok: false, message: "forbidden" });
      await expect(
        archiveEventTicketPackageAction("es", PKG_ID),
      ).resolves.toMatchObject({ ok: false, message: "forbidden" });

      expect(createAdminClient).not.toHaveBeenCalled();
    });
  });

  describe("add", () => {
    it("stores a trimmed package with its benefits in order", async () => {
      const { client, inserted } = buildAdminClient();
      createAdminClient.mockReturnValue(client);

      const result = await addEventTicketPackageAction({
        ...validPackage,
        name: "  VIP  ",
        benefits: [" Cena ", "", "Ubicación preferencial"],
      });

      expect(result.ok).toBe(true);
      expect(inserted[0]).toMatchObject({
        event_id: EVENT_ID,
        name: "VIP",
        price: 12000,
        capacity: 20,
        benefits: ["Cena", "Ubicación preferencial"],
      });
    });

    it("rejects a blank name, a negative price and a zero capacity", async () => {
      const { client } = buildAdminClient();
      createAdminClient.mockReturnValue(client);

      for (const bad of [
        { name: "   " },
        { price: -1 },
        { capacity: 0 },
      ]) {
        await expect(
          addEventTicketPackageAction({ ...validPackage, ...bad }),
        ).resolves.toMatchObject({ ok: false, message: "validation_failed" });
      }
    });

    it("accepts a package with no capacity of its own", async () => {
      const { client, inserted } = buildAdminClient();
      createAdminClient.mockReturnValue(client);

      const result = await addEventTicketPackageAction({ ...validPackage, capacity: null });

      expect(result.ok).toBe(true);
      expect(inserted[0]?.capacity).toBeNull();
    });
  });

  describe("update", () => {
    it("refuses a package that belongs to another event", async () => {
      const { client, updates } = buildAdminClient({
        pkg: { id: PKG_ID, event_id: OTHER_EVENT_ID, position: 0, archived_at: null },
      });
      createAdminClient.mockReturnValue(client);

      const result = await updateEventTicketPackageAction({ ...validPackage, packageId: PKG_ID });

      expect(result).toMatchObject({ ok: false, message: "package_not_found" });
      expect(updates).toHaveLength(0);
    });

    it("refuses an archived package", async () => {
      const { client } = buildAdminClient({
        pkg: { id: PKG_ID, event_id: EVENT_ID, position: 0, archived_at: "2026-01-01T00:00:00Z" },
      });
      createAdminClient.mockReturnValue(client);

      await expect(
        updateEventTicketPackageAction({ ...validPackage, packageId: PKG_ID }),
      ).resolves.toMatchObject({ ok: false, message: "package_archived" });
    });

    it("saves the new values and audits the change", async () => {
      const { client, updates } = buildAdminClient();
      createAdminClient.mockReturnValue(client);

      const result = await updateEventTicketPackageAction({
        ...validPackage,
        packageId: PKG_ID,
        price: 9000,
      });

      expect(result.ok).toBe(true);
      expect(updates[0]?.patch).toMatchObject({ name: "VIP", price: 9000 });
      expect(recordSystemAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "event_ticket_package_updated",
          resourceId: PKG_ID,
          payload: expect.objectContaining({ event_id: EVENT_ID }),
        }),
      );
    });
  });

  describe("reorder", () => {
    it("swaps positions with the neighbour above", async () => {
      const { client, updates } = buildAdminClient();
      createAdminClient.mockReturnValue(client);

      const result = await moveEventTicketPackageAction({
        locale: "es",
        packageId: PKG_ID,
        direction: "up",
      });

      expect(result.ok).toBe(true);
      expect(updates).toEqual(
        expect.arrayContaining([
          { id: PKG_ID, patch: { position: 0 } },
          { id: SIBLING_ID, patch: { position: 1 } },
        ]),
      );
    });

    it("does nothing at the edge of the list", async () => {
      const { client, updates } = buildAdminClient({
        pkg: { id: PKG_ID, event_id: EVENT_ID, position: 0, archived_at: null },
        siblings: [
          { id: PKG_ID, position: 0 },
          { id: SIBLING_ID, position: 1 },
        ],
      });
      createAdminClient.mockReturnValue(client);

      const result = await moveEventTicketPackageAction({
        locale: "es",
        packageId: PKG_ID,
        direction: "up",
      });

      expect(result.ok).toBe(true);
      expect(updates).toHaveLength(0);
    });
  });

  describe("archive", () => {
    it("stamps archived_at instead of deleting", async () => {
      const { client, updates } = buildAdminClient();
      createAdminClient.mockReturnValue(client);

      const result = await archiveEventTicketPackageAction("es", PKG_ID);

      expect(result.ok).toBe(true);
      expect(updates[0]?.patch.archived_at).toEqual(expect.any(String));
    });

    it("records how many packages are left, because archiving the last one changes the price", async () => {
      // With no active packages the event falls back to residency pricing, so
      // the count belongs in the audit trail.
      const { client } = buildAdminClient({
        siblings: [{ id: SIBLING_ID, position: 0 }],
      });
      createAdminClient.mockReturnValue(client);

      await archiveEventTicketPackageAction("es", PKG_ID);

      expect(recordSystemAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "event_ticket_package_archived",
          payload: expect.objectContaining({
            event_id: EVENT_ID,
            remaining_active_packages: expect.any(Number),
          }),
        }),
      );
    });
  });
});
