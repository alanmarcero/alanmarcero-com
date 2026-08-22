import { spellCount } from './spellCount';

describe('spellCount', () => {
  it('spells the counts inside its word list', () => {
    expect(spellCount(0)).toBe('zero');
    expect(spellCount(1)).toBe('one');
    expect(spellCount(12)).toBe('twelve');
    expect(spellCount(20)).toBe('twenty');
  });

  it('capitalizes only when asked', () => {
    expect(spellCount(12)).toBe('twelve');
    expect(spellCount(12, { capitalized: true })).toBe('Twelve');
  });

  /*
   * The fallback is the whole point of the function existing. A thirteenth
   * game is a one-line change in a file the arcade slice does not own, and a
   * twenty-first must degrade to digits rather than to `undefined` — which is
   * what an unguarded lookup would have rendered into the lead paragraph.
   */
  it('falls back to digits past the end of the word list', () => {
    expect(spellCount(21)).toBe('21');
    expect(spellCount(100)).toBe('100');
  });

  it('falls back to digits for values that are not whole counts', () => {
    expect(spellCount(-1)).toBe('-1');
    expect(spellCount(2.5)).toBe('2.5');
    expect(spellCount(Number.NaN)).toBe('NaN');
  });
});
