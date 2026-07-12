// REGRESSION CHECK: Gate 0 must deny implementation edits when locked; allowing
// specs/plans/marker always; unlock only via valid approval marker + existing
// spec (or SKIP_SDD=1). Changing path allowlists can reopen the skip-to-code hole.

import { describe, expect, it } from "vitest";
import {
  decideGate0FileEdit,
  decideGate0ShellCommand,
  SDD_GATE0_APPROVAL_MARKER,
} from "../../../.cursor/hooks/sdd-gate0-policy.mjs";

const ROOT = "/repo";

function memFs(files: Record<string, string>) {
  return {
    existsSync(p: string) {
      return Object.prototype.hasOwnProperty.call(files, p);
    },
    readFileSync(p: string, _enc?: string) {
      if (!Object.prototype.hasOwnProperty.call(files, p)) {
        throw new Error(`ENOENT: ${p}`);
      }
      return files[p];
    },
  };
}

describe("decideGate0FileEdit", () => {
  it("allows edits under docs/superpowers/specs without approval", () => {
    const result = decideGate0FileEdit({
      targetPath: `${ROOT}/docs/superpowers/specs/2026-07-11-x-design.md`,
      workspaceRoot: ROOT,
      env: {},
      fs: memFs({}),
    });
    expect(result.permission).toBe("allow");
  });

  it("allows writing the approval marker without prior unlock", () => {
    const result = decideGate0FileEdit({
      targetPath: `${ROOT}/${SDD_GATE0_APPROVAL_MARKER}`,
      workspaceRoot: ROOT,
      env: {},
      fs: memFs({}),
    });
    expect(result.permission).toBe("allow");
  });

  it("denies src edits when locked", () => {
    const result = decideGate0FileEdit({
      targetPath: `${ROOT}/src/components/Foo.tsx`,
      workspaceRoot: ROOT,
      env: {},
      fs: memFs({}),
    });
    expect(result.permission).toBe("deny");
    expect(result.agent_message).toMatch(/Gate 0/i);
  });

  it("allows src edits when marker points at an existing spec", () => {
    const specRel = "docs/superpowers/specs/2026-07-11-feature-design.md";
    const fs = memFs({
      [`${ROOT}/${SDD_GATE0_APPROVAL_MARKER}`]: JSON.stringify({
        spec: specRel,
        approvedAt: "2026-07-11T15:00:00.000Z",
      }),
      [`${ROOT}/${specRel}`]: "# Feature\n",
    });
    const result = decideGate0FileEdit({
      targetPath: `${ROOT}/src/lib/x.ts`,
      workspaceRoot: ROOT,
      env: {},
      fs,
    });
    expect(result.permission).toBe("allow");
  });

  it("denies when marker references a missing spec", () => {
    const fs = memFs({
      [`${ROOT}/${SDD_GATE0_APPROVAL_MARKER}`]: JSON.stringify({
        spec: "docs/superpowers/specs/missing-design.md",
      }),
    });
    const result = decideGate0FileEdit({
      targetPath: `${ROOT}/package.json`,
      workspaceRoot: ROOT,
      env: {},
      fs,
    });
    expect(result.permission).toBe("deny");
  });

  it("allows when SKIP_SDD=1", () => {
    const result = decideGate0FileEdit({
      targetPath: `${ROOT}/src/x.ts`,
      workspaceRoot: ROOT,
      env: { SKIP_SDD: "1" },
      fs: memFs({}),
    });
    expect(result.permission).toBe("allow");
  });

  it("allows plans path without approval", () => {
    const result = decideGate0FileEdit({
      targetPath: `${ROOT}/docs/superpowers/plans/2026-07-11-x.md`,
      workspaceRoot: ROOT,
      env: {},
      fs: memFs({}),
    });
    expect(result.permission).toBe("allow");
  });
});

describe("decideGate0ShellCommand", () => {
  it("allows read-only git when locked", () => {
    const result = decideGate0ShellCommand({
      command: "git status",
      workspaceRoot: ROOT,
      env: {},
      fs: memFs({}),
    });
    expect(result.permission).toBe("allow");
  });

  it("denies rm of src when locked", () => {
    const result = decideGate0ShellCommand({
      command: "rm -rf src/components/Foo.tsx",
      workspaceRoot: ROOT,
      env: {},
      fs: memFs({}),
    });
    expect(result.permission).toBe("deny");
  });

  it("allows mutating shell when unlocked", () => {
    const specRel = "docs/superpowers/specs/2026-07-11-feature-design.md";
    const fs = memFs({
      [`${ROOT}/${SDD_GATE0_APPROVAL_MARKER}`]: JSON.stringify({
        spec: specRel,
      }),
      [`${ROOT}/${specRel}`]: "# ok\n",
    });
    const result = decideGate0ShellCommand({
      command: "rm -rf src/tmp",
      workspaceRoot: ROOT,
      env: {},
      fs,
    });
    expect(result.permission).toBe("allow");
  });
});
