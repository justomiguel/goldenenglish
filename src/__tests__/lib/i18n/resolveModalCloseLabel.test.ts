import { describe, expect, it } from "vitest";
import {
  localeCodeFromPathname,
  resolveModalCloseLabel,
  resolveModalScrollMoreHint,
} from "@/lib/i18n/resolveModalCloseLabel";

describe("localeCodeFromPathname", () => {
  it("returns es for root or unknown paths", () => {
    expect(localeCodeFromPathname(null)).toBe("es");
    expect(localeCodeFromPathname("")).toBe("es");
    expect(localeCodeFromPathname("/fr/foo")).toBe("es");
  });

  it("reads leading en or es segment", () => {
    expect(localeCodeFromPathname("/en")).toBe("en");
    expect(localeCodeFromPathname("/en/dashboard")).toBe("en");
    expect(localeCodeFromPathname("/es")).toBe("es");
    expect(localeCodeFromPathname("/es/registro")).toBe("es");
  });
});

describe("resolveModalCloseLabel", () => {
  it("uses explicit closeLabel when provided", () => {
    expect(resolveModalCloseLabel("Cancelar", "/en/x")).toBe("Cancelar");
  });

  it("uses common.modalClose for en and es when closeLabel is omitted", () => {
    expect(resolveModalCloseLabel(undefined, "/en")).toBe("Close");
    expect(resolveModalCloseLabel(undefined, "/es")).toBe("Cerrar");
  });

  it("returns null when closeLabel is empty string", () => {
    expect(resolveModalCloseLabel("", "/en")).toBeNull();
  });
});

describe("resolveModalScrollMoreHint", () => {
  it("uses common.modalScrollMore for en and es paths", () => {
    expect(resolveModalScrollMoreHint("/en/dashboard")).toBe("More content below");
    expect(resolveModalScrollMoreHint("/es/dashboard")).toBe("Hay más contenido abajo");
  });
});
