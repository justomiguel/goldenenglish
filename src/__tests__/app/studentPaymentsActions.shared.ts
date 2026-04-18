import { vi } from "vitest";

export const mockCreateClient = vi.fn();

export function studentFd(
  o: Partial<{
    month: string;
    year: string;
    amount: string;
    file: File | null | "omit";
  }> = {},
) {
  const form = new FormData();
  form.set("locale", "en");
  form.set("month", o.month ?? "3");
  form.set("year", o.year ?? "2026");
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

export interface StudentPayMockOpts {
  user: { id: string } | null;
  profileRole: string | null;
  /** Segundo SELECT en profiles (getProfilePermissions). */
  isMinor?: boolean;
  pay: { id: string; status: string } | null;
  payErr?: unknown;
  uploadErr?: unknown;
  updateErr?: unknown;
}

export function studentSupabaseFor(opts: StudentPayMockOpts) {
  let paymentsFromCount = 0;
  let profilesFromCount = 0;
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: opts.user } }),
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        profilesFromCount++;
        if (profilesFromCount === 1) {
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
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { is_minor: opts.isMinor ?? false },
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
            is: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: opts.payErr ? null : opts.pay,
              error: opts.payErr ?? null,
            }),
          };
        }
        const end = vi.fn().mockResolvedValue({
          error: opts.updateErr ?? null,
        });
        const e2 = vi.fn().mockReturnValue({ eq: end });
        const e1 = vi.fn().mockReturnValue({ eq: e2 });
        return {
          update: vi.fn().mockReturnValue({ eq: e1 }),
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
