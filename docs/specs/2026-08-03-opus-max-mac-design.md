# /opus-max-mac — an ephemeris of the work

A fourth, independent design of the main page and the arcade, served at
`/opus-max-mac` and `/opus-max-mac-arcade`. It reuses the site's content — the
eleven patch banks, the live release list, the twelve arcade machines — and
takes nothing from any existing design. The era themes are deliberately absent.

This document is the record of what was decided and why. An earlier draft was
put through three independent critiques (collision, accessibility, honesty)
before any of the page was built; most of what follows is the second draft.

## What it is

**An observatory almanac, printed at dusk.** The page is the sheet an observer
takes to the eyepiece.

Kepler's *Harmonices Mundi* (1619) argued the planets' orbital periods stand in
musical ratios to one another, so plotting a catalogue of tuned sounds as orbits
is not a costume borrowed from astronomy — it is the oldest version of the same
idea. **The signature is the interval orrery**: eleven banks as eleven bodies,
one per just interval, turning. One showpiece; everything around it holds still.

### The palette is the sky, and it is not a metaphor

Deep indigo overhead, and at the horizon the rose band real observers call the
**Belt of Venus** — the sunlit air you see looking *away* from the sunset, during
the hour you actually go out to observe. Indigo is the ground. Rose is every
mark the instrument makes. Nothing else gets a colour.

### What this design must not borrow

| Route | Identity | Off limits here |
|-------|----------|-----------------|
| `/` | Studio dark | phosphor green `#4af2a4`, VU amber `#ffb454`, panel surfaces, Archivo + IBM Plex Mono |
| `/matrix` | Patch Sheet | warm graphite panel, amber LCD accent, silkscreen legends, the faceplate metaphor |
| `/opus5ios` | Printed proof on black stock | **hairline rules as the separation device**, Instrument Serif / Inter Tight / Azeret Mono, blue + vermilion, "Fig. n" captions, duotone-by-blend photographs, drawn faceplate plans, **a word with a rule under it and a ▸ in front** |

Also off limits, because they are what any generated design reaches for: a cream
ground with a high-contrast serif and a terracotta accent; a near-black ground
with one acid accent; a broadsheet of hairline rules and dense columns. And the
first draft's own near-miss: **navy + champagne gold + a Didone + roman numerals
+ a starfield**, which is the celestial template, not a design.

Concretely, versus the first draft: the ground moved off the L\* 4–8 plateau all
three existing routes share (ΔE76 ≥ 18 from every one of their surfaces), the
off-white ink was replaced (three routes already have one at R 232–233), the
champagne gold was dropped entirely, Bodoni Moda was dropped, **the monospace
was dropped**, the starfield was dropped, and the page's structure was changed
from eleven stacked three-column plates — which is `/opus5ios`'s rhythm no
matter what colour it is painted — to a register with one instrument beside it.

**No cards** on either route: nothing has a background panel, a corner radius, a
shadow or a border. **No hairline rules between items** either. With both of
those unavailable, separation is rhythm and one device:

### The structural device: the register line

A label on the left, a figure on the right, and a run of dots holding the two
ends together. Every ephemeris, timetable and star index ever printed does this.
It carries the bank names, every action, the bench readout and the tracklist —
so a thing you can do looks like a thing you can read, and the whole line is the
hit target. `.line` / `.act` in `dusk.css`.

## Tokens

Dark only. Every ratio measured against **all three** grounds a mark can land on,
because a number that only holds against the darkest one is not a number.

```css
--dusk: #171334;       /* the ground   L* 8.1, C* 24.7 — ΔE76 ≥ 18 from every
                          existing route surface, and chromatic enough that the
                          hue, not the lightness, is what separates them */
--dusk-deep: #120c2a;  /* the far edge; the field a game runs on */
--horizon: #2b1d4a;    /* the wash's low end */
--field: #221c46;      /* the ground a figure sits on */
--field-lit: #2c2458;

/*                        dusk    field   field-lit */
--ink: #e6ddfa;       /* 13.6:1  12.2:1   10.9:1   headings, names, figures */
--prose: #cfc7e2;     /* 11.0:1   9.8:1    8.7:1   running prose */
--quiet: #9d99c2;     /*  6.6:1   5.9:1    5.2:1   annotation */

--rose: #dc93a9;      /*  7.5:1   6.7:1    5.9:1   the instrument layer */
--rose-lit: #ffb0c3;  /* 10.4:1   9.3:1    8.2:1   live, hover, focus, current */
--rose-mark: #a3707f; /*  4.4:1   3.9:1    3.5:1   marks that carry meaning */
--haze: #372e61;      /*  1.5:1   decorative only */

--face: 'Spectral', Georgia, serif;   /* the only family on the route */
```

