## what we're building

A single static `index.html` file (Tailwind CDN + Google Fonts DM Sans, zero JavaScript) for an AI story coach product called **"find your signature story"**. HERO-heavy, premium-1974-redesigned-in-Milan-2024 feel. Will replace the current placeholder so it loads at the project's root URL.

## the laws (non-negotiable)

**Palette** (only these, no black/white/blue/cool grey ever):
- page base `#f2efe9` · dark section `#3c4235` · card surface `#d7d1c6`
- accent/CTA `#fb7339` · body text `#575349` · type on dark `#d7d1c6`

**Type**: DM Sans only. Heavy weights (700/900). Lowercase. Tight tracking. Big enough to make you lean back (hero headline ~clamp(4rem, 12vw, 11rem), line-height ~0.9).

## page structure

```text
┌─────────────────────────────────────────────────┐
│  [floating pill navbar — does not touch edges]  │  ← parchment, logo+label left, orange CTA right
│                                                 │
│   hero (full-bleed, dark #3c4235 background)    │
│   ┌─ headline, lowercase, left-aligned ──────┐  │
│   │  "find your                              │  │
│   │   signature                              │  │
│   │   story."   ← massive, slightly above ctr│  │
│   └────────────────────────────────────────┬─┘  │
│   [hero image bleeds OVER bottom of type]  │    │  ← z-index layered, not flat behind
│                              ┌─────────────┴──┐ │
│                              │ frosted card    │ │  ← rgba(87,83,73,0.45) + backdrop-blur
│                              │ "1/5 · the     │ │     bottom-right, warm brown blur
│                              │  interview"    │ │
│                              └────────────────┘ │
└─────────────────────────────────────────────────┘
   ↓ scroll
┌─────────────────────────────────────────────────┐
│  section 2 — what it is (light #f2efe9)         │
│   oversized lowercase pull quote, left-aligned  │
│   "storytellers teaching storytellers, the way  │
│    coaches teach coaches."                      │
│   small body paragraph beneath, generous space  │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  section 3 — the 3 steps (dark #3c4235)         │
│   01 it interviews you                          │
│   02 it listens and finds the thread            │
│   03 it builds your signature story blueprint   │
│   numbered, lowercase, big, on card surfaces    │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  section 4 — who it's for (light)               │
│   5 small card-surface tiles in a soft grid:    │
│   coach · realtor · chiropractor · speaker ·    │
│   business owner — each with a one-liner        │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  section 5 — the blueprint deliverables (dark)  │
│   list of 7 items (origin story, core message,  │
│   unique value, ideal client, content pillars,  │
│   offer alignment, bio) — heavy lowercase type  │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  closing CTA (light, hero-scale type)           │
│   "you go in not knowing. you come out          │
│    knowing exactly who you are."                │
│   [orange pill: begin your interview →]         │
└─────────────────────────────────────────────────┘
```

## hero details

- Full-bleed background: a warm, dusty cinematic photo (interview/portrait scene — someone being interviewed, soft window light, warm tones). Sourced from Unsplash via direct URL so the file stays single.
- Subtle vignette using the dark palette color (no black) to seat the type.
- Headline absolutely positioned, left-aligned, slightly above vertical center.
- A second product/scene image (a portrait of someone speaking to a laptop — the "telling your story to a clone" idea) positioned bottom-left/center, layered with `z-index` so it bleeds OVER the descenders of the headline.
- Frosted info card bottom-right: `background: rgba(87,83,73,0.45)`, `backdrop-filter: blur(20px)`, rounded-2xl, contains a small mark + "1/5 · the interview" label in tracked uppercase-but-tiny DM Sans.

## navbar details

- Floating pill, `#f2efe9` background, sits ~16px from top with side margins (does not touch edges).
- Left side: small rounded square logo tile + tiny section label.
- Right side: hamburger glyph + orange `#fb7339` rounded pill "order"-equivalent → here it says **"begin"**.
- Aesop-level restraint: nothing else. No nav links visible. Lots of negative space.

## technical notes

- Single `index.html` at project root (replaces `src/pages/Index.tsx` route content by serving the static file). Since this project is React/Vite, the cleanest way to honor the "single HTML file, Tailwind CDN, no JS" brief is to put the file at `public/signature-story.html` AND also rewrite `src/pages/Index.tsx` to render the same markup with Tailwind classes (Tailwind is already in the project). I'll do both:
  1. `public/signature-story.html` — the literal single-file deliverable (Tailwind CDN, Google Fonts, no JS) that the user can download/share.
  2. `src/pages/Index.tsx` — same design rendered via the project's existing Tailwind so the live preview shows it at `/`.
- Add DM Sans to `index.html` `<head>` (Google Fonts) and set it as the default font family.
- Use arbitrary Tailwind values (`bg-[#f2efe9]`, `text-[#575349]`, etc.) to enforce the exact palette without touching the design tokens.
- No JS, no animation libs. Any "parallax energy" comes from `background-attachment: fixed` on the hero and generous scale — purely CSS.

## images

Will use 2-3 carefully chosen Unsplash photos via direct URL (warm-toned interview / portrait / hands-on-laptop scenes). No RVs, no outdoors. If any feel cool-toned in preview I'll swap them.

## out of scope

No working chat, no form, no backend. The "begin" CTA is a visual anchor only (anchors to the closing section).
