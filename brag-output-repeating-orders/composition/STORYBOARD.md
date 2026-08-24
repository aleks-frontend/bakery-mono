---
format: 1920x1080
duration: 20s
message: "You don't have to remember to order bread every week anymore — check one box, once."
arc: Question → Check the box → Confirmation → Order once, relax → A word from the bakery
audience: end customers of the bakery, in Serbian
mode: autonomous
---

## Frame 1 — The question

- status: built
- src: compositions/01-hook.html
- duration: 3s
- transition_in: cut
- scene: Cream background, Fraunces line settles in — "Opet ste zaboravili da naručite hleb?"
- blueprint: compose (waterfall-entry rule) — Hook role, no product UI yet.

Cold open on the customer's own weekly forgetfulness — the exact anxiety the repeat-order option removes.

## Frame 2 — Check the box

- status: built
- src: compositions/02-checkbox.html
- duration: 5s
- transition_in: crossfade
- scene: Real repeat-order checkbox row ("Ponavljaj ovu porudžbinu svake nedelje" + sub-copy) and "Pošalji narudžbu" button; cursor checks the box, then taps submit.
- blueprint: cursor-ui-demo (Key_Feature role, static-stage variant) — one real interaction, locked camera.

The whole feature, in one click. Beat-locked: checkbox check at 4.10s, submit tap at 5.74s (both exact/near beats in the vol-10 grid).

## Frame 3 — The confirmation

- status: built
- src: compositions/03-confirmation.html
- duration: 4.5s
- transition_in: cut
- scene: Real confirmation card — checkmark badge, "Porudžbina primljena!", "Hvala, Ana — vaša porudžbina je primljena.", then the payoff line "Ova porudžbina će se automatski ponavljati svake nedelje." arriving last.
- blueprint: titlecard-reveal-adjacent (Benefits role) — compose from spring-pop-entrance + waterfall-entry.

The reassurance lands here. Beat-locked: badge pop at 7.79s, payoff line at 10.38s.

## Frame 4 — Order once, relax

- status: built
- src: compositions/04-weekly.html
- duration: 4s
- transition_in: crossfade
- scene: Three weekly markers ("Nedelja 1/2/3", each with a loaf glyph + checkmark) stagger-pop left to right, then "Naručite jednom. I opustite se." settles beneath.
- blueprint: grid-card-assemble (Benefits role) — small staggered self-assembling set.

Wordless proof this just keeps happening, then the line that says it plainly.

## Frame 5 — A word from the bakery

- status: built
- src: compositions/05-outro.html
- duration: 3.5s
- transition_in: crossfade
- scene: Cream card, bakery logo, "Liszt: Rapszódia" wordmark, and a genuine one-line thank-you: "Hvala vam što nas puštate u vaš dom, svake nedelje."
- blueprint: titlecard-reveal (Brand_Outro role) — one restrained move, then hold.

Calm, warm close, per the user's explicit ask for a closing message + logo. Music fades to silence under this card.
