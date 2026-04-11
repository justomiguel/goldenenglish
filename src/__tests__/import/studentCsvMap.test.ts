import { describe, it, expect } from "vitest";
import { mapCsvRecord, mapCsvRecords } from "@/lib/import/studentCsvMap";

describe("mapCsvRecord", () => {
  it("maps Spanish headers and required fields", () => {
    const row = mapCsvRecord({
      nombre: " Ana ",
      apellido: "López",
      documento: "12.345.678",
    });
    expect(row).toEqual({
      first_name: "Ana",
      last_name: "López",
      dni_or_passport: "12.345.678",
    });
  });

  it("maps academic_year alias", () => {
    const row = mapCsvRecord({
      academic_year: "2026",
      nombre: "X",
      apellido: "Y",
      dni: "99",
    });
    expect(row?.academic_year).toBe(2026);
  });

  it("maps level to uppercase CEFR", () => {
    const row = mapCsvRecord({
      first_name: "X",
      last_name: "Y",
      dni: "1",
      nivel: "b1",
    });
    expect(row?.level).toBe("B1");
  });

  it("returns null when required fields missing", () => {
    expect(mapCsvRecord({ nombre: "Only" })).toBeNull();
  });

  it("skips empty values", () => {
    const row = mapCsvRecord({
      nombre: "A",
      apellido: "B",
      dni: "1",
      email: "",
    });
    expect(row?.email).toBeUndefined();
  });

  it("omits monthly_fee when value is not numeric", () => {
    const row = mapCsvRecord({
      nombre: "A",
      apellido: "B",
      dni: "1",
      cuota: "xx",
    });
    expect(row?.monthly_fee).toBeUndefined();
  });

  it("ignores columns mapped to skip", () => {
    const row = mapCsvRecord({
      nombre: "A",
      apellido: "B",
      dni: "1",
      notas: "ignored text",
    });
    expect((row as Record<string, unknown>).notas).toBeUndefined();
  });

  it("parses monthly_fee with comma decimal", () => {
    const row = mapCsvRecord({
      nombre: "A",
      apellido: "B",
      dni: "1",
      cuota: "12,5",
    });
    expect(row?.monthly_fee).toBe(12.5);
  });

  it("does not set level when value is not a CEFR code", () => {
    const row = mapCsvRecord({
      nombre: "A",
      apellido: "B",
      dni: "1",
      nivel: "D1",
    });
    expect(row?.level).toBeUndefined();
  });

  it("maps Google Form / Golden Excel style columns", () => {
    const row = mapCsvRecord({
      "Dirección de correo electrónico": "a@b.com",
      Apellidos: "Aguilar",
      Nombre: "Bastian",
      DNI: "53567652",
      "Fecha nacimi": "6/14/14",
      "Nombre del tutor": "Aguilar Arturo",
      "Cntacto tutor": "3704699535",
      nivel: "1 año",
    });
    expect(row).toMatchObject({
      first_name: "Bastian",
      last_name: "Aguilar",
      dni_or_passport: "53567652",
      email: "a@b.com",
      birth_date: "2014-06-14",
      tutor_first_name: "Aguilar Arturo",
      tutor_phone: "3704699535",
    });
    expect(row?.level).toBeUndefined();
  });
});

describe("mapCsvRecords", () => {
  it("filters null mapped rows", () => {
    const out = mapCsvRecords([
      { nombre: "A", apellido: "B", dni: "1" },
      { nombre: "incomplete" },
    ]);
    expect(out).toHaveLength(1);
  });
});
