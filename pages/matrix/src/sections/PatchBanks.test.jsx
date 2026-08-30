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
 * --- The custom-property contract -------------------------------------
 *
 * This closes HALF of the gap the stylesheet names on itself. `patchbanks.css`
 * says of the live-row rule: "NOT UNIT-TESTED, AND SAYING SO: jsdom implements
 * neither :has() nor stylesheet computation, so this is browser-verified only."
 * That is still true of the SELECTOR and this file does not pretend otherwise —
 * `:has(.player)` matching the playing row remains browser-verified.
 *
 * But the other failure mode is static and was never covered: an undefined
 * custom property does not error. `color: var(--phosphor)` with no
 * `--phosphor` defined silently inherits, and `text-shadow: var(--bloom-phosphor)`
 * silently drops the bloom. m1 named this exact hazard when landing the
 * tracking scale — "an undefined var would have silently reverted letter-spacing
 * to `normal`, so 'the token exists' is the load-bearing half."
 *
 * It is live rather than theoretical here. Until 2026-08-30 `GROUNDRULES` told
 * every slice that `--phosphor` "does not resolve anywhere" and to define it
 * slice-locally; it now resolves from `tokens.css`. A slice deleting its local
 * block, or `tokens.css` dropping a name during a refactor, breaks this section
 * with no error anywhere — the page just renders the wrong colour.
 *
 * So: assert every property this stylesheet CONSUMES is DEFINED in a sheet the
 * component tree actually loads. Reading the files as text is the point — it
 * needs no CSS engine, so it runs in the suite that already exists.
 */
describe('patchbanks.css custom-property contract', () => {
  const fs = require('fs');
  const path = require('path');

  // Sheets MatrixApp imports (tokens, layout, matrix) plus this section's own.
  const LOADED = ['../tokens.css', '../layout.css', '../matrix.css', './patchbanks.css'];

  const read = (rel) => fs.readFileSync(path.resolve(__dirname, rel), 'utf8');

  it('defines every custom property patchbanks.css references', () => {
    const consumed = new Set(
      [...read('./patchbanks.css').matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)].map((m) => m[1]),
    );
    const defined = new Set(
      LOADED.flatMap((rel) => [...read(rel).matchAll(/^\s*(--[a-zA-Z0-9-]+)\s*:/gm)].map((m) => m[1])),
    );

    // Guard the side we read FROM: an empty regex haul would make the
    // set-difference below pass vacuously and report a clean contract.
    expect(consumed.size).toBeGreaterThan(0);
    expect(defined.size).toBeGreaterThan(0);

    const unresolved = [...consumed].filter((name) => !defined.has(name)).sort();
    expect(unresolved).toEqual([]);
  });

  it('still spends --phosphor exactly once, on the live row', () => {
    const css = read('./patchbanks.css');
    // Comments explain the scarcity rule at length; only declarations count.
    const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const phosphorUses = [...declarations.matchAll(/var\(\s*--phosphor\b/g)];

    expect(phosphorUses).toHaveLength(1);
    expect(declarations).toMatch(/\.plate:has\(\.player\)\s+\.entry__name\s*\{/);
  });
});
