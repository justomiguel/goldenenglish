import { describe, expect, it } from "vitest";
import {
  academicProfileValueSlot,
  isActiveAcademicProfileField,
  normalizeAcademicProfileFieldDraft,
} from "@/lib/academic-profile/academicProfileFieldRules";

describe("normalizeAcademicProfileFieldDraft", () => {
  it("forces the column off for a file", () => {
    const result = normalizeAcademicProfileFieldDraft({
      label: " Certificado ",
      fieldType: "file",
      selectOptions: [],
      required: false,
      showInDirectory: true,
    });
    expect(result).toEqual({
      ok: true,
      field: {
        label: "Certificado",
        fieldType: "file",
        selectOptions: [],
        required: false,
        showInDirectory: false,
      },
    });
  });

  it("rejects a select with no options", () => {
    const result = normalizeAcademicProfileFieldDraft({
      label: "Nivel",
      fieldType: "select",
      selectOptions: ["  "],
      required: false,
      showInDirectory: true,
    });
    expect(result).toEqual({ ok: false, error: "options" });
  });

  it("rejects an unknown type", () => {
    const result = normalizeAcademicProfileFieldDraft({
      label: "Nivel",
      fieldType: "color",
      selectOptions: [],
      required: false,
      showInDirectory: false,
    });
    expect(result).toEqual({ ok: false, error: "type" });
  });

  it("keeps trimmed select options", () => {
    const result = normalizeAcademicProfileFieldDraft({
      label: "Nivel",
      fieldType: "select",
      selectOptions: [" B1 "],
      required: true,
      showInDirectory: true,
    });
    expect(result).toEqual({
      ok: true,
      field: {
        label: "Nivel",
        fieldType: "select",
        selectOptions: ["B1"],
        required: true,
        showInDirectory: true,
      },
    });
  });

  it("rejects an empty label", () => {
    const result = normalizeAcademicProfileFieldDraft({
      label: " ",
      fieldType: "text",
      selectOptions: [],
      required: false,
      showInDirectory: false,
    });
    expect(result).toEqual({ ok: false, error: "label" });
  });
});

describe("academicProfileValueSlot", () => {
  it("maps text types to text and image to file", () => {
    expect(academicProfileValueSlot("email")).toBe("text");
    expect(academicProfileValueSlot("number")).toBe("number");
    expect(academicProfileValueSlot("date")).toBe("date");
    expect(academicProfileValueSlot("image")).toBe("file");
  });
});

describe("isActiveAcademicProfileField", () => {
  it("hides an archived field", () => {
    expect(isActiveAcademicProfileField({ archivedAt: null })).toBe(true);
    expect(isActiveAcademicProfileField({ archivedAt: "2026-10-27T00:00:00Z" })).toBe(false);
  });
});
