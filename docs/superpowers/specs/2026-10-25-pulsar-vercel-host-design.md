# Pulsar host on pulsarlab.vercel.app

## Intent

Treat `pulsarlab.vercel.app` as a Pulsar platform host, the same way as `pulsarlab.cl` and `www.pulsarlab.cl`.

## Done when

- `DEFAULT_PULSAR_HOSTS` includes `pulsarlab.vercel.app`.
- A request to that host is Pulsar mode. It does not return 404. It does not resolve an institute tenant.
- A tenant cannot register that host.
- On that host, the public origin used for metadata and the browser bag is `https://pulsarlab.vercel.app`, not `https://pulsarlab.cl`.
- `pulsarlab.cl` and `www.pulsarlab.cl` stay Pulsar hosts.
- Vitest covers the new host.

## Out of scope

- Other `*.vercel.app` preview URLs.
- DNS, Vercel domain setup, or removing `TENANTS_CONFIG_JSON`.
- Changing `PULSAR_HOSTS` when that env var is set. A set value still replaces the default list.
