/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { continueRegistrationDni } from "@/components/register/registerFormHandlers";
import { dictEn } from "@/test/dictEn";

const lookupRegistrationStudentAction = vi.hoisted(() => vi.fn());

vi.mock("@/app/[locale]/register/lookupRegistrationStudentAction", () => ({
  lookupRegistrationStudentAction,
}));

vi.mock("@/app/[locale]/register/actions", () => ({
  submitPublicRegistration: vi.fn(),
}));

vi.mock("@/app/[locale]/i/actions", () => ({
  submitSectionLinkRegistration: vi.fn(),
}));

function formWithDni(value: string): HTMLFormElement {
  const form = document.createElement("form");
  const input = document.createElement("input");
  input.name = "dni";
  input.required = true;
  input.value = value;
  form.appendChild(input);
  form.reportValidity = () => true;
  return form;
}

describe("continueRegistrationDni", () => {
  beforeEach(() => {
    lookupRegistrationStudentAction.mockReset();
    lookupRegistrationStudentAction.mockResolvedValue({ ok: true, found: false });
  });

  it("looks up the live form DNI and writes it into state", async () => {
    const setDni = vi.fn();
    const setStep = vi.fn();
    await continueRegistrationDni({
      form: formWithDni("87654321"),
      dni: "",
      dict: dictEn.register,
      setBusy: vi.fn(),
      setMsg: vi.fn(),
      setMsgTone: vi.fn(),
      setDni,
      setFirstName: vi.fn(),
      setLastName: vi.fn(),
      setBirthDate: vi.fn(),
      setDefaultEmail: vi.fn(),
      setDefaultPhone: vi.fn(),
      setTutorDefaults: vi.fn(),
      setExistingMatch: vi.fn(),
      setExistingConfirmed: vi.fn(),
      setStep,
    });
    expect(setDni).toHaveBeenCalledWith("87654321");
    expect(lookupRegistrationStudentAction).toHaveBeenCalledWith("87654321");
    expect(setStep).toHaveBeenCalledWith("details");
  });
});
