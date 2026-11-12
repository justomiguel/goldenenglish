import { describe, expect, it, vi } from "vitest";
import { loadDashboardBirthdaysCard } from "@/lib/birthdays/loadDashboardBirthdaysCard";

const STORAGE_PATH = "0c2a6619-46c1-422d-a490-ec34fa94ce9d/cf50110b-c9f4-456a-b08c-6f4d1b578472.jpg";
const SIGNED =
  "https://proj.supabase.co/storage/v1/object/sign/avatars/u/a.jpg?token=x";

function thenable(result: unknown) {
  const chain: Record<string, unknown> = {
    then: (onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  };
  for (const method of ["select", "in", "eq"]) {
    chain[method] = () => chain;
  }
  return chain;
}

describe("loadDashboardBirthdaysCard", () => {
  // REGRESSION CHECK: A private avatars object path must become a signed https
  // URL before the birthday card renders. A raw path crashes next/image.
  it("signs a storage avatar path before returning card rows", async () => {
    const createSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: SIGNED },
      error: null,
    });
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            student_id: "s1",
            first_name: "Ada",
            last_name: "Lovelace",
            birth_date: "1990-11-10",
            celebration_date: "2026-11-10",
            is_celebration_today: true,
          },
        ],
        error: null,
      }),
      from: (table: string) => {
        if (table === "profiles") {
          return thenable({
            data: [{ id: "s1", avatar_url: STORAGE_PATH }],
            error: null,
          });
        }
        return thenable({
          data: [
            {
              student_id: "s1",
              academic_sections: { name: "A1" },
            },
          ],
          error: null,
        });
      },
      storage: { from: () => ({ createSignedUrl }) },
    };

    const rows = await loadDashboardBirthdaysCard(supabase as never, "viewer-1");

    expect(createSignedUrl).toHaveBeenCalledWith(STORAGE_PATH, 60 * 60);
    expect(rows[0]?.avatarUrl).toBe(SIGNED);
    expect(rows[0]?.sectionLabel).toBe("A1");
  });
});
