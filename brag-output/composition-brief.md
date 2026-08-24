# Hyperframes Composition Brief: Liszt: Rapszódia — Order Form (Out-of-Stock Products)

## Objective
Create a short launch-style brag video for one specific feature just shipped in Liszt: Rapszódia's public order form: honestly surfacing out-of-stock products instead of silently hiding them.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 19 seconds

## Source Material
- Project root: `/Users/aleksandargojkovic/Code/Personal/bakery-mono`
- Primary files read: `apps/order-form/src/components/OutOfStockArticles.tsx`, `apps/order-form/src/components/OrderItems.tsx`, `apps/order-form/tailwind.config.js`, `apps/order-form/index.html`, `apps/order-form/src/i18n/en.json`, `apps/order-form/public/logo.png`
- Product name: Liszt: Rapszódia — Order (a bakery order form, not a SaaS product)
- Tagline / strongest claim: not a marketing tagline — the real customer-facing copy: "Don't see what you're looking for?" and "These products aren't available right now:" / "These may become available again."
- Key UI or visual moment to recreate: the "Ordered products" section — the "+ Add product" button, the "Don't see what you're looking for?" toggle expanding into a wrapped pill-cloud of unavailable product names, and the small "i" info icon unfurling a reassurance note with an "Email us" mailto link.
- Copy that must appear verbatim:
  - "Ordered products"
  - "+ Add product"
  - "Don't see what you're looking for?"
  - "These products aren't available right now:"
  - "These may become available again."
  - "Want to know when, or looking for something similar?"
  - "Email us"
  - Real product names for the pills, e.g. "Tigrasti hleb - Tigris kenyér - 1000g", "Pan Cubano - 800g", "Hleb sa heljdom - Hajdinás kenyét - 1000g", "Polubeli hleb - Félfehér kenyér - 1000g"

## Creative Direction
- Tone preset: default
- Creative direction: warm, handmade, small-bakery feel — a note taped to the shop window, not enterprise software.
- Interpretation: playful but unhurried pacing, generous holds on text, soft crossfades over hard cuts, typography in the app's own Fraunces/Work Sans pairing.
- Angle: this isn't a big feature — it's a small, honest fix. Previously, sold-out bread just vanished from the form with no explanation; now the form admits it, plainly, one tap away. The video should feel proportionate to that: quiet, warm, a little charming, never hyped.
- Hook: cream background, Fraunces line: "Wait... where did the rye bread go?" — no logo yet, just the relatable customer confusion.
- Outro / punchline: cream card, bakery logo + "Liszt: Rapszódia" wordmark, closing line "No more mystery bread."
- Avoid:
  - Generic SaaS language ("streamline," "workflow," "seamless")
  - Abstract filler visuals (particle systems, gradients unrelated to the bakery palette)
  - Any enterprise/corporate visual register — no dashboards, no stat/metric cards, no growth-chart energy
  - Redesigning the actual UI — the recreated components should read as the real order form, not a reimagined version of it

## Visual Identity
- Background: `#fbf3e7` (bakery.bg, warm cream)
- Background (soft variant): `#f5ebda` (bakery.bg-soft)
- Card: `#fffefb` (bakery.card)
- Accent/primary: `#c4703b` (bakery.primary), hover `#ad5f2e`
- Secondary: `#7c8b6f` (bakery.secondary, sage green)
- Highlight: `#e7be97` / soft `#f6ead2`
- Text: `#362617` (bakery.text, deep brown)
- Border: `#e6d5be` (bakery.border)
- Display font: Fraunces (serif, weights 500-700) — Google Fonts, already linked via `fonts.googleapis.com`
- Body font: Work Sans (weights 400-700) — Google Fonts, already linked
- Visual references from the project: the bakery logo at `apps/order-form/public/logo.png` (treble clef + wheat motif), the rounded-corner card/button language (`rounded-xl`/`rounded-2xl`), the soft `shadow-bakery` treatment used on the main form card

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract (full scene-by-scene detail, including audio-coupled ideas, lives there).

