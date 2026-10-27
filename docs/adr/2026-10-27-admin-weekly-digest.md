# Admin weekly digest mail

## Context

Staff do not get a Monday picture of who entered the site, who paid, and what is waiting. The product already stores signed-in sessions, payments, messages, attendance, and tasks. A weekly mail must use those facts. Email clients do not run JavaScript charts.

## Decision

Send one mail each Monday to every admin of a tenant. A SQL function returns the closed week. The server draws SVG charts in the tenant colors and rasterizes them to PNG. The same numbers are written in HTML. A row keyed by week start stops a second send.

## Options considered

Chart.js inside the mail was rejected. Gmail and Outlook do not run it. HTML bars alone were rejected because staff asked for chart images. `chart.js` with `node-canvas` was rejected because the native canvas module is a poor fit for Vercel. Anonymous public traffic was rejected because `user_events` stores signed-in sessions only.

## Consequences

Migration adds the digest-send table and the aggregate function. No existing column is dropped. Tests cover the aggregate shape, the mail HTML, a quiet week, a cron retry, and a cron request that puts the secret in the query string. The template can be turned off with the existing email gate.
