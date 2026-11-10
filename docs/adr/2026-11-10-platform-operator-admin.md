# Platform operator admin

## Context

A new institute schema has no admin until someone uses the first-run form. The operator needs the same admin on every generated institute, with a known password.

## Decision

After schema provision (shared) or on project-mode save (when a database URL exists), upsert `justomiguelvargas@gmail.com` and set that schema's profile role to `admin`. The password comes from Pulsar `platform_settings.operator_admin_password`. Staff replace it in the CentroListo panel. That save also updates the CentroListo login for that email. The email stays in `src/lib/pulsar/platformOperatorAdmin.ts`. The rule is `.cursor/rules/52-platform-operator-admin.mdc`.

## Options considered

- Leave the first-run form as the only admin path. Rejected. A generated institute would stay without this operator until a person fills the form.
- Store the password in an environment variable. Rejected. A person changes this after deploy. Rule 46 stores that kind of value in the database. An environment variable needs a new deploy.
- Store the password in the repository next to the email. Rejected. A committed secret is copied into git history.

## Consequences

- Each provision resets this account's password to the value currently stored in Pulsar. A manual password change on one institute does not stick.
- The panel must have a password before a new institute can create this admin. An empty column returns `operator_admin_failed`.
- The browser receives only a boolean: a password is saved, or it is missing.
- An institute with its own database takes the new password the next time staff save that institute.
- Tests pass a fake password. They do not connect to a database and they do not contain the real password.
- Failure logs use scope `ensurePlatformOperatorAdmin` and do not include the password.
- Staff see `operator_admin_failed` when a project-mode seed fails.
