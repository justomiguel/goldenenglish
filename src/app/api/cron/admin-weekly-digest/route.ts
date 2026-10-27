import { NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/auth/verifyCronRequest";
import { createAdminClient } from "@/lib/supabase/admin";
import { runCronAcrossTenants } from "@/lib/tenant/runCronAcrossTenants";
import { loadEmailSendGate } from "@/lib/email/loadEmailSendGate";
import { isProductEmailEnabled } from "@/lib/email/emailSendsEnabled";
import { getProperty } from "@/lib/theme/themeParser";
import { loadEffectiveProperties } from "@/lib/theme/loadEffectiveProperties";
import { SYSTEM_PROPERTIES_DEFAULTS } from "@/lib/theme/systemPropertiesDefaults";
import { parseInstituteTimeZone } from "@/lib/datetime/parseInstituteTimeZone";
import { getBrandForRequest } from "@/lib/brand/server";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { ResendEmailProvider } from "@/lib/email/resendEmailProvider";
import { logServerException } from "@/lib/logging/serverActionLog";
import { runAdminWeeklyDigest } from "@/lib/admin-digest/runAdminWeeklyDigest";
import { rasterizeDigestSvg } from "@/lib/admin-digest/rasterizeDigestCharts";
import {
  claimAdminWeeklyDigestWeek,
  listAdminWeeklyDigestRecipients,
  loadAdminWeeklyDigestPayload,
  loadPriorAdminWeeklyDigest,
  markAdminWeeklyDigestSent,
} from "@/lib/admin-digest/adminWeeklyDigestStore";

export const runtime = "nodejs";

const TEMPLATE_KEY = "admin.weekly_digest";

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return runCronAcrossTenants(async () => {
    try {
      const admin = await createAdminClient();
      const result = await runAdminWeeklyDigest(await digestDeps(admin));
      return NextResponse.json({ ok: result.ok, sent: result.sent }, { status: result.ok ? 200 : 500 });
    } catch (err) {
      logServerException("admin.weekly_digest", err);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  });
}

async function digestDeps(admin: NonNullable<Awaited<ReturnType<typeof createAdminClient>>>) {
  const gate = await loadEmailSendGate();
  const timeZone = await readDigestTimeZone(admin);
  const colors = await readDigestColors();
  const brand = await getBrandForRequest();
  const provider = new ResendEmailProvider();
  return {
    enabled: isProductEmailEnabled({
      map: gate.map,
      classRemindersEnabled: gate.classRemindersEnabled,
      templateKey: TEMPLATE_KEY,
    }),
    now: new Date(),
    timeZone,
    origin: getPublicSiteUrl()?.origin ?? "",
    instituteName: brand.name,
    logoUrl: brand.logoPath || null,
    legalLine: [brand.legalName, brand.contactEmail, brand.contactAddress].filter(Boolean).join(" · "),
    colors,
    loadDigest: (args: Parameters<typeof loadAdminWeeklyDigestPayload>[1]) =>
      loadAdminWeeklyDigestPayload(admin, args),
    loadPriorPayload: (weekStartDate: string) => loadPriorAdminWeeklyDigest(admin, weekStartDate),
    claimWeek: (
      weekStartDate: string,
      digest: Parameters<typeof claimAdminWeeklyDigestWeek>[2],
    ) => claimAdminWeeklyDigestWeek(admin, weekStartDate, digest),
    listAdmins: () => listAdminWeeklyDigestRecipients(admin),
    sendMail: async (input: {
      to: string;
      subject: string;
      html: string;
      attachments: Parameters<ResendEmailProvider["sendEmail"]>[0]["attachments"];
    }) => {
      const sent = await provider.sendEmail(input);
      return sent.ok;
    },
    markSent: (weekStartDate: string, recipientIds: string[]) =>
      markAdminWeeklyDigestSent(admin, weekStartDate, recipientIds),
    rasterize: rasterizeDigestSvg,
  };
}

async function readDigestTimeZone(admin: NonNullable<Awaited<ReturnType<typeof createAdminClient>>>) {
  const { data } = await admin.from("site_settings").select("value").eq("key", "analytics_config").maybeSingle();
  return parseInstituteTimeZone(data?.value);
}

async function readDigestColors() {
  const { properties } = await loadEffectiveProperties();
  return {
    primary: getProperty(properties, "color.primary", SYSTEM_PROPERTIES_DEFAULTS["color.primary"]),
    primaryLight: getProperty(properties, "color.primary.light", SYSTEM_PROPERTIES_DEFAULTS["color.primary.light"]),
    primaryDark: getProperty(properties, "color.primary.dark", SYSTEM_PROPERTIES_DEFAULTS["color.primary.dark"]),
    foreground: getProperty(
      properties,
      "color.primary.foreground",
      SYSTEM_PROPERTIES_DEFAULTS["color.primary.foreground"],
    ),
    background: getProperty(properties, "color.background", SYSTEM_PROPERTIES_DEFAULTS["color.background"]),
  };
}
