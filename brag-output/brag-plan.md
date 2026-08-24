# Brag Plan: Liszt: Rapszódia — Order Form

## What is this app?
The public weekly order form for Liszt: Rapszódia, a small Subotica bakery — customers pick breads, pastries, and pizza dough for the week's delivery cycle. This brag video is about one specific feature just shipped: instead of silently vanishing when a bread sells out, out-of-stock products now show up honestly, one tap away.

## The angle
The joke/claim is small and true, which is exactly why it works: this isn't "AI-powered inventory intelligence," it's a bakery admitting "yeah, we're out of the rye today" instead of pretending it never existed. The video should feel like reading a handwritten note taped to a bakery counter, not a SaaS feature announcement.

## Hook (first 2-3 seconds)
A big Fraunces-serif line on the cream background, like a customer's inner monologue: **"Wait... where did the rye bread go?"** — the exact confusion the baker described customers having. No logo yet, just the relatable moment.

## Key moments (the middle)
- The real "Ordered products" section of the order form, with the actual "+ Add product" button and, right below it, the "Don't see what you're looking for?" toggle link — a cursor taps it.
- The toggle expands into the pill-cloud of unavailable products, each pill popping in one by one (real product names: "Tigrasti hleb - Tigris kenyér - 1000g", "Pan Cubano - 800g", "Hleb sa heljdom - Hajdinás kenyét - 1000g").
- A tap on the small "i" info icon unfurls the reassurance note in the real copy: *"These may become available again. Want to know when, or looking for something similar?"* with the underlined **Email us** mailto link in the bakery's terracotta accent.

## Outro / punchline
Cut to a warm cream card centered on the bakery logo and "Liszt: Rapszódia" in Fraunces, with a small closing line under it: **"No more mystery bread."** Simple, warm, done.

## User flow worth showing
1. **Entry** — customer scrolls the order form to the "Ordered products" section, scanning the product dropdown for something specific.
2. **Key action** — taps "Don't see what you're looking for?", then taps the "i" icon on the resulting list.
3. **Result** — sees the honest pill list of what's unavailable, plus the reassurance + "Email us" note, instead of silence.

## Tone
- Preset: `default`
- Creative direction: warm, handmade, small-bakery feel — a note taped to the shop window, not enterprise software. No corporate SaaS language anywhere.
- Interpretation: playful but unhurried pacing, generous holds on text (this is a cozy reveal, not a hype reel), soft crossfades instead of hard cuts, all typography in the app's own Fraunces/Work Sans pairing.

## Format: landscape — 1920x1080
## Duration: 19s

## Visual identity (from the project)
- Background: `#fbf3e7` (bakery.bg, warm cream)
- Background (soft variant): `#f5ebda`
- Accent/primary: `#c4703b` (terracotta), hover `#ad5f2e`
- Secondary: `#7c8b6f` (sage green)
- Text: `#362617` (deep brown)
- Border: `#e6d5be`
- Card: `#fffefb`
- Display font: Fraunces (serif, headline weight 600-700)
- Body font: Work Sans (400-600)
- Strongest visual element: the pill-cloud of out-of-stock product names expanding under the toggle, plus the small circular "i" icon unfurling the info note — both are real, working UI from `apps/order-form/src/components/OutOfStockArticles.tsx`, not a mockup.

## Share copy (draft)
"Liszt: Rapszódia's order form just got a little more honest — if your favorite bread's sold out, you'll actually know why. 🍞"

