# Stable matrícula pay link

## Intent

A second "send matrícula mail" must keep the same public pay link. The page must accept the slug that the mail already uses.

## Done when

- The fee flow writes a new `pay_token` only when the lead has none.
- The mail and the later stamp use that same token.
- A lead with no section uses the undecided-section label in the canonical path, the same label the mail uses.
- A test locks the kept token.

## Out of scope

- Batch mail.
- Restoring a token that a previous send already replaced.
