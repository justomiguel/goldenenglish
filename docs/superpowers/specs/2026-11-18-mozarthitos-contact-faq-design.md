# Mozarthitos contact FAQ

## Intent

Publish the 16 approved Mozarthitos questions on the contact surfaces and on `/{locale}/preguntas`. Answers stay closed until the person opens the question.

## Done when

- `publicAnswers.kinds.mozarthitos.items` in `en.json`, `es.json`, and `pt.json` has the 16 questions from the approved file, in that file order.
- Spanish answers match the approved file. FAQ14 keeps one closing. The repeated tail that starts at `🎶s que` stays out.
- The admission link is `https://wa.me/message/AIF6J7HA3KIDE1` on the landing contact control and inside the WhatsApp answer.
- Each question is a closed `<details>` control. The answer is in the HTML and hidden until click.
- The same list renders on the landing `#contacto` block, on the Mozarthitos contact screen, and on `/preguntas`.
- Other institutes keep the open article on `/preguntas`.
- `FAQPage` JSON-LD still comes from the same visible strings on `/preguntas`.

## Out of scope

- A page per question.
- Program tuition amounts. The approved price answer does not give a number.
- A staff editor for the $20.000 trial fee.
- Changelog and commit. Those wait for an explicit commit.

## Surfaces (Web vs PWA)

Tier A public marketing. Mozarthitos has no second PWA tree for `/preguntas` or for the landing contact block. `PublicExperienceChrome` already switches the public frame.

- **Web:** accordion on one white score. The violin character sits once beside the list, with the pink and blue blobs already used on the landing. The baby photo is a small round cameo on that figure. Questions are numbered lines. A row takes a light wash only while it is open. The contact form and the WhatsApp control stay on the page.
- **PWA / narrow:** the same accordion. Each question row is at least 44px tall. No second component tree.

## Decisions

- One shared accordion in `src/variants/owned/mozarthitos/`. Copy stays in the dictionaries.
- Landing contact puts the accordion above the form so `#contacto` opens on the questions.
- The contact screen puts the accordion above the form.
- `/preguntas` uses the accordion instead of `PublicAnswerArticle` for this tenant only.
