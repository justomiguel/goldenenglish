import { describe, expect, it } from "vitest";
import { loadAdminFirstClassChecklist } from "@/lib/dashboard/loadAdminFirstClassChecklist";

type TableResult = {
  data?: unknown;
  count?: number;
  error?: unknown;
};

function createChain(result: TableResult) {
  const chain: Record<string, unknown> = {};
  const methods = ["select", "eq", "neq", "is", "gt", "gte", "lte", "not", "in", "order", "limit"];
  for (const method of methods) {
    chain[method] = () => chain;
  }
  const payload = {
    data: result.data ?? [],
    count: result.count ?? 0,
    error: result.error ?? null,
  };
  chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve(payload).then(resolve);
  chain.maybeSingle = () =>
    Promise.resolve({
      data: Array.isArray(result.data) ? (result.data[0] ?? null) : (result.data ?? null),
      error: result.error ?? null,
    });
  return chain;
}

function supabaseFrom(results: {
  profilesByRole: Record<string, number>;
  tables: Record<string, TableResult>;
}) {
  return {
    from(table: string) {
      if (table === "profiles") {
        const chain = createChain({ count: 0 });
        chain.eq = (col: string, value: string) => {
          if (col === "role") return createChain({ count: results.profilesByRole[value] ?? 0 });
          return chain;
        };
        return chain;
      }
      return createChain(results.tables[table] ?? { count: 0, data: [] });
    },
  };
}

describe("loadAdminFirstClassChecklist", () => {
  it("evaluates an empty institute as incomplete", async () => {
    const supabase = supabaseFrom({
      profilesByRole: { student: 0, teacher: 0 },
      tables: {
        academic_cohorts: { count: 0 },
        academic_sections: { data: [] },
        section_enrollments: { count: 0 },
        section_fee_plans: { count: 0 },
        class_pack_prices: { count: 0 },
        site_settings: { data: [] },
        payment_gateway_credentials: { count: 0 },
      },
    });

    const checklist = await loadAdminFirstClassChecklist(supabase as never, "es");

    expect(checklist.allDone).toBe(false);
    expect(checklist.doneCount).toBe(0);
    expect(checklist.items[0]?.href).toBe("/es/dashboard/admin/users/new?role=student");
  });

  it("points academic CTAs at the existing cohort and incomplete section", async () => {
    const supabase = supabaseFrom({
      profilesByRole: { student: 1, teacher: 1 },
      tables: {
        academic_cohorts: { data: [{ id: "coh-1" }] },
        academic_sections: {
          data: [
            {
              id: "sec-1",
              cohort_id: "coh-1",
              teacher_id: null,
              schedule_slots: [],
              enrollment_fee_amount: 0,
              billing_mode: "section_monthly_fee",
            },
          ],
        },
        section_enrollments: { count: 0 },
        section_fee_plans: { count: 0 },
        class_pack_prices: { count: 0 },
        site_settings: { data: [] },
        payment_gateway_credentials: { count: 0 },
      },
    });

    const checklist = await loadAdminFirstClassChecklist(supabase as never, "es");
    const hrefById = Object.fromEntries(checklist.items.map((item) => [item.id, item.href]));

    expect(hrefById.createTeacher).toBe("/es/dashboard/admin/users/new?role=teacher");
    expect(hrefById.assignTeacher).toBe("/es/dashboard/admin/academic/coh-1/sec-1");
    expect(hrefById.setSchedule).toBe("/es/dashboard/admin/academic/coh-1/sec-1");
    expect(hrefById.setFees).toBe("/es/dashboard/admin/academic/coh-1/sec-1");
  });

  it("marks the loop complete when people, section setup, fees, and payment exist", async () => {
    const supabase = supabaseFrom({
      profilesByRole: { student: 1, teacher: 1 },
      tables: {
        academic_cohorts: { data: [{ id: "coh-1" }] },
        academic_sections: {
          data: [
            {
              id: "sec-1",
              cohort_id: "coh-1",
              teacher_id: "t1",
              schedule_slots: [{ dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }],
              enrollment_fee_amount: 200,
              billing_mode: "section_monthly_fee",
            },
          ],
        },
        section_enrollments: { count: 1 },
        section_fee_plans: { count: 1 },
        class_pack_prices: { count: 0 },
        site_settings: { data: [{ value: { instructions: "Banco Estado" } }] },
        payment_gateway_credentials: { count: 0 },
      },
    });

    const checklist = await loadAdminFirstClassChecklist(supabase as never, "en");

    expect(checklist.allDone).toBe(true);
    expect(checklist.doneCount).toBe(8);
  });

  it("returns an incomplete checklist when a read throws", async () => {
    const supabase = {
      from() {
        throw new Error("boom");
      },
    };

    const checklist = await loadAdminFirstClassChecklist(supabase as never, "es");

    expect(checklist.allDone).toBe(false);
    expect(checklist.totalCount).toBe(8);
    expect(checklist.doneCount).toBe(0);
  });
});

