/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import PatchBanks, { headingIdFor } from './PatchBanks';
import { patchBanks } from '../../../../src/data/patchBanks';

/**
 * These assert PROPERTIES over the shipped catalogue, not a fixture, so a
 * bank added later is covered without anyone remembering to extend a list.
 *
 * The 2026-08-02 pass gave every control a unique accessible name and, in
 * doing so, broke WCAG 2.5.3: `aria-label` OVERRIDES the visible text, and
 * "Download the {bank} bank" splits the visible "Download the bank" around
 * the instrument. Both properties are tested here because fixing either one
 * alone reintroduces the other.
 */

const accessibleName = (el) => el.getAttribute('aria-label') || el.textContent.trim();
const visibleText = (el) => el.textContent.replace(/\s+/g, ' ').trim();

const renderCatalogue = () =>
  render(<PatchBanks banks={patchBanks} searchQuery="" />);

describe('PatchBanks accessible names', () => {
  it('every control\'s accessible name CONTAINS its visible text (WCAG 2.5.3)', () => {
    renderCatalogue();
    const controls = [...screen.getAllByRole('link'), ...screen.getAllByRole('button')];
    expect(controls.length).toBeGreaterThan(0);

    const offenders = controls
      .filter((el) => visibleText(el))
      .filter((el) => !accessibleName(el).toLowerCase().includes(visibleText(el).toLowerCase()))
      .map((el) => `visible "${visibleText(el)}" not in name "${accessibleName(el)}"`);

    expect(offenders).toEqual([]);
  });

  it('no two controls share an accessible name', () => {
    renderCatalogue();
    const names = [...screen.getAllByRole('link'), ...screen.getAllByRole('button')]
      .map(accessibleName);
    const duplicated = names.filter((n, i) => names.indexOf(n) !== i);
    expect(duplicated).toEqual([]);
  });

  it('names the download link for every bank without splitting its visible text', () => {
    renderCatalogue();
    for (const bank of patchBanks) {
      expect(screen.getByRole('link', { name: `Download the bank — ${bank.name}` })).toBeTruthy();
    }
  });
});

describe('PatchBanks regions', () => {
  it('gives every bank plate an accessible name resolving to a real heading', () => {
    const { container } = renderCatalogue();
    const articles = [...container.querySelectorAll('article')];
    expect(articles).toHaveLength(patchBanks.length);

    for (const article of articles) {
      const id = article.getAttribute('aria-labelledby');
      expect(id).toBeTruthy();
      expect(container.querySelector(`h3[id="${id}"]`)).toBeTruthy();
    }
  });

  it('derives collision-free ids from names carrying commas and spaces', () => {
    const ids = patchBanks.map((b) => headingIdFor(b.name));
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^bank-[a-z0-9-]+$/);
  });
});

describe('PatchBanks readouts', () => {
  it('never renders a bare "patches" label for an uncounted bank', () => {
    renderCatalogue();
    const uncounted = patchBanks.filter((b) => !b.count);
    expect(uncounted.length).toBeGreaterThan(0);
    expect(screen.getAllByText('MIDI files')).toHaveLength(uncounted.length);
    expect(screen.getAllByText('patches')).toHaveLength(patchBanks.length - uncounted.length);
  });

  it('reports the search term back when nothing matches', () => {
    render(<PatchBanks banks={[]} searchQuery="zzzz" />);
    expect(screen.getByText(/zzzz/)).toBeTruthy();
  });
});

/**
 * --- The phosphor scarcity rule ---------------------------------------
 *
 * This file briefly carried a general custom-property-resolution test. It has
 * been REMOVED rather than kept, because `../tokens.test.js` now covers the
 * same contract across all six sheets on `matrix.html` and all four on
 * `arcade.html`, and the general version is strictly better than the one I
 * wrote: a property has THREE legitimate resolution routes and my scan saw
 * one. `var(--photo-brightness, 1)` self-resolves through its fallback, and
 * `--bulb` is injected per element from `Marquee.jsx`. Mine was correct only
 * because `patchbanks.css` happens to contain neither — which is exactly the
 * kind of accident that stops being true later. Two tests asserting one
 * contract means the weaker one eventually disagrees and someone has to
 * work out which was right. (Generalised by m1 at b26dcaa, with the negative
 * control mine lacked: rename a token out of `tokens.css`, watch it go red.)
 *
 * What stays here is the part that is about THIS SLICE's design and belongs
 * nowhere else: phosphor is the signal colour and it is scarce by SEMANTICS.
 * Eleven catalogue rows is eleven chances to spend it on a non-signal, and
 * the rule only means anything while it is spent exactly once.
 *
 * Still browser-verified only, and saying so: jsdom implements neither
 * `:has()` nor stylesheet computation, so this asserts the RULE EXISTS and is
 * unique — not that it matches the playing row at runtime.
 */
