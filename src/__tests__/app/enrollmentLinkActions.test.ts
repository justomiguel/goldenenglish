/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const adminUpsert = vi.fn();
const adminUpdate = vi.fn();
const adminFrom = vi.fn();
const revalidatePath = vi.fn();
const userIsSectionTeacherOrAssistant = vi.fn();
const resolveIsAdminSession = vi.fn();
const randomUUID = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      adminFrom(table);
      return { upsert: adminUpsert, update: adminUpdate };
    },
  }),
}));

vi.mock("@/lib/academics/userIsSectionTeacherOrAssistant", () => ({
  userIsSectionTeacherOrAssistant: (...args: unknown[]) =>
    userIsSectionTeacherOrAssistant(...args),
}));

vi.mock("@/lib/auth/resolveIsAdminSession", () => ({
  resolveIsAdminSession: (...args: unknown[]) => resolveIsAdminSession(...args),
}));

vi.mock("node:crypto", () => ({ randomUUID: () => randomUUID() }));

const SECTION = "11111111-1111-4111-8111-111111111111";
const TOKEN = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const ROTATED = "22222222-2222-4222-8222-222222222222";

async function load() {
  return import(
    "@/app/[locale]/dashboard/teacher/sections/[sectionId]/enrollmentLinkActions"
  );
}

describe("section enrollment link actions", () => {
  beforeEach(() => {
    vi.resetModules();
    getUser.mockReset();
    adminUpsert.mockReset();
    adminUpdate.mockReset();
    adminFrom.mockReset();
    revalidatePath.mockReset();
    userIsSectionTeacherOrAssistant.mockReset();
    resolveIsAdminSession.mockReset();
    randomUUID.mockReset();

    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    userIsSectionTeacherOrAssistant.mockResolvedValue(true);
    resolveIsAdminSession.mockResolvedValue(false);
    randomUUID.mockReturnValue(TOKEN);
    adminUpsert.mockResolvedValue({ error: null });
    adminUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  });

  it("refuses an anonymous caller", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { generateSectionEnrollmentLinkAction } = await load();
    const res = await generateSectionEnrollmentLinkAction("es", SECTION);
    expect(res.ok).toBe(false);
    expect(adminUpsert).not.toHaveBeenCalled();
  });

  it("refuses a teacher who does not lead the section", async () => {
    userIsSectionTeacherOrAssistant.mockResolvedValue(false);
    const { generateSectionEnrollmentLinkAction } = await load();
    const res = await generateSectionEnrollmentLinkAction("es", SECTION);
    expect(res.ok).toBe(false);
    expect(adminUpsert).not.toHaveBeenCalled();
  });

  it("allows an admin who does not lead the section", async () => {
    userIsSectionTeacherOrAssistant.mockResolvedValue(false);
    resolveIsAdminSession.mockResolvedValue(true);
    const { generateSectionEnrollmentLinkAction } = await load();
    const res = await generateSectionEnrollmentLinkAction("es", SECTION);
    expect(res.ok).toBe(true);
    expect(adminUpsert).toHaveBeenCalledTimes(1);
  });

  it("writes to the dedicated link table, never to academic_sections", async () => {
    const { generateSectionEnrollmentLinkAction } = await load();
    await generateSectionEnrollmentLinkAction("es", SECTION);
    expect(adminFrom).toHaveBeenCalledWith("section_enrollment_links");
    expect(adminFrom).not.toHaveBeenCalledWith("academic_sections");
  });

  it("generates a token, activates the link and stamps the author", async () => {
    const { generateSectionEnrollmentLinkAction } = await load();
    const res = await generateSectionEnrollmentLinkAction("es", SECTION);
    expect(res.ok).toBe(true);
    const [row, options] = adminUpsert.mock.calls[0];
    expect(row).toMatchObject({
      section_id: SECTION,
      token: TOKEN,
      is_active: true,
      created_by: "user-1",
    });
    expect(options).toEqual({ onConflict: "section_id" });
  });

  it("deactivates without discarding the token", async () => {
    const { setSectionEnrollmentLinkActiveAction } = await load();
    const res = await setSectionEnrollmentLinkActiveAction("es", SECTION, false);
    expect(res.ok).toBe(true);
    expect(adminUpsert).not.toHaveBeenCalled();
    expect(adminUpdate.mock.calls[0][0]).toMatchObject({ is_active: false });
  });

  it("rotates to a brand-new token", async () => {
    randomUUID.mockReturnValue(ROTATED);
    const { rotateSectionEnrollmentLinkAction } = await load();
    const res = await rotateSectionEnrollmentLinkAction("es", SECTION);
    expect(res.ok).toBe(true);
    expect(adminUpsert.mock.calls[0][0]).toMatchObject({
      section_id: SECTION,
      token: ROTATED,
      is_active: true,
    });
  });

  it("rejects a section id that is not a uuid", async () => {
    const { generateSectionEnrollmentLinkAction } = await load();
    const res = await generateSectionEnrollmentLinkAction("es", "../../etc/passwd");
    expect(res.ok).toBe(false);
    expect(adminUpsert).not.toHaveBeenCalled();
  });

  it("revalidates the teacher and admin section screens after a write", async () => {
    const { generateSectionEnrollmentLinkAction } = await load();
    await generateSectionEnrollmentLinkAction("es", SECTION);
    expect(revalidatePath).toHaveBeenCalledWith(
      `/es/dashboard/teacher/sections/${SECTION}`,
      "page",
    );
    expect(revalidatePath).toHaveBeenCalledWith(
      `/es/dashboard/admin/academic`,
      "layout",
    );
  });
});
