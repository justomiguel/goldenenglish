import "server-only";
import { headers } from "next/headers";

type HeaderGet = { get(name: string): string | null };

/** Request headers for one `[ge:server]` line. Null outside a request. */
export async function readRequestLogHeaders(): Promise<HeaderGet | null> {
  try {
    const value = await headers();
    if (!value || typeof value.get !== "function") return null;
    return value;
  } catch {
    return null;
  }
}
