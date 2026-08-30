/**
 * --- The token contract's own guard ----------------------------------
 *
 * `tokens.css` is the contract every slice codes against, and the failure
 * mode it cannot defend against by itself is SILENT: an undefined custom
 * property does not error. `font-weight: var(--weight-panel)` with no
 * `--weight-panel` defined renders at `normal`; `color: var(--phosphor)`
 * with no `--phosphor` silently inherits. Nothing fails, no test goes red,
 * and the page renders wrong.
 *
 * m1 and agatha-13 have each shipped a token conversion whose safety rested
 * on checking this BY HAND at the moment of the change ("every referenced
 * --track-* is defined", "every referenced --weight-* is defined"). That is
 * a discipline applied once by whoever remembered; this is the mechanism.
 * m3 wrote the first version of it for `patchbanks.css` alone
 * (PatchBanks.test.jsx, fdf9931); this generalises it to every sheet on
 * both entry points, which is m1's side of the contract.
 *
 * THE GENERALISATION IS NOT THE OBVIOUS ONE, AND THE NAIVE FORM FAILS ON
 * CORRECT CODE. Widening m3's regex to the whole tree reports two
 * "unresolved" names, and both are correct usage:
 *
 *   --photo-brightness   consumed only as `var(--photo-brightness, 1)` —
 *                        a fallback makes it self-resolving by construction
 *   --bulb               never defined in any sheet; injected per-element
 *                        from JSX (`style={{ '--bulb': index }}`)
 *
 * So a custom property has THREE legitimate resolution routes and a text
 * scan of the stylesheets can only see one of them:
 *
 *   1. defined in a loaded sheet          <- the only one m3's form checks
 *   2. consumed with an inline fallback   <- `var(--x, 1)`
 *   3. injected at runtime from JS        <- `style={{ '--x': v }}`
 *
 * Miss 2 and 3 and the guard fails the build on two working declarations,
 * which is the failure that gets a guard deleted rather than fixed.
 *
 * WHAT THIS CANNOT SEE, stated here because the caveat belongs beside the
 * instrument and not in the conversation that found it:
 *
 *   - It reads SOURCE, so it shares the count-tell's false-subject blind
 *     spot: a declaration that loses the cascade is still checked, and a
 *     name consumed only by a dead declaration still counts as consumed.
 *     It answers "does this name resolve", never "does this rule apply".
 *   - Route 3 is matched by the literal string in a JSX inline style. A
 *     property name built dynamically (`{[`--${k}`]: v}`) is invisible to
 *     it and would read as unresolved.
 *   - It does not check the reverse direction. A token defined and never
 *     consumed is not an error here; the contract may legitimately define
 *     ahead of use.
 *   - It proves resolution, NOT correctness. `var(--panel)` where
 *     `var(--panel-2)` was meant resolves perfectly.
 */

import fs from 'node:fs';
import path from 'node:path';

const read = (rel) => fs.readFileSync(path.resolve(__dirname, rel), 'utf8');

// Import chains, as they actually are. MatrixApp.jsx imports tokens/layout/
// matrix; each section imports its own sheet. ArcadeShell.jsx imports
// tokens/layout/arcade, and GameView.jsx adds game-chrome.
const ENTRY_POINTS = {
  'matrix.html (MatrixApp)': [
    'tokens.css',
    'layout.css',
    'matrix.css',
    'hero.css',
    'sections/music.css',
    'sections/patchbanks.css',
  ],
  'arcade.html (ArcadeShell)': [
    'tokens.css',
    'layout.css',
    'arcade/arcade.css',
    'arcade/game-chrome.css',
  ],
};

const JSX_FILES = [
  'MatrixApp.jsx',
  'Hero.jsx',
  'Footer.jsx',
  'YouTubeFacade.jsx',
  'sections/PatchBanks.jsx',
  'sections/Music.jsx',
  'graphics/EnvelopeField.jsx',
  'graphics/SpectrumBars.jsx',
  'arcade/ArcadeShell.jsx',
  'arcade/GameView.jsx',
  'arcade/Marquee.jsx',
];

const DEFINED = /^\s*(--[A-Za-z0-9-]+)\s*:/gm;
const CONSUMED_NO_FALLBACK = /var\(\s*(--[A-Za-z0-9-]+)\s*\)/g;
const INJECTED_FROM_JSX = /'(--[A-Za-z0-9-]+)'\s*:/g;

const matches = (text, re) => [...text.matchAll(re)].map((m) => m[1]);

describe('custom-property contract', () => {
  // Route 3. Collected once: an inline style set anywhere in the tree can
  // supply a property to any sheet that element's subtree renders under.
  const injected = new Set(JSX_FILES.flatMap((f) => matches(read(f), INJECTED_FROM_JSX)));

  it('finds the runtime-injected properties it needs to know about', () => {
    // Guards route 3's side. If this regex silently stopped matching, every
    // injected property would read as unresolved and the suite below would
    // fail loudly rather than pass vacuously — but it would fail for the
    // wrong reason, so name the expectation.
    expect([...injected].sort()).toEqual(['--bulb', '--photo-brightness']);
  });

  describe.each(Object.entries(ENTRY_POINTS))('%s', (_entry, sheets) => {
    const defined = new Set(sheets.flatMap((s) => matches(read(s), DEFINED)));

    it('defines every custom property its sheets consume without a fallback', () => {
      const consumed = sheets.flatMap((sheet) =>
        matches(read(sheet), CONSUMED_NO_FALLBACK).map((name) => ({ sheet, name })),
      );

      // Guard BOTH sides we read from. A set-difference over an empty haul
      // passes vacuously and reports a clean contract — the failure shape
      // that certified a zero-byte ledger as healthy in this project's own
      // history. An audit that passes on empty input has not passed.
      expect(defined.size).toBeGreaterThan(0);
      expect(consumed.length).toBeGreaterThan(0);

      const unresolved = consumed
        .filter(({ name }) => !defined.has(name) && !injected.has(name))
        .map(({ sheet, name }) => `${sheet}: ${name}`)
        .sort();

      expect(unresolved).toEqual([]);
    });
  });
});
