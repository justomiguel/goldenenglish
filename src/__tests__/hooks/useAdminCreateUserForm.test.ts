import type { FormEvent } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import es from "@/dictionaries/es.json";
import { useAdminCreateUserForm } from "@/hooks/useAdminCreateUserForm";

const push = vi.fn();

const createDashboardUserMock = vi.hoisted(() => vi.fn());
const linkParentMock = vi.hoisted(() => vi.fn());
const searchParentsActionMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/app/[locale]/dashboard/admin/users/actions", () => ({
  createDashboardUser: createDashboardUserMock,
}));

vi.mock("@/app/[locale]/dashboard/admin/users/adminUserDetailActions", () => ({
  createAdminParentAndLinkStudentAction: linkParentMock,
  searchAdminParentsForDetailAction: searchParentsActionMock,
}));

const opts = {
  locale: "es",
  legalAgeMajority: 18,
  labels: es.admin.users,
  birthDateIncompleteMessage: "incomplete",
};

describe("useAdminCreateUserForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createDashboardUserMock.mockResolvedValue({ ok: true, userId: "u1" });
    linkParentMock.mockResolvedValue({ ok: true });
    searchParentsActionMock.mockResolvedValue([]);
  });

  it("searchParents maps server rows to combobox hits", async () => {
    searchParentsActionMock.mockResolvedValueOnce([
      { id: "p1", label: "Parent One" },
    ]);
    const { result } = renderHook(() => useAdminCreateUserForm(opts));
    await act(async () => {
      const rows = await result.current.searchParents("mar");
      expect(rows).toEqual([{ id: "p1", label: "Parent One" }]);
    });
    expect(searchParentsActionMock).toHaveBeenCalledWith("mar");
  });

  it("treats under-age birth date as minor student", () => {
    const { result } = renderHook(() => useAdminCreateUserForm(opts));

    expect(result.current.showMinor).toBe(false);

    act(() => {
      result.current.setBirthDate("2015-06-01");
    });
    expect(result.current.showMinor).toBe(true);
  });

  it("resetGuardianUi clears pick and tutor draft fields", () => {
    const { result } = renderHook(() => useAdminCreateUserForm(opts));

    act(() => {
      result.current.setBirthDate("2015-06-01");
      result.current.setTutorDni("123");
      result.current.setRelationship("mother");
      result.current.setPickedGuardian({ id: "g1", label: "Guardian" });
      result.current.resetGuardianUi();
    });

    expect(result.current.tutorDni).toBe("");
    expect(result.current.relationship).toBe("");
    expect(result.current.pickedGuardian).toBeNull();
  });

  it("onSubmit rejects incomplete birth date for student", async () => {
    const { result } = renderHook(() => useAdminCreateUserForm(opts));
    await act(async () => {
      await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });
    expect(result.current.feedback).toEqual({ ok: false, text: "incomplete" });
    expect(createDashboardUserMock).not.toHaveBeenCalled();
  });

  it("onSubmit requires DNI for minor student", async () => {
    const { result } = renderHook(() => useAdminCreateUserForm(opts));
    act(() => {
      result.current.setBirthDate("2015-06-01");
      result.current.setRelationship("mother");
    });
    await act(async () => {
      await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });
    expect(result.current.feedback).toEqual({
      ok: false,
      text: es.admin.users.errCreateMinorStudentDniRequired,
    });
  });

  it("onSubmit navigates after admin user create succeeds", async () => {
    const { result } = renderHook(() => useAdminCreateUserForm(opts));
    act(() => {
      result.current.setRole("admin");
      result.current.setFirstName("A");
      result.current.setLastName("B");
      result.current.setEmail("a@b.co");
      result.current.setPassword("secret123");
    });
    await act(async () => {
      await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });
    expect(createDashboardUserMock).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/es/dashboard/admin/users");
  });

  it("onSubmit sets reuse confirm when server asks", async () => {
    createDashboardUserMock.mockResolvedValueOnce({
      ok: false,
      needsGuardianReuseConfirm: true,
      userId: "u9",
      existingProfileId: "p9",
      reuseKind: "reused_parent",
    });
    const { result } = renderHook(() => useAdminCreateUserForm(opts));
    act(() => {
      result.current.setBirthDate("2015-06-01");
      result.current.setDni("1");
      result.current.setRelationship("mother");
      result.current.setGuardianMode("new");
      result.current.setTutorEmail("t@x.co");
    });
    await act(async () => {
      await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });
    expect(result.current.reuseConfirm).toEqual({
      userId: "u9",
      existingProfileId: "p9",
      reuseKind: "reused_parent",
    });
  });

  it("confirmReuseLink no-ops without reuse state", async () => {
    const { result } = renderHook(() => useAdminCreateUserForm(opts));
    await act(async () => {
      await result.current.confirmReuseLink();
    });
    expect(linkParentMock).not.toHaveBeenCalled();
  });

  it("onSubmit requires tutor relationship for minor with DNI", async () => {
    const { result } = renderHook(() => useAdminCreateUserForm(opts));
    act(() => {
      result.current.setBirthDate("2015-06-01");
      result.current.setDni("12345678");
    });
    await act(async () => {
      await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });
    expect(result.current.feedback).toEqual({
      ok: false,
      text: es.admin.users.detailErrTutorRelationshipRequired,
    });
  });

  it("onSubmit requires picked guardian when linking to existing tutor", async () => {
    const { result } = renderHook(() => useAdminCreateUserForm(opts));
    act(() => {
      result.current.setBirthDate("2015-06-01");
      result.current.setDni("12345678");
      result.current.setRelationship("mother");
      result.current.setGuardianMode("existing");
    });
    await act(async () => {
      await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });
    expect(result.current.feedback).toEqual({
      ok: false,
      text: es.admin.users.errCreateGuardianPickRequired,
    });
  });

  it("confirmReuseLink no-ops when relationship is empty", async () => {
    const { result } = renderHook(() => useAdminCreateUserForm(opts));
    act(() => {
      result.current.setReuseConfirm({
        userId: "u1",
        existingProfileId: "p1",
        reuseKind: "reused_parent",
      });
    });
    await act(async () => {
      await result.current.confirmReuseLink();
    });
    expect(linkParentMock).not.toHaveBeenCalled();
  });

  it("confirmReuseLink pushes users list on success", async () => {
    createDashboardUserMock.mockResolvedValueOnce({
      ok: false,
      needsGuardianReuseConfirm: true,
      userId: "u9",
      existingProfileId: "p9",
      reuseKind: "reused_parent",
    });
    const { result } = renderHook(() => useAdminCreateUserForm(opts));
    act(() => {
      result.current.setBirthDate("2015-06-01");
      result.current.setDni("1");
      result.current.setRelationship("mother");
      result.current.setGuardianMode("new");
      result.current.setTutorEmail("t@x.co");
      result.current.setTutorDni("tdni");
      result.current.setTutorFirstName("TF");
      result.current.setTutorLastName("TL");
    });
    await act(async () => {
      await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });
    await act(async () => {
      await result.current.confirmReuseLink();
    });
    expect(linkParentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: "es",
        studentId: "u9",
        confirmReuseOfProfileId: "p9",
        tutorDni: "tdni",
        tutorFirstName: "TF",
        tutorLastName: "TL",
        tutorEmail: "t@x.co",
        relationship: "mother",
      }),
    );
    expect(push).toHaveBeenCalledWith("/es/dashboard/admin/users");
    expect(result.current.reuseConfirm).toBeNull();
    expect(result.current.feedback).toEqual({ ok: true, text: es.admin.users.success });
  });

  it("confirmReuseLink surfaces link errors", async () => {
    linkParentMock.mockResolvedValueOnce({ ok: false, message: "link-fail" });
    createDashboardUserMock.mockResolvedValueOnce({
      ok: false,
      needsGuardianReuseConfirm: true,
      userId: "u9",
      existingProfileId: "p9",
      reuseKind: "reused_parent",
    });
    const { result } = renderHook(() => useAdminCreateUserForm(opts));
    act(() => {
      result.current.setBirthDate("2015-06-01");
      result.current.setDni("1");
      result.current.setRelationship("father");
      result.current.setGuardianMode("new");
      result.current.setTutorEmail("t@x.co");
    });
    await act(async () => {
      await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });
    await act(async () => {
      await result.current.confirmReuseLink();
    });
    expect(result.current.feedback).toEqual({ ok: false, text: "link-fail" });
  });

  it("confirmReuseLink falls back to generic error without message", async () => {
    linkParentMock.mockResolvedValueOnce({ ok: false });
    createDashboardUserMock.mockResolvedValueOnce({
      ok: false,
      needsGuardianReuseConfirm: true,
      userId: "u9",
      existingProfileId: "p9",
      reuseKind: "reused_parent",
    });
    const { result } = renderHook(() => useAdminCreateUserForm(opts));
    act(() => {
      result.current.setBirthDate("2015-06-01");
      result.current.setDni("1");
      result.current.setRelationship("mother");
      result.current.setGuardianMode("new");
      result.current.setTutorEmail("t@x.co");
    });
    await act(async () => {
      await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });
    await act(async () => {
      await result.current.confirmReuseLink();
    });
    expect(result.current.feedback).toEqual({ ok: false, text: es.admin.users.error });
  });

  it("onSubmit navigates after adult student create succeeds", async () => {
    const { result } = renderHook(() => useAdminCreateUserForm(opts));
    act(() => {
      result.current.setBirthDate("2000-06-01");
      result.current.setFirstName("Adult");
      result.current.setLastName("Learner");
      result.current.setEmail("adult@learn.test");
      result.current.setPassword("secret123");
      result.current.setPhone("+1000000000");
    });
    await act(async () => {
      await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });
    expect(createDashboardUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "student",
        email: "adult@learn.test",
        phone: "+1000000000",
        birth_date: "2000-06-01",
      }),
    );
    expect(push).toHaveBeenCalledWith("/es/dashboard/admin/users");
  });

  it("onSubmit navigates after minor student create with existing guardian", async () => {
    const { result } = renderHook(() => useAdminCreateUserForm(opts));
    act(() => {
      result.current.setBirthDate("2015-06-01");
      result.current.setDni("12345");
      result.current.setRelationship("mother");
      result.current.setGuardianMode("existing");
      result.current.setPickedGuardian({ id: "g99", label: "Guardian" });
      result.current.setFirstName("Kid");
      result.current.setLastName("Student");
      result.current.setPassword("pw123456");
    });
    await act(async () => {
      await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });
    expect(createDashboardUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        student_guardian_mode: "existing",
        existing_guardian_id: "g99",
        birth_date: "2015-06-01",
        email: "",
        phone: "",
      }),
    );
    expect(push).toHaveBeenCalledWith("/es/dashboard/admin/users");
  });

  it("onSubmit shows server message when create fails", async () => {
    createDashboardUserMock.mockResolvedValueOnce({ ok: false, message: "nope" });
    const { result } = renderHook(() => useAdminCreateUserForm(opts));
    act(() => {
      result.current.setRole("teacher");
      result.current.setFirstName("A");
      result.current.setLastName("B");
      result.current.setEmail("a@b.co");
      result.current.setPassword("secret123");
    });
    await act(async () => {
      await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });
    expect(result.current.feedback).toEqual({ ok: false, text: "nope" });
  });

  it("onSubmit falls back to generic error when create fails without message", async () => {
    createDashboardUserMock.mockResolvedValueOnce({ ok: false });
    const { result } = renderHook(() => useAdminCreateUserForm(opts));
    act(() => {
      result.current.setRole("teacher");
      result.current.setFirstName("A");
      result.current.setLastName("B");
      result.current.setEmail("a@b.co");
      result.current.setPassword("secret123");
    });
    await act(async () => {
      await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });
    expect(result.current.feedback).toEqual({ ok: false, text: es.admin.users.error });
  });
});
