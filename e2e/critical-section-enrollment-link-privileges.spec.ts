import { test, expect } from "@playwright/test";
import { e2eRequireFailureMessage, resolveE2eIsolation } from "./env";

const isolation = resolveE2eIsolation();

/**
 * The static guard in `section_enrollment_links_migration.test.ts` only reads the
 * migration text. This is the half it cannot do: it proves the revokes actually took
 * effect in the running database.
 *
 * The whole feature rests on the token being unguessable. If anon can read the token
 * column, every live link is harvestable — which is precisely what the first version of
 * this migration did, while passing every text assertion.
 *
 * Delete any REVOKE from migration 182 and this test must go red.
 */
test.describe("@critical-section-enrollment-link", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
  });

  test("the database refuses to hand out enrollment tokens", async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    test.skip(!url || !anon, "Supabase URL / anon key missing — re-run e2e:stack:up");

    const headers = { apikey: anon!, Authorization: `Bearer ${anon}` };
    const jsonHeaders = { ...headers, "Content-Type": "application/json" };

    // Control: the public registration path still works, so a failure below cannot be
    // blamed on a broken endpoint or a misconfigured key.
    const control = await fetch(`${url}/rest/v1/rpc/list_registration_section_options`, {
      method: "POST",
      headers: jsonHeaders,
      body: "{}",
    });
    expect(control.ok, "list_registration_section_options must stay public").toBe(true);

    // Control: resolving a token is public by design. An unknown token yields an empty
    // list, not an error — that is the "link no longer available" path.
    const resolve = await fetch(`${url}/rest/v1/rpc/resolve_section_enrollment_link`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ p_token: "00000000-0000-0000-0000-000000000000" }),
    });
    expect(resolve.ok, "resolve_section_enrollment_link must stay public").toBe(true);
    expect(await resolve.json()).toEqual([]);

    // The secret itself must be unreachable.
    const tokens = await fetch(
      `${url}/rest/v1/section_enrollment_links?select=token&limit=1`,
      { headers },
    );
    expect(tokens.ok, "anon must not read section_enrollment_links").toBe(false);
    expect(await tokens.text()).toMatch(/42501|permission denied/i);

    // And so must the table that used to carry it.
    const sections = await fetch(`${url}/rest/v1/academic_sections?select=id&limit=1`, {
      headers,
    });
    expect(sections.ok, "anon must not read academic_sections").toBe(false);
    expect(await sections.text()).toMatch(/42501|permission denied/i);

    // Staff-only functions must not be callable without a session.
    for (const fn of [
      "section_enrollment_link_state",
      "section_enrollment_link_lead_count",
    ]) {
      const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ p_section_id: "00000000-0000-0000-0000-000000000000" }),
      });
      expect(res.ok, `${fn} must not be callable by anon`).toBe(false);
    }
  });
});
