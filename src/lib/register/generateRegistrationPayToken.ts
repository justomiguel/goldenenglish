import { randomBytes } from "node:crypto";

/** Opaque 32-byte hex token for `/matricula/[token]`. */
export function generateRegistrationPayToken(): string {
  return randomBytes(32).toString("hex");
}
