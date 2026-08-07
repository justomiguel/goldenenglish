# Visual brainstorm companion — agent launch rule

**Intent:** Persist the Cursor agent procedure that successfully runs the Superpowers visual brainstorm companion on this machine (persistent Node process, large HTTP headers, project-dir session, no owner-PID watchdog), so agents do not use the default `start-server.sh` path that dies or returns HTTP 431.

**Done when:**
- Rule file exists under `.cursor/rules/` in English documenting the launch recipe and recovery steps.
- `.superpowers/` is gitignored if not already.

**Out of scope:** Changing the upstream Superpowers `start-server.sh` / `server.cjs` packages.
