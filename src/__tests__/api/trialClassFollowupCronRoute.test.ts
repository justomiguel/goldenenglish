import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/cron/trial-class-followup/route";

describe("GET /api/cron/trial-class-followup", () => {
  it("returns 401 without cron secret", async () => {
    const res = await GET(new Request("http://localhost/api/cron/trial-class-followup"));
    expect(res.status).toBe(401);
  });
});
