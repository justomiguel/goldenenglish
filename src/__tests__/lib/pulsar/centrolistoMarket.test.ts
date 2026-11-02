import { describe, expect, it } from "vitest";
import {
  centrolistoMarketCookieAssignment,
  resolveCentrolistoMarket,
  withCentrolistoMarket,
} from "@/lib/pulsar/centrolistoMarket";

// REGRESSION CHECK: Query wins over the cookie. An unknown code falls back to Chile.
describe("centrolistoMarket", () => {
  it("uses the query, then the cookie, then Chile", () => {
    expect(resolveCentrolistoMarket({ query: "ar", cookie: "cl" })).toBe("ar");
    expect(resolveCentrolistoMarket({ query: "nope", cookie: "uy" })).toBe("uy");
    expect(resolveCentrolistoMarket({ query: undefined, cookie: null })).toBe("cl");
    expect(resolveCentrolistoMarket({ query: ["py"], cookie: "cl" })).toBe("py");
  });

  it("keeps pais on links outside Chile and leaves Chile links unchanged", () => {
    expect(withCentrolistoMarket("/es/precios", "cl")).toBe("/es/precios");
    expect(withCentrolistoMarket("/es/precios", "uy")).toBe("/es/precios?pais=uy");
    expect(withCentrolistoMarket("/es/contacto?hola=1", "ar")).toBe("/es/contacto?hola=1&pais=ar");
  });

  it("writes a year-long SameSite cookie", () => {
    expect(centrolistoMarketCookieAssignment("py", true)).toContain("centrolisto_market=py");
    expect(centrolistoMarketCookieAssignment("py", true)).toContain("SameSite=Lax");
    expect(centrolistoMarketCookieAssignment("py", true)).toContain("Secure");
    expect(centrolistoMarketCookieAssignment("py", false)).not.toContain("Secure");
  });
});