`--prose` is deliberately **not** the brightest ink. Maximum contrast on a dark
ground is where a serif blooms and its counters fill in; 9–12:1 is the
comfortable band for long-form.

A `--rose-mark` stroke is **never** dimmed with `opacity` or `stroke-opacity` —
that multiplies straight into the ratio. Change the colour instead.

### One family

Spectral, at 300 (display only, above 2.5rem), 400 (prose) and 600 (names and
every gloss). **There is no monospace on this route.** All three existing routes
pair a display face with a text face and set every machine-made figure in a
mono; this one sets its figures in the same serif with `tabular-nums`, which is
what an almanac has always done, and is the one typographic structure left
unclaimed.

## Where each figure comes from

No randomness at render time, and each figure states its own provenance.

| Figure | Source |
|---|---|
| the orrery's rings and periods | the assigned interval — **a label**, see below |
| a body's size and magnitude | the patch count — **the one measurement** |
| the bodies' starting phases | a golden-angle sequence — spacing, not data |
| the plate graticule | geometry |
| an Airy disc | physics: the zeros of J₁ |
| a key cluster | the game's own `controls.keyboard` |

**The interval is a designation, assigned by catalogue position, exactly as the
roman numeral is. It is not derived from the bank.** No field in
`patchBanks.js` ranks eleven banks distinctly — `count` has five distinct values
(128 on seven of eleven, then 100, 88, 64, none), `audioDemo.length` has three —
so a scale of eleven cannot be earned from the data. The page says this, in those
words, in the orrery's caption. What the figure measures is the patch count:
seven of the eleven hold 128 patches, so seven bodies match, and that is worth
seeing.

### orbits.js

Eleven just intervals, ascending: `1:1 16:15 9:8 6:5 5:4 4:3 3:2 8:5 5:3 15:8 2:1`.
Period is `96 · den/num`, so a higher interval turns faster; radius follows
Kepler's third law, `a ∝ T^(2/3)`, normalised into `[0.2, 1.0]` of the field
radius. **Radii therefore *descend* with catalogue index** — entry I is the
outermost ring and XI the innermost — because a higher interval is a faster
vibration and Kepler puts a faster body closer in. That is intended, and the
test asserts that direction.

The magnitude is **not** printed in the bench beside the patch count it is
computed from — two figures a line apart read as two measurements, and seven of
the eleven would print the same 2.0 anyway. It stays inside the figure, where
size and brightness already carry it; the one bank with no count is drawn
**hollow** rather than at the floor of the scale, so the figure claims nothing
for the entry whose readout says there is nothing to claim.

Bodies are drawn small (0.4–0.8 units in the 100-unit field) because Kepler
crowds two of the eleven pairs to 1.85 units apart; `closestApproach()` exists so
a test can hold the body scale to the real gap rather than to a comment. Size is
carried to the eye by a halo, which is decorative and free to overlap — two
glows blending is what a conjunction looks like.

### airy.js — the three banks with no photograph

**Roland SH-01A** (no freely-licensed photograph exists anywhere — re-verified
2026-08-03: no `Category:Roland SH-01A`, and `File:Roland GAIA SH-01.jpg` is a
different synth while the SH-101 files are the 1982 original), **Waves CODEX** (a
plugin) and **Audio Demo MIDIs** (not an instrument) are drawn as the image a
telescope actually makes of a source it cannot resolve: an Airy diffraction
pattern, from the zeros of J₁. A drawing of a diffraction pattern cannot be
mistaken for a photograph of a machine that does not exist; a substituted
SH-101 shot could.

