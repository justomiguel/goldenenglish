/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { publicRegistrationInputFromFormData } from "@/lib/register/publicRegistrationInputFromFormData";

function fd(entries: Record<string, string | string[]>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    if (Array.isArray(value)) {
      for (const item of value) form.append(key, item);
    } else {
      form.set(key, value);
    }
  }
  return form;
}

describe("publicRegistrationInputFromFormData", () => {
  it("reads core fields and trial intent without extras", () => {
    const raw = publicRegistrationInputFromFormData(
      fd({
        first_name: "Ada",
        last_name: "Lovelace",
        dni: "1",
        email: "ada@test.com",
        phone: "+1",
        birth_date: "2000-01-01",
        preferred_section_id: "sec-1",
        additional_section_ids: ["sec-2", ""],
        tutor_name: "Ann",
      }),
      null,
      "trial",
    );
    expect(raw).toMatchObject({
      first_name: "Ada",
      preferred_section_id: "sec-1",
      additional_section_ids: ["sec-2"],
      intent: "trial",
      tenant_extras: undefined,
    });
  });

  it("stamps nago extras when the pack is nago", () => {
    const raw = publicRegistrationInputFromFormData(
      fd({ first_name: "Ada", nago_nationality: "CL" }),
      "nago",
      "reserve",
    );
    expect(raw.tenant_extras).toMatchObject({ pack: "nago", nationality: "CL" });
  });
});
