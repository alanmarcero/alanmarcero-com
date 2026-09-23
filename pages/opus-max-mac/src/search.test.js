import { matchesQuery } from './search';

describe('matchesQuery', () => {
  it('matches everything when there is no query', () => {
    expect(matchesQuery('', 'anything')).toBe(true);
    expect(matchesQuery('')).toBe(true);
  });

  it('ignores case', () => {
    expect(matchesQuery('NORD', 'Nord Lead 3')).toBe(true);
  });

  it('matches on any field', () => {
    expect(matchesQuery('trance', 'Virus TI', 'Uplifting trance leads')).toBe(true);
  });

  it('treats a missing field as empty', () => {
    expect(matchesQuery('nord', undefined, null)).toBe(false);
  });
});