## Audio direction
- Role: warm bed, restrained — this should never feel like a startup launch video
- Music: `happy-beats-business-moves-vol-10-by-ende-dot-app.mp3` (109.96 BPM, 60s, the gentlest-feeling of the bundled tracks) — kept low in the mix, more texture than drive
- Music treatment: soft fade in under Scene 1, steady low bed through the middle, gentle fade out under the outro card — never louder than a quiet café playlist
- Music cue guidance: preset available at `assets/music/cues/happy-beats-business-moves-vol-10-by-ende-dot-app.music-cues.md`. Notable strong cues inside the 0-19s window: ~3.0s, ~4.6s, ~6.3s, ~8.2s, ~9.8s, ~11.5s, ~13.1s, ~14.7s, ~16.4s, ~18.0s — usable as soft landing points for the pill pops and the toggle tap, not as a rigid grid.
- Audio-reactive treatment: none — keep the UI feeling calm and handmade, not reactive/flashy
- SFX posture: sparse. One soft "tap" on the toggle click, a light, warm "pop" per pill arriving (quieter than a typical UI click — think a soft paper/cloth sound, not a digital blip), one gentle "unfurl" or paper-rustle sound when the info note opens
- Audio-coupled moments: the pill-by-pill reveal in Scene 3 should land its pops on nearby beat-grid points from the cue list above; the "i" tap and note unfurl in Scene 4 can land on one strong cue for a satisfying but quiet payoff
- Restraint rule: no music swells, no digital "success" chimes, no bass drops — this is a bakery, not a product launch

## Storyboard

### Scene 1 — The question — 3s
Cream background (`#fbf3e7`). Centered Fraunces-serif line fades/settles in: "Wait... where did the rye bread go?" in deep brown (`#362617`). No UI chrome yet — just the relatable moment, held long enough to read (full sentence, ~2s settled minimum).
Sequential/interaction: none
Audio intent: quiet, curious — the music bed fades in under this line
Audio-coupled idea: none
Music: soft fade-in, low volume
Transition mood: soft crossfade → Scene 2

### Scene 2 — The real order form — 4s
Recreate the actual "Ordered products" section: heading "Ordered products", one product row with a real product name selected (e.g. "Beli hleb - Fehér kenyér - 500g"), the terracotta "+ Add product" button, and directly below it the underlined "Don't see what you're looking for?" link. A cursor moves in and taps that link.
Sequential/interaction: yes — cursor enters, moves to the toggle link, taps it (simulated click)
Audio intent: a small, warm confirmation — customer found the door
Audio-coupled idea: soft tap sound synced to the click
Music: steady low bed
Transition mood: clean → Scene 3

### Scene 3 — The honest list — 5s
The toggle expands (soft height/opacity reveal, matches the real disclosure pattern) into the muted card with "These products aren't available right now:" and the small "i" icon. Below it, 4-5 real product-name pills pop in one by one, wrapping into the pill-cloud layout (not a tall list) — e.g. "Tigrasti hleb - Tigris kenyér - 1000g", "Pan Cubano - 800g", "Hleb sa heljdom - Hajdinás kenyét - 1000g", "Polubeli hleb - Félfehér kenyér - 1000g".
Sequential/interaction: yes — pills arrive one by one, ~0.3-0.4s apart, each with a soft pop
Audio intent: light, satisfying, unhurried — this is transparency, not a big reveal
Audio-coupled idea: pop per pill, landing near the beat-grid points noted above
Music: steady low bed
Transition mood: clean → Scene 4

### Scene 4 — The reassurance — 4s
Cursor taps the small "i" icon. The info note unfurls beneath the intro line, in the real copy: "These may become available again. Want to know when, or looking for something similar?" with the underlined "Email us" mailto link highlighted in terracotta (`#c4703b`). Hold long enough to read the full note.
Sequential/interaction: yes — simulated tap on the "i" icon, note unfurls
Audio intent: warm, reassuring — the emotional payoff of the whole video
Audio-coupled idea: one gentle unfurl/paper-rustle sound on the tap, landing on a strong cue
Music: steady low bed, starting to soften toward the outro
Transition mood: soft crossfade → Scene 5

### Scene 5 — Outro — 3s
Cut to a centered cream card: the bakery logo, "Liszt: Rapszódia" in Fraunces, and the closing line "No more mystery bread." underneath in Work Sans. Music fades out under this card.
Sequential/interaction: none
Audio intent: warm close, no big finish — just settles
Audio-coupled idea: none
Music: fade to silence
Transition mood: soft fade → end

**Music mood for this video:** warm / gently upbeat, restrained
**Audio summary:** A quiet, low café-playlist-style bed under the whole video with a handful of soft, paper-and-touch-feeling SFX (tap, pop, unfurl) tied to the real UI interactions — never louder or brighter than the product itself.
