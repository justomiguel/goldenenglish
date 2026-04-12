import { describe, it, expect, vi, beforeEach } from "vitest";
import es from "@/dictionaries/es.json";
import { deleteAdminUsers } from "@/app/[locale]/dashboard/admin/users/deleteActions";

const U = es.admin.users;

const mockAssertAdmin = vi.fn();
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

const mockDeleteUser = vi.fn();
const mockAdminClient = {
  auth: {
    admin: {
      deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
    },
  },
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdminClient,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("deleteAdminUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns Invalid data when ids are empty", async () => {
    mockAssertAdmin.mockResolvedValue({
      user: { id: "11111111-1111-1111-1111-111111111111" },
    });
    const r = await deleteAdminUsers("es", []);
    expect(r).toEqual({ ok: false, message: U.errDeleteInvalid });
  });

  it("returns Forbidden when not admin", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));
    const r = await deleteAdminUsers("es", ["550e8400-e29b-41d4-a716-446655440000"]);
    expect(r).toEqual({ ok: false, message: U.errDeleteForbidden });
  });

  it("strips current admin id from deletion list", async () => {
    const selfId = "550e8400-e29b-41d4-a716-446655440000";
    mockAssertAdmin.mockResolvedValue({ user: { id: selfId } });
    mockDeleteUser.mockResolvedValue({ error: null });
    const r = await deleteAdminUsers("es", [selfId]);
    expect(r).toEqual({ ok: false });
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("deletes users and returns count", async () => {
    mockAssertAdmin.mockResolvedValue({
      user: { id: "11111111-1111-1111-1111-111111111111" },
    });
    mockDeleteUser.mockResolvedValue({ error: null });
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const r = await deleteAdminUsers("es", [id]);
    expect(r).toEqual({ ok: true, deleted: 1 });
    expect(mockDeleteUser).toHaveBeenCalledWith(id);
  });

  it("returns partial when some deletes fail", async () => {
    mockAssertAdmin.mockResolvedValue({
      user: { id: "11111111-1111-1111-1111-111111111111" },
    });
    const idOk = "550e8400-e29b-41d4-a716-446655440000";
    const idFail = "650e8400-e29b-41d4-a716-446655440001";
    mockDeleteUser
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: "nope" } });
    const r = await deleteAdminUsers("es", [idOk, idFail]);
    expect(r).toEqual({ ok: true, deleted: 1, partial: true });
  });

  it("returns error when every delete fails", async () => {
    mockAssertAdmin.mockResolvedValue({
      user: { id: "11111111-1111-1111-1111-111111111111" },
    });
    mockDeleteUser.mockResolvedValue({ error: { message: "fail" } });
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const r = await deleteAdminUsers("es", [id]);
    expect(r.ok).toBe(false);
    expect(r.message).toBe(U.errDeleteAllFailed);
  });
});
