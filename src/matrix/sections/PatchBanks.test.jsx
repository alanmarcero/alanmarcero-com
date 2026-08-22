/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import PatchBanks, { headingIdFor } from './PatchBanks';
import { patchBanks } from '../../data/patchBanks';

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
