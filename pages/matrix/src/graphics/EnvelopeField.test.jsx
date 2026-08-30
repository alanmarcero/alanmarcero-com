/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import EnvelopeField from './EnvelopeField';

const base = { seed: 'hero', count: 12, columns: 4 };
const glows = (c) => [...c.container.querySelectorAll('path')]
  .filter((p) => (p.getAttribute('style') || '').includes('drop-shadow'));

/*
 * The guard the first version of banding did not have, and the reason it
 * needed one: weighting the bands raised the field's total ink by 54% while
 * every existing test stayed green. Ink coverage is a measured number another
 * slice derives contrast decisions from, so a silent 54% is a real bill.
 * Asserted on the live catalogue's shape, since that shape is what produced
 * the drift — seven of ten bands pinned to the top of the ramp.
 */
describe('band weighting is ink-neutral', () => {
  // [128 x7, 100, 88, 64] — the real catalogue, summing to 1148.
  const catalogue = [128, 128, 128, 64, 128, 128, 100, 128, 88, 128];
  const total = catalogue.reduce((a, b) => a + b, 0);

  const bandWidths = (groups, strokeWidth) => {
    const c = render(
      <EnvelopeField seed="hero" count={total} columns={34} groups={groups} strokeWidth={strokeWidth} />,
    );
    return [...c.container.querySelectorAll('.envelope-field__band')]
      .map((p) => Number(p.getAttribute('stroke-width')));
  };

  const glyphWeightedMean = (widths, groups) =>
    groups.reduce((sum, size, i) => sum + size * widths[i], 0)
    / groups.reduce((a, b) => a + b, 0);

  it('keeps the glyph-weighted mean stroke at the caller\'s width', () => {
    const widths = bandWidths(catalogue, 1);
    expect(glyphWeightedMean(widths, catalogue)).toBeCloseTo(1, 2);
  });

  it('scales with the caller\'s width rather than pinning to 1', () => {
    const widths = bandWidths(catalogue, 2);
    expect(glyphWeightedMean(widths, catalogue)).toBeCloseTo(2, 2);
  });

  it('still separates the bands it neutralises', () => {
    const widths = bandWidths(catalogue, 1);
    // Ink-neutral must not mean uniform — that is the field this replaced.
    expect(Math.max(...widths) / Math.min(...widths)).toBeGreaterThan(1.3);
  });
});

describe('the field without a beam', () => {
  it('renders no beam and no style block by default', () => {
    const c = render(<EnvelopeField {...base} />);
    expect(c.container.querySelector('.envelope-field__beam')).toBeNull();
    expect(c.container.querySelector('style')).toBeNull();
  });

  it('adds no glow to the field itself', () => {
    expect(glows(render(<EnvelopeField {...base} />))).toHaveLength(0);
  });
});

describe('the beam', () => {
  it('renders exactly one beam path when asked', () => {
    const c = render(<EnvelopeField {...base} beam />);
    expect(c.container.querySelectorAll('.envelope-field__beam')).toHaveLength(1);
  });

  /*
   * The measurement this whole design rests on. The main site's glow sits on
   * ONE mark; this field carries up to 1,148 glyphs, and light composites
   * where ink does not — a 6px blur on a 1.25px stroke at 6.22% ink coverage
   * would put glow across ~66% of the hero from 1,089 additive sources.
   *
   * So the invariant is not "there is a glow", it is that the number of glow
   * sources is INDEPENDENT of the number of glyphs. If this test ever fails,
   * someone has moved the drop-shadow onto the field and the hero has become
   * a haze.
   */
  it('uses one glow source at twelve glyphs and at 1,148', () => {
    expect(glows(render(<EnvelopeField {...base} count={12} beam />))).toHaveLength(1);
    expect(glows(render(
      <EnvelopeField seed="hero" count={1148} aspect={1.6} beam />,
    ))).toHaveLength(1);
  });

  /*
   * A dash pattern restarts at every subpath — measured by rasterising a
   * three-subpath path, which produced three dashes (234/234/234 ink), not
   * one. So the carrier must have exactly one moveto or the single packet
   * becomes one packet per glyph.
   */
  it('rides a carrier with exactly one subpath', () => {
    const c = render(<EnvelopeField {...base} count={1148} aspect={1.6} beam />);
    const d = c.container.querySelector('.envelope-field__beam').getAttribute('d');
    expect((d.match(/M/g) || []).length).toBe(1);
  });

  it('expresses the packet against pathLength 1, so it is resolution-independent', () => {
    const c = render(<EnvelopeField {...base} beam />);
    const beam = c.container.querySelector('.envelope-field__beam');
    expect(beam.getAttribute('pathLength')).toBe('1');
    const [on, off] = beam.getAttribute('stroke-dasharray').split(' ').map(Number);
    expect(on + off).toBeCloseTo(1, 5);
  });

  /*
   * The animation travels in the SVG's own <style> because the stylesheets
   * belong to another slice. That is only acceptable if the reduced-motion
   * query travels with it — SMIL would not have honoured the query at all.
   */
  it('carries its own reduced-motion escape', () => {
    const css = render(<EnvelopeField {...base} beam />)
      .container.querySelector('style').textContent;
    expect(css).toContain('prefers-reduced-motion');
    expect(css).toMatch(/\.envelope-field__beam\s*\{\s*animation:\s*none/);
  });

  it('is deterministic for a seed and differs across seeds', () => {
    const d = (seed) => render(<EnvelopeField {...base} seed={seed} beam />)
      .container.querySelector('.envelope-field__beam').getAttribute('d');
    expect(d('one')).toBe(d('one'));
    expect(d('one')).not.toBe(d('two'));
  });
});
