# Centro Listo — Google Analytics 4

**Intent:** Record anonymous visits and link clicks on the Centro Listo marketing site so staff can see which pages and actions people use.

**Done when:**

- The GA4 tag loads only on the Pulsar host, and only when `platform_settings.ga_measurement_id` matches `G-` plus letters or digits.
- Pulsar admin can save or clear that id. The next public request uses the new value. No deploy is required.
- Each marketing page view is one `page_view`. Client navigations count too.
- Each link click on a marketing page is one `cl_click` with the URL and a short label. A successful public contact form is one `cl_contact_submit` with the subject code only.
- Paths under `/admin` send no page views and no clicks.
- No name, email, or phone goes to Google.

**Out of scope:** Cookie banner, user names, institute dashboards, and the existing signed-in `user_events` pipeline.

## Surfaces (Web vs PWA)

Tier A public marketing. Web chrome is `PulsarSiteChrome`. PWA chrome is `PulsarSiteChromePwa`. One tag in the Pulsar locale layout covers both. A document click listener reads every link, so the two trees do not need separate event code.

The settings form is Tier B. It lives on the Pulsar admin fleet screen. That screen has no PWA tree.

## Decision

Use GA4 (`gtag`) with `send_page_view: false` and send `page_view` from the app on each path change. That avoids a double hit on the first load and still counts App Router navigations.
