import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { LANDING_MEDIA_BUCKET } from "@/lib/cms/landingMediaBucket";
import { logServerActionException } from "@/lib/logging/serverActionLog";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";

const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,62})$/;
const FILE = /^[a-z0-9][a-z0-9.-]{0,80}$/;

function contentType(file: string): string {
  if (file.endsWith(".svg")) return "image/svg+xml";
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
  if (file.endsWith(".webp")) return "image/webp";
  if (file.endsWith(".ico")) return "image/x-icon";
  return "image/png";
}

function imageResponse(bytes: Uint8Array, file: string) {
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": contentType(file),
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string; file: string }> },
) {
  const { slug, file } = await context.params;
  if (!SLUG.test(slug) || !FILE.test(file)) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const bytes = await readFile(path.join(process.cwd(), "public", "images", slug, file));
    return imageResponse(bytes, file);
  } catch {
    // The deployment bundle may not contain a runtime upload. Try storage next.
  }

  const tenant = await resolveRequestTenant();
  if (!tenant || tenant.slug !== slug) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const admin = await createAdminClient();
    const { data, error } = await admin.storage
      .from(LANDING_MEDIA_BUCKET)
      .download(`institute-public/${file}`);
    if (error || !data) return new NextResponse(null, { status: 404 });
    return imageResponse(new Uint8Array(await data.arrayBuffer()), file);
  } catch (err) {
    logServerActionException("institutePublicImage:get", err, { slug });
    return new NextResponse(null, { status: 404 });
  }
}
