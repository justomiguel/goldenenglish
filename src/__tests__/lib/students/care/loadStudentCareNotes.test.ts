import { describe, expect, it, vi, beforeEach } from "vitest";
import { loadStudentCareNotes } from "@/lib/students/care/loadStudentCareNotes";

const STUDENT = "11111111-1111-1111-1111-111111111111";
const ADMIN = "22222222-2222-2222-2222-222222222222";
const TUTOR = "33333333-3333-3333-3333-333333333333";
const TEACHER = "44444444-4444-4444-4444-444444444444";
const EDITOR = "55555555-5555-5555-5555-555555555555";

const mockRequestFrom = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from: (...args: unknown[]) => mockRequestFrom(...args) }),
}));

const mockAdminFrom = vi.fn();
const mockCreateAdminClient = vi.fn(() => ({
  from: (...args: unknown[]) => mockAdminFrom(...args),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockCreateAdminClient(),
}));

const mockResolveIsAdminSession = vi.fn();
vi.mock("@/lib/auth/resolveIsAdminSession", () => ({
  resolveIsAdminSession: (...args: unknown[]) => mockResolveIsAdminSession(...args),
}));

const mockLoadTeacherSectionIds = vi.fn();
vi.mock("@/lib/academics/loadTeacherSectionIdsForUser", () => ({
  loadTeacherSectionIdsForUser: (...args: unknown[]) => mockLoadTeacherSectionIds(...args),
}));

const mockAuthzDenied = vi.fn();
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerAuthzDenied: (...args: unknown[]) => mockAuthzDenied(...args),
  logSupabaseClientError: vi.fn(),
}));

const NOTE_ROW = {
  care_health_note: "Asma leve",
  care_diet_note: "Sin gluten",
  care_support_note: null,
  care_updated_at: "2026-08-01T12:00:00.000Z",
  care_updated_by: EDITOR,
};

/** Request-scoped reads: tutor link and the student's section enrollments. */
function setRequestClient(options: {
  tutorLinkRows?: { student_id: string }[];
  studentSectionIds?: string[];
  enrollmentsError?: unknown;
}) {
  const { tutorLinkRows = [], studentSectionIds = [], enrollmentsError = null } = options;
  mockRequestFrom.mockImplementation((table: string) => {
    if (table === "tutor_student_rel") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              limit: () => Promise.resolve({ data: tutorLinkRows, error: null }),
            }),
          }),
        }),
      };
    }
    if (table === "section_enrollments") {
      return {
        select: () => ({
          eq: () =>
            Promise.resolve({
              data: studentSectionIds.map((id) => ({ section_id: id })),
              error: enrollmentsError,
            }),
        }),
      };
    }
    throw new Error(`unexpected request-scoped table: ${table}`);
  });
}

