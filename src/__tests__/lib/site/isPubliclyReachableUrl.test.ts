import { describe, expect, it } from "vitest";
import { isPubliclyReachableUrl } from "@/lib/site/isPubliclyReachableUrl";

describe("isPubliclyReachableUrl", () => {
  it("accepts public https origins", () => {
    expect(isPubliclyReachableUrl("https://goldenenglish.com")).toBe(true);
    expect(isPubliclyReachableUrl("https://my-app.vercel.app/es/events")).toBe(true);
    expect(isPubliclyReachableUrl("http://example.org")).toBe(true);
  });

  it("rejects localhost and loopback", () => {
    expect(isPubliclyReachableUrl("http://localhost:3000")).toBe(false);
    expect(isPubliclyReachableUrl("http://127.0.0.1:3000/x")).toBe(false);
    expect(isPubliclyReachableUrl("http://0.0.0.0:3000")).toBe(false);
    expect(isPubliclyReachableUrl("http://[::1]:3000")).toBe(false);
  });

  it("rejects private LAN IPs and .local hosts", () => {
    expect(isPubliclyReachableUrl("http://192.168.1.10:3000")).toBe(false);
    expect(isPubliclyReachableUrl("http://10.0.0.5")).toBe(false);
    expect(isPubliclyReachableUrl("http://172.16.0.9")).toBe(false);
    expect(isPubliclyReachableUrl("http://172.31.255.1")).toBe(false);
    expect(isPubliclyReachableUrl("http://mybox.local")).toBe(false);
  });

  it("treats 172.x outside the private range as public", () => {
    expect(isPubliclyReachableUrl("http://172.15.0.1")).toBe(true);
    expect(isPubliclyReachableUrl("http://172.32.0.1")).toBe(true);
  });

  it("rejects malformed or non-http URLs", () => {
    expect(isPubliclyReachableUrl("not a url")).toBe(false);
    expect(isPubliclyReachableUrl("ftp://example.org")).toBe(false);
    expect(isPubliclyReachableUrl("")).toBe(false);
  });
});
