import { NextResponse } from "next/server";
import { readInstituteSchemaProvisionSnapshot } from "@/lib/pulsar/instituteSchemaProvisionProgress";
import { getPulsarStaffSession } from "@/lib/pulsar/pulsarStaffAuth";

const SCHEMA_NAME = /^tenant_[a-z0-9_]{1,50}$/;
const PRIVATE_CACHE = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const session = await getPulsarStaffSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: PRIVATE_CACHE });
  }
  const schema = new URL(request.url).searchParams.get("schema") ?? "";
  if (!SCHEMA_NAME.test(schema)) {
    return NextResponse.json({ error: "invalid_schema" }, { status: 400, headers: PRIVATE_CACHE });
  }
  const snapshot = await readInstituteSchemaProvisionSnapshot(schema);
  return NextResponse.json(snapshot, { headers: PRIVATE_CACHE });
}
