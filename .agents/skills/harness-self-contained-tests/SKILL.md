---
name: harness-self-contained-tests
description: Use when writing, editing, or reviewing Vitest/Testing Library tests; when tests share state, depend on run order, or need isolation; when the user mentions self-contained tests or harness engineering.
---

# Self-Contained Test Harness

## Overview

Each test file owns its mocks and fixtures. Shared helpers are optional and **explicitly imported**. Complements repo TDD (`02-testing-tdd.mdc`); rule: `30-harness-self-contained-tests.mdc`.

## Checklist (before marking tests done)

- [ ] File states subject under test at top
- [ ] All `vi.mock` calls visible in this file (or thin re-export helper imported here)
- [ ] `beforeEach` clears mocks / resets data
- [ ] Passes alone: `npx vitest run <path>`
- [ ] Asserts observable behavior, not private structure
- [ ] Mocks only external boundaries

## Pattern (RTL component)

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MyWidget } from "@/components/.../MyWidget";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

const dict = { save: "Save", cancel: "Cancel" };

describe("MyWidget", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls onSave when Save is pressed", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<MyWidget dict={dict} onSave={onSave} />);
    await user.click(screen.getByRole("button", { name: dict.save }));
    expect(onSave).toHaveBeenCalledOnce();
  });
});
```

## Anti-patterns

| Bad | Good |
|-----|------|
| Mutable `sharedDb` imported across files | Factory `makeDb()` per test |
| Relying on another file's `beforeAll` | Local setup |
| Global product mocks in setupFiles | Per-file `vi.mock` |

## Related

- `tdd` skill for red → green → refactor
- Coverage gates remain in `02-testing-tdd.mdc`
