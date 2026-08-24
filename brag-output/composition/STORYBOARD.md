---
format: 1920x1080
duration: 19s
message: "Out-of-stock bread doesn't have to vanish without explanation — the order form just got honest about it."
arc: Hook → Product moment → Key feature → Reassurance → Brand outro
audience: the bakery owner, for sharing with their customers
mode: autonomous
---

## Frame 1 — The question

- status: built
- src: compositions/01-hook.html
- duration: 3s
- transition_in: cut
- scene: Cream background, Fraunces line settles in — "Wait... where did the rye bread go?"
- blueprint: compose (waterfall-entry rule) — Hook role, no product UI yet, just the relatable confusion line.

Cold open on the customer's own confusion — no logo, no chrome. Sets up exactly the pain the baker described: a favorite product missing with no explanation.

## Frame 2 — The real order form

- status: built
- src: compositions/02-order-form.html
- duration: 4s
- transition_in: crossfade
- scene: "Ordered products" section, one product row, "+ Add product" button; cursor taps "Don't see what you're looking for?"
- blueprint: cursor-ui-demo (Product_Intro role) — first look at the real UI, cursor-driven click.

Recreates the actual order-form section verbatim (copy from `OrderItems.tsx`/`OutOfStockArticles.tsx`). The cursor arrives and taps the toggle link, motivating the next scene.

## Frame 3 — The honest list

- status: built
- src: compositions/03-pill-list.html
- duration: 5s
- transition_in: cut
- scene: Toggle expands; "These products aren't available right now:" + info icon; 4 real product-name pills pop in one by one into a wrapped pill-cloud.
- blueprint: grid-card-assemble (Key_Feature role) — staggered self-assembling cards/pills.

The feature's core moment. Real product names from the seed catalog, verbatim copy from the component.

## Frame 4 — The reassurance

- status: built
- src: compositions/04-info-note.html
- duration: 4s
- transition_in: crossfade
- scene: Cursor taps the "i" icon; note unfurls — "These may become available again. Want to know when, or looking for something similar?" with underlined "Email us" in terracotta.
- blueprint: compose (cursor-click-ripple + anchored-layout-expand rules) — Benefits role, the emotional payoff.

Pays off the whole video: this isn't just informative, it's an invitation to reach out.

## Frame 5 — Outro

- status: built
- src: compositions/05-outro.html
- duration: 3s
- transition_in: crossfade
- scene: Cream card, bakery logo, "Liszt: Rapszódia" wordmark, closing line "No more mystery bread."
- blueprint: titlecard-reveal (Brand_Outro role) — one restrained move, then a still hold.

Calm, warm close. Music fades to silence under this card.
