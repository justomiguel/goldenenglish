/** @vitest-environment node */
// REGRESSION CHECK: a failed receipt attach must cancel the attendee. A guest must not stay pending without a file.
import { beforeEach, describe, expect, it, vi } from "vitest";

const notify = vi.fn(async () => undefined);

vi.mock("@/lib/email/notifyAdminsReceiptPending", () => ({
  notifyAdminsEventReceiptPending: (...args: unknown[]) => notify(...args),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerWarn: vi.fn(),
  logServerError: vi.fn(),
  logServerException: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));

import { attachEventPaymentReceipt } from "@/lib/events/server/attachEventPaymentReceipt";
import { finalizeEventTransferReceipt } from "@/lib/events/server/finalizeEventTransferReceipt";

function paymentAdmin(options: {
  rows?: Array<{ name: string; metadata?: { size?: number } }>;
  existing?: { id: string; status: string; receipt_storage_path: string | null } | null;
  writeError?: { message: string } | null;
}) {
  const inserts: unknown[] = [];
  const updates: unknown[] = [];
  const moves: Array<[string, string]> = [];
  const removes: string[][] = [];
  const write = options.writeError ?? null;

  function chain() {
    const promise = Promise.resolve({ error: write });
    return Object.assign(promise, {
      eq: () => chain(),
      is: () => promise,
    });
  }

  const admin = {
    storage: {
      from: () => ({
        list: async () => ({ data: options.rows ?? [], error: null }),
        move: async (from: string, to: string) => {
          moves.push([from, to]);
          return { error: null };
        },
        remove: async (paths: string[]) => {
          removes.push(paths);
          return { error: null };
        },
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: options.existing ?? null, error: null }),
        }),
      }),
      insert: (row: unknown) => {
        inserts.push(row);
        return Promise.resolve({ error: write });
      },
      update: (row: unknown) => {
        updates.push(row);
        return chain();
      },
    }),
  };

  return { admin, inserts, updates, moves, removes };
}

const input = {
  eventId: "event-1",
  attendeeId: "att-1",
  amount: 15000,
  currency: "CLP",
  stagingPath: "event-1/staging/abc/receipt/pago.jpg",
  fileName: "pago.jpg",
  mime: "image/jpeg",
};

describe("attachEventPaymentReceipt", () => {
  beforeEach(() => {
    notify.mockClear();
  });

  it("moves the staged file and inserts a pending payment", async () => {
    const db = paymentAdmin({
      rows: [{ name: "pago.jpg", metadata: { size: 4000 } }],
    });
    const result = await attachEventPaymentReceipt(db.admin as never, input);
    expect(result.ok).toBe(true);
    expect(db.moves[0]?.[0]).toBe(input.stagingPath);
    expect(db.inserts[0]).toMatchObject({
      event_attendee_id: "att-1",
      status: "pending",
      amount: 15000,
    });
    expect(notify).toHaveBeenCalledWith("att-1");
  });

  it("keeps the payment when the admin mail fails", async () => {
    notify.mockRejectedValueOnce(new Error("smtp"));
    const db = paymentAdmin({
      rows: [{ name: "pago.jpg", metadata: { size: 4000 } }],
    });
    const result = await attachEventPaymentReceipt(db.admin as never, input);
    expect(result.ok).toBe(true);
    expect(db.inserts).toHaveLength(1);
  });

  it("rejects a missing object and does not insert a payment", async () => {
    const db = paymentAdmin({ rows: [] });
    const result = await attachEventPaymentReceipt(db.admin as never, input);
    expect(result).toEqual({ ok: false, code: "missing_object" });
    expect(db.inserts).toEqual([]);
    expect(notify).not.toHaveBeenCalled();
  });

  it("cancels the attendee when the receipt cannot be attached", async () => {
    const db = paymentAdmin({ rows: [] });
    const result = await finalizeEventTransferReceipt(db.admin as never, input);
    expect(result.ok).toBe(false);
    expect(db.updates).toContainEqual({ status: "cancelled" });
    expect(notify).not.toHaveBeenCalled();
  });
});
