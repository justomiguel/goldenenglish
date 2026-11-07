# Discriminated user-facing errors

**Intent:** Add an always-on Cursor rule. A failure a person sees must name the cause, a stable code they can quote, and the next step. The same code is logged for support. A generic "try again" sentence is not enough.

**Done when:**

- `.cursor/rules/50-discriminated-user-errors.mdc` exists, with `alwaysApply: true`, in English.
- `AGENTS.md` lists the rule.
- `09-i18n-copy.mdc` and `25-server-error-logging.mdc` point at it.

**Out of scope:** Rewriting every retry sentence that is already the only cause for one action. This change uncovers paths that drop a stable code.

**Surfaces (Web vs PWA):** No screen change in this change. The rule applies to both trees. Web and PWA must read the same codes and the same dictionary sentences.

**Approval:** The request in this chat asked to create the rule. That request is the approval.
