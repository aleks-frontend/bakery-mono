# Brag Plan: Liszt: Rapszódia — Repeating Orders

## What is this app?
The public weekly order form for Liszt: Rapszódia, a small Subotica bakery. This video is a customer-facing explainer (not an internal feature-shipped brag) for one specific option in that form: "repeat this order every week," which clones a customer's order into every new weekly cycle automatically.

## The angle
The video's whole job is answering one question a customer has never had to ask before: "do I have to remember to order every single week?" No — check one box, once, and stop thinking about it. The angle is reassurance and relief, not a feature tour. Every beat should feel like exhaling.

## Hook (first 2-3 seconds)
A relatable Serbian line, the customer's own inner voice: **"Opet ste zaboravili da naručite hleb?"** ("Forgot to order bread again?") — the exact weekly-forgetting problem this feature removes, stated before the product appears.

## Key moments (the middle)
- The real order form's repeat option, recreated verbatim: the checkbox labeled "Ponavljaj ovu porudžbinu svake nedelje" with its real sub-copy, a cursor checking it.
- The real confirmation screen: "Porudžbina primljena!" with the checkmark, the "Hvala, {ime} — vaša porudžbina je primljena." line, and the real repeat-confirmation line "Ova porudžbina će se automatski ponavljati svake nedelje." landing as the payoff.
- A simple, non-UI benefit beat: three small weekly markers (Nedelja 1 / Nedelja 2 / Nedelja 3) each arriving with a loaf + a checkmark, wordlessly proving "this just keeps happening" — then the line "Naručite jednom. I opustite se." lands.

## Outro / punchline
A warm closing card: the bakery logo + "Liszt: Rapszódia" wordmark with a genuine sign-off line from the bakery itself — not a slogan, a small thank-you — per the user's explicit ask for "a nice message from Liszt Rapszódia with logo."

## User flow worth showing
1. **Entry** — customer is filling out their usual weekly order, reaches the bottom of the form.
2. **Key action** — checks "Ponavljaj ovu porudžbinu svake nedelje" and submits.
3. **Result** — sees the real confirmation screen telling them this order will now repeat automatically every week, no further action needed.

## Tone
- Preset: `default`, tuned toward reassurance rather than reveal-energy
- Creative direction: same warm, handmade small-bakery feel as the first `/brag` video (continuity across the two) — a relieved exhale, not a hype reel. Speaks directly to the end customer, in Serbian, second person.
- Interpretation: calmer pacing than a typical feature-reveal — more hold time on the payoff line, softer transitions, nothing rushed. The "relax" message should be felt in the pacing itself, not just said.

## Format: landscape — 1920x1080
## Duration: 20s

## Visual identity (from the project)
Same as the first `/brag` video — this is the same brand, and visual continuity between the two matters:
- Background: `#fbf3e7` (bakery.bg), soft `#f5ebda`, card `#fffefb`
- Accent/primary: `#c4703b` (hover `#ad5f2e`)
- Secondary: `#7c8b6f`
- Text: `#362617`, border `#e6d5be`
- Display font: Fraunces (600/700) — same embedded local woff2 files already in `brag-output/composition/assets/fonts/`, reusable here
- Body font: Work Sans (400/500/600) — same as above
- Strongest visual element: the real confirmation screen's checkmark badge and the repeat-confirmation line, both verbatim from `apps/order-form/src/components/OrderForm.tsx`

## Language
All on-screen copy is in Serbian (Latin script), matching `apps/order-form/src/i18n/sr.json` verbatim where the real UI is quoted:
- "Ponavljaj ovu porudžbinu svake nedelje"
- "Dobijaćete ovu istu porudžbinu automatski svake nedelje — nećete morati ponovo da je šaljete, osim ako želite da je izmenite ili otkažete."
- "Pošalji narudžbu"
- "Porudžbina primljena!"
- "Hvala, Ana — vaša porudžbina je primljena." (a real-looking placeholder name, "Ana," standing in for `{{recipient}}`)
- "Ova porudžbina će se automatski ponavljati svake nedelje."

## Share copy (draft)
"Naručite jednom, opustite se — Liszt: Rapszódia sad pamti vašu nedeljnu porudžbinu umesto vas. 🍞"

