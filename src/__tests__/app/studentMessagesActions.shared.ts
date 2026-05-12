import { vi } from "vitest";

export const mockCreateClient = vi.fn();

export function supabaseForStudentMessageDelete(opts: { userId: string }) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: opts.userId } } }),
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: "student" },
            error: null,
          }),
        };
      }
      if (table === "portal_messages") {
        const deleteSecondEq = vi.fn().mockResolvedValue({ error: null });
        const deleteFirstEq = vi.fn().mockReturnValue({ eq: deleteSecondEq });
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { broadcast_batch_id: null },
            error: null,
          }),
          delete: vi.fn().mockReturnValue({ eq: deleteFirstEq }),
        };
      }
      throw new Error(`unexpected ${table}`);
    }),
  };
}

export function supabaseForSendMessage(opts: {
  userId: string;
  role: "student" | "teacher";
  first?: string;
  last?: string;
}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: opts.userId } } }),
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              role: opts.role,
              first_name: opts.first ?? "F",
              last_name: opts.last ?? "L",
            },
            error: null,
          }),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { role: opts.role },
            error: null,
          }),
        };
      }
      if (table === "academic_section_staff") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      if (table === "academic_sections") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      throw new Error(`unexpected ${table}`);
    }),
  };
}
