import { randomInt } from "node:crypto";

const A_TO_Z = "abcdefghijklmnopqrstuvwxyz";

/** Cryptographically random string of lowercase ASCII letters (a–z). Server-only. */
export function randomLowercaseAlphaString(length: number): string {
  const n = Math.max(1, Math.min(32, Math.floor(length)));
  let out = "";
  for (let i = 0; i < n; i++) {
    out += A_TO_Z[randomInt(0, 26)];
  }
  return out;
}
