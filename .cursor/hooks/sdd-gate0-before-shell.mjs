#!/usr/bin/env node
/**
 * Cursor beforeShellExecution — heuristic block of mutating shells while Gate 0 locked.
 */
import { decideGate0ShellCommand } from "./sdd-gate0-policy.mjs";

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

const command =
  typeof payload.command === "string"
    ? payload.command
    : typeof payload.tool_input?.command === "string"
      ? payload.tool_input.command
      : "";

const decision = decideGate0ShellCommand({
  command,
  workspaceRoot: workspaceRoot(payload),
});

const out = { permission: decision.permission };
if (decision.permission === "deny") {
  out.user_message = decision.user_message;
  out.agent_message = decision.agent_message;
}
process.stdout.write(JSON.stringify(out));
process.exit(0);
