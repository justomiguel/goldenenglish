# Pulsar session uses one auth client

## Context

Centro Listo sign-in called the institute browser client. Session reads and sign-out used the Pulsar server client. Sign-out was missing from the public header and from most staff screens. Phone visitors, who convert on the public pages and on `/cuenta`, had no native shell.

## Decision

Sign-in and sign-out use the Pulsar Supabase project. One session menu appears on the public header, the account frame, and every staff screen. Narrow public pages and `/cuenta` use a separate touch shell with a bottom navigation and a thumb-zone conversation button.

## Options considered

Add a sign-out button only on the fleet header. Rejected. A person on the public site or on a phone still cannot leave the session, and the two clients stay split.

## Consequences

- `createPulsarBrowserClient` reads the Pulsar URL already injected on Pulsar pages.
- `signOutPulsarSessionAction` clears that session.
- Tests cover the header states, the safe next path, and the narrow shell.
- Manual QA (user): sign in, open `/es` on a phone width, sign out, and confirm `/es/admin` asks for sign-in again.