## Audio direction
- Role: warm bed, restrained — same posture as the first video
- Music: `happy-beats-business-moves-vol-10-by-ende-dot-app.mp3` (same track as video 1, for brand continuity across both brags)
- Music treatment: fade in under Scene 1, steady low bed, fade to silence under the outro card — slightly longer holds than video 1 since this piece is calmer/slower-paced
- Music cue guidance: same bundled preset as before (`assets/music/cues/happy-beats-business-moves-vol-10-by-ende-dot-app.music-cues.md`), 109.96 BPM. Reuse only as soft optional landing points — this video's pacing is driven by reassurance/reading time, not rhythm.
- Audio-reactive treatment: none
- SFX posture: sparse — one soft checkbox-tick sound, one gentle confirmation chime on the checkmark badge, soft pops on the three weekly markers
- Audio-coupled moments: checkbox check (Scene 2), confirmation badge appearance (Scene 3), weekly-marker stagger (Scene 4)
- Restraint rule: no swells, no "success jingle" energy — this is relief, not celebration

## Storyboard

### Scene 1 — The question — 3s
Cream background. Centered Fraunces line settles in: "Opet ste zaboravili da naručite hleb?" No UI yet.
Sequential/interaction: yes — word-by-word waterfall-entry cascade (same technique as video 1)
Audio intent: quiet, familiar, a little wry
Music: soft fade-in
Transition mood: soft crossfade → Scene 2

### Scene 2 — Check the box — 5s
Recreate the real form's bottom section: a checkbox row with "Ponavljaj ovu porudžbinu svake nedelje" and its real sub-copy beneath, plus the "Pošalji narudžbu" button below it. Cursor arrives, checks the box (checkbox fills with the accent color + a small check-draw), then taps submit.
Sequential/interaction: yes — cursor check, then cursor tap on submit; checkbox check-mark draws on via svg-path-draw-style stroke
Audio intent: a small, satisfying "that's it, that's the whole feature" moment
Audio-coupled idea: soft tick sound on the checkbox check
Music: steady low bed
Transition mood: clean → Scene 3

### Scene 3 — The confirmation — 4.5s
Cut to the real confirmation card: the round checkmark badge, "Porudžbina primljena!", "Hvala, Ana — vaša porudžbina je primljena.", and — as the payoff line, arriving a beat after the rest — "Ova porudžbina će se automatski ponavljati svake nedelje." in the bakery's muted-brown body copy, held long enough to read twice.
Sequential/interaction: yes — badge spring-pops in, heading and thank-you line settle, payoff line arrives last on its own beat
Audio intent: warm, settled — the reassurance landing
Audio-coupled idea: one gentle confirmation chime on the badge pop
Music: steady low bed
Transition mood: soft crossfade → Scene 4

### Scene 4 — Order once, relax — 4s
Cut away from UI entirely: three small rounded markers labeled "Nedelja 1", "Nedelja 2", "Nedelja 3" pop in one by one left to right, each with a tiny loaf glyph and a checkmark — wordless proof this just keeps happening without the customer doing anything. Then the line "Naručite jednom. I opustite se." settles beneath them.
Sequential/interaction: yes — 3 markers stagger-pop, then the line arrives
Audio intent: light, domestic, calm
Audio-coupled idea: soft pop per marker
Music: steady low bed, beginning to soften toward the outro
Transition mood: soft crossfade → Scene 5

### Scene 5 — A word from the bakery — 3.5s
Cream card: bakery logo + "Liszt: Rapszódia" wordmark, and beneath it a genuine one-line thank-you from the bakery (not a slogan) — e.g. "Hvala vam što nas puštate u vaš dom, svake nedelje." ("Thank you for letting us into your home, every week.") Music fades to silence under this card.
Sequential/interaction: none — one restrained settle, then hold
Audio intent: warm close, no big finish
Music: fade to silence
Transition mood: soft fade → end

**Music mood for this video:** warm / calm / reassuring, slightly slower-breathing than video 1
**Audio summary:** Same quiet café-playlist bed as video 1, with a handful of soft domestic sounds (tick, chime, pop) tied to the real interactions — the whole audio arc should feel like a long exhale, ending in silence on the bakery's own thank-you.
