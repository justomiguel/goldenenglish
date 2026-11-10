# PWA install icons for every host

**Intent:** Chrome can install Matiss and every later institute. The manifest for each host declares PNG icons of 192 and 512 whose pixels match those sizes. iOS gets a 180 PNG for the home screen.

**Done when:**

- `https://matiss.centrolisto.cl/manifest.webmanifest` lists a `192x192` PNG and a `512x512` PNG.
- Those URLs return a PNG of that exact pixel size.
- A host whose favicon and logo are the same PNG gets the same pair.
- A host that already has an `android-chrome-192x192.png` and `android-chrome-512x512.png` sibling (favicon.ico bundle or Storage bundle) keeps those files.
- The document head includes an apple touch icon of 180×180 when no sibling apple icon exists.
- Tests lock the Matiss-shaped brand and the existing ico-bundle brand.

**Out of scope:** A new install banner, a change to the service worker, push, or offline pages. Maskable crop. A new native binary per institute.

## Cause

`buildWebManifestIcons` labels a non-bundle favicon as `48x48`. When that path equals the logo, it skips the 512 entry. Matiss stores both paths as `/images/matiss/logo/logo.png` (512×512). Chrome does not fire `beforeinstallprompt`. The account row "Instalar" stays hidden.

`writeInstitutePublicImagePack` already writes 16, 32, 180, 192, and 512 for a generic institute and points the favicon at `favicon.ico`. That path is fine. Exclusive themes and a single uploaded PNG are not.

## Decision

Serve exact install PNGs from one route per host: `/pwa/icon/192`, `/pwa/icon/512`, and `/pwa/icon/180`. The route reads the active brand mark, scales it with `scalePngNearest`, and returns `image/png`. The manifest points at 192 and 512 with `purpose: "any"`. The head uses 180 as the apple icon when no sibling apple file exists.

Keep the current bundle icons when `faviconBundlePrefix` is set or the favicon is an `.ico` inside a folder that has the android-chrome siblings. Do not invent those sibling paths for a lone PNG.

Do not add a maskable purpose on the scaled logo. Android crops maskable icons. Nagô already avoids that crop.

`id`, `start_url`, `scope`, and `display: "standalone"` stay as they are. Each origin remains its own installed app.

## Surfaces (Web vs PWA)

The manifest and the apple icon are shared. `web-desktop`, `web-mobile`, and `pwa-mobile` all install from the same host manifest. No screen tree changes. `PwaInstallPrompt`, `PortalAccountList`, and `usePwaInstallPrompt` stay. The install control appears after Chrome fires `beforeinstallprompt`. iOS Safari still shows the share steps. It has no install event.

## Options considered

Bake 192 and 512 files next to the Matiss logo only. That fixes one theme and leaves the next exclusive theme broken. Rejected.

Declare the 512 file as both 192 and 512. Chrome rejects a size that does not match the pixels. Rejected.

## Consequences

- New public route. Cache is `public, max-age=86400`. The image is the same for every visitor of that host.
- A missing or non-PNG mark falls back to the existing letter mark at the requested size, so the route still returns a PNG.
- SVG logos are rasterized only when the bytes are a PNG. A pure SVG mark uses the letter fallback until a PNG exists. Site setup already prefers a PNG pack.
- Staff-visible: Matiss and later institutes can be installed. Changelog row on the same commit.
- ADR: `docs/adr/2026-11-10-pwa-install-icons.md`.

## Tests

- `buildWebManifestIcons`: PNG favicon equal to PNG logo includes 192 and 512 route URLs, and does not use `48x48` as the only icon.
- Existing ico-bundle and Storage-bundle cases still point at `android-chrome-192x192.png` and `android-chrome-512x512.png`.
- Icon route: a 512 PNG source returns 192 and 512 responses whose decoded size matches the path.
- `manifest` test: a Matiss-shaped brand lists both sizes.
