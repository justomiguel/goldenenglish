/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockLoadEvent = vi.fn();
const mockEnroll = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
  }),
}));

vi.mock("@/lib/dashboard/events/loadEventForPublicLanding", () => ({
  loadEventForPublicLanding: (...args: unknown[]) => mockLoadEvent(...args),
}));

vi.mock("@/lib/events/server/enrollEventAttendeeServer", () => ({
  enrollEventAttendeeServer: (...args: unknown[]) => mockEnroll(...args),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerException: vi.fn(),
}));

import { POST } from "@/app/api/events/[slug]/enroll/route";

const baseEvent = {
  id: "evt-1",
  collectBirthDate: false,
  fields: [],
  packages: [] as { id: string }[],
  allowMultipleTickets: false,
  maxTicketsPerRegistration: null as number | null,
  companionCollectDni: false,
  companionCollectBirthDate: false,
  companionCollectEmail: false,
};

const base = {
  firstName: "Juan",
  lastName: "Perez",
  dniOrPassport: "12345678",
  email: "juan@example.com",
};

let ipCounter = 0;

async function post(body: Record<string, unknown>) {
  ipCounter += 1;
  return POST(
    new Request("https://goldenenglish.cl/api/events/gala/enroll", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${ipCounter}` },
      body: JSON.stringify({ captchaToken: "tok", locale: "es", base, ...body }),
    }),
    { params: Promise.resolve({ slug: "gala" }) },
  );
}

describe("POST /api/events/[slug]/enroll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadEvent.mockResolvedValue(baseEvent);
    mockEnroll.mockResolvedValue({
      attendeeId: "att-1",
      attendeeStatus: "pending_payment",
      paymentRequired: true,
      paymentId: null,
      resultCode: "payment_pending",
      seats: 1,
      totalAmount: 5000,
    });
  });

  it("enrolls a plain single-seat registration, as every event does today", async () => {
    const res = await post({});

    expect(res.status).toBe(200);
    expect(mockEnroll).toHaveBeenCalledWith(
      expect.objectContaining({ ticketPackageId: null, companions: [] }),
    );
  });

  it("ignores any price the client tries to send", async () => {
    // Nothing about money is read from the request: the RPC recomputes the
    // amount from the database and that is what comes back.
    await post({ price: 1, totalAmount: 1, amount: 1 });

    const sent = mockEnroll.mock.calls[0]![0] as Record<string, unknown>;
    expect(sent).not.toHaveProperty("price");
    expect(sent).not.toHaveProperty("totalAmount");
    expect(sent).not.toHaveProperty("amount");
  });

  it("returns the server-computed seats and total", async () => {
    mockEnroll.mockResolvedValue({
      attendeeId: "att-1",
      attendeeStatus: "pending_payment",
      paymentRequired: true,
      paymentId: null,
      resultCode: "payment_pending",
      seats: 3,
      totalAmount: 15000,
    });

    const body = (await (await post({})).json()) as { result: { seats: number; totalAmount: number } };

    expect(body.result.seats).toBe(3);
    expect(body.result.totalAmount).toBe(15000);
  });

  it("refuses companions on an event that sells one seat at a time", async () => {
    const res = await post({ companions: [{ firstName: "Ana", lastName: "Ruiz" }] });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "multiple_tickets_not_allowed" });
    expect(mockEnroll).not.toHaveBeenCalled();
  });

  it("refuses a package on an event that sells none", async () => {
    const res = await post({ ticketPackageId: "pkg-1" });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "package_not_allowed" });
    expect(mockEnroll).not.toHaveBeenCalled();
  });

  it("demands a package once the event sells them", async () => {
    mockLoadEvent.mockResolvedValue({ ...baseEvent, packages: [{ id: "pkg-1" }] });

    const res = await post({});

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "package_required" });
  });

  it("passes a valid package and its companions through to the RPC", async () => {
    mockLoadEvent.mockResolvedValue({
      ...baseEvent,
      packages: [{ id: "pkg-1" }],
      allowMultipleTickets: true,
      maxTicketsPerRegistration: 3,
    });

    await post({
      ticketPackageId: "pkg-1",
      companions: [{ firstName: "Ana", lastName: "Ruiz" }],
    });

    expect(mockEnroll).toHaveBeenCalledWith(
      expect.objectContaining({
        ticketPackageId: "pkg-1",
        companions: [{ firstName: "Ana", lastName: "Ruiz", fieldValues: [] }],
      }),
    );
  });
});
