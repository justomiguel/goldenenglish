import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronRequest } from "@/lib/auth/verifyCronRequest";
import { runTrialClassFollowup } from "@/lib/register/runTrialClassFollowup";
import { logServerException } from "@/lib/logging/serverActionLog";
import { runCronAcrossTenants } from "@/lib/tenant/runCronAcrossTenants";

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return runCronAcrossTenants(async () => {
  let admin;
  try {
    admin = await createAdminClient();
  } catch (err) {
    logServerException("api/cron/trial-class-followup:createAdminClient", err);
    return NextResponse.json({ ok: false, message: "no_admin_client" }, { status: 500 });
  }

  const result = await runTrialClassFollowup(admin);
  return NextResponse.json({ ok: true, ...result });
  });
}
