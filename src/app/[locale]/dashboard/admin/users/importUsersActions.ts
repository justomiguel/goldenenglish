"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/types/i18n";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { parseUsersSpreadsheetBuffer } from "@/lib/users/parseUsersSpreadsheetFile";
import { parseUsersSpreadsheetRawRows } from "@/lib/users/usersSpreadsheetRowSchema";
import { classifyUsersSpreadsheetRows } from "@/lib/users/classifyUsersSpreadsheetRows";
import { loadExistingProfilesForUsersSpreadsheet } from "@/lib/users/loadExistingProfilesForUsersSpreadsheet";
import { createDashboardUser } from "@/app/[locale]/dashboard/admin/users/actions";
import {
  logServerAuthzDenied,
  logServerException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import { revalidatePath } from "next/cache";

const localeSchema = z.string().min(2).max(8);

export type DryRunImportUsersResult =
  | {
      ok: true;
      newCount: number;
      duplicateCount: number;
      invalidCount: number;
      /** Opaque rows for apply — valid new + duplicates only */
      payload: {
        newRows: ReturnType<typeof parseUsersSpreadsheetRawRows>["valid"];
        duplicateRows: {
          existingId: string;
          row: ReturnType<typeof parseUsersSpreadsheetRawRows>["valid"][number];
        }[];
      };
    }
  | { ok: false; message: string };

export type ApplyImportUsersResult =
  | {
      ok: true;
      created: number;
      updated: number;
      skipped: number;
      failed: number;
    }
  | { ok: false; message: string };

async function assertAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await resolveIsAdminSession(supabase, user.id))) {
    return null;
  }
  return user;
}

export async function dryRunImportUsersAction(
  locale: string,
  formData: FormData,
): Promise<DryRunImportUsersResult> {
  const loc = localeSchema.safeParse(locale);
  const dict = await getDictionary((loc.success ? loc.data : "en") as Locale);
  const labels = dict.admin.users.spreadsheet;

  try {
    const user = await assertAdminUser();
    if (!user) {
      logServerAuthzDenied("dryRunImportUsersAction");
      return { ok: false, message: labels.errorForbidden };
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, message: labels.errorNoFile };
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const parsed = await parseUsersSpreadsheetBuffer(buf, file.name);
    if (!parsed.ok) {
      if (parsed.code === "missing_headers") {
        return {
          ok: false,
          message: labels.errorMissingHeaders.replace(
            "{{missing}}",
            (parsed.missing ?? []).join(", "),
          ),
        };
      }
      return { ok: false, message: labels.errorParseFailed };
    }

    const { valid, invalid } = parseUsersSpreadsheetRawRows(parsed.rawRows);
    const admin = createAdminClient();
    const existing = await loadExistingProfilesForUsersSpreadsheet(
      admin,
      valid.map((r) => r.email),
      valid.map((r) => r.dni_or_passport ?? ""),
    );
    const classified = classifyUsersSpreadsheetRows(valid, existing);

    return {
      ok: true,
      newCount: classified.newRows.length,
      duplicateCount: classified.duplicateRows.length,
      invalidCount: invalid.length,
      payload: {
        newRows: classified.newRows,
        duplicateRows: classified.duplicateRows.map((d) => ({
          existingId: d.existingId,
          row: d.row,
        })),
      },
    };
  } catch (err) {
    logServerException("dryRunImportUsersAction", err, {});
    return { ok: false, message: labels.errorParseFailed };
  }
}

const applySchema = z.object({
  locale: z.string().min(2).max(8),
  updateDuplicates: z.boolean(),
  newRows: z.array(z.record(z.string(), z.unknown())),
  duplicateRows: z.array(
    z.object({
      existingId: z.string().uuid(),
      row: z.record(z.string(), z.unknown()),
    }),
  ),
});

export async function applyImportUsersAction(raw: unknown): Promise<ApplyImportUsersResult> {
  const parsed = applySchema.safeParse(raw);
  const locale = parsed.success ? parsed.data.locale : "en";
  const dict = await getDictionary(locale as Locale);
  const labels = dict.admin.users.spreadsheet;

  if (!parsed.success) {
    return { ok: false, message: labels.errorValidation };
  }

  try {
    const user = await assertAdminUser();
    if (!user) {
      logServerAuthzDenied("applyImportUsersAction");
      return { ok: false, message: labels.errorForbidden };
    }

    const { valid: newValid } = parseUsersSpreadsheetRawRows(parsed.data.newRows);
    const dupParsed = parsed.data.duplicateRows.map((d) => {
      const { valid } = parseUsersSpreadsheetRawRows([d.row]);
      return { existingId: d.existingId, row: valid[0] ?? null };
    });

    let created = 0;
    let failed = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of newValid) {
      const result = await createDashboardUser({
        email: row.email,
        password: "",
        role: row.role,
        first_name: row.first_name,
        last_name: row.last_name,
        dni_or_passport: row.dni_or_passport ?? "",
        phone: row.phone ?? "",
        birth_date: row.birth_date ?? "",
        locale: parsed.data.locale,
        provisioning_route: "admin_ui",
      });
      if (result.ok) created += 1;
      else failed += 1;
    }

    const admin = createAdminClient();
    if (parsed.data.updateDuplicates) {
      for (const d of dupParsed) {
        if (!d.row) {
          failed += 1;
          continue;
        }
        const { error } = await admin
          .from("profiles")
          .update({
            first_name: d.row.first_name,
            last_name: d.row.last_name,
            phone: d.row.phone,
            birth_date: d.row.birth_date,
            ...(d.row.dni_or_passport
              ? { dni_or_passport: d.row.dni_or_passport }
              : {}),
          })
          .eq("id", d.existingId);
        if (error) {
          logSupabaseClientError("applyImportUsersAction:update", error, {
            existingId: d.existingId,
          });
          failed += 1;
        } else {
          updated += 1;
        }
      }
    } else {
      skipped = dupParsed.length;
    }

    await recordSystemAudit({
      action: "users_spreadsheet_import",
      resourceType: "profiles",
      payload: {
        created,
        updated,
        skipped,
        failed,
        updateDuplicates: parsed.data.updateDuplicates,
      },
    });

    revalidatePath(`/${parsed.data.locale}/dashboard/admin/users`);
    return { ok: true, created, updated, skipped, failed };
  } catch (err) {
    logServerException("applyImportUsersAction", err, {});
    return { ok: false, message: labels.errorApplyFailed };
  }
}
