# Blog notes: emphasis and whole photos

**Intent:** The five Golden notes use bold, underline, and italics. Photos stay whole and centered on the article page and on the card.

**Done when:**

- A hero photo and a card photo use `object-contain` and stay centered. They do not use `object-cover`.
- A body photo is a centered block. Its paragraph has no indent and no justify.
- `strong` stays semibold and `u` stays underlined in the article body.
- The fifteen published translations (five notes, es/en/pt) store `strong`, `u`, and `em` in `body_html`.
- A test locks the hero, the card, and the body photo classes.

**Out of scope:**

- New notes.
- A deploy. The live host shows the photo frame only after deploy. The stored emphasis shows on the next request.
- FAQ JSON-LD.

## Surfaces (Web vs PWA)

Tier A public article. Desktop and PWA both render `BlogArticleDetailHero` and `BlogArticleBodyHtml`. The card is shared. One class change covers both trees. No separate layout.

## Cause

The hero used `object-cover` inside a wide box, so a square or tall photo lost the edges. A body image sat in a paragraph with `indent-8` and `text-justify`, so the photo shifted and could clip. The sanitizer allows `strong`, `u`, and `em`, and drops `style` and `class` on `img`. Centering has to live in the component class.
