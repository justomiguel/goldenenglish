#!/usr/bin/env node
/**
 * Smoke: locked deny → unlocked allow for an implementation path.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  decideGate0FileEdit,
  SDD_GATE0_APPROVAL_MARKER,
} from "./sdd-gate0-policy.mjs";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sdd-gate0-"));
const specRel = "docs/superpowers/specs/smoke-design.md";
fs.mkdirSync(path.join(tmp, "docs/superpowers/specs"), { recursive: true });
fs.writeFileSync(path.join(tmp, specRel), "# smoke\n");

const locked = decideGate0FileEdit({
  targetPath: path.join(tmp, "src/x.ts"),
  workspaceRoot: tmp,
  env: {},
});
if (locked.permission !== "deny") {
  console.error("FAIL: expected deny while locked, got", locked);
  process.exit(1);
}

fs.mkdirSync(path.join(tmp, ".cursor"), { recursive: true });
fs.writeFileSync(
  path.join(tmp, SDD_GATE0_APPROVAL_MARKER),
  JSON.stringify({ spec: specRel, approvedAt: new Date().toISOString() }),
);

const unlocked = decideGate0FileEdit({
  targetPath: path.join(tmp, "src/x.ts"),
  workspaceRoot: tmp,
  env: {},
});
if (unlocked.permission !== "allow") {
  console.error("FAIL: expected allow when unlocked, got", unlocked);
  process.exit(1);
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log("sdd-gate0-self-check: ok (deny then allow)");
