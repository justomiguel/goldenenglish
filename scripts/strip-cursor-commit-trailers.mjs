#!/usr/bin/env node
/**
 * Removes Cursor IDE commit trailers (e.g. Co-authored-by: Cursor …) from the
 * message file. Invoked from `.husky/prepare-commit-msg`.
 */
import fs from "node:fs";

const file = process.argv[2];
if (!file || !fs.existsSync(file)) process.exit(0);

const raw = fs.readFileSync(file, "utf8");
const lines = raw.split(/\r?\n/);

/** @param {string} line */
function isCursorTrailer(line) {
  const t = line.trim();
  if (!t) return false;
  if (/^co-authored-by:\s*.+cursor/i.test(t)) return true;
  if (/^co-authored-by:\s*.+@cursor\.(com|sh)\b/i.test(t)) return true;
  if (/^signed-off-by:\s*cursor\b/i.test(t)) return true;
  if (/^🤖/.test(t) && /cursor/i.test(t)) return true;
  if (/^generated with cursor/i.test(t)) return true;
  return false;
}

const kept = lines.filter((line) => !isCursorTrailer(line));
while (kept.length > 0 && kept[kept.length - 1] === "") kept.pop();
const next = kept.length ? `${kept.join("\n")}\n` : "";

if (next !== raw) fs.writeFileSync(file, next, "utf8");
