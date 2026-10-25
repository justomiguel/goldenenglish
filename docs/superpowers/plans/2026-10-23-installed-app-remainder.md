# Installed app remainder

Spec: `docs/superpowers/specs/2026-10-23-installed-app-remainder-design.md`

1. `useInstalledDisplay` in the surface core. Frame uses it for the thin bar and pull-to-refresh.
2. Standalone CSS keeps `.public-pwa-tab` visible above `md`.
3. Auth headers get `public-marketing-chrome`. Pages pass `brandForPublicChrome`.
4. Remove the Nagô blog sheet. Offline safe area. Manifest `orientation: any` plus a student shortcut.
