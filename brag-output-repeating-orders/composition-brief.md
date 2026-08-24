# Hyperframes Composition Brief: Liszt: Rapszódia — Repeating Orders (Serbian explainer)

## Objective
Create a short, warm, Serbian-language explainer video for Liszt: Rapszódia's public order form, for end customers: the "repeat this order every week" option. Not an internal feature-reveal — a reassurance piece answering "do I have to remember to order every week?"

## Output
- Composition directory: `brag-output-repeating-orders/composition/`
- Rendered video: `brag-output-repeating-orders/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: `/Users/aleksandargojkovic/Code/Personal/bakery-mono`
- Primary files read: `apps/order-form/src/components/OrderForm.tsx` (the repeat checkbox + its sub-copy + the confirmation screen), `apps/order-form/src/i18n/sr.json` (all Serbian copy, quoted verbatim), `apps/order-form/public/logo.png`
- Product name: Liszt: Rapszódia — Order (a bakery order form)
- Copy that must appear verbatim (Serbian, from `sr.json`):
  - "Ponavljaj ovu porudžbinu svake nedelje"
  - "Dobijaćete ovu istu porudžbinu automatski svake nedelje — nećete morati ponovo da je šaljete, osim ako želite da je izmenite ili otkažete."
  - "Pošalji narudžbu"
  - "Porudžbina primljena!"
  - "Hvala, Ana — vaša porudžbina je primljena." (real-looking placeholder recipient name standing in for `{{recipient}}`)
  - "Ova porudžbina će se automatski ponavljati svake nedelje."
  - Invented but on-brand lines (not from the app, written for this video): the Scene 1 hook "Opet ste zaboravili da naručite hleb?", the Scene 4 line "Naručite jednom. I opustite se.", and the Scene 5 bakery sign-off "Hvala vam što nas puštate u vaš dom, svake nedelje."

## Creative Direction
- Tone preset: default, tuned toward reassurance
- Creative direction: same warm, handmade small-bakery register as the earlier out-of-stock `/brag` video (`brag-output/`) — visual and tonal continuity between the two matters. This one is calmer: a relieved exhale, not a reveal.
- Angle: the feature removes a small weekly anxiety (forgetting to reorder). The video should feel like permission to stop worrying, not a product demo.
- Hook: "Opet ste zaboravili da naručite hleb?" on a plain cream field.
- Outro / punchline: bakery logo + wordmark + a genuine one-line thank-you from the bakery, not a slogan.
- Avoid:
  - Generic SaaS/automation language ("set it and forget it," "streamline")
  - Celebration/success-jingle energy — this is relief, not a win
  - Redesigning the real UI — the checkbox, sub-copy, and confirmation screen should read as the real order form

## Visual Identity
Identical system to the first `/brag` video — reuse it verbatim for continuity:
- Background `#fbf3e7`, soft `#f5ebda`, card `#fffefb`
- Accent `#c4703b` (hover `#ad5f2e`), secondary `#7c8b6f`
- Text `#362617`, border `#e6d5be`
- Display font Fraunces (600/700), body font Work Sans (400/500/600) — the same locally-embedded woff2 files already prepared at `brag-output/composition/assets/fonts/fraunces-latin(.−ext).woff2` and `worksans-latin(.−ext).woff2` can be copied into this project's own `assets/fonts/` rather than re-fetched.
- Visual references: the bakery logo (`apps/order-form/public/logo.png`), the app's rounded-card/button language, the real confirmation screen's checkmark badge treatment (a circular soft-sage badge, per `bakery-secondary-soft` / `bakery-secondary` tokens: `#e9ede4` / `#7c8b6f`)

## Storyboard
Use `brag-output-repeating-orders/brag-plan.md`'s storyboard as the creative contract (full scene-by-scene detail, audio-coupled ideas, and timing intent live there).

Scene summary:
1. The question — 3s — Serbian hook line, cream background, no UI.
2. Check the box — 5s — real repeat-checkbox row + sub-copy + submit button; cursor checks the box, taps submit.
3. The confirmation — 4.5s — real confirmation card (checkmark badge, heading, thank-you line, repeat-confirmation payoff line arriving last).
4. Order once, relax — 4s — three weekly markers (non-UI, invented visual) stagger-pop, then the reassurance line lands.
5. A word from the bakery — 3.5s — logo + wordmark + genuine one-line thank-you, cream card, restrained settle then hold.

## Audio
- Audio role: warm bed, restrained, same posture as video 1
- Audio arc: fade in under Scene 1, steady low bed through Scenes 2-4 with sparse soft SFX on each real interaction, fade to silence under the Scene 5 outro card
- Music: `happy-beats-business-moves-vol-10-by-ende-dot-app.mp3` — same track as video 1 (copy it into this project's own `assets/music/`)
- Music treatment: same fade posture as video 1, slightly more generous holds given the calmer pacing
- Music cue guidance: bundled preset at the skill's `assets/music/cues/happy-beats-business-moves-vol-10-by-ende-dot-app.music-cues.md` (109.96 BPM) — optional soft landing points only; this video's pacing follows reading/reassurance time, not the beat grid
- Audio-reactive treatment: none
- Audio-coupled moments:
  - Scene 2 — checkbox check — soft tick sound
  - Scene 3 — confirmation badge pop — one gentle chime
  - Scene 4 — weekly-marker stagger — soft pop per marker
- SFX selection guidance: sparse, warm, low-register — same palette used in video 1 (`assets/sfx-interface/click_002.ogg`, `click_003.ogg`, `click_005.ogg`, `switch_007.ogg` were used there and are reasonable starting candidates here too; choose based on the actual implemented animation)
- Exact SFX choice: Hyperframes should choose filenames, timestamps, density, and volume based on the implemented animation.
- Audio files: copy the chosen music (and reused SFX) into `brag-output-repeating-orders/composition/assets/`

## Hyperframes Instructions
Use the current `hyperframes` skill and CLI workflow. Prefer native Hyperframes conventions over anything in `/brag`.

Requirements:
- Show at least one real UI, copy, or visual element from the source project (Scenes 2-3 recreate real order-form UI and copy verbatim, in Serbian).
- Keep all text readable in the final render — Serbian diacritics (č, ć, š, ž, đ) must render correctly; use the same latin + latin-ext font-face pairing as video 1.
- Keep the video within 15-25 seconds (target 20s).
- Include the planned music/SFX layer as described above.
- Sub-composition root elements MUST use unique ids per scene (e.g. `root-02`, `root-03`, not a shared generic `root`) — the first video hit a real bug where a document-wide `document.querySelector('[data-composition-id="…"]')` inside a sub-comp's own script matched the HOST's outer slot div in `index.html` (which carries the same `data-composition-id` attribute by design) instead of the sub-comp's own cloned root, leaving crossfade-in scenes stuck at `opacity: 0` (blank frames) with no lint/runtime error surfaced. Use `document.getElementById("root-0N")` with a scene-unique id instead, for any sub-comp that needs to reference its own root element in script (e.g. for a crossfade opacity tween or a `getBoundingClientRect` measurement).
- Treat `/brag` audio notes as guidance, not a fixed cue sheet. Choose SFX after the visual animation exists.
- Treat music cue metadata as optional timing hints. Ignore cues that hurt readability, scene pacing, or the calm/reassuring tone.
- Use SFX to support motion and interaction: sparse and soft throughout.
- Honor the planned fade-in/fade-out music treatment.
- No audio-reactive visuals for this one — keep it calm.
- Use local assets for audio and any required runtime/media dependencies when possible.
- Run Hyperframes lint and validate before render.
