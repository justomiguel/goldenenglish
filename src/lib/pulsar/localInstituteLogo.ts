import { existsSync } from "node:fs";
import { join } from "node:path";
import { centrolistoClientLogoCandidates } from "@/lib/pulsar/centrolistoClientPreviews";

export function publicLogoFileExists(publicPath: string): boolean {
  if (!publicPath.startsWith("/") || publicPath.includes("..")) return false;
  return existsSync(join(process.cwd(), "public", publicPath.slice(1)));
}

export function localInstituteLogo(slug: string): string | null {
  return centrolistoClientLogoCandidates(slug).find(publicLogoFileExists) ?? null;
}
