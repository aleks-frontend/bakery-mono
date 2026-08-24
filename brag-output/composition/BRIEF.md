---
workflow: general-video
flow: automation
storyboard: no
message: "Out-of-stock bread doesn't have to vanish without explanation — the order form just got honest about it."
aspect: 1920x1080
language: en
length: 19s
angle: feature-reveal
---

## Intent

A `/brag` launch video for one specific feature just shipped in Liszt: Rapszódia's
public order form (a small Subotica bakery): unavailable products used to be
silently hidden from the picker; now there's a "Don't see what you're looking
for?" toggle that reveals them honestly, plus a small info note pointing
customers to email the bakery. Warm, handmade, small-bakery feel — not
enterprise SaaS energy. Full creative brief already confirmed via `/brag` at
`../brag-plan.md` and `../composition-brief.md`.

## Assets

- ../../apps/order-form/public/logo.png (copied to assets/logo.png) — the bakery's real logo (treble clef + wheat motif).
- assets/music/happy-beats-business-moves-vol-10-by-ende-dot-app.mp3 — chosen music bed, warm/restrained.

## Customizations

- None beyond the `/brag` plan — no captions, no voiceover.

## Notes

- Full storyboard, tone, palette, fonts, and audio direction live in
  `../brag-plan.md` (creative) and `../composition-brief.md` (source
  material + copy that must appear verbatim). Treat both as already-confirmed
  intent; do not re-run discovery or ask brief questions.
- Palette: bg `#fbf3e7`, bg-soft `#f5ebda`, card `#fffefb`, primary/accent
  `#c4703b` (hover `#ad5f2e`), secondary `#7c8b6f`, text `#362617`, border
  `#e6d5be`.
- Fonts: Fraunces (display/serif), Work Sans (body/sans) — both Google Fonts.
- Must show real UI/copy from `apps/order-form/src/components/OutOfStockArticles.tsx`
  and `OrderItems.tsx` — no generic SaaS language, no redesigning the UI.
- flow/storyboard fixed at automation/no for this run — `/brag` renders
  autonomously and hands the finished file back for review, no mid-build
  checkpoints.
