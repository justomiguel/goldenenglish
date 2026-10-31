import { describe, expect, it } from "vitest";
import {
  isCentrolistoMarketingPath,
  readCentrolistoGaMeasurementId,
  resolveCentrolistoClick,
} from "@/lib/pulsar/centrolistoAnalytics";

// REGRESSION CHECK: A bad measurement id must not reach the gtag script.
// Admin paths must stay out of marketing page views.

describe("readCentrolistoGaMeasurementId", () => {
  it("accepts a GA4 measurement id", () => {
    expect(readCentrolistoGaMeasurementId("G-ABC1234")).toBe("G-ABC1234");
  });

  it("rejects empty and injected values", () => {
    expect(readCentrolistoGaMeasurementId("")).toBeNull();
    expect(readCentrolistoGaMeasurementId("  ")).toBeNull();
    expect(readCentrolistoGaMeasurementId("G-ABC';alert(1)")).toBeNull();
    expect(readCentrolistoGaMeasurementId("UA-123")).toBeNull();
  });
});

describe("isCentrolistoMarketingPath", () => {
  it("keeps public pages and drops admin", () => {
    expect(isCentrolistoMarketingPath("/es")).toBe(true);
    expect(isCentrolistoMarketingPath("/es/contacto")).toBe(true);
    expect(isCentrolistoMarketingPath("/es/para/danza")).toBe(true);
    expect(isCentrolistoMarketingPath("/es/admin")).toBe(false);
    expect(isCentrolistoMarketingPath("/es/admin/tenants")).toBe(false);
  });
});

describe("resolveCentrolistoClick", () => {
  it("reads the link url and a short label", () => {
    document.body.innerHTML = `<a href="https://centrolisto.cl/es/contacto"><span>Escribir</span></a>`;
    const span = document.querySelector("span");
    expect(resolveCentrolistoClick(span, "https://centrolisto.cl")).toEqual({
      linkUrl: "https://centrolisto.cl/es/contacto",
      linkText: "Escribir",
      outbound: false,
    });
  });

  it("marks a different origin as outbound", () => {
    document.body.innerHTML = `<a href="https://wa.me/56911111111" aria-label="WhatsApp">wa</a>`;
    const link = document.querySelector("a");
    expect(resolveCentrolistoClick(link, "https://centrolisto.cl")).toMatchObject({
      linkText: "WhatsApp",
      outbound: true,
    });
  });

  it("ignores clicks that are not links", () => {
    document.body.innerHTML = `<button type="button">Ok</button>`;
    expect(resolveCentrolistoClick(document.querySelector("button"), "https://centrolisto.cl")).toBeNull();
  });
});
