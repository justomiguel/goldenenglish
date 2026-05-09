import { describe, it, expect, vi, beforeEach } from "vitest";

const { revalidatePath } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

import { revalidateStudentBillingPaths } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/revalidateStudentBilling";

describe("revalidateStudentBillingPaths", () => {
  beforeEach(() => {
    revalidatePath.mockClear();
  });

  it("revalidates finance collections with layout so [sectionId] pages refresh", () => {
    revalidateStudentBillingPaths("es", "student-uuid");

    expect(revalidatePath).toHaveBeenCalledWith("/es/dashboard/admin/finance/collections", "layout");
  });
});
