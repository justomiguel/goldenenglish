/**
 * REGRESSION CHECK: admin email template editor used to upsert `body_html`
 * raw, so a compromised admin (or a stolen session) could persist
 * `<script>`, `onerror=`, `javascript:` URLs, etc., which then went out to
 * every recipient in real branded emails. We now sanitize at the persistence
 * boundary using a curated email-safe allowlist (OWASP A03 / A08 — defense
 * in depth even when the caller is supposed to be staff).
 */
import { describe, it, expect } from "vitest";
import { sanitizeEmailTemplateHtml } from "@/lib/email/sanitizeEmailTemplateHtml";

describe("sanitizeEmailTemplateHtml", () => {
  it("removes <script> tags entirely (no contents leaked)", () => {
    const out = sanitizeEmailTemplateHtml("<p>hi</p><script>alert(1)</script>");
    expect(out).toBe("<p>hi</p>");
    expect(out).not.toContain("alert");
    expect(out).not.toContain("<script");
  });

  it("removes <iframe>, <object>, <embed>", () => {
    const out = sanitizeEmailTemplateHtml(
      `<iframe src="evil"></iframe><object data="x"></object><embed src="x">`,
    );
    expect(out).not.toContain("<iframe");
    expect(out).not.toContain("<object");
    expect(out).not.toContain("<embed");
  });

  it("strips on* event handlers", () => {
    const out = sanitizeEmailTemplateHtml(
      `<p onclick="evil()">hi</p><img src="https://x" onerror="boom()" alt="x" />`,
    );
    expect(out).not.toMatch(/onclick/i);
    expect(out).not.toMatch(/onerror/i);
    expect(out).toContain("<p>hi</p>");
  });

  it("rejects javascript: in href", () => {
    const out = sanitizeEmailTemplateHtml(
      `<a href="javascript:alert(1)">click</a>`,
    );
    expect(out).not.toMatch(/javascript:/i);
  });

  it("keeps safe http/https/mailto/tel hrefs", () => {
    const html = `<p><a href="https://example.com">x</a> <a href="mailto:a@b.co">m</a> <a href="tel:+5491100000000">t</a></p>`;
    const out = sanitizeEmailTemplateHtml(html);
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('href="mailto:a@b.co"');
    expect(out).toContain('href="tel:+5491100000000"');
  });

  it("preserves inline style and basic block tags used by existing templates", () => {
    const html = `<p style="font-size:0.875rem;color:#6B7280;">{{footer}}</p><ul style="padding-left:20px;"><li>a</li></ul>`;
    const out = sanitizeEmailTemplateHtml(html);
    expect(out).toContain("font-size:0.875rem");
    expect(out).toContain("color:#6B7280");
    expect(out).toContain("padding-left:20px");
    expect(out).toContain("{{footer}}");
  });

  it("strips style values that try to escape with javascript / expression()", () => {
    const out = sanitizeEmailTemplateHtml(
      `<p style="background:url('javascript:alert(1)');color:red;">x</p>`,
    );
    expect(out).not.toMatch(/javascript:/i);
    expect(out).toContain("color:red");
  });

  it("preserves placeholders ({{var}}) untouched", () => {
    const out = sanitizeEmailTemplateHtml(
      `<p>Hola, <strong>{{wardName}}</strong>. Email: {{newEmail}}</p>`,
    );
    expect(out).toContain("{{wardName}}");
    expect(out).toContain("{{newEmail}}");
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeEmailTemplateHtml("")).toBe("");
  });
});
