# ADR — Install icons for every host

Date: 2026-11-10
Status: Accepted

## Context

Chrome installs a site only when the manifest lists a 192 PNG and a 512 PNG whose pixels match those sizes. Matiss stored one 512 PNG and the manifest labeled it `48x48`. `beforeinstallprompt` never fired.

A generated institute that already has an `favicon.ico` bundle is fine. A lone PNG, an SVG, or a remote file without sized siblings is not.

## Decision

`GET /pwa/icon/{180|192|512}` scales the host logo to that exact size and returns `image/png`. The manifest uses 192 and 512 when no ico or Storage bundle exists. The document head uses 180 as the apple icon in that same case. The cache is `public, max-age=86400`. The image is the same for every visitor of that host.

## Options considered

Declare the 512 file as both sizes. Chrome rejects a label that does not match the pixels.

Write extra PNG files only for Matiss. The next exclusive theme would repeat the bug.

## Consequences

Each origin stays its own installed app. The service worker does not change. A missing PNG falls back to a letter mark so the route still returns a PNG. Tests cover the Matiss logo and a rejected size.
