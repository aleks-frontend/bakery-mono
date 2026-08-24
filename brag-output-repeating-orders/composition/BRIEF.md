---
workflow: general-video
flow: automation
storyboard: no
message: "You don't have to remember to order bread every week anymore — check one box, once."
aspect: 1920x1080
language: sr
length: 20s
angle: reassurance-explainer
---

## Intent

A `/brag`-style explainer video for Liszt: Rapszódia's public order form (a small
Subotica bakery), aimed at END CUSTOMERS rather than an internal audience: the
"repeat this order every week" checkbox. Warm, calm, reassuring — visual and
tonal continuity with the earlier out-of-stock video at `../../brag-output/`.
Full creative brief already confirmed via `/brag` at `../brag-plan.md` and
`../composition-brief.md`.

## Assets

- assets/logo.png — the bakery's real logo, copied from
  `../../brag-output/composition/assets/logo.png` (itself from
  `apps/order-form/public/logo.png`).
- assets/fonts/*.woff2 — Fraunces + Work Sans, latin + latin-ext, copied from
  the first brag video's project (same embedded local files).
- assets/music/happy-beats-business-moves-vol-10-by-ende-dot-app.mp3 — same
  music bed as video 1, for brand continuity.
- assets/sfx-interface/*.ogg — same 4 soft interface sounds used in video 1.

## Customizations

- None beyond the `/brag` plan — no voiceover, no captions.

## Notes

- Full storyboard, tone, palette, fonts, and audio direction live in
  `../brag-plan.md` (creative) and `../composition-brief.md` (source material +
  copy that must appear verbatim). Treat both as already-confirmed intent; do
  not re-run discovery or ask brief questions.
- All on-screen copy is Serbian (Latin script), taken verbatim from
  `apps/order-form/src/i18n/sr.json` where real UI is quoted.
- Palette/fonts identical to the first brag video (`#fbf3e7` bg, `#c4703b`
  accent, `#362617` text, Fraunces/Work Sans) — reuse for continuity.
- **Known bug from video 1, already fixed there, must not be repeated here**:
  give every sub-comp's root a unique id (`root-02`, `root-03`, …) and select
  it via `document.getElementById`, never a document-wide
  `document.querySelector('[data-composition-id="…"]')` — that selector also
  matches the host's own slot div in `index.html`, which carries the same
  attribute by design, and silently leaves crossfade-in scenes stuck at
  `opacity: 0` with no lint/runtime error.
- flow/storyboard fixed at automation/no — renders autonomously, no mid-build
  checkpoints, hands the finished file back for review.