Scene summary:
1. The question — 3s — Fraunces line "Wait... where did the rye bread go?" on cream background.
2. The real order form — 4s — "Ordered products" heading, one selected product row, "+ Add product" button, cursor taps "Don't see what you're looking for?"
3. The honest list — 5s — toggle expands; "These products aren't available right now:" + "i" icon; 4-5 real product-name pills pop in one by one into a wrapped pill-cloud.
4. The reassurance — 4s — tap on "i" icon; note unfurls: "These may become available again. Want to know when, or looking for something similar?" with underlined "Email us" in terracotta.
5. Outro — 3s — cream card, logo, "Liszt: Rapszódia", closing line "No more mystery bread."

## Audio
- Audio role: warm bed, restrained — never louder or brighter than the product itself
- Audio arc: soft fade-in under Scene 1, steady low bed through Scenes 2-4 with light SFX tied to each interaction, soft fade-out under the Scene 5 outro card
- Music: `happy-beats-business-moves-vol-10-by-ende-dot-app.mp3` (109.96 BPM, 60s, gentlest-feeling of the bundled tracks)
- Music treatment: fade in under Scene 1's opening line, hold at a quiet/background volume throughout (never a "launch video" swell), fade to silence under the outro card
- Music cue guidance: bundled preset at `assets/music/cues/happy-beats-business-moves-vol-10-by-ende-dot-app.music-cues.json` / `.md`. Strong cues inside the 0-19s window fall roughly at 3.0s, 4.6s, 6.3s, 8.2s, 9.8s, 11.5s, 13.1s, 14.7s, 16.4s, 18.0s — usable as soft landing points, not a rigid grid. Treat as optional; readability and the calm tone win over strict sync.
- Audio-reactive treatment: none — keep the UI feeling calm and handmade, not reactive
- Audio-coupled moments:
  - Scene 2 — toggle tap — soft, warm tap sound synced to the simulated click
  - Scene 3 — pill-by-pill reveal — one soft "pop" per pill (think soft paper/cloth texture, not a digital blip), landing near nearby beat-grid points, spaced so each product name is readable (not one per single beat if that's too fast to read)
  - Scene 4 — "i" tap and note unfurl — one gentle paper-rustle/unfurl sound, may land on a strong cue for a quiet payoff
- SFX selection guidance: sparse and soft throughout — this is a bakery counter note, not a UI system. Prefer warm, low-register, non-digital-sounding effects over sharp/bright UI clicks.
- SFX analysis guidance: use `assets/sfx/sfx-analysis.md` from the current hyperframes/brag skill assets; prefer lower high-frequency-risk sounds for the repeated pill-pop moments in Scene 3.
- Exact SFX choice: Hyperframes should choose filenames, timestamps, density, and volume based on the implemented animation.
- Audio files: copy the chosen music into `brag-output/composition/assets/music/`; Hyperframes copies any selected SFX into the same `assets/` tree.

## Hyperframes Instructions
Use the current `hyperframes` skill and CLI workflow. Prefer native Hyperframes conventions over anything in `/brag`.

Requirements:
- Show at least one real UI, copy, or visual element from the source project (Scenes 2-4 recreate real order-form UI and copy verbatim).
- Keep all text readable in the final render.
- Keep the video within 15-25 seconds (target 19s).
- Include the planned music/SFX layer as described above.
- Treat `/brag` audio notes as guidance, not a fixed cue sheet. Choose SFX after the visual animation exists.
- Treat music cue metadata as optional timing hints. Ignore cues that hurt readability, scene pacing, or the calm/warm tone.
- Major reveals may move toward nearby strong cues within about 0.15s. Smaller entrances may align to nearby beat points within about 0.10s. Use only 1-3 strong cue locks across the video.
- Use SFX to support motion and interaction: soft pops for the pill sequence, a light tap for the toggle click, a gentle unfurl for the info note. Restraint throughout.
- Honor the planned fade-in/fade-out music treatment.
- No audio-reactive visuals for this one — keep it calm.
- Use local assets for audio and any required runtime/media dependencies when possible.
- Run Hyperframes lint and validate before render.
