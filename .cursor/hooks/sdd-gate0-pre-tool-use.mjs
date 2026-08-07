#!/usr/bin/env node
/**
 * Cursor preToolUse — block Write/StrReplace/Delete when SDD Gate 0 is locked.
 */
import {
  decideGate0FileEdit,
  extractToolTargetPath,
} from "./sdd-gate0-policy.mjs";

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function workspaceRoot(payload) {
  const roots = payload.workspace_roots;
  if (Array.isArray(roots) && typeof roots[0] === "string" && roots[0]) {
    return roots[0];
  }
  return process.cwd();
}

const raw = await readStdin();
let payload = {};
try {
  payload = raw.trim() ? JSON.parse(raw) : {};
} catch {
  payload = {};
}

const toolInput =
  typeof payload.tool_input === "string"
    ? (() => {
        try {
          return JSON.parse(payload.tool_input);
        } catch {
          return {};
        }
      })()
    : payload.tool_input ?? {};

const targetPath = extractToolTargetPath(toolInput);
if (!targetPath) {
  // No path — do not block (e.g. unexpected tool shape).
  process.stdout.write(JSON.stringify({ permission: "allow" }));
  process.exit(0);
}

const decision = decideGate0FileEdit({
  targetPath,
  workspaceRoot: workspaceRoot(payload),
});

const out = { permission: decision.permission };
if (decision.permission === "deny") {
  out.user_message = decision.user_message;
  out.agent_message = decision.agent_message;
}
process.stdout.write(JSON.stringify(out));
process.exit(0);
