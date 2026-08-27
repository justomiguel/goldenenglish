import { describe, expect, it, vi } from "vitest";
import { applyNagoExtrasOnAccept } from "@/lib/register/packs/nago/applyNagoExtrasOnAccept";
import { validNagoExtras } from "@/__tests__/lib/register/packs/nagoExtrasFixture";

const labels = {
  insurance: "Previsión",
  bloodType: "Grupo",
  condition: "Condición",
  healthCenter: "Centro",
  allergies: "Alergias",
  none: "No",
};

function adminMock(opts: {
  selectData?: Record<string, string | null>;
  selectError?: { message: string };
  updateError?: { message: string };
}) {
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: opts.updateError ?? null }),
  });
  const maybeSingle = vi.fn().mockResolvedValue({
    data: opts.selectData ?? {
      home_address_text: "",
      care_health_note: "",
      care_diet_note: "",
    },
    error: opts.selectError ?? null,
  });
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle })),
      })),
      update,
    })),
    update,
  };
}

describe("applyNagoExtrasOnAccept", () => {
  it("does nothing when extras are not Nagô", async () => {
    const admin = adminMock({});
    await applyNagoExtrasOnAccept({
      admin: admin as never,
      studentId: "s1",
      tenantExtras: {},
      labels,
    });
    expect(admin.from).not.toHaveBeenCalled();
  });

  it("fills blank profile fields", async () => {
    const admin = adminMock({});
    await applyNagoExtrasOnAccept({
      admin: admin as never,
      studentId: "s1",
      tenantExtras: validNagoExtras(),
      labels,
    });
    expect(admin.update).toHaveBeenCalledWith(
      expect.objectContaining({
        home_address_text: "Av. Principal 100, Santiago",
        care_diet_note: "Alergias: No",
      }),
    );
    expect(admin.update.mock.calls[0][0]).not.toHaveProperty("has_care_notes");
    expect(admin.update.mock.calls[0][0]).not.toHaveProperty("care_support_note");
  });

  it("does not overwrite non-blank notes", async () => {
    const admin = adminMock({
      selectData: {
        home_address_text: "Ya hay",
        care_health_note: "Asma",
        care_diet_note: "Maní",
      },
    });
    await applyNagoExtrasOnAccept({
      admin: admin as never,
      studentId: "s1",
      tenantExtras: validNagoExtras(),
      labels,
    });
    expect(admin.update).not.toHaveBeenCalled();
  });

  it("does not throw when select fails", async () => {
    const admin = adminMock({ selectError: { message: "nope" } });
    await expect(
      applyNagoExtrasOnAccept({
        admin: admin as never,
        studentId: "s1",
        tenantExtras: validNagoExtras(),
        labels,
      }),
    ).resolves.toBeUndefined();
    expect(admin.update).not.toHaveBeenCalled();
  });
});
