import { describe, expect, it, vi } from "vitest";
import {
  loadEventSeatLocks,
  lockSeatsForAttendee,
  releaseSeatsForAttendee,
} from "@/lib/events/server/eventSeatLocksServer";

describe("eventSeatLocksServer", () => {
  it("loads active seat locks for pending_payment and confirmed attendees", async () => {
    const eqMock = vi.fn().mockResolvedValue({
      data: [
        {
          seat_key: "f1:b1:0:0",
          event_attendees: { status: "pending_payment" },
        },
        {
          seat_key: "f1:b1:0:1",
          event_attendees: { status: "confirmed" },
        },
        {
          seat_key: "f1:b1:0:2",
          event_attendees: { status: "cancelled" },
        },
      ],
      error: null,
    });
    const admin = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: eqMock }),
      }),
    };

    const locks = await loadEventSeatLocks(admin as never, "ev-1");
    expect(locks).toEqual([
      { seatKey: "f1:b1:0:0", attendeeStatus: "pending_payment" },
      { seatKey: "f1:b1:0:1", attendeeStatus: "confirmed" },
    ]);
  });

  it("locks seats and stores seat_labels on the attendee", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const updateEqMock = vi.fn().mockResolvedValue({ error: null });
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "event_seat_locks") {
          return { insert: insertMock };
        }
        return {
          update: vi.fn().mockReturnValue({ eq: updateEqMock }),
        };
      }),
    };

    const res = await lockSeatsForAttendee(admin as never, {
      eventId: "ev-1",
      attendeeId: "att-1",
      seats: [{ seatKey: "f1:b1:0:0", seatLabel: "Platea · A-1" }],
    });

    expect(res).toEqual({ ok: true });
    expect(insertMock).toHaveBeenCalledWith([
      {
        event_id: "ev-1",
        attendee_id: "att-1",
        seat_key: "f1:b1:0:0",
        seat_label: "Platea · A-1",
      },
    ]);
    expect(updateEqMock).toHaveBeenCalledWith("id", "att-1");
  });

  it("rolls back the attendee row and returns seat_already_taken on unique violation", async () => {
    const deleteEqMock = vi.fn().mockResolvedValue({ error: null });
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "event_seat_locks") {
          return {
            insert: vi.fn().mockResolvedValue({
              error: { code: "23505", message: "duplicate key value" },
            }),
          };
        }
        return {
          delete: vi.fn().mockReturnValue({ eq: deleteEqMock }),
        };
      }),
    };

    const res = await lockSeatsForAttendee(admin as never, {
      eventId: "ev-1",
      attendeeId: "att-conflict",
      seats: [{ seatKey: "f1:b1:0:0", seatLabel: "Platea · A-1" }],
    });

    expect(res).toEqual({ ok: false, code: "seat_already_taken" });
    expect(deleteEqMock).toHaveBeenCalledWith("id", "att-conflict");
  });

  it("releases seat locks for an attendee", async () => {
    const deleteEqMock = vi.fn().mockResolvedValue({ error: null });
    const admin = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({ eq: deleteEqMock }),
      }),
    };

    await releaseSeatsForAttendee(admin as never, "att-1");
    expect(deleteEqMock).toHaveBeenCalledWith("attendee_id", "att-1");
  });

  it("returns no locks when the query fails or the attendee row is a list", async () => {
    const failed = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } }),
        }),
      }),
    };
    expect(await loadEventSeatLocks(failed as never, "ev-1")).toEqual([]);

    const listed = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ seat_key: "k", event_attendees: [{ status: "confirmed" }] }],
            error: null,
          }),
        }),
      }),
    };
    expect(await loadEventSeatLocks(listed as never, "ev-1")).toEqual([
      { seatKey: "k", attendeeStatus: "confirmed" },
    ]);
  });

  it("skips an empty selection and reports a lock failure that is not a conflict", async () => {
    const admin = { from: vi.fn() };
    expect(
      await lockSeatsForAttendee(admin as never, { eventId: "ev-1", attendeeId: "att-1", seats: [] }),
    ).toEqual({ ok: true });
    expect(admin.from).not.toHaveBeenCalled();

    const deleteEq = vi.fn().mockResolvedValue({ error: { message: "rollback" } });
    const failing = {
      from: vi.fn((table: string) => {
        if (table === "event_seat_locks") {
          return { insert: vi.fn().mockResolvedValue({ error: { code: "XX", message: "no" } }) };
        }
        return { delete: vi.fn().mockReturnValue({ eq: deleteEq }) };
      }),
    };
    expect(
      await lockSeatsForAttendee(failing as never, {
        eventId: "ev-1",
        attendeeId: "att-1",
        seats: [{ seatKey: "k", seatLabel: "A-1" }],
      }),
    ).toEqual({ ok: false, code: "lock_failed" });
    expect(deleteEq).toHaveBeenCalledWith("id", "att-1");
  });

  it("still succeeds when saving labels fails, and release ignores a missing delete", async () => {
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "event_seat_locks") return { insert: vi.fn().mockResolvedValue({ error: null }) };
        return { update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: { message: "label" } }) }) };
      }),
    };
    expect(
      await lockSeatsForAttendee(admin as never, {
        eventId: "ev-1",
        attendeeId: "att-1",
        seats: [{ seatKey: "k", seatLabel: "A-1" }],
      }),
    ).toEqual({ ok: true });

    const bare = { from: vi.fn().mockReturnValue({}) };
    await releaseSeatsForAttendee(bare as never, "");
    await releaseSeatsForAttendee(bare as never, "att-1");
    const broken = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "delete" } }),
        }),
      }),
    };
    await releaseSeatsForAttendee(broken as never, "att-1");
  });
});