**That is not the same three banks that have no audio demo.** The no-demo set is
JP-08, CODEX and the MIDI collection; they overlap on two of three. The SH-01A
has a demo and no photograph; the JP-08 has a photograph and no demo. Both sets
are derived — from `synthImages` and from `audioDemo.length` — never hardcoded as
one list.

## The main page

```
 EPHEMERIS OF THE WORK · EDITION 2026 · 11 BANKS
                                                   ╭───────────────╮
 Alan Marcero                                      │  the interval │
 ─────────────                                     │    orrery     │
 SYNTHESIST · SOUND DESIGNER · BOSTON               │   (turning)   │
 prose, one measure                                ╰───────────────╯
                                                   I 1:1 · VI 4:3 · XI 2:1
 1,148 patches   11 patch banks   N releases       caption + pause control
 Subscribe on YouTube ········· CHANNEL
 Enter the arcade ············· 12 MACHINES

 FIND AN INSTRUMENT OR A TRACK   [ ______________ ]

 Patch banks                          REGISTER · 11 ENTRIES · FREE

  I   Sequential Prophet 08 and Rev2 ········ 128 PATCHES    ╭────────╮
      128 trance and synthwave patches. Compatible with…     │ plate  │
      Download ···························· ZIP             ╰────────╯
      Hear it ····························· DEMO 1          DESIGNATION ·· I
 II   Nord Lead 3 and Nord Rack 3 ·········· 128 PATCHES     INTERVAL ····· 1:1
      …                                                      PATCHES ······ 128
```

The register is **rows, not blocks**, and one instrument sits beside it showing
whichever row is being read (a band across the middle of the viewport decides
which — `useNearestRow`). That puts one large photograph on the page instead of
eleven small ones and loads one instead of eight. Below 62rem there is nowhere to
park a bench, so each row carries its own figure; the swap is made in JavaScript
on a media query, not in CSS, because a `display: none` `<img>` is still an
`<img>` the browser fetches.

Rules the copy follows:

- Headings and controls stay plain — **Patch banks**, **Releases**, **Arcade**,
  `Download`, `Hear it`, `Play`. The almanac voice lives in the glosses and
  captions and never makes an action ambiguous.
- **A legend never states a figure the data does not hold.** A bank with no
  patch count reads `MIDI FILES`, not a fabricated magnitude. The release figure
  is omitted until the fetch resolves, and stays omitted on error — never
  `0 releases`.
- Counts are counted honestly: **11 patch banks**, not "11 instruments" (the
  Prophet bank alone lists five compatible machines, and one entry is not an
  instrument at all).
- The edition year is computed, never written into the markup.
- The three banks with no demo say `NO DEMO ON FILE` rather than stopping.

The bio keeps every fact the present site states: Boston; trance and electronic;
original tracks, remixes and sound design since the early 2000s; supported by
Ferry Corsten, Paul van Dyk, Sean Tyas and Daniel Kandi; A State of Trance and
BBC Radio 1's Essential Mix; released on Armada, Bonzai and Ministry of Sound.

## Motion

One arrival (the strip, the name, the role, then the rings drawing themselves in
outermost-first, then the bodies) and one ambient loop (the bodies turning at
their own periods). Nothing else moves.

Entrance animations live **inside `@media (prefers-reduced-motion: no-preference)`**
and the resting state is the base style. Written the other way round — hidden in
the base rule, revealed by an animation — a reader who asks for less motion gets
a blank masthead and eleven undrawn orbits, and no amount of `!important` in a
reduce block brings them back.

The orrery **can be stopped**: WCAG 2.2.2 asks for a control on the page, and an
operating-system preference is not one. The button is hidden when that preference
is already set, because then there is nothing left to stop. The figure also stops
turning off-screen — eleven simultaneous SVG rotations repaint the whole figure
every frame, and SVG transforms do not composite the way HTML ones do.

## The arcade

`/opus-max-mac-arcade`. The `<h1>` is **Arcade** — a visitor must be able to tell
what the page is; the almanac voice goes in the kicker.

The showpiece is an **azimuth dial**: twelve sectors, one per machine, the one
you are pointing at lit, with its name set in the middle of the dial. It is a
figure, not a control — `aria-hidden`, `focusable="false"`, `pointer-events:
none`, nothing focusable inside — because the twelve rows below are the twelve
real controls, and a sector that lights under the cursor but does nothing is a
lie.

