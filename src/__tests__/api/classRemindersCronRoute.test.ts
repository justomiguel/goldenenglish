import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/cron/class-reminders/route";

describe("GET /api/cron/class-reminders", () => {
  it("returns 401 without cron secret", async () => {
    const res = await GET(new Request("http://localhost/api/cron/class-reminders"));
    expect(res.status).toBe(401);
  });
});
