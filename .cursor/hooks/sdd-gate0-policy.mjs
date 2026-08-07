/**
 * SDD Gate 0 — pure allow/deny policy for Cursor hooks.
 * Spec: docs/superpowers/specs/2026-07-11-sdd-gate0-enforcement-design.md
 */

import fsNode from "node:fs";
import path from "node:path";

export const SDD_GATE0_APPROVAL_MARKER = ".cursor/sdd-gate0-approved";

const ALWAYS_ALLOW_PREFIXES = [
  "docs/superpowers/specs/",
  "docs/superpowers/plans/",
];

const ALWAYS_ALLOW_EXACT = new Set([SDD_GATE0_APPROVAL_MARKER]);

/** @typedef {{ existsSync: (p: string) => boolean, readFileSync: (p: string, enc?: string) => string | Buffer }} Gate0Fs */

/**
 * @param {string} targetPath
 * @param {string} workspaceRoot
 */
export function toRepoRelative(targetPath, workspaceRoot) {
  const root = path.resolve(workspaceRoot);
  const abs = path.isAbsolute(targetPath)
    ? path.resolve(targetPath)
    : path.resolve(root, targetPath);
  const rel = path.relative(root, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return null;
  }
  return rel.split(path.sep).join("/");
}

/**
 * @param {{ workspaceRoot: string, env?: NodeJS.ProcessEnv, fs?: Gate0Fs }} opts
 */
export function isGate0Unlocked(opts) {
  const env = opts.env ?? process.env;
  if (env.SKIP_SDD === "1" || env.SKIP_SDD === "true") {
    return { unlocked: true, reason: "SKIP_SDD" };
  }

  const fs = opts.fs ?? fsNode;
  const markerAbs = path.join(opts.workspaceRoot, SDD_GATE0_APPROVAL_MARKER);
  if (!fs.existsSync(markerAbs)) {
    return { unlocked: false, reason: "missing_approval_marker" };
  }

  let parsed;
  try {
    const raw = fs.readFileSync(markerAbs, "utf8");
    parsed = JSON.parse(String(raw));
  } catch {
    return { unlocked: false, reason: "invalid_approval_marker" };
  }

  const specRel =
    typeof parsed?.spec === "string" ? parsed.spec.trim().replace(/\\/g, "/") : "";
  if (!specRel.startsWith("docs/superpowers/specs/") || specRel.includes("..")) {
    return { unlocked: false, reason: "approval_spec_not_under_specs" };
  }

  const specAbs = path.join(opts.workspaceRoot, specRel);
  if (!fs.existsSync(specAbs)) {
    return { unlocked: false, reason: "approval_spec_missing" };
  }

  return { unlocked: true, reason: "approved", spec: specRel };
}

/**
 * @param {string | null} rel
 */
function isAlwaysAllowedRel(rel) {
  if (!rel) return false;
  if (ALWAYS_ALLOW_EXACT.has(rel)) return true;
  if (ALWAYS_ALLOW_PREFIXES.some((p) => rel.startsWith(p))) return true;
  return false;
}

const DENY_MSG =
  "SDD Gate 0: write a mini/full spec under docs/superpowers/specs/, wait for user approval, then write .cursor/sdd-gate0-approved with { \"spec\": \"docs/superpowers/specs/....md\" }. Or set SKIP_SDD=1 only with explicit user consent.";

/**
 * @param {{ targetPath: string, workspaceRoot: string, env?: NodeJS.ProcessEnv, fs?: Gate0Fs }} opts
 */
export function decideGate0FileEdit(opts) {
  const rel = toRepoRelative(opts.targetPath, opts.workspaceRoot);
  if (isAlwaysAllowedRel(rel)) {
    return { permission: "allow", reason: "allowlisted_path" };
  }

  const unlock = isGate0Unlocked(opts);
  if (unlock.unlocked) {
    return { permission: "allow", reason: unlock.reason };
  }

  return {
    permission: "deny",
    reason: unlock.reason,
    user_message: "Blocked: Spec-Driven Development Gate 0 is locked.",
    agent_message: DENY_MSG,
  };
}

const SAFE_SHELL_PREFIX =
  /^(git\s+(status|diff|log|show|branch|rev-parse|remote|fetch|ls-files)|ls\b|cat\b|head\b|tail\b|rg\b|grep\b|find\b|pwd\b|echo\b|node\s+\.cursor\/hooks\/|npx\s+vitest|npm\s+(test|run|exec)\b)/;

const MUTATING_SHELL =
  /(\brm\b|\bmv\b|\bcp\b|\btee\b|\btouch\b|\bmkdir\b|\btruncate\b|\bsed\s+-i|\bperl\s+-i|>>?|dd\s+)/;

/**
 * @param {{ command: string, workspaceRoot: string, env?: NodeJS.ProcessEnv, fs?: Gate0Fs }} opts
 */
export function decideGate0ShellCommand(opts) {
  const unlock = isGate0Unlocked(opts);
  if (unlock.unlocked) {
    return { permission: "allow", reason: unlock.reason };
  }

  const cmd = String(opts.command ?? "").trim();
  if (!cmd) {
    return { permission: "allow", reason: "empty_command" };
  }

  if (SAFE_SHELL_PREFIX.test(cmd)) {
    return { permission: "allow", reason: "safe_shell_prefix" };
  }

  if (MUTATING_SHELL.test(cmd)) {
    // Allow mutations that only touch allowlisted paths (specs/plans/marker/hooks).
    const pathHits = cmd.match(
      /(?:docs\/superpowers\/(?:specs|plans)\/[^\s'"]+|\.cursor\/(?:hooks\/[^\s'"]+|sdd-gate0-approved|hooks\.json))/g,
    );
    const riskyHits = cmd.match(
      /(?:src\/|supabase\/|public\/|package\.json|package-lock\.json)/g,
    );
    if (pathHits && pathHits.length > 0 && !riskyHits) {
      return { permission: "allow", reason: "mutating_allowlisted_only" };
    }
    return {
      permission: "deny",
      reason: "mutating_shell_while_locked",
      user_message: "Blocked: mutating shell while SDD Gate 0 is locked.",
      agent_message: DENY_MSG,
    };
  }

  return { permission: "allow", reason: "non_mutating_heuristic" };
}

/**
 * Extract a file path from Cursor preToolUse tool_input.
 * @param {Record<string, unknown> | null | undefined} toolInput
 */
export function extractToolTargetPath(toolInput) {
  if (!toolInput || typeof toolInput !== "object") return null;
  for (const key of ["path", "file_path", "filePath", "target_notebook"]) {
    const v = toolInput[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}
