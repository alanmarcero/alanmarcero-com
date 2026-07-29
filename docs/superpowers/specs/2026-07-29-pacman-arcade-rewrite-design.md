# Pac-Man — from-scratch arcade rewrite

**Date:** 2026-07-29
**Status:** Approved

Replace `src/arcade/games/pac-man/` wholesale with a faithful reimplementation of
the 1980 arcade game. The existing version is 1,108 lines in one file, uses an
invented maze, and approximates the ghost behaviour. Nothing is carried over.

Two areas carry the most weight, per the request: **ghost AI** and **control
feel**. Everything else supports those.

## Colour exception

The arcade uses authentic 1980 colours — blue maze, yellow Pac-Man, red/pink/
cyan/orange ghosts. This deliberately breaks the "Outrun CRT palette only" rule
CLAUDE.md states for arcade games. The exception is intentional and gets
recorded in CLAUDE.md; the cabinet card in the picker keeps the site palette so
the arcade index stays consistent.

## Modules

| File | Responsibility | Purity |
|---|---|---|
| `maze.js` | 28×31 grid, tile queries, tunnel wrap, dot bookkeeping | pure |
| `levels.js` | Per-level speed/timing/fruit tables | pure data |
| `ghostAI.js` | Target selection + the movement decision rule | pure |
| `PacManRenderer.js` | All drawing | side-effecting on ctx only |
| `PacMan.js` | Game class: state machine, movement, collisions, scoring | stateful |

Splitting the pure three out is the point: the arcade rules become directly
unit-testable, which a single file cannot offer. `PacMan.js` implements the
existing game interface (`init`/`resize`/`update`/`render`/`handleKeyDown`/
`handleKeyUp`/`handleTouchAction`/`destroy`, `onHudUpdate`) and reports through
the shared `emitHud` helper.

## The maze

Authored as an array of strings, not nested integers — the layout is legible in
the source and diffs meaningfully.

```
# wall     . dot      o energizer
  space    - house door    (house interior is enclosed by walls)
```

28 columns × 31 rows. Two tunnels on row 14 wrap horizontally. Invariants
enforced by test:

- exactly 240 dots and 4 energizers (244 total)
- 28×31 dimensions, every row the same length
- left/right mirror symmetry
- Pac-Man's start and all four scatter targets sit on expected tiles

## Ghost AI

This is the section that matters. The arcade algorithm is documented public
knowledge (Jamey Pittman, *The Pac-Man Dossier*). It is **not** pathfinding.

### The decision rule

A ghost holds a direction and moves continuously. On **entering a new tile** it
decides its next direction by looking one tile ahead:

1. Enumerate the exits of the tile being entered.
2. Remove the reverse of the current direction. Reversal is never a choice — it
   is only ever imposed (see below).
3. Remove `up` if the tile is one of the four **no-up tiles**.
4. Of the remaining candidates, choose the one whose destination tile has the
   smallest **Euclidean distance** to the ghost's target tile. Distance is
   compared squared; no square root is needed.
5. Break ties in the fixed order **up, left, down, right**.

One tile of lookahead, greedy, stateless. That is the whole thing. The apparent
intelligence is emergent — it comes entirely from what each ghost passes as its
target tile.

Reversal is imposed, never chosen, in exactly two cases: a scatter↔chase mode
flip, and the moment frightened mode begins.

### The four targets

| Ghost | Chase target | Scatter target |
|---|---|---|
| **Blinky** (red) | Pac-Man's tile | top-right `(25, 0)` |
| **Pinky** (pink) | 4 tiles ahead of Pac-Man | top-left `(2, 0)` |
| **Inky** (cyan) | vector from Blinky through *(2 ahead of Pac)*, doubled | bottom-right `(27, 30)` |
| **Clyde** (orange) | Pac-Man's tile if >8 tiles away, else his scatter corner | bottom-left `(0, 30)` |

### The overflow bug is preserved

When Pac-Man faces **up**, Pinky's "4 tiles ahead" is computed as 4 up **and 4
left**, and Inky's "2 ahead" likewise as 2 up and 2 left. This is an original
8-bit overflow bug. It is retained deliberately — it changes how the ghosts pack
around a north-facing Pac-Man and is load-bearing for real play. A comment marks
it so nobody later "fixes" it.

### Other states

- **Frightened** — random legal direction at each decision point (no reverse).
- **Eaten** — eyes target the house door tile and may pass through the door.
- **In-house / leaving** — vertical bob, then exit; governed by dot counters.

## Control feel

Three mechanics, in order of importance.

**Cornering.** Approaching a corner while holding a perpendicular direction,
Pac-Man begins moving on the new axis before reaching the tile centre, tracking
both axes through the turn. Ghosts must pass orthogonally through centres, so
cornering is a genuine, earned speed advantage. This single mechanic is the
difference between tight and mushy Pac-Man.

**Buffered pre-turn.** The requested direction is retained and applied at the
first legal opportunity rather than dropped, so an early press still lands.

**Instant reversal.** A 180° flip applies on the same frame, never waiting for a
tile centre.

Underneath all three: a **fixed-timestep accumulator** (120 Hz logic) so
movement is deterministic and independent of rAF jitter. The game's history
includes a "movement and ghost pathfinding freezing" fix; a fixed step removes
that class of bug and makes tests reproducible.

## Level tables

Encoded as named data in `levels.js`, auditable rather than scattered as magic
numbers. Speeds are percentages of the arcade's 100% ≈ 75.76 px/s.

- **Speeds** — Pac 80→100%, ghosts 75→95%, frightened ghosts 50→60%, tunnel
  40→50%, scaling across levels 1, 2–4, 5–20, 21+.
- **Scatter/chase waves** — 7/20/7/20/5/20/5/∞ at level 1, tightening after.
- **Frightened** — 6s at level 1 decaying to 0s by level 19.
- **Cruise Elroy** — Blinky speeds up at two dots-remaining thresholds.
- **House release** — per-level dot counters (Pinky 0, Inky 30, Clyde 60 at
  level 1) plus a global timeout so a stalled player still gets ghosts.
- **Fruit** — spawns at 70 and 170 dots eaten; cherry 100 → key 5000.

## Scoring

Dot 10, energizer 50, ghost chain 200/400/800/1600 reset per energizer, fruit
per table, extra life at 10,000.

## Out of scope

Intermission cutscenes, distinct sprites for all eight fruits (first few then
reuse), and the level-256 kill screen.

## Testing

The current 554-line test file targets internals that will not exist and is
replaced.

- `maze` — the invariants listed above.
- `levels` — table shape and boundary levels (1, 2, 5, 19, 21).
- `ghostAI` — the heaviest coverage. Each ghost's target under known states; the
  overflow bug explicitly asserted for both Pinky and Inky; tie-break order;
  no-up tiles; reverse exclusion; Clyde's 8-tile switch on both sides.
- `PacMan` — buffered turns, cornering, tunnel wrap, dot/energizer scoring,
  ghost chain scoring, life loss, level advance, HUD payload.

Pure-module tests assert on real computed values, not restatements of inputs.
