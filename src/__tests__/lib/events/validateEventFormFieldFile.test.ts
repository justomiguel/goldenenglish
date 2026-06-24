import { describe, expect, it } from "vitest";
import {
  resolveEventFormFieldAcceptAttr,
  validateEventFormFieldFile,
} from "@/lib/events/validateEventFormFieldFile";
import type { EventFormFieldDefinition } from "@/lib/events/types";

function makeField(fieldType: "file" | "image"): EventFormFieldDefinition {
  return {
    id: "f1",
    fieldKey: "doc",
    fieldType,
    labelI18n: { es: "Doc" },
    required: false,
  };
}

describe("validateEventFormFieldFile", () => {
  it("accepts pdf for file fields but not for image fields", () => {
    const pdf = { size: 1024, type: "application/pdf" };

    expect(validateEventFormFieldFile(makeField("file"), pdf)).toEqual({
      ok: true,
      mime: "application/pdf",
    });
    expect(validateEventFormFieldFile(makeField("image"), pdf)).toEqual({
      ok: false,
      code: "invalid_type",
    });
  });

  it("builds different accept lists for file vs image", () => {
    expect(resolveEventFormFieldAcceptAttr(makeField("image"))).toBe(
      "image/jpeg,image/png,image/webp",
    );
    expect(resolveEventFormFieldAcceptAttr(makeField("file"))).toBe(
      "image/jpeg,image/png,image/webp,application/pdf",
    );
  });
});
