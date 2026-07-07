# Lissajous Halo — live XY-oscilloscope ring around the hero mark

**Date:** 2026-07-07
**Status:** Approved

## Summary

Add a fun, decorative UI element built from **parametric equations**
([Wikipedia](https://en.wikipedia.org/wiki/Parametric_equation)): an animated
neon curve that rings the hero mark like the trace on an XY-mode oscilloscope.
It continuously morphs through a set of Lissajous figures and a rose curve, with
a bright "beam" packet crawling along the trace. Purely decorative; matches the
site's Hard Outrun CRT / phosphor-scope visual language.

## Motivation

The site already speaks in oscilloscope metaphors: `HeroScopeTrace` (a horizontal
scrolling waveform, i.e. an X-only scope) behind the hero, `WaveformDivider`, and
a `SignalMeter` spectrum analyzer in the footer. An XY-mode scope traces 2D
**parametric curves** — the natural next member of that family. The hero mark's
CSS already describes a "breathing phosphor halo"; this adds an animated line-art
halo in the same spirit.

## The math

Sampled on a fixed parameter grid `t ∈ [0, 2π]` (one shared sample count so paths
are morph-compatible):

- **Lissajous:** `x = A·sin(a·t + δ)`, `y = B·sin(b·t)`
- **Rose:** `r = cos(k·t)`, then `x = r·cos t`, `y = r·sin t`

Morph sequence (all closed over `[0, 2π]`, equal point counts):
`3:2 → 5:4 → 3:4 (Lissajous) → 5-petal rose → back to 3:2`.

## Architecture

Mirrors the existing pattern: **pure geometry module + tested SVG graphic + CSS.**

| File | Role |
|------|------|
| `src/components/graphics/parametric.js` | **New.** Pure functions: `lissajousPoint(a,b,delta)`, `rosePoint(k)`, `buildParametricPath(pointFn, opts)` returning an SVG `d` string sampled on a fixed grid. No side effects. |
| `src/components/graphics/parametric.test.js` | **New.** Unit tests for the geometry (point counts, closed curves, known values, determinism). |
| `src/components/graphics/LissajousHalo.jsx` | **New.** SVG component: echo trace + main trace + tracer beam; SMIL `<animate>` morph of `d`; `usePrefersReducedMotion` → single static curve, no morph/beam. `aria-hidden`. |
| `src/components/graphics/LissajousHalo.test.jsx` | **New.** Render tests: renders paths; omits morph/beam animation when reduced motion is set. |
| `src/components/graphics/index.js` | Export `LissajousHalo`. |
| `src/components/Hero.jsx` | Render `<LissajousHalo className="hero-mark-halo" />` inside `.hero-mark`. |
| `src/App.css` | `.hero-mark { overflow: visible }` + `.hero-mark-halo` absolute positioning (negative insets so it rings the badge; z-index behind the badge) + tracer-beam keyframe. |

## Behavior & guardrails

- **Decorative:** `aria-hidden="true"`, `pointer-events: none`, no interaction.
- **Reduced motion:** respects `prefers-reduced-motion` — a single static phosphor
  curve, no SMIL morph and no marching beam (consistent with `HeroScopeTrace`).
- **Layering:** halo sits behind the badge (z-index 0); the badge's opaque panel
  circle masks the center so only the outer excursions read as a glowing ring.
- **No layout impact:** absolutely positioned within the existing `.hero-mark`.
- **Palette:** uses the phosphor/amber CSS custom properties already in the theme.

## Testing

- Geometry: pure-function unit tests (deterministic output, correct sample counts,
  first/last point continuity for closed curves, known Lissajous/rose values).
- Component: React Testing Library — renders expected `<path>` elements; asserts
  morph `<animate>` present in motion mode and absent under reduced motion.
- Full existing suite must stay green.

## Out of scope (YAGNI)

- No user controls / interactivity (that would be the arcade-toy concept).
- No new arcade game.
- No changes to other pages or components.
