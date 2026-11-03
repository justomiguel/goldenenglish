# Free site contact mail

## Context

A free generic site needs a public contact form. The message must reach the CentroListo account that created the site. A free site must stop after 50 successful sends. The site also needs the owner's phone, WhatsApp, Instagram, Facebook, and address on the page.

## Decision

Save the share fields on the institute theme with the existing brand keys. Send the form to the current `platform_owners` email for that site. Count sends on `platform_tenants` with `free_contact_mail_sent` and `free_contact_mail_quota` (default 50), one allowance per free site.

## Options considered

- Share one allowance of 50 across every site of the account. Rejected. Each site has its own public page and its own counter.
- Lower `pulsar_mail_quota` to 50. Rejected. That counter also covers other institute mail.

## Consequences

- Additive Pulsar migration only. No institute table.
- A failed send releases the count.
- The preview route does not send mail.
- Tests cover normalization, the cap, and the preview refusal.
