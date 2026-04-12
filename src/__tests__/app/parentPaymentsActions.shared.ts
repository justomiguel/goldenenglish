import { vi } from "vitest";

export const mockCreateClient = vi.fn();

export function fd(
  o: Partial<{
    studentId: string;
    month: string;
    year: string;
    amount: string;
    file: File | null | "omit";
  }> = {},
) {
  const form = new FormData();
  form.set("studentId", o.studentId ?? "stu-1");
  form.set("month", o.month ?? "3");
  form.set("year", o.year ?? "2025");
  form.set("amount", o.amount ?? "100");
  if (o.file !== "omit") {
    if (o.file === null) {
      /* no receipt field */
    } else if (o.file instanceof File) {
      form.set("receipt", o.file);
    } else {
      form.set(
        "receipt",
        new File([new Uint8Array([1])], "r.pdf", {
          type: "application/pdf",
        }),
      );
    }
  }
  return form;
}

export interface PayMockOpts {
  user: { id: string } | null;
  profileRole: string | null;
  link: boolean;
  pay: { id: string; status: string } | null;
  payErr?: unknown;
  uploadErr?: unknown;
  updateErr?: unknown;
}

export function supabaseFor(opts: PayMockOpts) {
  let paymentsFromCount = 0;
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: opts.user } }),
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data:
              opts.profileRole === null
                ? null
                : { role: opts.profileRole },
            error: null,
          }),
        };
      }
      if (table === "tutor_student_rel") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: opts.link ? { student_id: "stu-1" } : null,
            error: null,
          }),
        };
      }
      if (table === "payments") {
        paymentsFromCount++;
        if (paymentsFromCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: opts.payErr ? null : opts.pay,
              error: opts.payErr ?? null,
            }),
          };
        }
        const end = vi.fn().mockResolvedValue({
          error: opts.updateErr ?? null,
        });
        const mid = vi.fn().mockReturnValue({ eq: end });
        return {
          update: vi.fn().mockReturnValue({ eq: mid }),
        };
      }
      throw new Error(`unexpected ${table}`);
    }),
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ error: opts.uploadErr ?? null }),
      }),
    },
  };
}