import fs from 'node:fs';
import path from 'node:path';

describe('patchbanks.css phosphor scarcity', () => {
  it('spends --phosphor exactly once, on the live row', () => {
    const css = fs.readFileSync(path.resolve(__dirname, './patchbanks.css'), 'utf8');
    // The comments explain the scarcity rule at length; only declarations count.
    const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');

    // Guard the side we read FROM: an empty haul would make the count below
    // pass at zero and report a rule that is simply absent.
    expect(declarations.trim().length).toBeGreaterThan(0);

    const phosphorUses = [...declarations.matchAll(/var\(\s*--phosphor\b/g)];
    expect(phosphorUses).toHaveLength(1);
    expect(declarations).toMatch(/\.plate:has\(\.player\)\s+\.entry__name\s*\{/);
  });
});

/**
 * --- The mass scale is total over what the component can emit ----------
 *
 * `patchbanks.css` enumerates data-coverage 0..5. `coverageOf` is unbounded
 * (`bank.instruments.length`), so before the clamp a sixth instrument on the
 * widest bank matched NO bucket, fell through to `.plate__body`'s default
 * padding, and rendered TIGHTER than a bank with three — the inverted
 * hierarchy that CSS block already documents itself getting wrong once.
 *
 * Latent, not live: counts are [5 2 4 1 1 4 2 4 1 1], max 5, scale top 5.
 * One instrument away, and adding one is the most ordinary edit this data
 * takes. The CSS promises adding a BANK cannot land in an unchosen bucket;
 * it is adding an INSTRUMENT that falls off.
 *
 * This asserts the two halves cannot drift apart: every value the component
 * can emit has a rule. It reads the buckets out of the stylesheet rather
 * than restating them, so widening the CSS without raising the clamp fails
 * here instead of shipping.
 *
 * WHICH OF THESE TWO ACTUALLY DISCRIMINATES TODAY, because the answer is
 * not the one the names suggest. Negative controls, run 2026-08-30:
 *
 *   un-clamp data-coverage        -> only the CLAMP test goes red
 *   add a '6' bucket, keep clamp  -> only the CLAMP test goes red
 *   spend --phosphor twice        -> only the SCARCITY test goes red
 *
 * The totality test — the one that reads like the guard on this bug —
 * stays GREEN with the clamp removed. It has to: the shipped data maxes at
 * 5, so un-clamping emits nothing out of range *yet*. It is a regression
 * detector armed for the day the data grows, not evidence the clamp works.
 * The clamp test is the only one carrying that weight now, and it earns it
 * by constructing a bank the data does not contain.
 *
 * Saying so because a suite reporting 10/10 invites the reading that ten
 * things were checked. Under this bug, nine of them pass.
 */
describe('patchbanks mass scale', () => {
  const cssBuckets = () => {
    const css = fs.readFileSync(path.resolve(__dirname, './patchbanks.css'), 'utf8');
    const found = new Set(
      [...css.matchAll(/\[data-coverage='(\d+)'\]/g)].map((m) => Number(m[1])),
    );
    // Guard the side we read FROM: zero buckets would make every containment
    // check below pass vacuously against an empty set.
    expect(found.size).toBeGreaterThan(0);
    return found;
  };

  it('gives every emitted data-coverage value a rule in the stylesheet', () => {
    renderCatalogue();
    const buckets = cssBuckets();
    const emitted = [...document.querySelectorAll('[data-coverage]')].map((el) =>
      Number(el.getAttribute('data-coverage')),
    );

    expect(emitted.length).toBe(patchBanks.length);
    expect(emitted.filter((v) => !buckets.has(v))).toEqual([]);
  });

  it('clamps a bank that runs off the top of the scale, and still reports the true count', () => {
    const buckets = cssBuckets();
    const top = Math.max(...buckets);
    const overflowing = {
      ...patchBanks[0],
      name: 'Overflow Test Bank',
      downloadLink: 'https://example.invalid/overflow.zip',
      instruments: Array.from({ length: top + 4 }, (_, i) => `Machine ${i + 1}`),
    };

    render(<PatchBanks banks={[overflowing]} searchQuery="" />);
    const plate = document.querySelector('[data-coverage]');

    // The bucket is clamped so a rule always matches...
    expect(Number(plate.getAttribute('data-coverage'))).toBe(top);
    expect(buckets.has(Number(plate.getAttribute('data-coverage')))).toBe(true);
    // ...while the readout still tells the truth about the bank.
    expect(screen.getByText(`Fits ${top + 4} instruments`)).toBeTruthy();
  });
});
