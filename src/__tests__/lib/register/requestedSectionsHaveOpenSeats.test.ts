/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import { requestedSectionsHaveOpenSeats } from "@/lib/register/requestedSectionsHaveOpenSeats";

describe("requestedSectionsHaveOpenSeats", () => {
  it("is true when there are no sections", async () => {
    const rpc = vi.fn();
    await expect(requestedSectionsHaveOpenSeats({ rpc }, [])).resolves.toBe(true);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("is false when any section is full or the RPC errors", async () => {
    const rpc = vi.fn()
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: false, error: null });
    await expect(
      requestedSectionsHaveOpenSeats({ rpc }, ["a", "b"]),
    ).resolves.toBe(false);
  });

  it("is true when every requested section is open", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    await expect(requestedSectionsHaveOpenSeats({ rpc }, ["a"])).resolves.toBe(true);
  });
});
