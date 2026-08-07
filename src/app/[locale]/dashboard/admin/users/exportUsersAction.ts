"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/types/i18n";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { buildUsersSpreadsheetXlsx } from "@/lib/users/buildUsersSpreadsheetXlsx";
import {
  resolveUsersExportScope,
  type UsersExportFallback,
  type UsersExportMode,
} from "@/lib/users/resolveUsersExportScope";
import { loadProfilesForUsersExport } from "@/lib/users/loadProfilesForUsersExport";
import {
  logServerAuthzDenied,
  logServerException,
} from "@/lib/logging/serverActionLog";

const exportSchema = z.object({
  locale: z.string().min(2).max(8),
  mode: z.enum(["template", "data"]),
  selectedIds: z.array(z.string().uuid()).max(2000),
  fallback: z.enum(["filter", "all"]),
  q: z.string().max(200).optional(),
  role: z.string().max(32).optional(),
});

export type ExportUsersActionResult =
  | {
      ok: true;
      artifact: { base64: string; filename: string; mimeType: string };
    }
  | { ok: false; message: string };

export async function exportUsersAction(input: {
  locale: string;
  mode: UsersExportMode;
  selectedIds: string[];
  fallback: UsersExportFallback;
  q?: string;
  role?: string;
}): Promise<ExportUsersActionResult> {
  const parsed = exportSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "validation" };
  }

  const dict = await getDictionary(parsed.data.locale as Locale);
  const labels = dict.admin.users.spreadsheet;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !(await resolveIsAdminSession(supabase, user.id))) {
      logServerAuthzDenied("exportUsersAction");
      return { ok: false, message: labels.errorForbidden };
    }

    const scope = resolveUsersExportScope({
      mode: parsed.data.mode,
      selectedIds: parsed.data.selectedIds,
      fallback: parsed.data.fallback,
    });

    if (scope.kind === "template") {
      const artifact = await buildUsersSpreadsheetXlsx({
        mode: "template",
        rows: [],
      });
      await recordSystemAudit({
        action: "users_spreadsheet_export",
        resourceType: "profiles",
        payload: { mode: "template", rowCount: 0 },
      });
      return {
        ok: true,
        artifact: {
          base64: artifact.base64,
          filename: artifact.filename,
          mimeType: artifact.mimeType,
        },
      };
    }

    const admin = createAdminClient();
    const loaded = await loadProfilesForUsersExport(admin, scope, {
      q: parsed.data.q,
      role: parsed.data.role,
    });
    if (!loaded.ok) {
      if (loaded.code === "too_many_rows") {
        return { ok: false, message: labels.errorTooManyRows };
      }
      return { ok: false, message: labels.errorExportFailed };
    }

    const artifact = await buildUsersSpreadsheetXlsx({
      mode: "data",
      rows: loaded.rows,
    });
    await recordSystemAudit({
      action: "users_spreadsheet_export",
      resourceType: "profiles",
      payload: {
        mode: "data",
        scope: scope.kind,
        rowCount: loaded.rows.length,
      },
    });
    return {
      ok: true,
      artifact: {
        base64: artifact.base64,
        filename: artifact.filename,
        mimeType: artifact.mimeType,
      },
    };
  } catch (err) {
    logServerException("exportUsersAction", err, {});
    return { ok: false, message: labels.errorExportFailed };
  }
}
