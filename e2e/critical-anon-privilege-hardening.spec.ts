import { execFileSync } from "node:child_process";
import { test, expect } from "@playwright/test";
import { e2eRequireFailureMessage, resolveE2eIsolation } from "./env";

const isolation = resolveE2eIsolation();

/**
 * Migration 185 takes every write privilege away from `anon` and re-grants exactly one:
 * INSERT on registrations. The static guard in
 * `src/__tests__/db/anon_privilege_hardening_migration.test.ts` only reads the migration
 * text, which proves nothing about the running database. This is the half that does.
 *
 * The load-bearing assertion is the registration one. Removing the
 * `GRANT INSERT ON public.registrations TO anon` line from migration 185 breaks the
 * public registration form for every tenant while every text-level assertion still
 * passes — so that line's absence has to turn this spec red, and it has been checked by
 * removing it, re-applying and watching it fail with a 401/42501 on the POST.
 *
 * The refusals are asserted on the SQLSTATE, not on the status code. With RLS alone a
 * blocked PATCH or DELETE comes back 200 with an empty result, which would prove nothing;
 * 42501 is the database saying the *privilege* is missing.
 */
test.describe("@critical-anon-privilege-hardening", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
  });

  test("anon may still register a lead and nothing else", async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    test.skip(!url || !anon, "Supabase URL / anon key missing — re-run e2e:stack:up");

    const headers = { apikey: anon!, Authorization: `Bearer ${anon}` };
    const jsonHeaders = { ...headers, "Content-Type": "application/json" };

    // Unique per run so cleanup can never touch a real lead, and so a leftover row from a
    // crashed earlier run cannot make this one pass.
    const sentinel = `e2e-anon-priv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    /** Removes the probe lead. anon cannot (that is asserted below), so: service role, else psql. */
    async function removeProbeLead(): Promise<void> {
      if (service) {
        const res = await fetch(
          `${url}/rest/v1/registrations?dni=eq.${encodeURIComponent(sentinel)}`,
          { method: "DELETE", headers: { apikey: service, Authorization: `Bearer ${service}` } },
        );
        if (res.ok) return;
      }
      // Last resort so a failed assertion never leaves a row behind.
      execFileSync(
        "docker",
        [
          "exec",
          "-i",
          "supabase_db_goldenenglish",
          "psql",
          "-U",
          "postgres",
          "-d",
          "postgres",
          "-c",
          `DELETE FROM public.registrations WHERE dni = '${sentinel}';`,
        ],
        { stdio: "ignore" },
      );
    }

    /** Rows carrying the sentinel, read with a key that bypasses RLS. */
    async function countProbeLeads(): Promise<number | null> {
      if (!service) return null;
      const res = await fetch(
        `${url}/rest/v1/registrations?select=dni&dni=eq.${encodeURIComponent(sentinel)}`,
        { headers: { apikey: service, Authorization: `Bearer ${service}` } },
      );
      if (!res.ok) return null;
      return ((await res.json()) as unknown[]).length;
    }

    try {
      // Control: a genuinely public read still works, so a refusal below cannot be blamed
      // on a broken endpoint or a bad key. site_settings is keyed by `key`, not `id`.
      const publicRead = await fetch(`${url}/rest/v1/site_settings?select=key&limit=1`, {
        headers,
      });
      expect(publicRead.status, "site_settings must stay publicly readable").toBe(200);

      // THE assertion of this spec: public registration still works for an anonymous
      // caller. Same shape the /register server action inserts.
      const insert = await fetch(`${url}/rest/v1/registrations`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          first_name: "E2E",
          last_name: "AnonPrivilege",
          dni: sentinel,
          email: `${sentinel}@example.test`,
          phone: "+56900000000",
          birth_date: "1990-01-01",
          preferred_section_id: null,
          level_interest: "e2e-probe",
          status: "new",
          tutor_name: null,
          tutor_dni: null,
          tutor_phone: null,
          tutor_email: null,
          tutor_relationship: null,
        }),
      });
      expect(
        `${insert.status} ${await insert.text()}`,
        "anon must still be able to insert a registration — migration 185 must keep GRANT INSERT ON public.registrations TO anon",
      ).toMatch(/^201/);

      // 201 alone could in principle be a no-op, so confirm the row exists.
      const landed = await countProbeLeads();
      if (landed !== null) {
        expect(landed, "the anonymous lead must actually be persisted").toBe(1);
      }

      // Writes that must now fail on the privilege, not on RLS. profiles is a table anon
      // has no business writing at all.
      const patch = await fetch(
        `${url}/rest/v1/profiles?id=eq.00000000-0000-0000-0000-000000000000`,
        { method: "PATCH", headers: jsonHeaders, body: JSON.stringify({ first_name: "x" }) },
      );
      expect(patch.ok, "anon must not update profiles").toBe(false);
      expect(await patch.text(), "the refusal must be a privilege error, not an empty RLS result").toMatch(
        /42501/,
      );

      // And the re-grant is INSERT only: anon can create a lead, never remove one.
      const del = await fetch(
        `${url}/rest/v1/registrations?dni=eq.${encodeURIComponent(sentinel)}`,
        { method: "DELETE", headers },
      );
      expect(del.ok, "anon must not delete registrations").toBe(false);
      expect(await del.text(), "DELETE on registrations must fail on the privilege").toMatch(
        /42501/,
      );
    } finally {
      await removeProbeLead();
    }

    const leftover = await countProbeLeads();
    if (leftover !== null) {
      expect(leftover, "the probe lead must be cleaned up").toBe(0);
    }
  });
});