Each row is **two columns**: the machine's name (which is the button that starts
it) with its description, and a **key cluster** drawn from that game's own
`controls.keyboard` — the four arrow positions as caps, used ones lit and unused
ones left as empty outlines, so a glance tells you Pong is a two-key game and
Pac-Man a four-key one. That replaces both the old design's mark column and its
keys column with one thing that is derived from data and is actually useful. The
same information reaches a screen reader as a sentence.

**The games are not re-worked.** `GameCanvas`, the loop, the HUD markup and the
touch controls are the existing runtime, mounted unchanged and lazily.
`screen.css` covers every class name that runtime emits, since it imports no
stylesheet of its own. The frame is an eyepiece. Of the runtime's three CRT
overlay divs, `.game-crt-overlay` and `.game-crt-reflection` are hidden — there
is no phosphor here — and `.game-crt-vignette` is **kept and restyled** as the
eyepiece's own vignette, because a circular field darkening at its edge is
exactly what looking through one does. Hidden rather than deleted: the runtime is
shared with the routes that want them.

What the new route fixes in its own new files, without touching the shared
runtime:

- A capture-phase `keydown` handler swallows the arrows, Space and the paging
  keys while a game runs. Without it the document behind the fixed wrapper
  scrolls, and — because focus can be left on a HUD button by a click — Space
  both fires and re-activates that button, so playing Space Invaders after
  pressing "Copy Link" re-copies the URL on every shot. The **game-over overlay
  is exempt**, scoped to the overlay rather than to buttons in general:
  cancelling a button's keydown is exactly what stops Space activating it, so a
  blanket exemption would hand Space straight back to the strip and reinstate
  the bug. A click on any button in the stage also returns focus to the stage,
  which is what makes the narrow exemption sufficient.
- Focus moves into the stage on mount, with an `.sr-only` description saying
  Escape leaves and naming the controls; leaving a game returns focus to the
  button that started it, rather than dropping it on `<body>`.
- At 320px in portrait the d-pad covers about 39% of the play field, so the
  canvas gives up a transparent bottom band, and the controls take
  `env(safe-area-inset-bottom)` so the bottom row is not under a home bar.

## Photographs

`scripts/fetch-opus-max-mac-photographs.py` → `public/opus-max-mac/plates/*.webp`
+ `src/opusmaxmac/data/plates.js`.

A **third** distinct Commons file per instrument, different from both existing
generators. The plate is a circle, so the generator **centre-crops to a square**
before resizing — the frames were chosen by doing exactly that crop and masking
it to a circle, and a generator that skipped the crop would ship a composition
nobody checked. Square derivatives at 320 and 640, **never upscaled**: a small
original gets one file and the page's `srcset` is built from the widths the data
records.

Licences must permit commercial use and modification; the script refuses anything
else rather than shipping it. Two picks need notes: the nord-lead-2x frame is a
**Nord Rack 2**, the rackmount of the Nord Lead 2 the bank names, and says so in
its alt text (`File:Clavia Nord Rack 2x.jpg` looks like a better pick and is not —
its wikitext carries `{{RetouchedPicture}}` and its panel pixels are another
generator's photograph composited onto a rack body); and the Slim Phatty file is
a derivative whose author field is a two-step chain that CC requires be preserved
rather than truncated to one name.

The imprint's credits block is the CC BY / BY-SA condition being met, not a
courtesy. Remove it and the photographs have to go too.

## Quality floor

Responsive to 320px. Visible keyboard focus. `prefers-reduced-motion` honoured
by construction rather than by override. A `forced-colors: active` block — SVG
`fill` and `stroke` are deliberately *not* forced, so without it every figure on
both routes would stay rose-on-white; every drawn `<svg>` root carries `.fig`,
and lit marks carry `data-lit` so they can be mapped to `Highlight`. A skip link
that moves focus. One `<h1>` per route. Every external link
`rel="noopener noreferrer"`. `npm test` and `npm run build` green, and no
existing route's files touched — the only shared changes are `vite.config.js`,
`CLAUDE.md`, and the two new HTML entries.