/** Service-role reads: the notes themselves and the editor's name. */
function setAdminClient(options: {
  noteRow?: Record<string, unknown> | null;
  noteError?: unknown;
  editorRow?: { first_name: string; last_name: string } | null;
} = {}) {
  const { noteRow = NOTE_ROW, noteError = null, editorRow = { first_name: "Ana", last_name: "Ruiz" } } =
    options;
  mockAdminFrom.mockImplementation((table: string) => {
    if (table !== "profiles") throw new Error(`unexpected admin table: ${table}`);
    let selected = "";
    const builder = {
      select: (columns: string) => {
        selected = columns;
        return builder;
      },
      eq: () => builder,
      maybeSingle: () =>
        selected.includes("care_health_note")
          ? Promise.resolve({ data: noteRow, error: noteError })
          : Promise.resolve({ data: editorRow, error: null }),
    };
    return builder;
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockResolveIsAdminSession.mockResolvedValue(false);
  mockLoadTeacherSectionIds.mockResolvedValue([]);
});

describe("loadStudentCareNotes", () => {
  it("lets an admin read the notes", async () => {
    mockResolveIsAdminSession.mockResolvedValue(true);
    setRequestClient({});
    setAdminClient();

    const result = await loadStudentCareNotes(ADMIN, STUDENT);

    expect(result).toEqual({
      ok: true,
      viewerRole: "admin",
      notes: {
        healthNote: "Asma leve",
        dietNote: "Sin gluten",
        supportNote: null,
        updatedAt: "2026-08-01T12:00:00.000Z",
        updatedByName: "Ruiz Ana",
      },
    });
  });

  it("lets the student's tutor read the notes", async () => {
    setRequestClient({ tutorLinkRows: [{ student_id: STUDENT }] });
    setAdminClient();

    const result = await loadStudentCareNotes(TUTOR, STUDENT);

    expect(result.ok).toBe(true);
    expect(result.ok && result.viewerRole).toBe("tutor");
  });

  it("lets a teacher of one of the student's sections read the notes", async () => {
    setRequestClient({ studentSectionIds: ["sec-a", "sec-b"] });
    mockLoadTeacherSectionIds.mockResolvedValue(["sec-z", "sec-b"]);
    setAdminClient();

    const result = await loadStudentCareNotes(TEACHER, STUDENT);

    expect(result.ok).toBe(true);
    expect(result.ok && result.viewerRole).toBe("section_staff");
  });

  it("denies a teacher who shares no section, without ever building the service client", async () => {
    setRequestClient({ studentSectionIds: ["sec-a"] });
    mockLoadTeacherSectionIds.mockResolvedValue(["sec-z"]);
    setAdminClient();

    const result = await loadStudentCareNotes(TEACHER, STUDENT);

    expect(result).toEqual({ ok: false, reason: "forbidden" });
    // The point of the door: denial happens before any privileged read exists.
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
    expect(mockAdminFrom).not.toHaveBeenCalled();
  });

  it("denies the student reading their own notes", async () => {
    setRequestClient({ studentSectionIds: ["sec-a"] });
    mockLoadTeacherSectionIds.mockResolvedValue(["sec-a"]);
    setAdminClient();

    const result = await loadStudentCareNotes(STUDENT, STUDENT);

    expect(result).toEqual({ ok: false, reason: "forbidden" });
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
  });

  it("logs the denial without leaking a single character of the notes", async () => {
    setRequestClient({});
    setAdminClient();

    await loadStudentCareNotes(TEACHER, STUDENT);

    expect(mockAuthzDenied).toHaveBeenCalledWith("loadStudentCareNotes", { studentId: STUDENT });
    const logged = JSON.stringify(mockAuthzDenied.mock.calls);
    expect(logged).not.toContain("Asma");
    expect(logged).not.toContain("gluten");
  });

  it("reports not_found for a student who does not exist", async () => {
    mockResolveIsAdminSession.mockResolvedValue(true);
    setRequestClient({});
    setAdminClient({ noteRow: null });

    expect(await loadStudentCareNotes(ADMIN, STUDENT)).toEqual({ ok: false, reason: "not_found" });
  });

  it("reports failed on a Supabase error instead of throwing", async () => {
    mockResolveIsAdminSession.mockResolvedValue(true);
    setRequestClient({});
    setAdminClient({ noteRow: null, noteError: { message: "boom" } });

    expect(await loadStudentCareNotes(ADMIN, STUDENT)).toEqual({ ok: false, reason: "failed" });
  });

  it("returns a null editor name when nobody has edited the notes yet", async () => {
    mockResolveIsAdminSession.mockResolvedValue(true);
    setRequestClient({});
    setAdminClient({
      noteRow: { ...NOTE_ROW, care_updated_by: null, care_updated_at: null },
    });

    const result = await loadStudentCareNotes(ADMIN, STUDENT);

    expect(result.ok && result.notes.updatedByName).toBeNull();
    expect(result.ok && result.notes.updatedAt).toBeNull();
  });

  it("treats blank notes as null so the UI has one empty case", async () => {
    mockResolveIsAdminSession.mockResolvedValue(true);
    setRequestClient({});
    setAdminClient({
      noteRow: { ...NOTE_ROW, care_health_note: "   ", care_diet_note: "" },
    });

    const result = await loadStudentCareNotes(ADMIN, STUDENT);

    expect(result.ok && result.notes.healthNote).toBeNull();
    expect(result.ok && result.notes.dietNote).toBeNull();
  });
});
